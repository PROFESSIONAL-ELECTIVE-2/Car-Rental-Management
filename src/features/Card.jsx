import React from 'react';
import './Card.css';

function Card({ id, title, description, image, type, stock, onRent }) {
    return (
        <div className="card">
            <div className="card-image-container">
                <img src={image} alt={title} className="card-image" />
                {type && <span className="card-type-badge">{type}</span>}
            </div>
            <div className="card-content">
                <h3 className="card-title">{title}</h3>
                <p className="card-description">{description}</p>
                <p className="card-stock">
                    <strong>Available Units:</strong> {stock || 0}
                </p>
                <button 
                    className="rent-button" 
                    onClick={() => onRent(id)}
                    disabled={stock <= 0}
                >
                    {stock > 0 ? "Rent Now" : "Out of Stock"}
                </button>
            </div>
        </div>
    );
}

export default Card;