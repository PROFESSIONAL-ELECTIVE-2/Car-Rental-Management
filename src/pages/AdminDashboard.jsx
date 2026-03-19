import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FleetPage from './FleetPage.jsx';
import BookingsPage from './BookingsPage.jsx';
import MessagesPage from './MessagesPage.jsx';
import './AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
}
function clearToken() {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
}

const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);
const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDay = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });

const NAV_LINKS = [
    {
        id: 'dashboard', label: 'Dashboard',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
        id: 'fleet', label: 'Fleet',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    },
    {
        id: 'bookings', label: 'Bookings',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
        id: 'messages', label: 'Messages',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    },
];

function StatusBadge({ status }) {
    return <span className={`ad-badge ad-badge--${status.toLowerCase()}`}>{status}</span>;
}

function StatCard({ title, value, subtitle, icon, accent, index }) {
    return (
        <div className={`ad-stat-card ad-stat-card--${accent}`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="ad-stat-card__icon">{icon}</div>
            <div className="ad-stat-card__body">
                <p className="ad-stat-card__title">{title}</p>
                <p className="ad-stat-card__value">{value}</p>
                {subtitle && <p className="ad-stat-card__sub">{subtitle}</p>}
            </div>
            <div className="ad-stat-card__glow" />
        </div>
    );
}

function RevenueChart({ data }) {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const weekTotal = data.reduce((s, d) => s + d.revenue, 0);
    return (
        <div className="ad-chart">
            <div className="ad-chart__header">
                <div>
                    <h3 className="ad-chart__title">Revenue — Last 7 Days</h3>
                    <p className="ad-chart__sub">Completed bookings only</p>
                </div>
                <span className="ad-chart__total">{formatCurrency(weekTotal)}</span>
            </div>
            <div className="ad-chart__bars">
                {data.map((day, i) => {
                    const pct = (day.revenue / max) * 100;
                    const isLast = i === data.length - 1;
                    return (
                        <div key={day.date} className="ad-chart__col">
                            <div className="ad-chart__bar-wrap">
                                <div className="ad-chart__tooltip">{formatCurrency(day.revenue)}</div>
                                <div className={`ad-chart__bar${isLast ? ' ad-chart__bar--today' : ''}`}
                                    style={{ height: `${Math.max(pct, 4)}%` }} />
                            </div>
                            <span className={`ad-chart__label${isLast ? ' ad-chart__label--today' : ''}`}>
                                {shortDay(day.date)}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="ad-chart__axis">
                <span>₱0</span>
                <span>{formatCurrency(max)}</span>
            </div>
        </div>
    );
}

function FleetStatus({ fleet, bookingStats }) {
    if (!fleet.total) return null;
    const avPct   = (fleet.available / fleet.total) * 100;
    const rentPct = (fleet.rented    / fleet.total) * 100;
    const gradient = `conic-gradient(
        var(--accent-gold) 0% ${avPct}%,
        var(--primary-blue) ${avPct}% ${avPct + rentPct}%,
        #374151 ${avPct + rentPct}% 100%
    )`;
    return (
        <div className="ad-fleet">
            <div className="ad-fleet__header">
                <h3 className="ad-chart__title">Fleet &amp; Bookings</h3>
                <span className="ad-fleet__total">{fleet.total} vehicles</span>
            </div>
            <div className="ad-fleet__body">
                <div className="ad-donut-wrap">
                    <div className="ad-donut" style={{ background: gradient }}>
                        <div className="ad-donut__hole">
                            <span className="ad-donut__num">{fleet.rented}</span>
                            <span className="ad-donut__lbl">Rented</span>
                        </div>
                    </div>
                </div>
                <div className="ad-fleet__legend">
                    {[
                        { label: 'Available',   val: fleet.available,   cls: 'gold' },
                        { label: 'Rented',      val: fleet.rented,      cls: 'blue' },
                        { label: 'Maintenance', val: fleet.maintenance, cls: 'grey' },
                    ].map(item => (
                        <div key={item.label} className="ad-fleet__legend-row">
                            <span className={`ad-fleet__dot ad-fleet__dot--${item.cls}`} />
                            <span className="ad-fleet__legend-label">{item.label}</span>
                            <span className="ad-fleet__legend-val">{item.val}</span>
                        </div>
                    ))}
                    <div className="ad-fleet__divider" />
                    {Object.entries(bookingStats).map(([key, val]) => (
                        <div key={key} className="ad-fleet__booking-row">
                            <StatusBadge status={key.charAt(0).toUpperCase() + key.slice(1)} />
                            <span className="ad-fleet__legend-val">{val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="ad-skeleton">
            <div className="ad-skeleton__row">{[1,2,3].map(i => <div key={i} className="ad-skeleton__card" />)}</div>
            <div className="ad-skeleton__row ad-skeleton__row--two">
                <div className="ad-skeleton__block" /><div className="ad-skeleton__block" />
            </div>
            <div className="ad-skeleton__block ad-skeleton__block--tall" />
        </div>
    );
}

// ── Dashboard overview page ───────────────────────────────────────────────────
function DashboardOverview({ data, loading, error, onRetry, onNav }) {
    if (loading) return <Skeleton />;
    if (error) return (
        <div className="ad-error">
            <span className="ad-error__icon">⚠️</span>
            <h3>Failed to load dashboard</h3>
            <p>{error}</p>
            <button className="ad-error__btn" onClick={onRetry}>Retry</button>
        </div>
    );
    if (!data) return null;

    const stats = [
        { title: 'Total Revenue',  value: formatCurrency(data.revenue.total), subtitle: 'From completed bookings', icon: '💰', accent: 'gold', index: 0 },
        { title: 'Active Rentals', value: data.fleet.rented, subtitle: `${data.fleet.available} available`, icon: '🚗', accent: 'blue', index: 1 },
        { title: 'Total Fleet',    value: data.fleet.total, subtitle: `${data.fleet.maintenance} in maintenance`, icon: '🏎️', accent: 'dark', index: 2 },
    ];

    return (
        <>
            <section className="ad-section">
                <p className="ad-section__label">Quick Stats</p>
                <div className="ad-stats-grid">
                    {stats.map(s => <StatCard key={s.title} {...s} />)}
                </div>
            </section>

            <section className="ad-section">
                <div className="ad-mid-grid">
                    <RevenueChart data={data.revenue.last7Days} />
                    <FleetStatus fleet={data.fleet} bookingStats={data.bookingStats} />
                </div>
            </section>

            <section className="ad-section">
                <div className="ad-table-header">
                    <div>
                        <p className="ad-section__label">Recent Bookings</p>
                        <p className="ad-table-sub">5 most recent transactions</p>
                    </div>
                    <button className="ad-view-all-btn" onClick={() => onNav('bookings')}>
                        View all bookings →
                    </button>
                </div>
                <div className="ad-table-wrap">
                    <table className="ad-table">
                        <thead>
                            <tr>{['Customer','Vehicle','Rental Period','Cost','Status','Booked'].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {data.recentBookings.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No bookings yet.</td></tr>
                            ) : data.recentBookings.map((b, i) => (
                                <tr key={b.id} style={{ animationDelay: `${i * 0.07}s` }}>
                                    <td>
                                        <div className="ad-table__customer">
                                            <div className="ad-table__avatar">{b.customerName.charAt(0)}</div>
                                            <div>
                                                <p className="ad-table__name">{b.customerName}</p>
                                                <p className="ad-table__email">{b.customerEmail}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="ad-table__car">{b.car}</p>
                                        <p className="ad-table__plate">{b.licensePlate}</p>
                                    </td>
                                    <td>
                                        <p className="ad-table__date">{formatDate(b.startDate)}</p>
                                        <p className="ad-table__date ad-table__date--end">→ {formatDate(b.endDate)}</p>
                                    </td>
                                    <td><span className="ad-table__cost">{formatCurrency(b.totalCost)}</span></td>
                                    <td><StatusBadge status={b.status} /></td>
                                    <td><p className="ad-table__booked">{formatDate(b.createdAt)}</p></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

// ── Root dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [activeNav, setActiveNav]     = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen]     = useState(false);
    const [loggingOut, setLoggingOut]   = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        if (!getToken()) navigate('/admin/login', { replace: true });
    }, [navigate]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/api/dashboard/analytics`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.status === 401) { clearToken(); navigate('/admin/login', { replace: true }); return; }
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            setData(json.data);

            // Fetch unread message count for sidebar badge
            try {
                const token = getToken();
                const msgRes = await fetch(`${API_BASE_URL}/api/admin/messages`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (msgRes.ok) {
                    const msgs = await msgRes.json();
                    setUnreadMessages(msgs.filter(m => m.status === 'Unread').length);
                }
            } catch { /* non-critical */ }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        const token = getToken();
        try {
            if (token) await fetch(`${API_BASE_URL}/api/admin/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        } catch { /* still clear */ } finally {
            clearToken();
            navigate('/admin/login', { replace: true });
        }
    };

    function navTo(id) {
        setActiveNav(id);
        setSidebarOpen(false);
    }

    const pendingCount = data?.bookingStats.pending ?? 0;

    return (
        <div className="ad-root">
            {sidebarOpen && <div className="ad-overlay" onClick={() => setSidebarOpen(false)} />}

            <aside className={`ad-sidebar${sidebarOpen ? ' ad-sidebar--open' : ''}`}>
                <div className="ad-sidebar__logo">
                    <div className="ad-sidebar__logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/>
                            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                    </div>
                    <div>
                        <p className="ad-sidebar__brand">Triple R &amp; A</p>
                        <p className="ad-sidebar__brand-sub">Admin Portal</p>
                    </div>
                </div>

                <nav className="ad-sidebar__nav">
                    <p className="ad-sidebar__nav-label">Main Menu</p>
                    {NAV_LINKS.map(link => (
                        <button key={link.id}
                            className={`ad-nav-btn${activeNav === link.id ? ' ad-nav-btn--active' : ''}`}
                            onClick={() => navTo(link.id)}>
                            <span className="ad-nav-btn__icon">{link.icon}</span>
                            {link.label}
                            {link.id === 'bookings' && pendingCount > 0 && (
                                <span className="ad-nav-btn__badge">{pendingCount}</span>
                            )}
                            {link.id === 'messages' && unreadMessages > 0 && (
                                <span className="ad-nav-btn__badge">{unreadMessages}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {data && (
                    <div className="ad-sidebar__mini-stats">
                        <p className="ad-sidebar__nav-label">Booking Pulse</p>
                        {[
                            { label: 'Active',    val: data.bookingStats.active,    cls: 'active'    },
                            { label: 'Pending',   val: data.bookingStats.pending,   cls: 'pending'   },
                            { label: 'Completed', val: data.bookingStats.completed, cls: 'completed' },
                        ].map(s => (
                            <div key={s.label} className="ad-sidebar__mini-row">
                                <span className={`ad-sidebar__mini-dot ad-sidebar__mini-dot--${s.cls}`} />
                                <span className="ad-sidebar__mini-label">{s.label}</span>
                                <span className="ad-sidebar__mini-val">{s.val}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="ad-sidebar__footer">
                    <button className="ad-sidebar__footer-btn">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                        </svg>
                        Settings
                    </button>
                    <button className="ad-sidebar__footer-btn ad-sidebar__footer-btn--logout"
                        onClick={handleLogout} disabled={loggingOut}>
                        {loggingOut ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ animation: 'ad-spin 0.8s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        )}
                        {loggingOut ? 'Logging out…' : 'Logout'}
                    </button>
                </div>
            </aside>

            <div className="ad-main">
                <header className="ad-header">
                    <div className="ad-header__left">
                        <button className="ad-hamburger" onClick={() => setSidebarOpen(v => !v)}>
                            <span /><span /><span />
                        </button>
                        <div>
                            <h1 className="ad-header__title">{NAV_LINKS.find(n => n.id === activeNav)?.label}</h1>
                            <p className="ad-header__date">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="ad-header__right">
                        {activeNav === 'dashboard' && (
                            <>
                                <div className="ad-notif-wrap">
                                    <button className="ad-notif-btn" onClick={() => setNotifOpen(v => !v)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                        </svg>
                                        {pendingCount > 0 && <span className="ad-notif-dot">{pendingCount}</span>}
                                    </button>
                                    {notifOpen && (
                                        <div className="ad-notif-dropdown">
                                            <p className="ad-notif-dropdown__title">Pending Bookings</p>
                                            {data?.recentBookings.filter(b => b.status === 'Pending').slice(0, 3).map(b => (
                                                <div key={b.id} className="ad-notif-item">
                                                    <span className="ad-notif-item__dot" />
                                                    <div>
                                                        <p className="ad-notif-item__name">{b.customerName}</p>
                                                        <p className="ad-notif-item__car">{b.car} — Pending approval</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!data || data.recentBookings.filter(b => b.status === 'Pending').length === 0) && (
                                                <p className="ad-notif-empty">No pending bookings</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button className="ad-refresh-btn" onClick={fetchData} title="Refresh">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="23 4 23 10 17 10"/>
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                    </svg>
                                </button>
                            </>
                        )}
                        <div className="ad-avatar-group">
                            <div className="ad-avatar">AD</div>
                            <div className="ad-avatar-info">
                                <p className="ad-avatar-name">Admin</p>
                                <p className="ad-avatar-role">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="ad-body">
                    {activeNav === 'dashboard' && (
                        <DashboardOverview
                            data={data}
                            loading={loading}
                            error={error}
                            onRetry={fetchData}
                            onNav={navTo}
                        />
                    )}
                    {activeNav === 'fleet'     && <FleetPage />}
                    {activeNav === 'bookings'  && <BookingsPage />}
                    {activeNav === 'messages'  && <MessagesPage />}
                </main>
            </div>
        </div>
    );
}