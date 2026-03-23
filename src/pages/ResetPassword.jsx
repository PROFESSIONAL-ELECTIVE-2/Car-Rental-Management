import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams]  = useSearchParams();
    const token           = searchParams.get('token');

    const [password,  setPassword]  = useState('');
    const [confirm,   setConfirm]   = useState('');
    const [loading,   setLoading]   = useState(false);
    const [done,      setDone]      = useState(false);
    const [error,     setError]     = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }

        setLoading(true); setError('');
        try {
            const res  = await fetch(`${API_BASE_URL}/api/admin/reset-password`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setDone(true);
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

    if (!token) return (
        <main style={styles.root}>
            <div style={styles.card}>
                <p style={{ textAlign:'center', color:'#991b1b' }}>Invalid reset link.</p>
                <button style={styles.btn} onClick={() => navigate('/admin/login')}>Back to Login</button>
            </div>
        </main>
    );

    if (done) return (
        <main style={styles.root}>
            <div style={styles.card}>
                <h1 style={styles.title}>Password Reset!</h1>
                <p style={styles.sub}>Your password has been updated successfully.</p>
                <button style={styles.btn} onClick={() => navigate('/admin/login')}>
                    Go to Login
                </button>
            </div>
        </main>
    );

    return (
        <main style={styles.root}>
            <div style={styles.card}>
                <h1 style={styles.title}>Reset Password</h1>
                <p style={styles.sub}>Enter a new password for your admin account.</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <label style={styles.label}>New Password</label>
                        <input
                            type="password" required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            disabled={loading}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password" required
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder="Repeat your new password"
                            disabled={loading}
                            style={styles.input}
                        />
                    </div>
                    <button type="submit" disabled={loading} style={styles.btn}>
                        {loading ? 'Resetting…' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </main>
    );
}

const styles = {
    root:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f8', padding:20 },
    card:  { background:'#fff', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.12)' },
    title: { fontSize:'1.6rem', fontWeight:800, color:'#111827', margin:'0 0 8px', textAlign:'center' },
    sub:   { fontSize:'0.9rem', color:'#6b7280', margin:'0 0 24px', textAlign:'center', lineHeight:1.6 },
    label: { fontSize:'0.78rem', fontWeight:600, color:'#374151', textTransform:'uppercase', letterSpacing:'0.6px' },
    input: { padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', fontFamily:'inherit' },
    btn:   { padding:'11px', background:'#2563eb', color:'#fff', border:'none', borderRadius:8, fontSize:'0.9rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
    error: { background:'#fee2e2', color:'#991b1b', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', fontSize:'0.85rem', marginBottom:8 },
};