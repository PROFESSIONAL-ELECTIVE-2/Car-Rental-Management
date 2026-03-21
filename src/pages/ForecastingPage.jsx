import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
}

async function apiFetch(path) {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(`Server error (${res.status})`); }
    if (!res.ok) throw new Error(data.message || `Server error (${res.status})`);
    return data;
}

const fmtPeso = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtPesoShort = (n) => {
    const v = Number(n ?? 0);
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `₱${(v / 1_000).toFixed(1)}K`;
    return `₱${v}`;
};

function Skeleton({ h = 220 }) {
    return (
        <div style={{
            height: h, borderRadius: 14,
            background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaed 50%,#f3f4f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'fp-shimmer 1.5s infinite',
        }} />
    );
}

function Card({ title, subtitle, children, accent = '#2563eb', badge }) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            overflow: 'hidden',
        }}>
            
            <div style={{ height: 3, background: accent }} />
            <div style={{ padding: '20px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{title}</h3>
                        {subtitle && <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>{subtitle}</p>}
                    </div>
                    {badge && (
                        <span style={{
                            background: '#f0fdf4', color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            fontSize: '0.75rem', fontWeight: 700,
                            padding: '4px 12px', borderRadius: 999,
                        }}>{badge}</span>
                    )}
                </div>
            </div>
            <div style={{ padding: '0 24px 24px' }}>{children}</div>
        </div>
    );
}

