import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Adminpages.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CAR_TYPES    = ['Sedan', 'SUV', 'Van', 'Bus', 'Truck', 'Coupe', 'Hatchback', 'Motorcycle'];

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

async function uploadImage(file) {
    const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error('Cloudinary env vars not set.');
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Image upload failed');
    return data.secure_url;
}


function CarFormModal({ car, onClose, onSaved }) {
    const isEdit  = !!car;
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        title:       car?.title       || '',
        description: car?.description || '',
        type:        car?.type        || CAR_TYPES[0],
        stock:       car?.stock       ?? 1,
        image:       car?.image       || '',
    });

    const [imagePreview, setImagePreview] = useState(car?.image || '');
    const [imageFile,    setImageFile]    = useState(null);
    const [uploading,    setUploading]    = useState(false);
    const [saving,       setSaving]       = useState(false);
    const [error,        setError]        = useState('');

    function handleField(e) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: name === 'stock' ? Number(value) : value }));
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        let imageUrl = form.image;
        if (imageFile) {
            setUploading(true);
            try   { imageUrl = await uploadImage(imageFile); }
            catch (err) { setError(err.message); setUploading(false); return; }
            setUploading(false);
        }
        if (!imageUrl) { setError('Please upload a vehicle image.'); return; }
        setSaving(true);
        try {
            const payload = { ...form, image: imageUrl };
            if (isEdit) {
                await apiFetch(`/api/admin/cars/${car._id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch('/api/admin/cars', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            onSaved();
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    }

    const busy = uploading || saving;

    return (
        <div className="fm-overlay">
            <div className="fm-modal">
                <div className="fm-header">
                    <h2>{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                    <button className="fm-close" onClick={onClose} disabled={busy}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="fm-form">
                    {error && <div className="fm-error">{error}</div>}

                    
                    <div className="fm-img-upload" onClick={() => fileRef.current?.click()}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="preview" className="fm-img-preview" />
                        ) : (
                            <div className="fm-img-placeholder">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                </svg>
                                <p>Click to upload image</p>
                                <span>PNG, JPG, WEBP — required</span>
                            </div>
                        )}
                        {imagePreview && <div className="fm-img-overlay">Change Image</div>}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

                    <div className="fm-row">
                        <div className="fm-group">
                            <label>Vehicle Title *</label>
                            <input name="title" required placeholder="2024 Toyota Camry"
                                value={form.title} onChange={handleField} disabled={busy} />
                        </div>
                        <div className="fm-group">
                            <label>Type *</label>
                            <select name="type" value={form.type} onChange={handleField} disabled={busy}>
                                {CAR_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="fm-group">
                        <label>Description *</label>
                        <textarea name="description" required rows={3} placeholder="Brief vehicle description…"
                            value={form.description} onChange={handleField} disabled={busy} />
                    </div>

                    <div className="fm-group">
                        <label>Stock (units)</label>
                        <input type="number" name="stock" min={0}
                            value={form.stock} onChange={handleField} disabled={busy} />
                    </div>

                
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        background: '#eff6ff', border: '1px solid #bfdbfe',
                        borderRadius: 8, padding: '10px 14px',
                    }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
                            Pricing is quoted per booking by the admin in the Bookings tab. No rate is set here.
                        </p>
                    </div>

                    <div className="fm-actions">
                        <button type="button" className="fm-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="fm-btn-save" disabled={busy}>
                            {uploading ? 'Uploading image…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BookingStatsBadges({ stats }) {
    if (!stats) return null;
    const items = [
        { label: 'Active',    val: stats.active,    bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
        { label: 'Pending',   val: stats.pending,   bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
        { label: 'Total',     val: stats.total,     bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
    ].filter(i => i.val > 0);

    if (items.length === 0) return (
        <span style={{ fontSize: '0.72rem', color: '#d1d5db', fontStyle: 'italic' }}>No bookings yet</span>
    );

    return (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {items.map(item => (
                <span key={item.label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: item.bg, color: item.color,
                    border: `1px solid ${item.border}`,
                    fontSize: '0.68rem', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 20,
                }}>
                    {item.val} {item.label}
                </span>
            ))}
        </div>
    );
}

export default function FleetPage() {
    const [cars,        setCars]        = useState([]);
    const [bookingMap,  setBookingMap]  = useState({}); 
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState('');
    const [search,      setSearch]      = useState('');
    const [modalCar,    setModalCar]    = useState(undefined);
    const [deleting,    setDeleting]    = useState(null);
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [carsData, bookingsData] = await Promise.all([
                apiFetch('/api/admin/cars'),
                apiFetch('/api/bookings'),
            ]);

            const cars = Array.isArray(carsData) ? carsData : [];
            setCars(cars);

            
            const map = {};
            if (Array.isArray(bookingsData)) {
                for (const b of bookingsData) {
                    const id = b.carId?._id || b.carId;
                    if (!id) continue;
                    if (!map[id]) map[id] = { active: 0, pending: 0, total: 0 };
                    map[id].total++;
                    if (b.status === 'Active')  map[id].active++;
                    if (b.status === 'Pending') map[id].pending++;
                }
            }
            setBookingMap(map);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    async function handleDelete(car) {
        if (!window.confirm(`Delete "${car.title}"? This cannot be undone.`)) return;
        setDeleting(car._id);
        try {
            await apiFetch(`/api/admin/cars/${car._id}`, { method: 'DELETE' });
            setCars(prev => prev.filter(c => c._id !== car._id));
        } catch (err) {
            alert(err.message);
        } finally {
            setDeleting(null);
        }
    }

    async function handleStockChange(car, delta) {
        const newStock = Math.max(0, car.stock + delta);
        try {
            await apiFetch(`/api/admin/cars/${car._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock }),
            });
            setCars(prev => prev.map(c => c._id === car._id ? { ...c, stock: newStock } : c));
        } catch (err) {
            alert(err.message);
        }
    }

    const filtered = cars.filter(c =>
        [c.title, c.type, c.description].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="fp-root">
            
            <div className="fp-toolbar">
                <div className="fp-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input className="fp-search" placeholder="Search fleet…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="fp-add-btn" onClick={() => setModalCar(null)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Vehicle
                </button>
            </div>

            {error && <div className="fp-banner fp-banner--error">{error}</div>}

            {loading ? (
                <div className="fp-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="fp-skeleton" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="fp-empty">
                    <p>{search ? `No vehicles matching "${search}"` : 'No vehicles in fleet yet.'}</p>
                    {!search && (
                        <button className="fp-add-btn" onClick={() => setModalCar(null)}>
                            Add your first vehicle
                        </button>
                    )}
                </div>
            ) : (
                <div className="fp-grid">
                    {filtered.map(car => {
                        const stats  = bookingMap[car._id] || null;
                        const isLive = stats?.active > 0;
                        return (
                            <div key={car._id} className="fp-card">
                                <div className="fp-card__img-wrap">
                                    <img src={car.image} alt={car.title} className="fp-card__img" />
                                    <span className="fp-card__type">{car.type}</span>
                                    
                                    {isLive && (
                                        <span style={{
                                            position: 'absolute', top: 8, left: 8,
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            background: 'rgba(5, 150, 105, 0.92)',
                                            backdropFilter: 'blur(4px)',
                                            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                                            padding: '3px 9px', borderRadius: 20,
                                            letterSpacing: '0.04em',
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: '#6ee7b7',
                                                boxShadow: '0 0 0 0 rgba(110,231,183,0.5)',
                                                animation: 'fp-pulse 2s infinite',
                                                display: 'inline-block', flexShrink: 0,
                                            }} />
                                            IN USE
                                        </span>
                                    )}
                                </div>

                                <div className="fp-card__body">
                                    <p className="fp-card__title">{car.title}</p>
                                    <p className="fp-card__desc">{car.description}</p>

                                    
                                    <div style={{ marginBottom: 8 }}>
                                        <BookingStatsBadges stats={stats} />
                                    </div>

                                    
                                    <div className="fp-card__meta">
                                        <span style={{
                                            fontSize: '0.75rem', color: '#9ca3af',
                                            display: 'flex', alignItems: 'center', gap: 5,
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="1" x2="12" y2="23"/>
                                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                            </svg>
                                            Quoted per booking
                                        </span>
                                        <div className="fp-stock-ctrl">
                                            <button className="fp-stock-btn"
                                                onClick={() => handleStockChange(car, -1)}
                                                disabled={car.stock === 0}>−</button>
                                            <span className={`fp-stock-val${car.stock === 0 ? ' fp-stock-val--empty' : ''}`}>
                                                {car.stock}
                                            </span>
                                            <button className="fp-stock-btn"
                                                onClick={() => handleStockChange(car, 1)}>+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="fp-card__actions">
                                    <button className="fp-action-btn fp-action-btn--edit"
                                        onClick={() => setModalCar(car)}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                        Edit
                                    </button>
                                    <button className="fp-action-btn fp-action-btn--delete"
                                        onClick={() => handleDelete(car)}
                                        disabled={deleting === car._id}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                            <path d="M10 11v6M14 11v6"/>
                                            <path d="M9 6V4h6v2"/>
                                        </svg>
                                        {deleting === car._id ? '…' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes fp-pulse {
                    0%   { box-shadow: 0 0 0 0   rgba(110,231,183,0.5); }
                    70%  { box-shadow: 0 0 0 6px rgba(110,231,183,0);   }
                    100% { box-shadow: 0 0 0 0   rgba(110,231,183,0);   }
                }
            `}</style>

            {modalCar !== undefined && (
                <CarFormModal
                    car={modalCar}
                    onClose={() => setModalCar(undefined)}
                    onSaved={() => { setModalCar(undefined); fetchAll(); }}
                />
            )}
        </div>
    );
}