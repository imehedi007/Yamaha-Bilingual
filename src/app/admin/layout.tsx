'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    // Check auth
    fetch('/api/admin/auth/me').then(res => {
      if (!res.ok) router.push('/admin/login');
      else setLoading(false);
    });
  }, [router, pathname]);

  if (loading) return <div style={{ padding: '80px', color: 'white', textAlign: 'center' }}>Verifying authorization...</div>;

  // Don't show sidebar/layout on login page
  if (pathname === '/admin/login') return <>{children}</>;

  const navItems = [
    { label: 'Overview', path: '/admin', tab: 'overview' },
    { label: 'Users', path: '/admin/users', tab: 'users' },
    { label: 'Generations', path: '/admin/generations', tab: 'generations' },
    { label: 'Bikes', path: '/admin/bikes', tab: 'bikes' },
    { label: 'Quiz Manager', path: '/admin/quiz', tab: 'quiz' },
    { label: 'Settings', path: '/admin/settings', tab: 'settings' },
  ];

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <div className={styles.brand}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#007aff' }}></div>
          Yamaha Admin
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button 
          onClick={async () => {
            await fetch('/api/admin/auth/logout', { method: 'POST' });
            router.push('/admin/login');
          }}
          className={styles.navItem}
          style={{ marginTop: 'auto', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ff4d4d' }}
        >
          Logout
        </button>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
