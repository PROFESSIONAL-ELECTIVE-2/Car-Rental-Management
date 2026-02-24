import React from 'react';
import CarViewer from '../features/CarModel.jsx'; 
import Button from '../components/Commons/Button.jsx';
import './Home.css'; 

function Home() {
    return (
        <div className="home-container">
            <section className="hero-section">
                <h1>Welcome to Triple R and A Car Rental</h1>
                <p>Experience our fleet in 3D</p>
                <Button /> 
            </section>
            
            <section className="featured-section">
                <h2>Featured 3D Model</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <CarViewer modelPath="/toyota_fortuner_2021.glb" />
                </div>
            </section>
        </div>
    );
}

export default Home;