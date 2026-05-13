'use client';

import { useState } from 'react';
import styles from '../result.module.css';

interface ResultActionsProps {
  imageUrl: string;
  userName: string;
}

export default function ResultActions({ imageUrl, userName }: ResultActionsProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleDownload = () => {
    if (downloadState !== 'idle') return;
    setDownloadState('downloading');
    
    setTimeout(() => {
      const proxyUrl = `/api/download?url=${encodeURIComponent(imageUrl)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = `Yamaha_Persona_${userName.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 3000);
    }, 800);
  };

  const shareText = `Check out my Yamaha cinematic persona! Generated with AI.`;

  const shareOnX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const shareOnInstagram = async () => {
    // Instagram doesn't have a web intent. Try native share if available, else copy link.
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Yamaha Ride Persona',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Native share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied! Open Instagram to paste and share.');
    }
    setShowShareMenu(false);
  };

  const copyImage = async () => {
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(imageUrl)}`);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      alert('Image copied to clipboard!');
    } catch (err) {
      alert('Failed to copy image. Your browser might not support this feature.');
    }
    setShowShareMenu(false);
  };

  return (
    <div className={styles.actionsGrid}>
      <div className={styles.shareWrapper}>
        <button 
          className={`${styles.actionBtn} ${styles.primaryBtn}`} 
          onClick={() => setShowShareMenu(!showShareMenu)}
          style={{ width: '100%' }}
        >
          <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          Share Persona
        </button>

        {showShareMenu && (
          <div className={styles.shareDropdown}>
            <button className={styles.shareDropdownBtn} onClick={shareOnX}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
              Share on X
            </button>
            <button className={styles.shareDropdownBtn} onClick={shareOnFacebook}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              Share on Facebook
            </button>
            <button className={styles.shareDropdownBtn} onClick={shareOnInstagram}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              Share on Instagram
            </button>
            <button className={styles.shareDropdownBtn} onClick={copyImage}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy Image
            </button>
          </div>
        )}
      </div>

      <div className={styles.rowActions}>
        <button 
          className={styles.actionBtn} 
          onClick={handleDownload}
          disabled={downloadState === 'downloading'}
        >
          {downloadState === 'idle' && (
            <>
              <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download
            </>
          )}
          {downloadState === 'downloading' && (
            <>
              <div className={styles.spinnerSmall}></div>
              Saving...
            </>
          )}
          {downloadState === 'done' && (
            <>
              <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Saved!
            </>
          )}
        </button>

        <button 
          className={styles.actionBtn} 
          onClick={() => window.location.href = '/'}
        >
          <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Home
        </button>
      </div>
    </div>
  );
}
