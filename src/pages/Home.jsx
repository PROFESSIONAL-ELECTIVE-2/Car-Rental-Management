import React from 'react';
import Card from '../features/Card.jsx';
import Button from '../components/Commons/Button.jsx';
import './Home.css'; 

function Home() {
    return (
        <div className="home-container">
            <section className="hero-section">
                <h1>Welcome to Triple R and A Car Rental</h1>
                <p>Business Desc.</p>
                <Button /> 
            </section>
            <section className="featured-section">
                <h2>Featured Vehicles</h2>
                <div className="car-grid">
                    <Card 
                        title="Car" 
                        description="Desc."
                        image="#"
                    />
                    <Card 
                        title="Car2" 
                        description="Desc."
                        image="#"
                    />
                    <Card 
                        title="Car3" 
                        description="Desc"
                        image="#"
                    />
                </div>
            </section>
        </div>
    );
}

export default Home;