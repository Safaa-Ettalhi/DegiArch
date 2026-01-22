'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent animate-spin mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">Chargement</p>
        </div>
    </div>
  );
}
