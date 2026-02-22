import React from 'react';
import { Link } from 'react-router-dom'; 
import './Header.css';

function Header() {
    return (
        <header className="header">
            <div className="header-container">
                <div className="brand">
                    <Link to="/" className="brand-logo">Triple R & A</Link>
                </div>
                <nav className="main-nav">
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/fleet">Our Fleet</Link></li>
                        <li><Link to="/services">Services</Link></li>
                        <li><Link to="/about">About</Link></li>
                    </ul>
                </nav>
                <div className="header-actions">
                    <Link to="/contact" className="contact-link">Contact Support</Link>
                    <button className="btn-book-now">Book Now</button>
                </div>
            </div>
        </header>
    );
}

export default Header;