function PipelinePanel({ pipeline }) {
    if (!pipeline) return <Skeleton />;

    const total = pipeline.total || 1;
    const bars = [
        { label: 'Confirmed (Paid)',    value: pipeline.confirmed,   color: '#16a34a', bg: '#dcfce7' },
        { label: 'Partial (Collected)', value: pipeline.partial,     color: '#d97706', bg: '#fef9c3' },
        { label: 'Outstanding (Quoted)',value: pipeline.outstanding, color: '#2563eb', bg: '#dbeafe' },
    ];

    return (
        <Card
            title="Revenue Pipeline"
            subtitle="Live snapshot of quoted bookings by payment status"
            accent="#16a34a"
            badge={fmtPeso(pipeline.total)}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {bars.map(b => (
                    <div key={b.label} style={{
                        background: b.bg, borderRadius: 10,
                        padding: '14px 16px',
                        borderLeft: `4px solid ${b.color}`,
                    }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {b.label.split(' ')[0]}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>
                            {fmtPesoShort(b.value)}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                            {total > 0 ? Math.round((b.value / total) * 100) : 0}% of pipeline
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: 10 }}>
                <div style={{
                    height: 12, borderRadius: 999, overflow: 'hidden',
                    background: '#f3f4f6', display: 'flex',
                }}>
                    {bars.map(b => {
                        const pct = total > 0 ? (b.value / total) * 100 : 0;
                        return pct > 0 ? (
                            <div key={b.label} style={{
                                width: `${pct}%`, background: b.color,
                                transition: 'width 0.6s ease',
                            }} />
                        ) : null;
                    })}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {bars.map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{b.label}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function ScheduledPanel({ upcoming }) {
    if (!upcoming) return <Skeleton />;

    if (upcoming.length === 0) {
        return (
            <Card title="Scheduled Revenue" subtitle="Quoted bookings starting in the next 30 days" accent="#7c3aed">
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: 10 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <p style={{ margin: 0, fontWeight: 600 }}>No scheduled bookings in the next 30 days</p>
                </div>
            </Card>
        );
    }

    const maxRev = Math.max(...upcoming.map(w => w.scheduledRevenue), 1);
    const totalScheduled = upcoming.reduce((s, w) => s + w.scheduledRevenue, 0);

    return (
        <Card
            title="Scheduled Revenue"
            subtitle="Quoted bookings starting in the next 30 days, grouped by week"
            accent="#7c3aed"
            badge={fmtPeso(totalScheduled)}
        >
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, marginBottom: 12 }}>
                {upcoming.map((w, i) => {
                    const pct = (w.scheduledRevenue / maxRev) * 100;
                    return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
                                
                                <div
                                    title={`Week ${w._id.week}: ${fmtPeso(w.scheduledRevenue)} (${w.bookingCount} booking${w.bookingCount !== 1 ? 's' : ''})`}
                                    style={{
                                        width: '100%',
                                        height: `${Math.max(pct, 5)}%`,
                                        background: 'linear-gradient(180deg,#7c3aed,#a78bfa)',
                                        borderRadius: '5px 5px 3px 3px',
                                        cursor: 'default',
                                        transition: 'filter 0.2s',
                                        minHeight: 6,
                                    }}
                                    onMouseEnter={e => e.target.style.filter = 'brightness(1.15)'}
                                    onMouseLeave={e => e.target.style.filter = ''}
                                />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, textAlign: 'center' }}>
                                W{w._id.week}
                            </span>
                        </div>
                    );
                })}
            </div>

            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                            fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed',
                            background: '#f5f3ff', padding: '2px 8px', borderRadius: 20, minWidth: 48, textAlign: 'center',
                        }}>
                            W{w._id.week}
                        </span>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${(w.scheduledRevenue / maxRev) * 100}%`,
                                background: '#7c3aed',
                                borderRadius: 999,
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', minWidth: 72, textAlign: 'right' }}>
                            {fmtPesoShort(w.scheduledRevenue)}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', minWidth: 56 }}>
                            {w.bookingCount} booking{w.bookingCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function AvgByTypePanel({ avgByType }) {
    if (!avgByType) return <Skeleton />;

    if (avgByType.length === 0) {
        return (
            <Card title="Quote Benchmarks by Type" subtitle="Average, min, and max quote per vehicle type" accent="#f59e0b">
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>No quoted bookings yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Benchmarks appear once you set quotes on bookings</p>
                </div>
            </Card>
        );
    }

    const maxAvg = Math.max(...avgByType.map(t => t.avgPrice), 1);
    const TYPE_COLORS = ['#f59e0b','#2563eb','#7c3aed','#16a34a','#ef4444','#0891b2','#d97706','#6d28d9'];

    return (
        <Card
            title="Quote Benchmarks by Type"
            subtitle="Average, min, and max quoted price per vehicle type"
            accent="#f59e0b"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {avgByType.map((t, i) => {
                    const color = TYPE_COLORS[i % TYPE_COLORS.length];
                    const pct = (t.avgPrice / maxAvg) * 100;
                    return (
                        <div key={t._id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: color, display: 'inline-block', flexShrink: 0,
                                    }} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                        {t._id || 'Unknown'}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                        ({t.bookings} booking{t.bookings !== 1 ? 's' : ''})
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>
                                    {fmtPesoShort(t.avgPrice)} avg
                                </span>
                            </div>
                            
                            <div style={{ height: 8, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden', marginBottom: 4 }}>
                                <div style={{
                                    height: '100%', width: `${pct}%`,
                                    background: color, borderRadius: 999,
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                    Min: {fmtPesoShort(t.minPrice)}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                    Max: {fmtPesoShort(t.maxPrice)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}


function ProjectionPanel({ last7Days, pipeline }) {
    if (!last7Days || !pipeline) return <Skeleton />;

    const weeklyRunRate = last7Days.reduce((s, d) => s + d.revenue, 0);
    const pipelineWeekly = pipeline.outstanding / 4; 

    const weeks = [1, 2, 3, 4].map(w => ({
        week: `Week ${w}`,
        conservative: Math.round(weeklyRunRate * 0.8),
        baseline:     Math.round(weeklyRunRate),
        optimistic:   Math.round(weeklyRunRate + pipelineWeekly * (1 / w)),
    }));

    const maxVal = Math.max(...weeks.map(w => w.optimistic), 1);

    const scenarios = [
        { key: 'conservative', label: 'Conservative (−20%)',       color: '#9ca3af' },
        { key: 'baseline',     label: 'Baseline (7d run-rate)',     color: '#2563eb' },
        { key: 'optimistic',   label: 'Optimistic (+pipeline)',     color: '#16a34a' },
    ];

    return (
        <Card
            title="4-Week Revenue Projection"
            subtitle="Based on last 7-day run-rate and outstanding pipeline"
            accent="#2563eb"
            badge={`Baseline: ${fmtPesoShort(weeklyRunRate)}/wk`}
        >
            
            <div style={{ marginBottom: 20 }}>
                {weeks.map((w, wi) => (
                    <div key={wi} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', minWidth: 56 }}>
                                {w.week}
                            </span>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {scenarios.map(s => (
                                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${(w[s.key] / maxVal) * 100}%`,
                                                background: s.color,
                                                borderRadius: 999,
                                                transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: s.color, fontWeight: 700, minWidth: 52, textAlign: 'right' }}>
                                            {fmtPesoShort(w[s.key])}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px dashed #f1f5f9' }}>
                {scenarios.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '10px 0 0', fontStyle: 'italic' }}>
                Projection only. Optimistic scenario assumes partial conversion of the outstanding quoted pipeline each week.
            </p>
        </Card>
    );
}

