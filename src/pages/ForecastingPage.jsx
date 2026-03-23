import React, { useState, useEffect, useCallback, useMemo } from 'react';

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

// ─────────────────────────────────────────────────────────────────────────────
// FORECASTING ENGINE
//
// Uses three signals in priority order:
//
//  Signal 1 — Historical run-rate (strongest)
//    Sum of completed revenue from last 7 days, averaged only over days
//    that actually had revenue (not all 7). This avoids zero-drag from
//    days with no bookings pulling the average down.
//
//  Signal 2 — Scheduled bookings (concrete future data)
//    Bookings already in the system with a quotedPrice and a startDate
//    in the next 30 days, grouped by ISO week. This is actual committed
//    future revenue — more reliable than extrapolation.
//
//  Signal 3 — Pipeline average (weakest, used when history is thin)
//    Derives a per-booking average from avgByType data, then estimates
//    how many bookings the outstanding balance implies per week.
//
// The three signals are blended by weight:
//   - Historical weight scales with how many of the 7 days had revenue (0–0.5)
//   - Scheduled weight is fixed at 0.4 when upcoming data exists
//   - Pipeline weight takes the remainder
//
// This means on day 1 with 1 completed booking, the forecast leans on
// scheduled bookings and the pipeline average — giving a real number
// instead of a flat ₱0.
// ─────────────────────────────────────────────────────────────────────────────
function buildForecast({ last7Days = [], pipeline = {}, upcoming = [], avgByType = [] }) {

    // ── Signal 1: Historical ──────────────────────────────────────────────
    const completedRevDays = (last7Days || []).filter(d => d.revenue > 0);
    const completedTotal   = (last7Days || []).reduce((s, d) => s + d.revenue, 0);
    const activeDays       = Math.max(completedRevDays.length, 1);
    const weeklyFromHist   = (completedTotal / activeDays) * 7;
    const histConfidence   = Math.min(completedRevDays.length / 7, 1); // 0–1

    // ── Signal 2: Scheduled ───────────────────────────────────────────────
    const scheduledTotal  = (upcoming || []).reduce((s, w) => s + w.scheduledRevenue, 0);
    const scheduledWeeks  = Math.max((upcoming || []).length, 1);
    const weeklyFromSched = scheduledTotal / scheduledWeeks;

    // ── Signal 3: Pipeline average ────────────────────────────────────────
    const totalBookings    = avgByType.reduce((s, t) => s + t.bookings, 0);
    const overallAvgQuote  = totalBookings > 0
        ? avgByType.reduce((s, t) => s + t.avgPrice * t.bookings, 0) / totalBookings
        : 0;
    const estBookingsPerWk = overallAvgQuote > 0
        ? (pipeline.outstanding || 0) / overallAvgQuote / 4
        : 0;
    const weeklyFromPipeline = overallAvgQuote * estBookingsPerWk;

    // ── Blend ─────────────────────────────────────────────────────────────
    const histWeight     = histConfidence * 0.5;           // max 0.5
    const schedWeight    = upcoming.length > 0 ? 0.4 : 0;
    const pipelineWeight = Math.max(1 - histWeight - schedWeight, 0);

    let blendedWeekly =
        (weeklyFromHist     * histWeight) +
        (weeklyFromSched    * schedWeight) +
        (weeklyFromPipeline * pipelineWeight);

    if (blendedWeekly < 0) blendedWeekly = 0;

    // ── Confidence label ──────────────────────────────────────────────────
    let dataSource, confidenceLevel, confidenceColor;

    if (completedRevDays.length >= 5) {
        dataSource      = 'Strong signal: 5+ days of completed revenue history';
        confidenceLevel = 'High';
        confidenceColor = '#16a34a';
    } else if (completedRevDays.length >= 2) {
        dataSource      = 'Blended: partial history + scheduled bookings';
        confidenceLevel = 'Medium';
        confidenceColor = '#d97706';
    } else if (upcoming.length > 0 || (pipeline.outstanding || 0) > 0) {
        dataSource      = 'Based on scheduled & quoted bookings — no completed history yet';
        confidenceLevel = 'Low — completes more bookings to improve accuracy';
        confidenceColor = '#ef4444';
    } else {
        dataSource      = 'Insufficient data — add bookings and set quotes to generate a forecast';
        confidenceLevel = 'No data';
        confidenceColor = '#9ca3af';
    }

    // ── 4-week scenarios ──────────────────────────────────────────────────
    // Each week compounds a growth/decline factor.
    // Conservative: −3%/wk  |  Baseline: flat  |  Optimistic: +5%/wk
    //
    // Pipeline bonus (outstanding cash collection curve):
    //   35% in week 1, 30% week 2, 20% week 3, 15% week 4
    //   Front-loaded because clients tend to pay sooner rather than later.
    const GROWTH = { conservative: 0.97, baseline: 1.00, optimistic: 1.05 };
    const PIPELINE_SPREAD = [0.35, 0.30, 0.20, 0.15];
    const outstanding = pipeline.outstanding || 0;

    const weeks = [1, 2, 3, 4].map((w, i) => ({
        week:         `Week ${w}`,
        conservative: Math.round(blendedWeekly * Math.pow(GROWTH.conservative, w)),
        baseline:     Math.round(blendedWeekly * Math.pow(GROWTH.baseline,     w)),
        optimistic:   Math.round(blendedWeekly * Math.pow(GROWTH.optimistic,   w) + outstanding * PIPELINE_SPREAD[i]),
    }));

    return { weeks, blendedWeekly, dataSource, confidenceLevel, confidenceColor };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

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

function Card({ title, subtitle, children, accent = '#2563eb', badge, badgeColor }) {
    return (
        <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden',
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
                            background: badgeColor ? `${badgeColor}18` : '#f0fdf4',
                            color: badgeColor || '#16a34a',
                            border: `1px solid ${badgeColor ? badgeColor + '40' : '#bbf7d0'}`,
                            fontSize: '0.72rem', fontWeight: 700,
                            padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap',
                        }}>{badge}</span>
                    )}
                </div>
            </div>
            <div style={{ padding: '0 24px 24px' }}>{children}</div>
        </div>
    );
}

