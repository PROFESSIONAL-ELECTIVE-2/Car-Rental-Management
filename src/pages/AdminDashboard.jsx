import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Realistic dummy data (mirrors dashboardController.js response shape) ───
const DUMMY_DATA = {
    revenue: {
        total: 48750,
        last7Days: [
            { date: '2025-07-26', revenue: 3200 },
            { date: '2025-07-27', revenue: 5100 },
            { date: '2025-07-28', revenue: 4200 },
            { date: '2025-07-29', revenue: 6800 },
            { date: '2025-07-30', revenue: 3900 },
            { date: '2025-07-31', revenue: 7200 },
            { date: '2025-08-01', revenue: 5600 },
        ],
    },
    fleet: { total: 24, available: 11, rented: 10, maintenance: 3 },
    recentBookings: [
        { id: 'b001', customerName: 'Marcus Johnson',  customerEmail: 'm.johnson@email.com',  car: '2023 Toyota Camry',     licensePlate: 'XYZ-4521', startDate: '2025-07-01T00:00:00Z', endDate: '2025-07-05T00:00:00Z', totalCost: 320,  status: 'Active',    createdAt: '2025-07-01T09:14:00Z' },
        { id: 'b002', customerName: 'Sarah Williams',  customerEmail: 's.williams@email.com', car: '2022 Honda Accord',     licensePlate: 'ABC-8873', startDate: '2025-06-28T00:00:00Z', endDate: '2025-07-02T00:00:00Z', totalCost: 480,  status: 'Completed', createdAt: '2025-06-28T11:30:00Z' },
        { id: 'b003', customerName: 'David Chen',      customerEmail: 'd.chen@techcorp.com',  car: '2024 BMW 3 Series',     licensePlate: 'LMN-2290', startDate: '2025-07-02T00:00:00Z', endDate: '2025-07-07T00:00:00Z', totalCost: 875,  status: 'Active',    createdAt: '2025-07-02T08:00:00Z' },
        { id: 'b004', customerName: 'Emily Rodriguez', customerEmail: 'emily.r@gmail.com',    car: '2023 Ford Explorer',    licensePlate: 'QRS-6641', startDate: '2025-07-03T00:00:00Z', endDate: '2025-07-06T00:00:00Z', totalCost: 390,  status: 'Pending',   createdAt: '2025-07-03T15:22:00Z' },
        { id: 'b005', customerName: 'James Okafor',    customerEmail: 'j.okafor@mail.com',    car: '2021 Chevrolet Malibu', licensePlate: 'TUV-1193', startDate: '2025-06-25T00:00:00Z', endDate: '2025-06-28T00:00:00Z', totalCost: 210,  status: 'Cancelled', createdAt: '2025-06-24T10:45:00Z' },
    ],
    bookingStats: { pending: 4, active: 10, completed: 87, cancelled: 6 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDay = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });

// ─── Nav config ──────────────────────────────────────────────────────────────
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
        id: 'customers', label: 'Customers',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
];

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    return <span className={`ad-badge ad-badge--${status.toLowerCase()}`}>{status}</span>;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
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

// ─── RevenueChart (pure CSS bars) ────────────────────────────────────────────
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
                                <div
                                    className={`ad-chart__bar${isLast ? ' ad-chart__bar--today' : ''}`}
                                    style={{ height: `${Math.max(pct, 4)}%` }}
                                />
                            </div>
                            <span className={`ad-chart__label${isLast ? ' ad-chart__label--today' : ''}`}>
                                {shortDay(day.date)}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="ad-chart__axis">
                <span>$0</span>
                <span>{formatCurrency(max)}</span>
            </div>
        </div>
    );
}

