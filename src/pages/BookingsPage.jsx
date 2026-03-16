import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_FILTERS = ['All', 'Pending', 'Active', 'Completed', 'Cancelled'];

const STATUS_TRANSITIONS = {
    Pending:   ['Active', 'Cancelled'],
    Active:    ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
};

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

const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

const formatCurrency = (n) =>
    n ? `₱${Number(n).toLocaleString()}` : '—';

function StatusBadge({ status }) {
    return <span className={`bp-badge bp-badge--${status?.toLowerCase()}`}>{status}</span>;
}

// ── Booking detail drawer ─────────────────────────────────────────────────────
function BookingDrawer({ booking, onClose, onStatusChange }) {
    const [updating, setUpdating] = useState(false);
    const next = STATUS_TRANSITIONS[booking.status] || [];

    async function handleStatus(newStatus) {
        setUpdating(true);
        try {
            await onStatusChange(booking._id, newStatus);
        } finally {
            setUpdating(false);
        }
    }

    return (
        <div className="bp-drawer-overlay" onClick={onClose}>
            <div className="bp-drawer" onClick={e => e.stopPropagation()}>
                <div className="bp-drawer__header">
                    <div>
                        <h3>Booking Details</h3>
                        <p className="bp-drawer__ref">Ref: {String(booking._id).slice(-8).toUpperCase()}</p>
                    </div>
                    <button className="bp-drawer__close" onClick={onClose}>×</button>
                </div>

                <div className="bp-drawer__body">
                    <div className="bp-drawer__section">
                        <p className="bp-drawer__label">Status</p>
                        <div className="bp-drawer__status-row">
                            <StatusBadge status={booking.status} />
                            {next.length > 0 && next.map(s => (
                                <button key={s} className={`bp-status-btn bp-status-btn--${s.toLowerCase()}`}
                                    onClick={() => handleStatus(s)} disabled={updating}>
                                    {updating ? '…' : `Mark ${s}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bp-drawer__section">
                        <p className="bp-drawer__label">Customer</p>
                        <p className="bp-drawer__val">{booking.customerName}</p>
                        <p className="bp-drawer__sub">{booking.customerEmail || '—'}</p>
                        <p className="bp-drawer__sub">{booking.customerPhone || '—'}</p>
                    </div>

                    <div className="bp-drawer__section">
                        <p className="bp-drawer__label">Vehicle</p>
                        {booking.carId?.image && (
                            <img src={booking.carId.image} alt={booking.carId.title} className="bp-drawer__car-img" />
                        )}
                        <p className="bp-drawer__val">{booking.carId?.title || booking.car || '—'}</p>
                        <p className="bp-drawer__sub">{booking.carId?.type || '—'}</p>
                        {booking.qty > 1 && <p className="bp-drawer__sub">Quantity: {booking.qty}</p>}
                    </div>

                    <div className="bp-drawer__section">
                        <p className="bp-drawer__label">Rental Period</p>
                        <p className="bp-drawer__val">{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</p>
                        <p className="bp-drawer__sub">{booking.rentalDays} day{booking.rentalDays !== 1 ? 's' : ''}</p>
                    </div>

                    {booking.pickupLocation && (
                        <div className="bp-drawer__section">
                            <p className="bp-drawer__label">Pickup Location</p>
                            <p className="bp-drawer__val">{booking.pickupLocation}</p>
                        </div>
                    )}

                    <div className="bp-drawer__section">
                        <p className="bp-drawer__label">Total Cost</p>
                        <p className="bp-drawer__val bp-drawer__val--cost">{formatCurrency(booking.totalCost)}</p>
                    </div>

                    <div className="bp-drawer__section">
                        <p className="bp-drawer__label">Booked On</p>
                        <p className="bp-drawer__val">{formatDate(booking.createdAt)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Bookings Page ─────────────────────────────────────────────────────────────
export default function BookingsPage() {
    const [bookings, setBookings]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [filter, setFilter]           = useState('All');
    const [search, setSearch]           = useState('');
    const [selected, setSelected]       = useState(null);
    const [page, setPage]               = useState(1);
    const PER_PAGE = 10;

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

    async function handleStatusChange(id, newStatus) {
        try {
            await apiFetch(`/api/admin/bookings/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            setBookings(prev => prev.map(b =>
                b._id === id ? { ...b, status: newStatus } : b
            ));
            setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
        } catch (err) {
            alert(err.message);
        }
    }

    const filtered = bookings.filter(b => {
        const matchStatus = filter === 'All' || b.status === filter;
        const term = search.toLowerCase();
        const matchSearch = !search ||
            b.customerName?.toLowerCase().includes(term) ||
            b.customerEmail?.toLowerCase().includes(term) ||
            (b.carId?.title || b.car || '').toLowerCase().includes(term);
        return matchStatus && matchSearch;
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const counts = STATUS_FILTERS.reduce((acc, s) => {
        acc[s] = s === 'All' ? bookings.length : bookings.filter(b => b.status === s).length;
        return acc;
    }, {});

    return (
        <div className="bp-root">
            {/* Filter tabs */}
            <div className="bp-tabs">
                {STATUS_FILTERS.map(s => (
                    <button key={s}
                        className={`bp-tab${filter === s ? ' bp-tab--active' : ''}`}
                        onClick={() => { setFilter(s); setPage(1); }}>
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
                    <input className="bp-search" placeholder="Search by customer or vehicle…"
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <span className="bp-count">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {error && <div className="bp-banner bp-banner--error">{error}</div>}

            {/* Table */}
            <div className="bp-table-wrap">
                <table className="bp-table">
                    <thead>
                        <tr>
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
                                <tr key={i}><td colSpan={7}><div className="bp-row-skeleton" /></td></tr>
                            ))
                        ) : paginated.length === 0 ? (
                            <tr><td colSpan={7} className="bp-empty-cell">No bookings found.</td></tr>
                        ) : paginated.map(b => (
                            <tr key={b._id} className="bp-row" onClick={() => setSelected(b)}>
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
                                    {b.qty > 1 && <p className="bp-qty">× {b.qty}</p>}
                                </td>
                                <td>
                                    <p className="bp-date">{formatDate(b.startDate)}</p>
                                    <p className="bp-date bp-date--end">→ {formatDate(b.endDate)}</p>
                                </td>
                                <td><span className="bp-cost">{formatCurrency(b.totalCost)}</span></td>
                                <td><StatusBadge status={b.status} /></td>
                                <td><p className="bp-booked">{formatDate(b.createdAt)}</p></td>
                                <td>
                                    <button className="bp-view-btn" onClick={e => { e.stopPropagation(); setSelected(b); }}>
                                        View
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
                    <button className="bp-pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                    <span className="bp-pg-info">Page {page} of {totalPages}</span>
                    <button className="bp-pg-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
                </div>
            )}

            {/* Detail drawer */}
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