function ConfidenceBadge({ level, color, source }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: `${color}10`, border: `1px solid ${color}30`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
        }}>
            <span style={{
                width: 8, height: 8, borderRadius: '50%', background: color,
                flexShrink: 0, marginTop: 4, boxShadow: `0 0 0 3px ${color}30`,
            }} />
            <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color }}>
                    Confidence: {level}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4 }}>
                    {source}
                </p>
            </div>
        </div>
    );
}

function ProjectionPanel({ last7Days, pipeline, upcoming, avgByType }) {
    const forecast = useMemo(() =>
        buildForecast({ last7Days, pipeline, upcoming, avgByType }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify({ last7Days, pipeline, upcoming, avgByType })]
    );

    const { weeks, blendedWeekly, dataSource, confidenceLevel, confidenceColor } = forecast;
    const maxVal = Math.max(...weeks.map(w => w.optimistic), 1);
    const totalBaseline = weeks.reduce((s, w) => s + w.baseline, 0);

    const scenarios = [
        { key: 'conservative', label: 'Conservative (−3%/wk)',          color: '#9ca3af' },
        { key: 'baseline',     label: 'Baseline (steady)',               color: '#2563eb' },
        { key: 'optimistic',   label: 'Optimistic (+5%/wk + pipeline)',  color: '#16a34a' },
    ];

    return (
        <Card
            title="4-Week Revenue Projection"
            subtitle="Multi-signal: history · scheduled bookings · outstanding pipeline"
            accent="#2563eb"
            badge={blendedWeekly > 0 ? `~${fmtPesoShort(blendedWeekly)}/wk baseline` : 'Awaiting data'}
            badgeColor={blendedWeekly > 0 ? '#2563eb' : '#9ca3af'}
        >
            <ConfidenceBadge level={confidenceLevel} color={confidenceColor} source={dataSource} />

            <div style={{ marginBottom: 20 }}>
                {weeks.map((w, wi) => (
                    <div key={wi} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', minWidth: 56 }}>
                                {w.week}
                            </span>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {scenarios.map(s => (
                                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: maxVal > 0 ? `${(w[s.key] / maxVal) * 100}%` : '0%',
                                                background: s.color, borderRadius: 999,
                                                transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)',
                                            }} />
                                        </div>
                                        <span style={{
                                            fontSize: '0.72rem',
                                            color: w[s.key] > 0 ? s.color : '#d1d5db',
                                            fontWeight: 700, minWidth: 56, textAlign: 'right',
                                        }}>
                                            {fmtPesoShort(w[s.key])}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {totalBaseline > 0 && (
                <div style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af' }}>
                        4-Week Baseline Total
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e40af' }}>
                        {fmtPesoShort(totalBaseline)}
                    </span>
                </div>
            )}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px dashed #f1f5f9' }}>
                {scenarios.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
                Blends completed revenue history, scheduled future bookings, and outstanding pipeline.
                Accuracy improves as more bookings are marked Completed.
            </p>
        </Card>
    );
}

function PipelinePanel({ pipeline }) {
    if (!pipeline) return <Skeleton />;
    const total = pipeline.total || 1;
    const bars = [
        { label: 'Confirmed (Paid)',     value: pipeline.confirmed,   color: '#16a34a', bg: '#dcfce7' },
        { label: 'Partial (Collected)',  value: pipeline.partial,     color: '#d97706', bg: '#fef9c3' },
        { label: 'Outstanding (Quoted)', value: pipeline.outstanding, color: '#2563eb', bg: '#dbeafe' },
    ];
    return (
        <Card title="Revenue Pipeline" subtitle="Live snapshot of quoted bookings by payment status"
            accent="#16a34a" badge={fmtPeso(pipeline.total)} badgeColor="#16a34a">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {bars.map(b => (
                    <div key={b.label} style={{ background: b.bg, borderRadius: 10, padding: '14px 16px', borderLeft: `4px solid ${b.color}` }}>
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
                <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', background: '#f3f4f6', display: 'flex' }}>
                    {bars.map(b => {
                        const pct = total > 0 ? (b.value / total) * 100 : 0;
                        return pct > 0 ? <div key={b.label} style={{ width: `${pct}%`, background: b.color, transition: 'width 0.6s ease' }} /> : null;
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
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <p style={{ margin: 0, fontWeight: 600 }}>No scheduled bookings in the next 30 days</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Set quotes on upcoming bookings and they will appear here</p>
                </div>
            </Card>
        );
    }
    const maxRev = Math.max(...upcoming.map(w => w.scheduledRevenue), 1);
    const totalScheduled = upcoming.reduce((s, w) => s + w.scheduledRevenue, 0);
    return (
        <Card title="Scheduled Revenue" subtitle="Quoted bookings starting in the next 30 days, grouped by week"
            accent="#7c3aed" badge={fmtPeso(totalScheduled)} badgeColor="#7c3aed">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, marginBottom: 12 }}>
                {upcoming.map((w, i) => {
                    const pct = (w.scheduledRevenue / maxRev) * 100;
                    return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                <div
                                    title={`Week ${w._id.week}: ${fmtPeso(w.scheduledRevenue)} (${w.bookingCount} booking${w.bookingCount !== 1 ? 's' : ''})`}
                                    style={{
                                        width: '100%', height: `${Math.max(pct, 5)}%`,
                                        background: 'linear-gradient(180deg,#7c3aed,#a78bfa)',
                                        borderRadius: '5px 5px 3px 3px', cursor: 'default',
                                        transition: 'filter 0.2s', minHeight: 6,
                                    }}
                                    onMouseEnter={e => e.target.style.filter = 'brightness(1.15)'}
                                    onMouseLeave={e => e.target.style.filter = ''}
                                />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, textAlign: 'center' }}>W{w._id.week}</span>
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 20, minWidth: 48, textAlign: 'center' }}>
                            W{w._id.week}
                        </span>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(w.scheduledRevenue / maxRev) * 100}%`, background: '#7c3aed', borderRadius: 999, transition: 'width 0.6s ease' }} />
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
        <Card title="Quote Benchmarks by Type" subtitle="Average, min, and max quoted price per vehicle type" accent="#f59e0b">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {avgByType.map((t, i) => {
                    const color = TYPE_COLORS[i % TYPE_COLORS.length];
                    return (
                        <div key={t._id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{t._id || 'Unknown'}</span>
                                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>({t.bookings} booking{t.bookings !== 1 ? 's' : ''})</span>
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>{fmtPesoShort(t.avgPrice)} avg</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden', marginBottom: 4 }}>
                                <div style={{ height: '100%', width: `${(t.avgPrice / maxAvg) * 100}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Min: {fmtPesoShort(t.minPrice)}</span>
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Max: {fmtPesoShort(t.maxPrice)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function SummaryBar({ pipeline, avgByType, upcoming }) {
    const totalScheduled = (upcoming || []).reduce((s, w) => s + w.scheduledRevenue, 0);
    const topType = avgByType?.[0];
    const stats = [
        { label: 'Total Pipeline',      value: fmtPesoShort(pipeline?.total ?? 0),       sub: 'Quoted, not yet cancelled',       color: '#2563eb' },
        { label: 'Outstanding Balance', value: fmtPesoShort(pipeline?.outstanding ?? 0), sub: 'Quoted but unpaid',               color: '#ef4444' },
        { label: 'Confirmed Revenue',   value: fmtPesoShort(pipeline?.confirmed ?? 0),   sub: 'Fully paid bookings',             color: '#16a34a' },
        { label: 'Scheduled (30 days)', value: fmtPesoShort(totalScheduled),             sub: `${upcoming?.length ?? 0} week${upcoming?.length !== 1 ? 's' : ''} with bookings`, color: '#7c3aed' },
        { label: 'Top-Earning Type',    value: topType?._id ?? '—',                      sub: topType ? `Avg ${fmtPesoShort(topType.avgPrice)}` : 'No data yet', color: '#f59e0b' },
    ];
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
            {stats.map(s => (
                <div key={s.label} style={{
                    background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12,
                    padding: '14px 18px', borderLeft: `4px solid ${s.color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                    <p style={{ margin: '4px 0 2px', fontSize: '1.15rem', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{s.sub}</p>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ForecastingPage() {
    const [data,        setData]        = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState('');
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

    const hasAnyData = data && (
        data.pipeline?.total > 0 ||
        data.avgByType?.length > 0 ||
        data.upcoming?.length > 0 ||
        data.revenue?.last7Days?.some(d => d.revenue > 0)
    );

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
                    onClick={fetchData} disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                        background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 8,
                        cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.82rem',
                        fontWeight: 600, color: '#475569', fontFamily: 'inherit',
                        opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Refresh
                </button>
            </div>

            {error && (
                <div style={{
                    background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                    borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: '0.875rem', fontWeight: 500,
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
                        <PipelinePanel  pipeline={data.pipeline} />
                        <ProjectionPanel
                            last7Days={data.revenue?.last7Days}
                            pipeline={data.pipeline}
                            upcoming={data.upcoming}
                            avgByType={data.avgByType}
                        />
                        <ScheduledPanel upcoming={data.upcoming} />
                        <AvgByTypePanel avgByType={data.avgByType} />
                    </>
                ) : null}
            </div>

            {!loading && !hasAnyData && (
                <div style={{
                    marginTop: 16, background: '#fff', borderRadius: 14,
                    border: '1.5px dashed #e2e8f0', padding: '56px 20px',
                    textAlign: 'center', color: '#9ca3af',
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2" style={{ marginBottom: 14 }}>
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#374151' }}>No forecast data yet</p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.875rem', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                        Add bookings and set quotes to populate the forecast.
                        Even a single quoted booking will generate projections.
                    </p>
                </div>
            )}
        </div>
    );
}