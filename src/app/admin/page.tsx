'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0,
    generations: 0,
    bikes: 0,
    questions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [u, g, b, q] = await Promise.all([
      fetch('/api/admin/users?limit=1').then(r => r.json()),
      fetch('/api/admin/generations?limit=1').then(r => r.json()),
      fetch('/api/admin/bikes').then(r => r.json()),
      fetch('/api/admin/quiz/questions').then(r => r.json())
    ]);
    
    setStats({
      users: u.total || 0,
      generations: g.total || 0,
      bikes: b.bikes?.length || 0,
      questions: q.questions?.length || 0
    });
  };

  const shortcuts = [
    { label: 'Manage Users', path: '/admin/users', icon: '👤', color: '#007aff' },
    { label: 'View Generations', path: '/admin/generations', icon: '🖼️', color: '#00ff7a' },
    { label: 'Bike Inventory', path: '/admin/bikes', icon: '🏍️', color: '#ff7a00' },
    { label: 'Quiz Logic', path: '/admin/quiz', icon: '❓', color: '#7a00ff' },
    { label: 'System Settings', path: '/admin/settings', icon: '⚙️', color: '#888' },
  ];

  return (
    <div className="fade-in">
      <div className={styles.header}>
        <h1>Dashboard Overview</h1>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.users}</div>
          <div className={styles.statLabel}>Total Registered Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.generations}</div>
          <div className={styles.statLabel}>Total AI Generations</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.bikes}</div>
          <div className={styles.statLabel}>Available Bikes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.questions}</div>
          <div className={styles.statLabel}>Quiz Questions</div>
        </div>
      </div>

      <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>Quick Shortcuts</h2>
      <div className={styles.statGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {shortcuts.map(s => (
          <Link key={s.path} href={s.path} className={styles.statCard} style={{ 
            cursor: 'pointer', 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '24px' }}>{s.icon}</div>
            <div>
              <div style={{ fontWeight: 600, color: 'white' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Management</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
