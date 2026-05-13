'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
        setLoading(false);
      });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', { 
      method: 'PUT', 
      body: JSON.stringify(settings) 
    });
    if (res.ok) alert('Settings saved successfully!');
    else alert('Failed to save settings.');
  };

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading settings...</div>;

  return (
    <div className="fade-in">
      <div className={styles.header}>
        <h1>System Settings</h1>
      </div>

      <div className={styles.card} style={{ maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '18px' }}>Generation Limits</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '32px' }}>
          Configure how many AI generations each user is allowed to perform within specific timeframes.
        </p>
        
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className={styles.statLabel}>Daily Limit (per user)</label>
            <input 
              type="number" 
              value={settings.max_daily_generations || ''} 
              onChange={e => setSettings({ ...settings, max_daily_generations: e.target.value })} 
              className={styles.input} 
              required 
            />
          </div>
          <div>
            <label className={styles.statLabel}>Weekly Limit (per user)</label>
            <input 
              type="number" 
              value={settings.max_weekly_generations || ''} 
              onChange={e => setSettings({ ...settings, max_weekly_generations: e.target.value })} 
              className={styles.input} 
              required 
            />
          </div>
          <div>
            <label className={styles.statLabel}>Monthly Limit (per user)</label>
            <input 
              type="number" 
              value={settings.max_monthly_generations || ''} 
              onChange={e => setSettings({ ...settings, max_monthly_generations: e.target.value })} 
              className={styles.input} 
              required 
            />
          </div>

          <div>
            <label className={styles.statLabel}>Require OTP Verification</label>
            <select 
              value={settings.otp_enabled || 'true'} 
              onChange={e => setSettings({ ...settings, otp_enabled: e.target.value })} 
              className={styles.input} 
            >
              <option value="true">Enabled (Require OTP)</option>
              <option value="false">Disabled (Bypass OTP)</option>
            </select>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>
              If disabled, users can access the quiz immediately after entering their phone number.
            </p>
          </div>
          
          <div style={{ marginTop: '12px' }}>
            <button type="submit" className={styles.primaryBtn}>Save Configurations</button>
          </div>
        </form>
      </div>

      <div className={styles.card} style={{ maxWidth: '600px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>
        <h2 style={{ marginBottom: '12px', fontSize: '18px', color: '#ff4d4d' }}>Danger Zone</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>
          Be careful with these settings. They affect the entire system security and data integrity.
        </p>
        <button className={styles.dangerBtn} onClick={() => alert('Logout is handled via the sidebar (coming soon)')}>
          Revoke All Sessions
        </button>
      </div>
    </div>
  );
}
