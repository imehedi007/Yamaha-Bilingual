'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function BikesPage() {
  const [bikes, setBikes] = useState<any[]>([]);
  const [newBike, setNewBike] = useState({ model_name: '', type: '', colors: '' });

  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    const res = await fetch('/api/admin/bikes');
    const data = await res.json();
    if (data.bikes) setBikes(data.bikes);
  };

  const handleAddBike = async (e: React.FormEvent) => {
    e.preventDefault();
    const bikeData = {
      ...newBike,
      colors: newBike.colors.split(',').map(c => c.trim()).filter(c => c)
    };
    await fetch('/api/admin/bikes', { method: 'POST', body: JSON.stringify(bikeData) });
    setNewBike({ model_name: '', type: '', colors: '' });
    fetchBikes();
  };

  const handleDeleteBike = async (id: string) => {
    if (confirm('Are you sure? This will delete all associated data.')) {
      await fetch(`/api/admin/bikes?id=${id}`, { method: 'DELETE' });
      fetchBikes();
    }
  };

  const Icons = {
    Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  };

  return (
    <div className="fade-in">
      <div className={styles.header}>
        <h1>Bikes Inventory</h1>
      </div>

      <div className={styles.card}>
        <h2 style={{ marginBottom: '20px' }}>Add New Bike</h2>
        <form onSubmit={handleAddBike} className={styles.formGrid}>
          <input placeholder="Model Name (e.g. R15 V4)" value={newBike.model_name} onChange={e => setNewBike({ ...newBike, model_name: e.target.value })} className={styles.input} required />
          <input placeholder="Type (e.g. SuperSport)" value={newBike.type} onChange={e => setNewBike({ ...newBike, type: e.target.value })} className={styles.input} required />
          <input placeholder="Available Colors (comma separated)" value={newBike.colors} onChange={e => setNewBike({ ...newBike, colors: e.target.value })} className={styles.input} style={{ gridColumn: 'span 2' }} />
          <button type="submit" className={styles.primaryBtn} style={{ gridColumn: 'span 2' }}>
            <Icons.Plus /> Register Bike
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead><tr><th>Model</th><th>Type</th><th>Colors</th><th>Actions</th></tr></thead>
          <tbody>
            {bikes.map(b => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600 }}>{b.model_name}</td><td>{b.type}</td>
                <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{JSON.parse(b.colors || '[]').join(', ')}</td>
                <td><button onClick={() => handleDeleteBike(b.id)} className={styles.dangerBtn}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
