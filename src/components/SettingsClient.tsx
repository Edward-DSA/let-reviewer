'use client';

import { useState } from 'react';
import { updateSettings } from '@/app/admin/actions';
import styles from '../app/admin/admin.module.css';

export default function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const [appName, setAppName] = useState(initialSettings?.appName || 'LET Reviewer');
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl || '/logo.png');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setLogoUrl(data.url);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('appName', appName);
    formData.append('logoUrl', logoUrl);
    
    try {
      await updateSettings(formData);
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border)', maxWidth: '600px' }}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Application Name</label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <img src={logoUrl} alt="Logo Preview" style={{ width: '64px', height: '64px', objectFit: 'contain', background: 'var(--bg)', borderRadius: '0.5rem', border: '1px solid var(--border)', padding: '0.5rem' }} />
            <div style={{ flex: 1 }}>
              <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginBottom: '0.5rem' }} placeholder="Logo URL" />
              <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} style={{ fontSize: '0.85rem' }} />
              {isUploading && <span style={{ fontSize: '0.85rem', color: 'var(--accent)', marginLeft: '0.5rem' }}>Uploading...</span>}
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} style={{ background: 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && <div style={{ color: message.includes('success') ? 'green' : 'red', fontWeight: 500, textAlign: 'center' }}>{message}</div>}
      </form>
    </div>
  );
}
