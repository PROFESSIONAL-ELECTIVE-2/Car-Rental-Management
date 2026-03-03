import React from 'react';
import './About.css';

const AboutUs = () => {
  const fleetCategories = [
    "Economy Cars", "Luxury Sedans", "SUVs", "Vans", "Specialty Vehicles"
  ];

  const benefits = [
    "Wide range of vehicles to suit your needs",
    "Affordable rates with no hidden fees",
    "Convenient pickup and drop-off locations",
    "Flexible rental plans to fit your schedule",
    "24/7 customer support and roadside assistance"
  ];

  return (
    <div className="about-container">
      
      <header className="about-hero">
        <h1>About Triple R and A Car Transport Services</h1>
        <p className="subtitle">Your trusted partner for over a decade.</p>
      </header>

      <section className="about-content">
        <div className="text-block">
          <p>
            Welcome to <strong>Triple R and A Car Rentals</strong>. With over a decade of experience, 
            we provide reliable, affordable, and high-quality car rental services for all your needs.
          </p>
        </div>

        <div className="mission-section">
          <h2>Our Mission</h2>
          <p>
            Our mission is to make car rental easy and accessible for everyone. Whether you're traveling for business, 
            planning a family vacation, or need a vehicle for a special occasion, we provide seamless rentals with 
            a focus on customer satisfaction.
          </p>
        </div>

        <hr className="divider" />

        <div className="fleet-section">
          <h2>Our Fleet</h2>
          <p>We maintain a diverse fleet of vehicles to ensure your safety and comfort.</p>
          <div className="fleet-grid">
            {fleetCategories.map((item, index) => (
              <div key={index} className="fleet-card">{item}</div>
            ))}
          </div>
        </div>

        <div className="why-us-section">
          <h2>Why Choose Us?</h2>
          <ul className="benefits-list">
            {benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>

        <div className="team-section">
          <h2>Our Team</h2>
          <p>
            Our experienced professionals make your rental process easy. From choosing the right vehicle to providing 24/7 support, 
            we're with you every step.
          </p>
        </div>

        <div className="testimonials-section">
          <h2>Customer Testimonials</h2>
          <div className="testimonial-grid">
            <blockquote>
              <p>"Triple R and A Car Rentals made my trip much easier. Booking was simple, and the car was in excellent condition."</p>
              <cite>— Jane Doe</cite>
            </blockquote>
            <blockquote>
              <p>"Great service and affordable rates. I will definitely use Triple R and A Car Rentals again."</p>
              <cite>— John Smith</cite>
            </blockquote>
          </div>
        </div>

        <section className="contact-cta">
          <h2>Contact Us</h2>
          <p>Our friendly support team is available 24/7.</p>
          <button className="contact-btn">Get In Touch</button>
        </section>

      </section>
    </div>
  );
};

export default AboutUs;