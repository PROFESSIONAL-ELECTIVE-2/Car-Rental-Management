import React, { useState, useEffect } from 'react';
import Card from '../features/Card.jsx';
import './Rent.css';

function Rent() {
    const [cars, setCars] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/cars')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => setCars(data))
            .catch(err => setError(err.message));
    }, []);

    return (
        <div className="rent-page">
            <main className="fleet-grid">
                {error && <p>Error: {error}</p>}
                {cars.map(car => (
                    <Card key={car._id} title={car.title} description={car.description} image={car.image} />
                ))}
            </main>
        </div>
    );
}

export default Rent;