function SummaryBar({ pipeline, avgByType, upcoming }) {
    const totalScheduled = (upcoming || []).reduce((s, w) => s + w.scheduledRevenue, 0);
    const topType = avgByType?.[0];

    const stats = [
        {
            label: 'Total Pipeline',
            value: fmtPesoShort(pipeline?.total ?? 0),
            sub: 'Quoted, not yet cancelled',
            color: '#2563eb', bg: '#dbeafe',
        },
        {
            label: 'Outstanding Balance',
            value: fmtPesoShort(pipeline?.outstanding ?? 0),
            sub: 'Quoted but unpaid',
            color: '#ef4444', bg: '#fee2e2',
        },
        {
            label: 'Confirmed Revenue',
            value: fmtPesoShort(pipeline?.confirmed ?? 0),
            sub: 'Fully paid bookings',
            color: '#16a34a', bg: '#dcfce7',
        },
        {
            label: 'Scheduled (30 days)',
            value: fmtPesoShort(totalScheduled),
            sub: `${upcoming?.length ?? 0} week${upcoming?.length !== 1 ? 's' : ''} with bookings`,
            color: '#7c3aed', bg: '#f5f3ff',
        },
        {
            label: 'Top-Earning Type',
            value: topType?._id ?? '—',
            sub: topType ? `Avg ${fmtPesoShort(topType.avgPrice)}` : 'No data yet',
            color: '#f59e0b', bg: '#fef9c3',
        },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
            {stats.map(s => (
                <div key={s.label} style={{
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: 12,
                    padding: '14px 18px',
                    borderLeft: `4px solid ${s.color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {s.label}
                    </p>
                    <p style={{ margin: '4px 0 2px', fontSize: '1.15rem', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
                        {s.value}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{s.sub}</p>
                </div>
            ))}
        </div>
    );
}

export default function ForecastingPage() {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await apiFetch('/api/dashboard/analytics');
            if (!res.success) throw new Error(res.message);
            setData(res.data);
            setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div style={{ padding: '24px 28px', minHeight: '100%', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <style>{`
                @keyframes fp-shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>
                        Revenue Forecasting
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                        Payment pipeline, scheduled bookings, and weekly projections
                        {lastUpdated && <span style={{ marginLeft: 8, color: '#9ca3af' }}>· Updated {lastUpdated}</span>}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px',
                        background: '#f1f5f9', border: '1.5px solid #e2e8f0',
                        borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.82rem', fontWeight: 600, color: '#475569',
                        fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                        transition: 'all 0.15s',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ animation: loading ? 'fp-shimmer 1s linear infinite' : '' }}>
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Refresh
                </button>
            </div>

            {error && (
                <div style={{
                    background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                    borderRadius: 10, padding: '14px 18px', marginBottom: 20,
                    fontSize: '0.875rem', fontWeight: 500,
                }}>
                    Failed to load forecast data: {error}
                    <button onClick={fetchData} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontFamily: 'inherit' }}>
                        Retry
                    </button>
                </div>
            )}

            
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={80} />)}
                </div>
            ) : data ? (
                <SummaryBar pipeline={data.pipeline} avgByType={data.avgByType} upcoming={data.upcoming} />
            ) : null}

            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 20 }}>
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={320} />)
                ) : data ? (
                    <>
                        <PipelinePanel    pipeline={data.pipeline} />
                        <ProjectionPanel  last7Days={data.revenue?.last7Days} pipeline={data.pipeline} />
                        <ScheduledPanel   upcoming={data.upcoming} />
                        <AvgByTypePanel   avgByType={data.avgByType} />
                    </>
                ) : null}
            </div>

            
            {!loading && data && !data.pipeline?.total && !data.avgByType?.length && (
                <div style={{
                    marginTop: 16, background: '#fff', borderRadius: 14,
                    border: '1.5px dashed #e2e8f0', padding: '56px 20px',
                    textAlign: 'center', color: '#9ca3af',
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2" style={{ marginBottom: 14 }}>
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#374151' }}>No forecast data yet</p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.875rem' }}>
                        Forecasting panels will populate once you set quotes on bookings using the Bookings page.
                    </p>
                </div>
            )}
        </div>
    );
}