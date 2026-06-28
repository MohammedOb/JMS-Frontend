'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const txnid        = searchParams.get('txnid');
  const urlStatus    = searchParams.get('status'); // 'success' or 'failed' from redirect URL
  const [status, setStatus]   = useState('loading');
  const [order, setOrder]     = useState(null);
  const pollRef               = useRef(null);
  const attemptsRef           = useRef(0);

  useEffect(() => {
    if (!txnid) {
      setStatus('error');
      return;
    }

    // If URL says failed, don't bother polling
    if (urlStatus === 'failed') {
      setStatus('failed');
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}mumin/payment/status/${txnid}`);
        const json = await res.json();
        const d   = json?.data;
        if (!d) { setStatus('error'); return; }

        setOrder(d);

        if (d.status === 'success') {
          setStatus('success');
          clearInterval(pollRef.current);
        } else if (d.status === 'failed' || d.status === 'cancelled') {
          setStatus(d.status);
          clearInterval(pollRef.current);
        } else if (++attemptsRef.current >= 15) {
          // Give up after 30s
          setStatus('timeout');
          clearInterval(pollRef.current);
        }
      } catch {
        if (++attemptsRef.current >= 15) {
          setStatus('error');
          clearInterval(pollRef.current);
        }
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current);
  }, [txnid, urlStatus]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-gray-500">Verifying payment...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-[13px] text-gray-500 mt-1">Your dues have been updated and receipt generated.</p>
          {order?.amount && <p className="text-[24px] font-bold text-green-600 mt-2">₹ {Number(order.amount).toLocaleString('en-IN')}</p>}
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link href="/mumin/receipts" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-[14px] text-center transition-colors">
            View Receipts
          </Link>
          <Link href="/mumin/dues" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl py-3 text-[14px] text-center transition-colors">
            Back to Dues
          </Link>
        </div>
      </div>
    );
  }

  // Failed / cancelled / timeout / error
  const isTimeout = status === 'timeout';
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <h1 className="text-[20px] font-bold text-gray-900">
          {isTimeout ? 'Payment Pending' : 'Payment Failed'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isTimeout
            ? 'Could not verify payment status. Please check your receipts in a few minutes.'
            : 'Your payment was not completed. No amount has been deducted.'}
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Link href="/mumin/dues" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-[14px] text-center transition-colors">
          Try Again
        </Link>
        <Link href="/mumin/receipts" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl py-3 text-[14px] text-center transition-colors">
          View Receipts
        </Link>
      </div>
    </div>
  );
}

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-screen gap-4">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-[14px] text-gray-500">Loading...</p>
  </div>
);

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentResultContent />
    </Suspense>
  );
}
