import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Adminpages.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PER_PAGE = 10;

const STATUS_FILTERS = ['All', 'Pending', 'Active', 'Completed', 'Cancelled'];

const STATUS_TRANSITIONS = {
    Pending:   ['Active', 'Cancelled'],
    Active:    ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
};

const SORT_OPTIONS = [
    { value: 'newest',   label: 'Newest First' },
    { value: 'oldest',   label: 'Oldest First' },
    { value: 'cost_hi',  label: 'Cost: High → Low' },
    { value: 'cost_lo',  label: 'Cost: Low → High' },
    { value: 'start',    label: 'Start Date' },
];

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

const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
const fmtCur = (n) => n != null ? `₱${Number(n).toLocaleString()}` : '—';
const fmtCurNum = (n) => Number(n ?? 0);

function StatusBadge({ status }) {
    return <span className={`bp-badge bp-badge--${status?.toLowerCase()}`}>{status}</span>;
}

function ConfirmDialog({ message, confirmLabel, confirmClass, onConfirm, onCancel }) {
    return (
        <div className="bp-confirm-overlay" onClick={onCancel}>
            <div className="bp-confirm" onClick={e => e.stopPropagation()}>
                <p className="bp-confirm__msg">{message}</p>
                <div className="bp-confirm__actions">
                    <button className="bp-confirm__cancel" onClick={onCancel}>Cancel</button>
                    <button className={`bp-confirm__ok ${confirmClass}`} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BookingDrawer({ booking, onClose, onStatusChange }) {
    const [updating, setUpdating]     = useState(false);
    const [confirm, setConfirm]       = useState(null); 
    const next = STATUS_TRANSITIONS[booking.status] || [];

    async function handleStatus(newStatus) {
        setConfirm(null);
        setUpdating(true);
        try { await onStatusChange(booking._id, newStatus); }
        finally { setUpdating(false); }
    }

    const handlePrint = () => {
        const w = window.open('', '_blank', 'width=700,height=600');
        w.document.write(`
            <html><head><title>Booking #${String(booking._id).slice(-8).toUpperCase()}</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #111; }
                h1   { font-size: 1.4rem; margin-bottom: 4px; }
                .ref { color: #6b7280; font-size: 0.85rem; margin-bottom: 24px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                td   { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                td:first-child { font-weight: 600; color: #374151; width: 36%; }
                .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
                .cost  { font-size: 1.1rem; font-weight: 800; color: #2563eb; }
                @media print { body { padding: 16px; } }
            </style></head><body>
            <h1>Booking Receipt</h1>
            <p class="ref">Ref: ${String(booking._id).slice(-8).toUpperCase()} &nbsp;·&nbsp; Booked on ${fmt(booking.createdAt)}</p>
            <table>
                <tr><td>Status</td><td>${booking.status}</td></tr>
                <tr><td>Customer</td><td>${booking.customerName}</td></tr>
                <tr><td>Email</td><td>${booking.customerEmail || '—'}</td></tr>
                <tr><td>Phone</td><td>${booking.customerPhone || '—'}</td></tr>
                <tr><td>Vehicle</td><td>${booking.carId?.title || booking.car || '—'} (${booking.carId?.type || '—'})</td></tr>
                ${booking.qty > 1 ? `<tr><td>Quantity</td><td>${booking.qty}</td></tr>` : ''}
                <tr><td>Pickup Date</td><td>${fmt(booking.startDate)}</td></tr>
                <tr><td>Return Date</td><td>${fmt(booking.endDate)}</td></tr>
                <tr><td>Rental Days</td><td>${booking.rentalDays} day${booking.rentalDays !== 1 ? 's' : ''}</td></tr>
                ${booking.pickupLocation ? `<tr><td>Pickup Location</td><td>${booking.pickupLocation}</td></tr>` : ''}
                <tr><td>Total Cost</td><td class="cost">${fmtCur(booking.totalCost)}</td></tr>
            </table>
            <script>window.onload=()=>{window.print();}<\/script>
            </body></html>
        `);
        w.document.close();
    };

    return (
        <>
            <div className="bp-drawer-overlay" onClick={onClose}>
                <div className="bp-drawer" onClick={e => e.stopPropagation()}>
                    <div className="bp-drawer__header">
                        <div>
                            <h3>Booking Details</h3>
                            <p className="bp-drawer__ref">#{String(booking._id).slice(-8).toUpperCase()}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="bp-drawer__action-btn" onClick={handlePrint} title="Print receipt">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                    <rect x="6" y="14" width="12" height="8"/>
                                </svg>
                                Print
                            </button>
                            <button className="bp-drawer__close" onClick={onClose}>×</button>
                        </div>
                    </div>
                    
                    <div className={`bp-drawer__status-banner bp-drawer__status-banner--${booking.status.toLowerCase()}`}>
                        <StatusBadge status={booking.status} />
                        {next.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                                {next.map(s => (
                                    <button key={s}
                                        className={`bp-status-btn bp-status-btn--${s.toLowerCase()}`}
                                        onClick={() => setConfirm({ status: s, label: `Mark as ${s}` })}
                                        disabled={updating}>
                                        {updating ? '…' : `→ ${s}`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bp-drawer__body">
                        <div className="bp-drawer__section">
                            <p className="bp-drawer__label">Customer</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="bp-drawer__avatar">
                                    {booking.customerName?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="bp-drawer__val">{booking.customerName}</p>
                                    {booking.customerEmail && (
                                        <a href={`mailto:${booking.customerEmail}`} className="bp-drawer__link">
                                            {booking.customerEmail}
                                        </a>
                                    )}
                                    {booking.customerPhone && (
                                        <a href={`tel:${booking.customerPhone}`} className="bp-drawer__link">
                                            {booking.customerPhone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bp-drawer__section">
                            <p className="bp-drawer__label">Vehicle</p>
                            {booking.carId?.image && (
                                <img src={booking.carId.image} alt={booking.carId.title}
                                    className="bp-drawer__car-img" />
                            )}
                            <p className="bp-drawer__val">{booking.carId?.title || booking.car || '—'}</p>
                            <p className="bp-drawer__sub">{booking.carId?.type || '—'}</p>
                            {booking.qty > 1 && (
                                <span className="bp-drawer__qty-tag">× {booking.qty} units</span>
                            )}
                        </div>

                        <div className="bp-drawer__section">
                            <p className="bp-drawer__label">Rental Period</p>
                            <div className="bp-drawer__dates">
                                <div className="bp-drawer__date-box">
                                    <span className="bp-drawer__date-lbl">Pickup</span>
                                    <span className="bp-drawer__date-val">{fmt(booking.startDate)}</span>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                </svg>
                                <div className="bp-drawer__date-box">
                                    <span className="bp-drawer__date-lbl">Return</span>
                                    <span className="bp-drawer__date-val">{fmt(booking.endDate)}</span>
                                </div>
                            </div>
                            <p className="bp-drawer__sub" style={{ marginTop: 8 }}>
                                {booking.rentalDays} day{booking.rentalDays !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {booking.pickupLocation && (
                            <div className="bp-drawer__section">
                                <p className="bp-drawer__label">Pickup Location</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    <p className="bp-drawer__val">{booking.pickupLocation}</p>
                                </div>
                            </div>
                        )}

                        <div className="bp-drawer__section">
                            <p className="bp-drawer__label">Total Cost</p>
                            <p className="bp-drawer__val bp-drawer__val--cost">{fmtCur(booking.totalCost)}</p>
                        </div>

                        <div className="bp-drawer__section">
                            <p className="bp-drawer__label">Booked On</p>
                            <p className="bp-drawer__val">{fmt(booking.createdAt)}</p>
                            <p className="bp-drawer__sub">
                                {new Date(booking.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {confirm && (
                <ConfirmDialog
                    message={`Change status to "${confirm.status}"? ${confirm.status === 'Cancelled' ? 'This will restore the vehicle stock.' : ''}`}
                    confirmLabel={confirm.label}
                    confirmClass={confirm.status === 'Cancelled' ? 'bp-confirm__ok--danger' : 'bp-confirm__ok--primary'}
                    onConfirm={() => handleStatus(confirm.status)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </>
    );
}

function exportCSV(bookings) {
    const headers = ['Ref', 'Customer', 'Email', 'Phone', 'Vehicle', 'Qty', 'Start', 'End', 'Days', 'Location', 'Cost', 'Status', 'Booked On'];
    const rows = bookings.map(b => [
        String(b._id).slice(-8).toUpperCase(),
        b.customerName || '',
        b.customerEmail || '',
        b.customerPhone || '',
        b.carId?.title || b.car || '',
        b.qty ?? 1,
        fmt(b.startDate),
        fmt(b.endDate),
        b.rentalDays,
        b.pickupLocation || '',
        b.totalCost ?? 0,
        b.status,
        fmt(b.createdAt),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [filter, setFilter]     = useState('All');
    const [search, setSearch]     = useState('');
    const [sort, setSort]         = useState('newest');
    const [selected, setSelected] = useState(null);
    const [page, setPage]         = useState(1);
    const searchRef               = useRef(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch('/api/bookings');
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    async function handleStatusChange(id, newStatus) {
        try {
            const res = await apiFetch(`/api/admin/bookings/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const updated = res.booking;
            setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
            setSelected(prev => prev?._id === id ? { ...prev, ...updated } : prev);
        } catch (err) {
            alert(err.message);
        }
    }

    const filtered = bookings
        .filter(b => filter === 'All' || b.status === filter)
        .filter(b => {
            const term = search.toLowerCase();
            return !term ||
                b.customerName?.toLowerCase().includes(term) ||
                b.customerEmail?.toLowerCase().includes(term) ||
                (b.carId?.title || b.car || '').toLowerCase().includes(term) ||
                String(b._id).slice(-8).toLowerCase().includes(term);
        })
        .sort((a, b) => {
            if (sort === 'newest')  return new Date(b.createdAt) - new Date(a.createdAt);
            if (sort === 'oldest')  return new Date(a.createdAt) - new Date(b.createdAt);
            if (sort === 'cost_hi') return fmtCurNum(b.totalCost) - fmtCurNum(a.totalCost);
            if (sort === 'cost_lo') return fmtCurNum(a.totalCost) - fmtCurNum(b.totalCost);
            if (sort === 'start')   return new Date(a.startDate) - new Date(b.startDate);
            return 0;
        });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const counts = STATUS_FILTERS.reduce((acc, s) => {
        acc[s] = s === 'All' ? bookings.length : bookings.filter(b => b.status === s).length;
        return acc;
    }, {});

    function changeFilter(f) { setFilter(f); setPage(1); }
    function changeSearch(v) { setSearch(v); setPage(1); }

    return (
        <div className="bp-root">

            {/* Filter tabs */}
            <div className="bp-tabs">
                {STATUS_FILTERS.map(s => (
                    <button key={s}
                        className={`bp-tab${filter === s ? ' bp-tab--active' : ''}`}
                        onClick={() => changeFilter(s)}>
                        {s}
                        <span className="bp-tab__count">{counts[s]}</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bp-toolbar">
                <div className="bp-search-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input ref={searchRef} className="bp-search"
                        placeholder="Search customer, vehicle, or ref… (Ctrl+F)"
                        value={search}
                        onChange={e => changeSearch(e.target.value)} />
                    {search && (
                        <button className="bp-search-clear" onClick={() => changeSearch('')}>×</button>
                    )}
                </div>

                <select className="bp-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                <button className="bp-export-btn" onClick={() => exportCSV(filtered)}
                    title="Export filtered bookings as CSV" disabled={filtered.length === 0}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export CSV
                </button>

                <button className="bp-refresh-btn" onClick={fetchBookings} title="Refresh">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                </button>

                <span className="bp-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {error && <div className="bp-banner bp-banner--error">{error}</div>}

            {/* Table */}
            <div className="bp-table-wrap">
                <table className="bp-table">
                    <thead>
                        <tr>
                            <th>Ref</th>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Dates</th>
                            <th>Cost</th>
                            <th>Status</th>
                            <th>Booked</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}><td colSpan={8}><div className="bp-row-skeleton" /></td></tr>
                            ))
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="bp-empty-cell">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    <p style={{ margin: 0, fontWeight: 600 }}>No bookings found</p>
                                    {search && <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Try a different search term</p>}
                                </td>
                            </tr>
                        ) : paginated.map((b, i) => (
                            <tr key={b._id} className="bp-row"
                                style={{ animationDelay: `${i * 0.03}s` }}
                                onClick={() => setSelected(b)}>
                                <td>
                                    <span className="bp-ref">#{String(b._id).slice(-8).toUpperCase()}</span>
                                </td>
                                <td>
                                    <div className="bp-customer">
                                        <div className="bp-avatar">{b.customerName?.[0] || '?'}</div>
                                        <div>
                                            <p className="bp-name">{b.customerName}</p>
                                            <p className="bp-email">{b.customerEmail || '—'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p className="bp-car">{b.carId?.title || b.car || '—'}</p>
                                    {b.qty > 1 && <p className="bp-qty">× {b.qty} units</p>}
                                </td>
                                <td>
                                    <p className="bp-date">{fmt(b.startDate)}</p>
                                    <p className="bp-date bp-date--end">→ {fmt(b.endDate)}</p>
                                </td>
                                <td><span className="bp-cost">{fmtCur(b.totalCost)}</span></td>
                                <td><StatusBadge status={b.status} /></td>
                                <td><p className="bp-booked">{fmt(b.createdAt)}</p></td>
                                <td onClick={e => e.stopPropagation()}>
                                    <button className="bp-view-btn" onClick={() => setSelected(b)}>
                                        View →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bp-pagination">
                    <button className="bp-pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                    <button className="bp-pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹ Prev</button>

                    <div className="bp-pg-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                            .reduce((acc, n, idx, arr) => {
                                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                                acc.push(n);
                                return acc;
                            }, [])
                            .map((n, i) => n === '…'
                                ? <span key={`e${i}`} className="bp-pg-ellipsis">…</span>
                                : <button key={n} className={`bp-pg-num${page === n ? ' bp-pg-num--active' : ''}`}
                                    onClick={() => setPage(n)}>{n}</button>
                            )
                        }
                    </div>

                    <button className="bp-pg-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next ›</button>
                    <button className="bp-pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                    <span className="bp-pg-info">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
                </div>
            )}

            {/* Drawer */}
            {selected && (
                <BookingDrawer
                    booking={selected}
                    onClose={() => setSelected(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
}