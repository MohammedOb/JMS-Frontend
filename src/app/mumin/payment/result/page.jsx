'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const urlStatus  = searchParams.get('status');   // 'success' | 'failed' | 'cancelled'
  const receiptNo  = searchParams.get('receiptNo');
  const rawAmount  = searchParams.get('amount');
  const amount     = rawAmount ? Number(rawAmount) : null;

  if (urlStatus === 'success') {
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
          {amount !== null && !isNaN(amount) && (
            <p className="text-[24px] font-bold text-green-600 mt-2">₹ {amount.toLocaleString('en-IN')}</p>
          )}
          {receiptNo && (
            <p className="text-[13px] text-gray-500 mt-1">Receipt No: <span className="font-semibold text-gray-700">{receiptNo}</span></p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link
            href="/mumin/receipts"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-[14px] text-center transition-colors"
          >
            View Receipts
          </Link>
          <Link
            href="/mumin/dues"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl py-3 text-[14px] text-center transition-colors"
          >
            Back to Dues
          </Link>
        </div>
      </div>
    );
  }

  // Failed / cancelled / unknown
  const isTimeout = urlStatus === 'timeout';
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
        <Link
          href="/mumin/dues"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-[14px] text-center transition-colors"
        >
          Try Again
        </Link>
        <Link
          href="/mumin/receipts"
          className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl py-3 text-[14px] text-center transition-colors"
        >
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
