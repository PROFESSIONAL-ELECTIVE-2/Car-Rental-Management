import React from 'react';
import Card from '../features/Card.jsx';
import Button from '../components/Commons/Button.jsx';
import './Home.css'; // We will create this next

function Home() {
    return (
        <div className="home-container">
            <section className="hero-section">
                <h1>Welcome to Triple R and A Car Rental</h1>
                <p>Find the perfect car for your next adventure or business trip.</p>
                <Button /> 
            </section>

            
            <section className="featured-section">
                <h2>Featured Vehicles</h2>
                <div className="car-grid">
                    <Card 
                        title="Toyota Camry" 
                        description="Reliable, fuel-efficient sedan perfect for city driving."
                        image="https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&q=80&w=500"
                    />
                    <Card 
                        title="Ford Mustang" 
                        description="Experience the thrill of a classic American muscle car."
                        image="https://images.unsplash.com/photo-1584345604476-8ec5e12e42a5?auto=format&fit=crop&q=80&w=500"
                    />
                    <Card 
                        title="Honda CR-V" 
                        description="Spacious and versatile SUV for family road trips."
                        image="https://images.unsplash.com/photo-1568844293986-8d0400ba4792?auto=format&fit=crop&q=80&w=500"
                    />
                </div>
            </section>
        </div>
    );
}

export default Home;