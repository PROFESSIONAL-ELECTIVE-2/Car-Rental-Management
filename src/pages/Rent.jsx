import React, { useState, useEffect } from 'react';
import Card from '../features/Card.jsx';
import './Rent.css';

function Rent() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetching data from the backend connected to car_rental database
        fetch('http://localhost:5000/api/cars')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch car data');
                return res.json();
            })
            .then(data => {
                setCars(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return (
        <div className="rent-page">
            <header className="rent-header">
                <h1>Our Rental Fleet</h1>
                <p>Choose the perfect vehicle for your next journey.</p>
            </header>
            
            <div className="rent-container">
                <aside className="filters">
                    <h3>Filter by Type</h3>
                    <ul>
                        <li><input type="checkbox" id="suv" /> <label htmlFor="suv">SUV</label></li>
                        <li><input type="checkbox" id="mpv" /> <label htmlFor="mpv">MPV</label></li>
                        <li><input type="checkbox" id="vans" /> <label htmlFor="vans">Vans</label></li>
                        <li><input type="checkbox" id="sedan" /> <label htmlFor="sedan">Sedan</label></li>
                    </ul>
                </aside>

                <main className="fleet-grid">
                    {loading && <p>Loading fleet...</p>}
                    {error && <p className="error-message">Error: {error}</p>}
                    
                    {!loading && !error && cars.map(car => (
                        <Card 
                            key={car._id} 
                            title={car.title} 
                            description={car.description} 
                            image={car.image}
                            type={car.type}
                            stock={car.stock} // Pass stock to the Card component
                        />
                    ))}
                    
                    {!loading && cars.length === 0 && <p>No vehicles available at the moment.</p>}
                </main>
            </div>
        </div>
    );
}

export default Rent;