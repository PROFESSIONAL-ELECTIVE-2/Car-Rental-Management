import React from 'react';
import Button from '../components/Commons/Button';
import './Card.css';

// id is often passed as _id from MongoDB, using both for compatibility
function Card({ _id, id, title, description, image, type, stock = 0, onRent }) {
    const isOutOfStock = stock <= 0;
    const carId = _id || id;

    return (
        <article className={`card ${isOutOfStock ? 'is-out' : ''}`}>
            <div className="card-image-container">
                <img
                    src={image}
                    alt={title}
                    className="card-image"
                    loading="lazy"
                />
                {type && (
                    <span className="card-type-badge">
                        {type}
                    </span>
                )}
                {isOutOfStock && (
                    <div className="out-of-stock-overlay">
                        <span>Sold Out</span>
                    </div>
                )}
            </div>

            <div className="card-content">
                <div className="card-text">
                    <h3 className="card-title">{title}</h3>
                    <p className="card-description">
                        {description}
                    </p>
                    <p className={`card-stock ${isOutOfStock ? 'out' : ''}`}>
                        {isOutOfStock
                            ? "Unavailable"
                            : `Available Units: ${stock}`
                        }
                    </p>
                </div>

                <Button
                    className="rent-button"
                    onClick={() => onRent(carId)}
                    disabled={isOutOfStock}
                >
                    {isOutOfStock ? "Fully Booked" : "Rent Now"}
                </Button>
            </div>
        </article>
    );
}

export default Card;