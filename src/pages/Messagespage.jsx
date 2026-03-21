import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(`Server error (${res.status})`); }
    if (!res.ok) throw new Error(data.message || `Server error (${res.status})`);
    return data;
}

const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const STATUS_TABS = ['All', 'Unread', 'Read', 'Archived'];

const SUBJECT_COLORS = {
    'General Inquiry': '#6366f1',
    'Booking Support':  '#f59e0b',
    'Fleet Questions':  '#10b981',
    'Feedback':         '#3b82f6',
};

function StatusPill({ status }) {
    const map = {
        Unread:   { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
        Read:     { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
        Archived: { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
    };
    const s = map[status] || map.Unread;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: s.bg, color: s.color,
            fontSize: '0.72rem', fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
            {status}
        </span>
    );
}

function ReplyComposer({ msg, onReplySent }) {
    const [subject, setSubject]   = useState(`Re: ${msg.subject || 'Your enquiry'}`);
    const [body, setBody]         = useState('');
    const [sending, setSending]   = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState(false);

    const handleSend = async () => {
        if (!body.trim()) { setError('Reply body cannot be empty.'); return; }
        setSending(true);
        setError('');
        try {
            const data = await apiFetch(`/api/admin/messages/${msg._id}/reply`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ subject: subject.trim(), body: body.trim() }),
            });
            setSuccess(true);
            setBody('');
            onReplySent(data.msg);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{
            border: '1.5px solid #bfdbfe',
            borderRadius: 10,
            background: '#f0f7ff',
            overflow: 'hidden',
            marginTop: 4,
        }}>
            
            <div style={{
                padding: '10px 14px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>
                    Reply to {msg.name}
                </span>
                <span style={{
                    marginLeft: 4, background: 'rgba(255,255,255,0.18)',
                    color: '#fff', fontSize: '0.72rem', padding: '2px 8px',
                    borderRadius: 20, fontWeight: 500,
                }}>
                    {msg.email}
                </span>
            </div>

            
            <div style={{ padding: '10px 14px 0', borderBottom: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', minWidth: 52 }}>
                        Subject:
                    </span>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        disabled={sending}
                        style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: '0.875rem',
                            color: '#111827',
                            padding: '6px 0',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>
            </div>

            
            <textarea
                value={body}
                onChange={e => { setBody(e.target.value); setError(''); }}
                disabled={sending}
                placeholder={`Type your reply to ${msg.name}…`}
                rows={5}
                style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    color: '#111827',
                    lineHeight: 1.65,
                    boxSizing: 'border-box',
                    minHeight: 110,
                }}
            />

            
            {error && (
                <div style={{
                    margin: '0 14px',
                    padding: '7px 12px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{
                    margin: '0 14px',
                    padding: '7px 12px',
                    background: '#d1fae5',
                    color: '#065f46',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Reply sent successfully! The customer will receive it by email.
                </div>
            )}

            
            <div style={{
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                borderTop: '1px solid #bfdbfe',
                background: '#f0f7ff',
            }}>
                <button
                    onClick={handleSend}
                    disabled={sending || !body.trim()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 18px',
                        background: sending || !body.trim() ? '#93c5fd' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontFamily: 'inherit',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: sending || !body.trim() ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s',
                    }}
                >
                    {sending ? (
                        <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{ animation: 'spin 0.8s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            Sending…
                        </>
                    ) : (
                        <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                            Send Reply
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function ReplyHistory({ replies }) {
    if (!replies || replies.length === 0) return null;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...replies].reverse().map((r) => (
                <div key={r._id} style={{
                    background: '#f0f7ff',
                    border: '1px solid #bfdbfe',
                    borderLeft: '3px solid #2563eb',
                    borderRadius: '0 8px 8px 0',
                    padding: '12px 14px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af' }}>
                            {r.sentBy || 'Admin'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {formatDate(r.sentAt)} · {formatTime(r.sentAt)}
                        </span>
                    </div>
                    {r.subject && (
                        <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>
                            Subject: {r.subject}
                        </p>
                    )}
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                        {r.body}
                    </p>
                </div>
            ))}
        </div>
    );
}

function MessageDrawer({ msg: initialMsg, onClose, onStatusChange, saving }) {
    const [msg, setMsg]               = useState(initialMsg);
    const [showReply, setShowReply]   = useState(false);

    useEffect(() => { setMsg(initialMsg); }, [initialMsg]);

    if (!msg) return null;

    const hasReplies = msg.replies && msg.replies.length > 0;

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                zIndex: 200, backdropFilter: 'blur(2px)',
            }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '100%', maxWidth: 500,
                background: '#fff', zIndex: 201,
                display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
                animation: 'mp-slideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
                
                <div style={{
                    padding: '20px 24px 18px',
                    background: '#111827',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    flexShrink: 0,
                }}>
                    <div>
                        <p style={{ color: '#ffc107', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>
                            Message Detail
                        </p>
                        <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{msg.name}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: '4px 0 0' }}>{msg.email}</p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff', width: 32, height: 32, borderRadius: '50%',
                        cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                </div>

                
                <div style={{
                    padding: '14px 24px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0,
                }}>
                    <span style={{
                        background: SUBJECT_COLORS[msg.subject] ? SUBJECT_COLORS[msg.subject] + '18' : '#f1f5f9',
                        color: SUBJECT_COLORS[msg.subject] || '#475569',
                        border: `1px solid ${SUBJECT_COLORS[msg.subject] || '#e2e8f0'}30`,
                        fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                    }}>{msg.subject || 'No subject'}</span>
                    <StatusPill status={msg.status} />
                    {hasReplies && (
                        <span style={{
                            background: '#eff6ff', color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            fontSize: '0.72rem', fontWeight: 700,
                            padding: '3px 10px', borderRadius: 20,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                            </svg>
                            {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'} sent
                        </span>
                    )}
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem', marginLeft: 'auto' }}>
                        {formatDate(msg.createdAt)} · {formatTime(msg.createdAt)}
                    </span>
                </div>

                
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

                    
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 0 }}>
                        Message
                    </p>
                    <div style={{
                        background: '#f8fafc', borderRadius: 10, padding: '16px 18px',
                        border: '1px solid #e2e8f0', lineHeight: 1.75,
                        fontSize: '0.92rem', color: '#1e293b', whiteSpace: 'pre-wrap',
                        marginBottom: 20,
                    }}>
                        {msg.message}
                    </div>

                    
                    {hasReplies && (
                        <>
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                                Sent Replies ({msg.replies.length})
                            </p>
                            <ReplyHistory replies={msg.replies} />
                            <div style={{ margin: '16px 0' }} />
                        </>
                    )}

                    
                    <div style={{ marginBottom: 8 }}>
                        <button
                            onClick={() => setShowReply(v => !v)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                                padding: '8px 16px',
                                background: showReply ? '#eff6ff' : '#2563eb',
                                color: showReply ? '#2563eb' : '#fff',
                                border: showReply ? '1.5px solid #bfdbfe' : 'none',
                                borderRadius: 8,
                                fontFamily: 'inherit',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {showReply ? (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                    Cancel Reply
                                </>
                            ) : (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                                    </svg>
                                    Reply to {msg.name}
                                </>
                            )}
                        </button>
                    </div>

                    {showReply && (
                        <ReplyComposer
                            msg={msg}
                            onReplySent={(updatedMsg) => {
                                setMsg(updatedMsg);
                                setShowReply(false);
                            }}
                        />
                    )}
                </div>

                
                <div style={{
                    padding: '14px 24px', borderTop: '1px solid #f1f5f9',
                    display: 'flex', gap: 8, flexShrink: 0, background: '#f8fafc',
                    flexWrap: 'wrap',
                }}>
                    <p style={{ width: '100%', margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Change Status
                    </p>
                    {['Read', 'Unread', 'Archived'].filter(s => s !== msg.status).map(s => (
                        <button key={s} onClick={() => onStatusChange(msg._id, s)} disabled={saving}
                            style={{
                                flex: 1, minWidth: 80, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                                fontSize: '0.84rem', fontWeight: 600,
                                border: s === 'Archived' ? '1.5px solid #e2e8f0' : 'none',
                                background: s === 'Read' ? '#2563eb' : s === 'Unread' ? '#f59e0b' : 'transparent',
                                color: s === 'Archived' ? '#64748b' : '#fff',
                                opacity: saving ? 0.6 : 1,
                                transition: 'opacity 0.15s',
                            }}>
                            Mark {s}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

export default function MessagesPage() {
    const [messages, setMessages]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [search, setSearch]       = useState('');
    const [selected, setSelected]   = useState(null);
    const [saving, setSaving]       = useState(false);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/admin/messages');
            setMessages(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    
    const openMessage = async (msg) => {
        setSelected(msg);
        if (msg.status === 'Unread') {
            try {
                await apiFetch(`/api/admin/messages/${msg._id}/status`, {
                    method:  'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ status: 'Read' }),
                });
                const updated = { ...msg, status: 'Read' };
                setMessages(prev => prev.map(m => m._id === msg._id ? updated : m));
                setSelected(updated);
            } catch {  }
        }
    };

    const handleStatusChange = async (id, status) => {
        setSaving(true);
        try {
            await apiFetch(`/api/admin/messages/${id}/status`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ status }),
            });
            setMessages(prev => prev.map(m => m._id === id ? { ...m, status } : m));
            setSelected(prev => prev?._id === id ? { ...prev, status } : prev);
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this message? This cannot be undone.')) return;
        try {
            await apiFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
            setMessages(prev => prev.filter(m => m._id !== id));
            if (selected?._id === id) setSelected(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const filtered = messages.filter(m => {
        const matchTab   = activeTab === 'All' || m.status === activeTab;
        const term       = search.toLowerCase();
        const matchSearch = !term || [m.name, m.email, m.subject, m.message]
            .some(f => f?.toLowerCase().includes(term));
        return matchTab && matchSearch;
    });

    const unreadCount = messages.filter(m => m.status === 'Unread').length;

    return (
        <div style={{ padding: '24px 28px', minHeight: '100%' }}>
            <style>{`
                @keyframes mp-slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes mp-fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                .mp-row { animation: mp-fadeUp 0.3s ease both; }
                .mp-row:hover { background: #f8fafc !important; }
                .mp-tab { transition: all 0.18s; }
                .mp-tab:hover { background: #f1f5f9 !important; color: #1e293b !important; }
                .mp-del-btn { opacity: 0; transition: opacity 0.15s; }
                .mp-row:hover .mp-del-btn { opacity: 1; }
            `}</style>

            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Messages
                        {unreadCount > 0 && (
                            <span style={{
                                marginLeft: 10, background: '#2563eb', color: '#fff',
                                fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                                borderRadius: 20, verticalAlign: 'middle',
                            }}>{unreadCount} new</span>
                        )}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0' }}>
                        Contact form submissions from your website
                    </p>
                </div>
                <button onClick={fetchMessages} title="Refresh" style={{
                    background: '#f1f5f9', border: '1.5px solid #e2e8f0',
                    borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600, color: '#475569',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Refresh
                </button>
            </div>

            
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 2 }}>
                    {STATUS_TABS.map(tab => {
                        const count = tab === 'All' ? messages.length
                            : messages.filter(m => m.status === tab).length;
                        return (
                            <button key={tab}
                                className="mp-tab"
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '6px 14px', borderRadius: 7, border: 'none',
                                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                    background: activeTab === tab ? '#fff' : 'transparent',
                                    color: activeTab === tab ? '#111827' : '#64748b',
                                    boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                }}>
                                {tab} {count > 0 && <span style={{ color: activeTab === tab ? '#2563eb' : '#94a3b8' }}>({count})</span>}
                            </button>
                        );
                    })}
                </div>

                <input
                    type="text"
                    placeholder="Search by name, email, subject…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        flex: 1, minWidth: 200, padding: '9px 14px',
                        border: '1.5px solid #e2e8f0', borderRadius: 8,
                        fontSize: '0.875rem', outline: 'none', background: '#fff',
                        color: '#111827',
                    }}
                />
            </div>

            
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        Loading messages…
                    </div>
                ) : error ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>
                        Error: {error}
                        <br />
                        <button onClick={fetchMessages} style={{ marginTop: 12, padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                            Retry
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <p style={{ margin: 0, fontWeight: 600 }}>No messages found</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                            {search ? 'Try a different search term' : 'Messages from your contact form will appear here'}
                        </p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                {['Sender', 'Subject', 'Preview', 'Status', 'Replies', 'Received', ''].map(h => (
                                    <th key={h} style={{
                                        padding: '12px 16px', textAlign: 'left',
                                        fontSize: '0.72rem', fontWeight: 700,
                                        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px',
                                        background: '#fafafa',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((msg, i) => (
                                <tr key={msg._id}
                                    className="mp-row"
                                    onClick={() => openMessage(msg)}
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        animationDelay: `${i * 0.04}s`,
                                        background: msg.status === 'Unread' ? '#fffbeb' : '#fff',
                                    }}>
                                    
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: '#eff6ff', color: '#2563eb',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
                                            }}>{msg.name.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: msg.status === 'Unread' ? 700 : 500, color: '#111827' }}>
                                                    {msg.name}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{msg.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            background: SUBJECT_COLORS[msg.subject] ? SUBJECT_COLORS[msg.subject] + '15' : '#f1f5f9',
                                            color: SUBJECT_COLORS[msg.subject] || '#475569',
                                            fontSize: '0.75rem', fontWeight: 600,
                                            padding: '3px 10px', borderRadius: 20,
                                            whiteSpace: 'nowrap',
                                        }}>{msg.subject || '—'}</span>
                                    </td>
                                    
                                    <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                                        <p style={{
                                            margin: 0, fontSize: '0.85rem', color: '#475569',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            fontWeight: msg.status === 'Unread' ? 600 : 400,
                                        }}>{msg.message}</p>
                                    </td>
                                    
                                    <td style={{ padding: '14px 16px' }}>
                                        <StatusPill status={msg.status} />
                                    </td>
                                    
                                    <td style={{ padding: '14px 16px' }}>
                                        {msg.replies && msg.replies.length > 0 ? (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                background: '#eff6ff', color: '#1e40af',
                                                border: '1px solid #bfdbfe',
                                                fontSize: '0.72rem', fontWeight: 700,
                                                padding: '3px 9px', borderRadius: 20,
                                            }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                                                </svg>
                                                {msg.replies.length}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#d1d5db', fontSize: '0.78rem' }}>—</span>
                                        )}
                                    </td>
                                    
                                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{formatDate(msg.createdAt)}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{formatTime(msg.createdAt)}</p>
                                    </td>
                                    
                                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                                        <button
                                            className="mp-del-btn"
                                            onClick={() => handleDelete(msg._id)}
                                            title="Delete"
                                            style={{
                                                background: '#fee2e2', border: 'none', color: '#dc2626',
                                                width: 30, height: 30, borderRadius: 6,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="3 6 5 6 21 6"/>
                                                <path d="M19 6l-1 14H6L5 6"/>
                                                <path d="M10 11v6M14 11v6"/>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            
            <MessageDrawer
                msg={selected}
                onClose={() => setSelected(null)}
                onStatusChange={handleStatusChange}
                saving={saving}
            />
        </div>
    );
}