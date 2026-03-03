import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section brand-section">
                    <h3>Triple R & A</h3>
                    <p>Your premium car rental destination. Reliable, affordable, and ready for your next journey across the Philippines.</p>
                </div>
                <div className="footer-section">
                    <h3>Explore</h3>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/fleet">Our Fleet</Link></li>
                        <li><Link to="/locations">Locations</Link></li>
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
                <div className="footer-section contact-info">
                    <h3>Contact Info</h3>
                    <p>12345678910</p>
                    <p>reychee06@gmail.com</p>
                    <p>Address</p>
                </div>

            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Triple R and A Car Rental. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;