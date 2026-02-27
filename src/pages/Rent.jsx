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
        fetch('http://localhost:5000/api/cars')
            .then(res => res.json())
            .then(data => {
                // Ensure data is an array before setting state
                setCars(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch cars:", err);
                setLoading(false);
            });
    }, []);

    // FIXED: Added optional chaining (?.) and fallbacks ("") 
    // to prevent "toLowerCase of undefined" errors.
    const filteredCars = cars.filter(car => {
        const searchTerm = searchQuery.toLowerCase();
        const carName = (car.name || "").toLowerCase();
        const carBrand = (car.brand || "").toLowerCase();
        
        return carName.includes(searchTerm) || carBrand.includes(searchTerm);
    });

    const openModal = (car) => {
        setSelectedCar(car);
    };

    const handleRentConfirm = async (carId, details) => {
        try {
            const response = await fetch(`http://localhost:5000/api/cars/rent/${carId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(details) 
            });

            if (response.ok) {
                setCars(prev => prev.map(c => 
                    c._id === carId ? { ...c, stock: c.stock - 1 } : c
                ));
                alert(`Success! ${details.userName}, your rental is confirmed.`);
                setSelectedCar(null); 
            }
        } catch (err) {
            alert("Error processing rental.");
        }
    };

    if (loading) {
        return <div className="loading-state">Loading fleet...</div>;
    }

    return (
        <div className="rent-page">
            {/* SearchBar integration */}
            <header className="rent-header">
                <SearchBar 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                />
            </header>

            <main className="fleet-grid">
                {filteredCars.length > 0 ? (
                    filteredCars.map(car => (
                        <Card 
                            key={car._id} 
                            {...car} 
                            onRent={() => openModal(car)} 
                        />
                    ))
                ) : (
                    <div className="no-results">
                        <p>No vehicles found matching "{searchQuery}"</p>
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