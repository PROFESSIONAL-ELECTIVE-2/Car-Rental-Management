import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleNav = (path) => {
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="brand">
                    <button className="brand-logo" onClick={() => handleNav('/')}>
                        Triple R & A
                    </button>
                </div>

                <nav className="main-nav">
                    <ul>
                        <li><button onClick={() => handleNav('/')}>Home</button></li>
                        <li><button onClick={() => handleNav('/fleet')}>Our Fleet</button></li>
                        <li><button onClick={() => handleNav('/services')}>Services</button></li>
                        <li><button onClick={() => handleNav('/about')}>About</button></li>
                    </ul>
                </nav>

                <div className="header-actions">
                    <button className="contact-link" onClick={() => handleNav('/contact')}>
                        Contact Support
                    </button>
                    <button className="btn-book-now" onClick={() => handleNav('/rent')}>
                        Book Now
                    </button>
                </div>

                <button
                    className={`mobile-menu-toggle ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
                <button onClick={() => handleNav('/')}>Home</button>
                <button onClick={() => handleNav('/fleet')}>Our Fleet</button>
                <button onClick={() => handleNav('/services')}>Services</button>
                <button onClick={() => handleNav('/about')}>About</button>
                <div className="mobile-nav-divider" />
                <button onClick={() => handleNav('/contact')}>Contact Support</button>
                <button className="btn-book-now" onClick={() => handleNav('/rent')}>Book Now</button>
            </nav>
        </header>
    );
}

export default Header;