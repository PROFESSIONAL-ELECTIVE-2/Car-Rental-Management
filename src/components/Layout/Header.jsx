import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import Logo from '../../assets/Logo.svg';
import LName from '../../assets/LName.png';

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
                       <img src={Logo} alt="Logo" className="logo"/>
                       <img src={LName} alt="Brand Name" className="name"/>
                    </button>
                </div>

                <nav className="main-nav">
                    <ul>
                        <li><button onClick={() => handleNav('/')}>Home</button></li>
                        <li><button onClick={() => handleNav('/fleet')}>Our Fleet</button></li>
                        <li><button onClick={() => handleNav('/about')}>About</button></li>
                        <li><button onClick={() => handleNav('/contact')}>Contact</button></li>
                    </ul>
                </nav>

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
            <div className="header-bottom-bar" />

            <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
                <button onClick={() => handleNav('/')}>Home</button>
                <button onClick={() => handleNav('/fleet')}>Our Fleet</button>
                <button onClick={() => handleNav('/about')}>About</button>
                <button onClick={() => handleNav('/contact')}>Contact</button>
            </nav>
        </header>
    );
}

export default Header;