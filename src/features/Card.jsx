import React from 'react';
import Button from '../components/Commons/Button';
import './Card.css';

function Card({ id, title, description, image, type, stock = 0, onRent }) {
    const isOutOfStock = stock <= 0;

    return (
        <article className="card">

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
            </div>

            <div className="card-content">
                <div className="card-text">
                    <h3 className="card-title">{title}</h3>

                    <p className="card-description">
                        {description}
                    </p>

                    <p className={`card-stock ${isOutOfStock ? 'out' : ''}`}>
                        {isOutOfStock
                            ? "Out of Stock"
                            : `Available Units: ${stock}`
                        }
                    </p>
                </div>

                <Button
                    className="rent-button"
                    onClick={() => onRent(id)}
                    disabled={isOutOfStock}
                >
                    {isOutOfStock ? "Unavailable" : "Rent Now"}
                </Button>
            </div>

        </article>
    );
}

export default Card;