import React, { useState, useEffect } from 'react';
import Card from '../features/Card.jsx';
import RentModal from '../features/RentModal.jsx'; 
import SearchBar from '../features/SearchBar.jsx'; 
import './Rent.css';

function Rent() {
    const [cars, setCars] = useState([]); 
    const [selectedCar, setSelectedCar] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(""); 

    useEffect(() => {
        // Updated to use the environment variable or localhost
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        fetch(`${API_URL}/api/cars`)
            .then(res => res.json())
            .then(data => {
                setCars(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Database error:", err);
                setLoading(false);
            });
    }, []);

    const filteredCars = cars.filter(car => {
        const term = searchQuery.toLowerCase();
        // Safe check for multiple fields
        return [car.name, car.make, car.brand, car.model, car.title, car.type]
            .filter(Boolean)
            .some(field => field.toString().toLowerCase().includes(term));
    });

    const handleRentConfirm = async (carId, details) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        try {
            const response = await fetch(`${API_URL}/api/cars/rent/${carId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(details) 
            });

            if (response.ok) {
                setCars(prev => prev.map(c => 
                    c._id === carId ? { ...c, stock: Math.max(0, c.stock - 1) } : c
                ));
                alert(`Success! Rental confirmed.`);
                setSelectedCar(null); 
            }
        } catch (err) {
            alert("Error processing rental.");
        }
    };

    return (
        <div className="rent-page">
            <header className="rent-header">
                <h1>Our Fleet</h1>
                <p>Select from our range of well-maintained vehicles.</p>
            </header>

            <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search by brand, model, or type..."
            />

            <main className="fleet-grid">
                {loading ? (
                    <p className="status-message">Loading database...</p>
                ) : filteredCars.length > 0 ? (
                    filteredCars.map(car => (
                        <Card 
                            key={car._id} 
                            {...car} 
                            disabled={car.stock === 0}
                            onRent={() => setSelectedCar(car)} 
                        />
                    ))
                ) : (
                    <div className="no-results">
                        No cars found for "<strong>{searchQuery}</strong>"
                    </div>
                )}
            </main>

            {selectedCar && (
                <RentModal 
                    car={selectedCar} 
                    onClose={() => setSelectedCar(null)} 
                    onConfirm={handleRentConfirm}
                />
            )}
        </div>
    );
}

export default Rent;