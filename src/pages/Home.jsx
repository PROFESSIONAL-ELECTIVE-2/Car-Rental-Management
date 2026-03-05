import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Commons/Button.jsx';
import Card from '../features/Card.jsx';
import './Home.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Home() {
    const navigate = useNavigate();

    const [featuredCars, setFeaturedCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCars = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/api/cars`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            setFeaturedCars(data.slice(0, 3));

        } catch (err) {
            console.error('Failed to fetch cars:', err);
            setError('Unable to load vehicles at this time. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    return (
        <main className="home-container">
            
            <section className="hero-section">
                <div className="hero-overlay">
                    <div className="hero-content">
                        <span className="hero-subtitle">
                            PREMIUM FLEET. UNMATCHED SERVICE.
                        </span>

                        <h1>Triple R and A Car Rental</h1>

                        <p>
                            Reliable, affordable, and ready for your next journey.
                            We provide high-quality vehicles for family trips,
                            business travel, and daily rentals.
                        </p>

                        <div className="hero-cta">
                            <Button onClick={() => navigate('/rent')}>
                                View All Vehicles
                            </Button>

                            <button
                                className="admin-login-btn"
                                onClick={() => navigate('/admin/login')}
                                aria-label="Admin Login"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                Admin Login
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="info-section">
                <div className="info-grid">
                    <div className="info-card">
                        <h3>Well-Maintained Vehicles</h3>
                        <p>
                            Every vehicle undergoes thorough inspection and
                            routine maintenance before each rental.
                        </p>
                    </div>

                    <div className="info-card">
                        <h3>Flexible Booking Options</h3>
                        <p>
                            Choose from daily, weekly, or monthly rental plans
                            tailored to your transportation needs.
                        </p>
                    </div>

                    <div className="info-card">
                        <h3>24/7 Customer Support</h3>
                        <p>
                            Dedicated assistance and roadside support available
                            throughout your rental period.
                        </p>
                    </div>
                </div>
            </section>

            <section className="featured-section">
                <header className="section-header">
                    <h2>Featured Fleet</h2>
                    <p>Explore our most in-demand vehicles.</p>
                </header>

                <div className="car-grid">
                    {loading && <p className="status-message">Loading vehicles...</p>}

                    {error && <p className="error-message">{error}</p>}

                    {!loading && !error && featuredCars.length === 0 && (
                        <p className="status-message">No vehicles available.</p>
                    )}

                    {!loading && !error && featuredCars.map((car) => (
                        <Card
                            key={car._id}
                            id={car._id}
                            title={car.title}
                            description={car.description}
                            image={car.image}
                            type={car.type}
                            stock={car.stock}
                            onRent={() => navigate('/rent')}
                        />
                    ))}
                </div>
            </section>

        </main>
    );
}

export default Home;