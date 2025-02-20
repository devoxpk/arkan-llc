'use client';

import React, { useState } from 'react';
import styles from './ContactForm.module.css';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const goWhatsapp = () => {
    const phoneNumber = '+966 59 677 5390';
    const formattedMsg = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nMessage: ${formData.message}`;
    window.location.href = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phoneNumber)}&text=${encodeURIComponent(formattedMsg)}`;
  };

  return (
    <section id="contact" className={styles.contactForm}>
      <h2>Contact Us</h2>
      <input 
        type="text" 
        name="name" 
        placeholder="Name" 
        value={formData.name} 
        onChange={handleChange} 
      />
      <input 
        type="email" 
        name="email" 
        placeholder="Email" 
        value={formData.email} 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        name="phone" 
        placeholder="Phone" 
        value={formData.phone} 
        onChange={handleChange} 
      />
      <textarea 
        name="message" 
        placeholder="Message" 
        value={formData.message} 
        onChange={handleChange} 
      ></textarea>
      <button onClick={goWhatsapp} type="submit">Submit</button>
    </section>
  );
};

export default ContactForm;