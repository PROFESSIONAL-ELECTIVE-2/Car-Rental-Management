import React from 'react';
import './Button.css'; 

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