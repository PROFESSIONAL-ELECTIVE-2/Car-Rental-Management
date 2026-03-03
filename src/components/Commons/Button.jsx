import React from 'react';
import './Button.css'; 

function Button({ onClick, disabled, children, className }) {
    return (
        <button 
            className={`custom-button ${className}`} 
            onClick={onClick} 
            disabled={disabled}
        >
            {children}
        </button>
    );
}

export default Button;