'use client';
// src/app/(dashboard)/layout.jsx
// Protects all dashboard routes.
// Mirrors ASP.NET: if (Session["username"] == null) Response.Redirect("LoginPage")

import { useEffect }   from 'react';
import { useRouter }   from 'next/navigation';
import { useAuth }     from '@/context/AuthContext';
import Sidebar         from '@/components/layout/Sidebar';
import Topbar          from '@/components/layout/Topbar';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent
                          rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-[228px]">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
