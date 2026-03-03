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
                <aside className="contact-info">
                    <div className="info-block">
                        <h3>Our Office</h3>
                        <p>Main Branch Headquarters</p>
                        <p>Manila, Philippines</p>
                    </div>

                    <div className="info-block">
                        <h3>Customer Support</h3>
                        <p><strong>Phone:</strong> 12345678910</p>
                        <p><strong>Email:</strong> reychee06@gmail.com</p>
                    </div>

                    <div className="info-block">
                        <h3>Business Hours</h3>
                        <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                        <p>Saturday - Sunday: 9:00 AM - 4:00 PM</p>
                        <p><em>24/7 Support for Active Rentals</em></p>
                    </div>
                </aside>

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

            <section className="map-section">
                <h3>Find Us on the Map</h3>
                <div className="map-wrapper">
                    <iframe 
                        title="Office Location"
                        src="https://maps.google.com/maps?q=2F Alphabase Bldg, 45 Scout Rallos Brgy. Laging Handa, Quezon City&z=15&output=embed"
                        width="100%" 
                        height="450" 
                        style={{ border: 0 }} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade">
                    </iframe>
                </div>
            </section>
        </div>
    );
}

export default Contact;