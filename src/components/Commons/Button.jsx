import React from 'react';
import './Button.css'; // Optional: for styling

function Button() {
    const handleClick = () => {
        alert("Button Clicked!");
    };

    return (
        <button className="custom-button" onClick={handleClick}>
            Rent Now
        </button>
    );
}

export default Button;