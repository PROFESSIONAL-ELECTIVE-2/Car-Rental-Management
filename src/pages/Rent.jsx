import React from 'react';
import Card from '../features/Card.jsx';
import './Rent.css';

const FLEET_DATA = [
    {
        id: 1,
        title: "Toyota Fortuner",
        description: "SUV | 7-Seater | Automatic | Diesel",
        image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=400"
    },
    {
        id: 2,
        title: "Mitsubishi Montero Sport",
        description: "SUV | 7-Seater | Automatic | Diesel",
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400"
    },
    {
        id: 3,
        title: "Toyota Vios",
        description: "Sedan | 5-Seater | Manual | Gasoline",
        image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400"
    },
    {
        id: 4,
        title: "Nissan Navara",
        description: "Pickup | 5-Seater | 4x4 | Diesel",
        image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=400"
    }
];

function Rent() {
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
                        <li><input type="checkbox" id="sedan" /> <label htmlFor="sedan">Sedan</label></li>
                        <li><input type="checkbox" id="pickup" /> <label htmlFor="pickup">Pickup</label></li>
                    </ul>
                </aside>

                <main className="fleet-grid">
                    {FLEET_DATA.map(car => (
                        <Card 
                            key={car.id}
                            title={car.title}
                            description={car.description}
                            image={car.image}
                        />
                    ))}
                </main>
            </div>
        </div>
    );
}

export default Rent;