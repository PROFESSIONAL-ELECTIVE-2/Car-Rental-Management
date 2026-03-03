import React, { useState } from 'react';
import Button from '../components/Commons/Button';
import './ContactUs.css';

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real application, you would send this to your backend
        console.log('Contact Form Submitted:', formData);
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="contact-page">
            <header className="contact-header">
                <h1>Contact Us</h1>
                <p>Have questions? We're here to help you get on the road.</p>
            </header>

            <div className="contact-container">
                {/* Contact Information */}
                <aside className="contact-info">
                    <div className="info-block">
                        <h3>Our Office</h3>
                        <p>123 Rental Avenue, Suite 100</p>
                        <p>Manila, Philippines</p>
                    </div>

                    <div className="info-block">
                        <h3>Customer Support</h3>
                        <p><strong>Phone:</strong> +63 912 345 6789</p>
                        <p><strong>Email:</strong> support@triplera.com</p>
                    </div>

                    <div className="info-block">
                        <h3>Business Hours</h3>
                        <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                        <p>Saturday - Sunday: 9:00 AM - 4:00 PM</p>
                        <p><em>24/7 Roadside Assistance for active rentals</em></p>
                    </div>
                </aside>

                {/* Contact Form */}
                <main className="contact-form-container">
                    {submitted ? (
                        <div className="success-message">
                            <h2>Thank you!</h2>
                            <p>Your message has been sent. Our team will get back to you shortly.</p>
                            <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Your Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Subject</label>
                                <select 
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                >
                                    <option value="">Select a topic</option>
                                    <option value="General Inquiry">General Inquiry</option>
                                    <option value="Booking Support">Booking Support</option>
                                    <option value="Fleet Questions">Fleet Questions</option>
                                    <option value="Feedback">Feedback</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    required
                                    rows="5"
                                    placeholder="How can we help you?"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>

                            <Button type="submit">Send Message</Button>
                        </form>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Contact;