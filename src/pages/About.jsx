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
    <>

      
      <div className="about-container">
        <header className="about-hero">
          <h1>About Triple R and A Car Transport Services</h1>
          <p className="subtitle">Your trusted partner for over a decade.</p>
        </header>

        <section className="about-content">
          <div className="text-block">
            <p>
              Welcome to <strong>Triple R and A Car Rentals</strong>. With over a decade of experience in the industry, 
              we are committed to providing our customers with reliable, affordable, and high-quality car rental services.
            </p>
          </div>

          <div className="mission-section">
            <h2>Our Mission</h2>
            <p>
              Our mission is to make car rental easy and accessible for everyone. Whether you're traveling for business, 
              planning a family vacation, or need a vehicle for a special occasion, we have the perfect solution for you. 
              We strive to offer a seamless rental experience with a focus on customer satisfaction.
            </p>
          </div>

          <hr className="divider" />

          <div className="fleet-section">
            <h2>Our Fleet</h2>
            <p>We offer a diverse fleet of vehicles well-maintained and regularly serviced to ensure your safety and comfort.</p>
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
                <li key={index}>✓ {benefit}</li>
              ))}
            </ul>
          </div>

          <div className="team-section">
            <h2>Our Team</h2>
            <p>
              Our team of experienced professionals is dedicated to making your rental process as easy as possible. 
              From choosing the right vehicle to providing 24/7 roadside assistance, we are here every step of the way.
            </p>
          </div>

          <div className="testimonials-section">
            <h2>Customer Testimonials</h2>
            <div className="testimonial-grid">
              <blockquote>
                <p>"Triple R and A Car Rentals made my trip so much easier. The booking process was simple, and the car was in excellent condition."</p>
                <cite>— Jane Doe</cite>
              </blockquote>
              <blockquote>
                <p>"Great service and affordable rates. I will definitely use Triple R and A Car Rentals again for my next trip."</p>
                <cite>— John Smith</cite>
              </blockquote>
            </div>
          </div>

          <section className="contact-cta">
            <h2>Contact Us</h2>
            <p>Our friendly customer support team is available 24/7.</p>
            <button className="contact-btn">Get In Touch</button>
          </section>
        </section>
      </div>

    </>
  );
};

export default AboutUs;