'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError('Invalid credentials');
    } else {
      router.push('/admin');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239,68,68,0.1)', padding: '0.6rem', borderRadius: '0.5rem' }}>{error}</p>}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
        <input 
          type="text" 
          required 
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
        <input 
          type="password" 
          required 
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
        Sign In
      </button>
    </form>
  );
}
