// src/app/page.jsx
// Redirect root to dashboard (layout will handle auth check)
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/dashboard');
}