// ─── FleetStatus ──────────────────────────────────────────────────────────────
function FleetStatus({ fleet, bookingStats }) {
    const avPct   = (fleet.available   / fleet.total) * 100;
    const rentPct = (fleet.rented      / fleet.total) * 100;
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

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
    return (
        <div className="ad-skeleton">
            <div className="ad-skeleton__row">
                {[1,2,3].map(i => <div key={i} className="ad-skeleton__card" />)}
            </div>
            <div className="ad-skeleton__row ad-skeleton__row--two">
                <div className="ad-skeleton__block" />
                <div className="ad-skeleton__block" />
            </div>
            <div className="ad-skeleton__block ad-skeleton__block--tall" />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [activeNav, setActiveNav]     = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen]     = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/dashboard/analytics`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            setData(json.data);
        } catch (err) {
            console.warn('[AdminDashboard] API unavailable, using dummy data:', err.message);
            setData(DUMMY_DATA); // ← swap for setError(err.message) in production
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const stats = data ? [
        { title: 'Total Revenue',  value: formatCurrency(data.revenue.total), subtitle: 'All completed bookings',        icon: '💰', accent: 'gold',  index: 0 },
        { title: 'Active Rentals', value: data.fleet.rented,                  subtitle: `${data.fleet.available} available`, icon: '🚗', accent: 'blue',  index: 1 },
        { title: 'Total Fleet',    value: data.fleet.total,                   subtitle: `${data.fleet.maintenance} in maintenance`, icon: '🏎️', accent: 'dark', index: 2 },
    ] : [];

    return (
        <div className="ad-root">
            {sidebarOpen && <div className="ad-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* ══ SIDEBAR ══ */}
            <aside className={`ad-sidebar${sidebarOpen ? ' ad-sidebar--open' : ''}`}>
                <div className="ad-sidebar__logo">
                    <div className="ad-sidebar__logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" rx="2"/>
                            <path d="M16 8h4l3 5v3h-7V8z"/>
                            <circle cx="5.5" cy="18.5" r="2.5"/>
                            <circle cx="18.5" cy="18.5" r="2.5"/>
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
                        <button
                            key={link.id}
                            className={`ad-nav-btn${activeNav === link.id ? ' ad-nav-btn--active' : ''}`}
                            onClick={() => { setActiveNav(link.id); setSidebarOpen(false); }}
                        >
                            <span className="ad-nav-btn__icon">{link.icon}</span>
                            {link.label}
                            {link.id === 'bookings' && data?.bookingStats.pending > 0 && (
                                <span className="ad-nav-btn__badge">{data.bookingStats.pending}</span>
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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                        </svg>
                        Settings
                    </button>
                    <button className="ad-sidebar__footer-btn ad-sidebar__footer-btn--logout">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* ══ MAIN ══ */}
            <div className="ad-main">
                {/* Header */}
                <header className="ad-header">
                    <div className="ad-header__left">
                        <button className="ad-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
                            <span /><span /><span />
                        </button>
                        <div>
                            <h1 className="ad-header__title">
                                {NAV_LINKS.find(n => n.id === activeNav)?.label}
                            </h1>
                            <p className="ad-header__date">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="ad-header__right">
                        {/* Notification bell */}
                        <div className="ad-notif-wrap">
                            <button className="ad-notif-btn" onClick={() => setNotifOpen(v => !v)} aria-label="Notifications">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                                {data?.bookingStats.pending > 0 && (
                                    <span className="ad-notif-dot">{data.bookingStats.pending}</span>
                                )}
                            </button>
                            {notifOpen && (
                                <div className="ad-notif-dropdown">
                                    <p className="ad-notif-dropdown__title">Notifications</p>
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

                        {/* Refresh */}
                        <button className="ad-refresh-btn" onClick={fetchData} title="Refresh data">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>

                        {/* Avatar */}
                        <div className="ad-avatar-group">
                            <div className="ad-avatar">AD</div>
                            <div className="ad-avatar-info">
                                <p className="ad-avatar-name">Admin</p>
                                <p className="ad-avatar-role">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Body */}
                <main className="ad-body">
                    {loading ? (
                        <Skeleton />
                    ) : error ? (
                        <div className="ad-error">
                            <span className="ad-error__icon">⚠️</span>
                            <h3>Failed to load dashboard</h3>
                            <p>{error}</p>
                            <button className="ad-error__btn" onClick={fetchData}>Retry</button>
                        </div>
                    ) : (
                        <>
                            {/* Stat Cards */}
                            <section className="ad-section">
                                <p className="ad-section__label">Quick Stats</p>
                                <div className="ad-stats-grid">
                                    {stats.map(s => <StatCard key={s.title} {...s} />)}
                                </div>
                            </section>

                            {/* Chart + Fleet */}
                            <section className="ad-section">
                                <div className="ad-mid-grid">
                                    <RevenueChart data={data.revenue.last7Days} />
                                    <FleetStatus fleet={data.fleet} bookingStats={data.bookingStats} />
                                </div>
                            </section>

                            {/* Bookings Table */}
                            <section className="ad-section">
                                <div className="ad-table-header">
                                    <div>
                                        <p className="ad-section__label">Recent Bookings</p>
                                        <p className="ad-table-sub">5 most recent transactions</p>
                                    </div>
                                    <button className="ad-view-all-btn">View all bookings →</button>
                                </div>
                                <div className="ad-table-wrap">
                                    <table className="ad-table">
                                        <thead>
                                            <tr>
                                                {['Customer','Vehicle','Rental Period','Cost','Status','Booked'].map(h => (
                                                    <th key={h}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.recentBookings.map((b, i) => (
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
                    )}
                </main>
            </div>
        </div>
    );
}