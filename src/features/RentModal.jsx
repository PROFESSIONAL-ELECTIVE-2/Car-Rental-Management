import React, { useState } from 'react';
import './RentModal.css';

function RentModal({ car, onClose, onConfirm }) {
    const [formData, setFormData] = useState({
        userName: '',
        rentalDays: 1,
        phone: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(car._id, formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Rent {car.title}</h2>
                <form onSubmit={handleSubmit}>
                    <label>Your Name:</label>
                    <input 
                        type="text" 
                        required 
                        value={formData.userName}
                        onChange={(e) => setFormData({...formData, userName: e.target.value})}
                    />
                    
                    <label>Duration (Days):</label>
                    <input 
                        type="number" 
                        min="1" 
                        required 
                        value={formData.rentalDays}
                        onChange={(e) => setFormData({...formData, rentalDays: e.target.value})}
                    />

                    <label>Phone Number:</label>
                    <input 
                        type="tel" 
                        required 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="confirm-btn">Confirm Rental</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RentModal;