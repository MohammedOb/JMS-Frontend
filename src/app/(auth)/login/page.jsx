'use client';
// src/app/(auth)/login/page.jsx
// Mirrors LoginPage_aspx.cs Button1_Click
// Calls POST /api/auth/login → stores JWT → redirects to dashboard

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import toast                   from 'react-hot-toast';
import { useAuth }             from '@/context/AuthContext';
import { EyeIcon, EyeOffIcon, MosqueIcon } from '@/components/shared/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();

  const [form, setForm]       = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  function handleChange(e) {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(form.username.trim(), form.password);
      toast.success('Login successful!');
      router.replace('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'linear-gradient(135deg, #0b1d38 0%, #163054 100%)' }}>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="bg-navy-800 px-8 py-8 text-center">
          <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <MosqueIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-white tracking-tight">
            Jamaat Management System
          </h1>
          <p className="text-white/40 text-xs mt-1 tracking-wide uppercase">
            Admin Portal · Sagwara Jamaat
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7">

          {/* Error message — mirrors Label1.Text */}
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 border-l-4 border-l-red-500
                            rounded-md text-red-700 text-[12.5px]">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="form-input"
              disabled={submitting}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="form-input pr-10"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-gray-600 text-sm transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center h-10 text-[13px] rounded-lg
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent
                                 rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-[11px] text-gray-400 mt-5 tracking-wide">
            JMS v2.0 · {new Date().getFullYear()}
          </p>
        </form>
      </div>
    </div>
  );
}
