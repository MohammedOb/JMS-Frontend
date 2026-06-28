'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MuminRoot() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('jms_mumin_token');
    router.replace(token ? '/mumin/dues' : '/mumin/login');
  }, [router]);

  return null;
}
