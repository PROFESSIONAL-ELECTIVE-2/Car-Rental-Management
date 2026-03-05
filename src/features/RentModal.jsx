import React, { useState } from 'react';
import Button from '../components/Commons/Button';
import BookingCalendar from '../components/Layout/BookingCalendar'; 
import './RentModal.css';

function RentModal({ car, onClose, onConfirm }) {
    const [formData, setFormData] = useState({
        fullName: '',
        rentalDays: 1,
        phone: '',
        email: '',
        pickupDate: ''
    });

    const handleDateChange = ({ start, end }) => {
        if (start && end) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setFormData({
                ...formData,
                pickupDate: start.toISOString().split('T')[0], 
                rentalDays: diffDays
            });
        } else if (start) {
            setFormData({
                ...formData,
                pickupDate: start.toISOString().split('T')[0],
                rentalDays: 1
            });
        } else {
            setFormData({
                ...formData,
                pickupDate: '',
                rentalDays: 1
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.pickupDate) {
            alert("Please select rental dates on the calendar.");
            return;
        }
        onConfirm(car._id, formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content booking-modal">
                <div className="modal-header">
                    <h2>Book This Vehicle</h2>
                    <button className="close-x" onClick={onClose} aria-label="Close modal">&times;</button>
                </div>

                <div className="modal-scroll-area">
                    <div className="modal-top">
                        <div className="car-summary">
                            <div className="car-image-wrapper">
                                <img
                                    src={car.image}
                                    alt={car.title}
                                    className="modal-car-image"
                                />
                            </div>
                            <h3 className="modal-car-title">{car.title}</h3>
                            <span className="car-type-tag">{car.type}</span>
                        </div>

                        <div className="calendar-section">
                            <label className="form-label">Select Rental Dates</label>
                            <BookingCalendar onDateSelect={handleDateChange} />
                        </div>
                    </div>

                    <div className="modal-bottom">
                        <form onSubmit={handleSubmit} className="rental-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Juan Dela Cruz"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="juan@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Pickup Date</label>
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select from calendar"
                                        value={formData.pickupDate}
                                        className="readonly-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Total Days</label>
                                    <input
                                        type="number"
                                        readOnly
                                        value={formData.rentalDays}
                                        className="readonly-input"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={onClose}>
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
        </div>
    );
}

export default RentModal;