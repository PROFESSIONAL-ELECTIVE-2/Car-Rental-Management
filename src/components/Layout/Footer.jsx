import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-top-bar" />
            <div className="footer-content">
                <div className="footer-section brand-section">
                    <Link to="/" className="footer-brand-logo">Triple R & A</Link>
                    <p>Your premium car rental destination. Reliable, affordable, and ready for your next journey across the Philippines.</p>
                    <div className="footer-brand-meta">
                        <span className="footer-meta-item">
                            <span className="footer-meta-dot" />
                            12345678910
                        </span>
                        <span className="footer-meta-item">
                            <span className="footer-meta-dot" />
                            reychee06@gmail.com
                        </span>
                        <span className="footer-meta-item">
                            <span className="footer-meta-dot" />
                            Manila, Philippines
                        </span>
                    </div>
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
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Triple R and A Car Rental. All rights reserved.</p>
                <div className="footer-bottom-accent">
                    <span /><span /><span />
                </div>
            </div>
        </footer>
    );
}

export default Footer;