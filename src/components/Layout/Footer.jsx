import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import Logo from '../../assets/Logo.svg';
import LName from '../../assets/LName.png';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-top-bar" />
            <div className="footer-content">
                <div className="footer-section brand-section">
                    <Link to="/" className="footer-brand-logo">
                        <img src={Logo} alt="Logo" className="logo"/>
                        <img src={LName} alt="Brand Name" className="name"/>
                    </Link>
                    <p>Your premium car rental destination. Reliable, affordable, and ready for your next journey across the Philippines.</p>
                </div>
                <div className="footer-section">
                    <h3>Explore</h3>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/fleet">Our Fleet</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h3>Support</h3>
                    <ul>
                        <li><Link to="/faq">FAQs</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/privacy">Privacy Policy</Link></li>
                        <li><Link to="/terms">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Triple R and A Car Rental. All rights reserved.</p>
                <div className="footer-bottom-accent">
                    <span /><span /><span />
                </div>
            </div>
            <button 
                className="floating-return-btn" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6"/>
                </svg>
            </button>
        </footer>
    );
}

export default Footer;