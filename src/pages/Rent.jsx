import React, { useState, useEffect, useMemo } from 'react';
import Card from '../features/Card.jsx';
import RentModal from '../features/RentModal.jsx';
import SearchBar from '../features/SearchBar.jsx';
import './Rent.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Rent() {
    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    /* =========================
       Fetch Cars
    ========================== */
    useEffect(() => {
        const fetchCars = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_BASE_URL}/api/cars`);

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                setCars(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching cars:", err);
                setError("Unable to load vehicles. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCars();
    }, []);

    /* =========================
       Search Filtering
    ========================== */
    const filteredCars = useMemo(() => {
        if (!searchQuery.trim()) return cars;

        const term = searchQuery.toLowerCase();

        return cars.filter(car =>
            [car.name, car.make, car.brand, car.model, car.title, car.type]
                .filter(Boolean)
                .some(field => field.toLowerCase().includes(term))
        );
    }, [cars, searchQuery]);

    /* =========================
       Handle Rental
    ========================== */
    const handleRentConfirm = async (carId, details) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/cars/rent/${carId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(details)
                }
            );

            if (!response.ok) {
                throw new Error("Rental failed");
            }

            // Optimistic UI update
            setCars(prev =>
                prev.map(car =>
                    car._id === carId
                        ? { ...car, stock: Math.max(car.stock - 1, 0) }
                        : car
                )
            );

            setSelectedCar(null);

        } catch (err) {
            console.error("Rental error:", err);
            alert("Unable to process rental. Please try again.");
        }
    };

    return (
        <div className="rent-page">

            <header className="rent-header">
                <h1>Available Vehicles</h1>
                <p>Browse our complete fleet and book your next ride.</p>
            </header>

            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by brand, model, or type..."
            />

            <main className="fleet-grid">

                {loading && (
                    <p className="status-message">Loading vehicles...</p>
                )}

                {error && (
                    <p className="error-message">{error}</p>
                )}

                {!loading && !error && filteredCars.length === 0 && (
                    <div className="no-results">
                        No vehicles found for "<strong>{searchQuery}</strong>"
                    </div>
                )}

                {!loading && !error && filteredCars.map(car => (
                    <Card
                        key={car._id}
                        {...car}
                        disabled={car.stock === 0}
                        onRent={() => {
                            if (car.stock > 0) {
                                setSelectedCar(car);
                            }
                        }}
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