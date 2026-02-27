import React, { useState, useEffect } from 'react';
import Card from '../features/Card.jsx';
import RentModal from '../features/RentModal.jsx'; 
import './Rent.css';

function Rent() {
    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/cars')
            .then(res => res.json())
            .then(data => {
                setCars(data);
                setLoading(false);
            });
    }, []);

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

    return (
        <div className="rent-page">
            <main className="fleet-grid">
                {cars.map(car => (
                    <Card 
                        key={car._id} 
                        {...car} 
                        onRent={() => openModal(car)} 
                    />
                ))}
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