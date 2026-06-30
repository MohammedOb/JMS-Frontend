import crypto from 'crypto';
import Link from 'next/link';

// Key derived once at startup — NOT NEXT_PUBLIC so it never reaches the browser bundle
const PAYMENT_RESULT_KEY = crypto.scryptSync(
  process.env.PAYMENT_URL_SECRET || 'change-me-set-PAYMENT_URL_SECRET-in-env',
  'jms-payment-result-v1',
  32
);

function decryptPaymentResult(token) {
  try {
    const buf = Buffer.from(token, 'base64url');
    const iv  = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', PAYMENT_RESULT_KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString('utf8'));
  } catch {
    return null; // tampered or invalid token
  }
}

export default async function PaymentResultPage({ searchParams }) {
  const params = await searchParams;
  const token  = params?.t;
  const data   = token ? decryptPaymentResult(token) : null;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-gray-700">Invalid Payment Link</h1>
          <p className="text-[13px] text-gray-400 mt-1">This link is invalid or has been tampered with.</p>
        </div>
        <Link href="/mumin/dues" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-3 text-[14px] transition-colors">
          Go to Dues
        </Link>
      </div>
    );
  }

  if (data.status === 'success') {
    const amount = data.amount ? Number(data.amount) : null;
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
          {data.receiptNo && (
            <p className="text-[13px] text-gray-500 mt-1">
              Receipt No: <span className="font-semibold text-gray-700">{data.receiptNo}</span>
            </p>
          )}
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

  // failed / cancelled / any other status
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <h1 className="text-[20px] font-bold text-gray-900">Payment Failed</h1>
        <p className="text-[13px] text-gray-500 mt-1">Your payment was not completed. No amount has been deducted.</p>
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
