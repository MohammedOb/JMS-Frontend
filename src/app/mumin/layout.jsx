'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/mumin/notifications', label: 'Notifications', icon: BellIcon },
  { href: '/mumin/dues',          label: 'Dues',          icon: DuesIcon },
  { href: '/mumin/receipts',      label: 'Receipts',      icon: ReceiptIcon },
  { href: '/mumin/profile',       label: 'Profile',       icon: ProfileIcon },
];

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function DuesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}
function ReceiptIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function ProfileIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default function MuminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady]     = useState(false);
  const [unread, setUnread]   = useState(0);
  const [inWebView, setInWebView] = useState(false);

  // Detect if running inside the native app's WebView
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      setInWebView(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jms_mumin_token');
    const publicPaths = ['/mumin/login', '/mumin/payment/result'];
    if (!token && !publicPaths.some(p => pathname.startsWith(p))) {
      router.replace('/mumin/login');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  // Register FCM token with backend (works for already-logged-in users too)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const registerToken = (fcmToken) => {
      const authToken = localStorage.getItem('jms_mumin_token');
      if (!authToken || !fcmToken) return;
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}mumin/register-fcm`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body:    JSON.stringify({ fcmToken }),
      }).catch(() => {});
    };

    if (window.__FCM_TOKEN__) registerToken(window.__FCM_TOKEN__);
    window.__onFcmToken__ = (token) => registerToken(token);
    return () => { window.__onFcmToken__ = null; };
  }, []);

  // Fetch unread count and post to native nav
  useEffect(() => {
    if (!ready || pathname === '/mumin/login') return;
    const token = localStorage.getItem('jms_mumin_token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/'}mumin/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const count = (d.data || []).filter(n => !n.is_read).length;
        setUnread(count);
        // Sync badge count with native tab bar
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'unread_count', count }));
        }
      })
      .catch(() => {});
  }, [ready, pathname]);

  if (pathname === '/mumin/login' || pathname.startsWith('/mumin/payment/result')) return <>{children}</>;
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative shadow-xl">
      {/* Page content — no bottom padding in WebView (native tab bar is outside the WebView) */}
      <main key={pathname} className={`flex-1 overflow-y-auto mumin-slide-page ${inWebView ? 'pb-2' : 'pb-20'}`}>
        {children}
      </main>

      {/* Bottom tab bar — only shown in regular browser, hidden in native app WebView */}
      {!inWebView && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-200 z-10">
          <div className="flex">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              const isBell = href === '/mumin/notifications';
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center pt-2 pb-3 gap-1 text-[11px] font-semibold transition-colors relative ${
                    active ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 left-1/4 right-1/4 h-[3px] bg-blue-600 rounded-b-full" />
                  )}
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {isBell && unread > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
