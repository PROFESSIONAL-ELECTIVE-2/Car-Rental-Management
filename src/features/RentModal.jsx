import React, { useState } from 'react';
import Button from '../components/Commons/Button';
import './RentModal.css';

function RentModal({ car, onClose, onConfirm }) {
    const [formData, setFormData] = useState({
        fullName: '',
        rentalDays: 1,
        phone: '',
        email: '',
        pickupDate: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(car._id, formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content booking-modal">

                <div className="modal-header">
                    <h2>Book This Vehicle</h2>
                    <button className="close-x" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="modal-body">

                    {/* Left Side – Car Summary */}
                    <div className="car-summary">
                        <img
                            src={car.image}
                            alt={car.title}
                            className="modal-car-image"
                        />
                        <h3>{car.title}</h3>
                        <p className="car-type-tag">{car.type}</p>

                        <div className="availability-info">
                            <p><strong>Available Units:</strong> {car.stock}</p>
                            <p>Please complete the form to reserve this vehicle.</p>
                        </div>
                    </div>

                    {/* Right Side – Booking Form */}
                    <form onSubmit={handleSubmit} className="rental-form">

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="Juan Dela Cruz"
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({ ...formData, fullName: e.target.value })
                                }
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="0912 345 6789"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="juan@example.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Pickup Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.pickupDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, pickupDate: e.target.value })
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>Rental Duration (Days)</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.rentalDays}
                                    onChange={(e) =>
                                        setFormData({ ...formData, rentalDays: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={onClose}
                            >
                                Cancel
                            </button>

                            <Button type="submit" className="confirm-btn">
                                Confirm Booking
                            </Button>
                        </div>

                    </form>

                </div>
            </div>
        </div>
    );
}

export default RentModal;