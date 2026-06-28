'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveApiBaseUrl } from '@/lib/api';

export default function MuminLoginPage() {
  const router = useRouter();
  const [form, setForm]   = useState({ accno: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (localStorage.getItem('jms_mumin_token')) {
      router.replace('/mumin/dues');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.accno || !form.password) {
      setError('Please enter your Account Number and Password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${resolveApiBaseUrl()}mumin/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accno: form.accno.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Login failed.');
        return;
      }
      localStorage.setItem('jms_mumin_token', data.accessToken);
      localStorage.setItem('jms_mumin_user', JSON.stringify(data.mumin));

      // Register FCM token if injected by Expo shell app
      if (typeof window !== 'undefined' && window.__FCM_TOKEN__) {
        fetch(`${resolveApiBaseUrl()}mumin/register-fcm`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.accessToken}` },
          body:    JSON.stringify({ fcmToken: window.__FCM_TOKEN__ }),
        }).catch(() => {});
      }

      if (data.forcePasswordChange) {
        router.replace('/mumin/profile?changePassword=true');
      } else {
        router.replace('/mumin/dues');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-800 to-blue-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">JMS Member Portal</h1>
          <p className="text-blue-200 text-sm mt-1">Sagwara Dawoodi Bohra Jamaat</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Account Number</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter your AccNo"
              value={form.accno}
              onChange={e => setForm(f => ({ ...f, accno: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password (default: ITS No)"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
            <p className="text-[11px] text-gray-400 mt-1">Default password is your ITS Number.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
