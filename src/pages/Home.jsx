import React from 'react';
import Button from '../components/Commons/Button.jsx';
import Card from '../features/Card.jsx'; // Import your existing Card component
import './Home.css'; 

function Home() {
    // Sample data for featured cars
    const featuredCars = [
        {
            id: 1,
            title: "Toyota Fortuner",
            description: "Premium SUV for family trips.",
            image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=400"
        },
        {
            id: 2,
            title: "Mitsubishi Montero",
            description: "Powerful performance on any terrain.",
            image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400"
        },
        {
            id: 3,
            title: "Toyota Vios",
            description: "Practical and fuel-efficient sedan.",
            image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400"
        }
    ];

    return (
        <div className="home-container">
            {/* Standard Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to Triple R and A Car Rental</h1>
                    <p>Reliable, affordable, and ready for your next journey across the Philippines.</p>
                    <Button /> 
                </div>
            </section>
            
            {/* Featured Cars Grid */}
            <section className="featured-section">
                <h2>Our Featured Fleet</h2>
                <div className="car-grid">
                    {featuredCars.map(car => (
                        <Card 
                            key={car.id}
                            title={car.title}
                            description={car.description}
                            image={car.image}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Home;