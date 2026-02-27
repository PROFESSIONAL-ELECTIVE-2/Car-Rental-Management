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
                console.log("Sample car object:", data[0]);
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
    return [car.name, car.make, car.brand, car.model, car.title, car.type]
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(term));
});


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
                alert(`Success! Rental confirmed.`);
                setSelectedCar(null); 
            }
        } catch (err) {
            alert("Error processing rental.");
        }
    };

    return (
        <div className="rent-page">
            <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
            />

            <main className="fleet-grid">
                {loading ? (
                    <p>Loading database...</p>
                ) : filteredCars.length > 0 ? (
                    filteredCars.map(car => (
                        <Card 
                            key={car._id} 
                            {...car} 
                            onRent={() => setSelectedCar(car)} 
                        />
                    ))
                ) : (
                    <div className="no-results">No cars found in database for "{searchQuery}"</div>
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