import React from 'react';
import './Card.css';

function Card({ title, description, image, type, stock }) {
    return (
        <div className="card">
            <div className="card-image-container">
                <img src={image} alt={title} className="card-image" />
                {type && <span className="card-type-badge">{type}</span>}
            </div>
            <div className="card-content">
                <h3 className="card-title">{title}</h3>
                <p className="card-description">{description}</p>
                {/* Displaying stock count from database */}
                <p className="card-stock">
                    <strong>Available Units:</strong> {stock || 0}
                </p>
                <button className="rent-button">Rent Now</button>
            </div>
        </div>
    );
}

export default Card;