import React from 'react';
import styles from './contactUpper.module.css';

const ContactUpper = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Let’s connect</h2>
      <p className={styles.paragraph}>If you want to hear more about any project, or want to discuss a project of your own, be in touch. We’d love to hear from you.</p>
      <button className={styles.button}>Leave a message</button>
      <div className={styles.contactInfo}>
        <div>
          <h3 className={styles.heading}>Call</h3>
          <p className={styles.paragraph}>+966 59 677 5390</p>
        </div>
        <div>
          <h3 className={styles.heading}>Write</h3>
          <p className={styles.paragraph}>info@arkan-llc.com</p>
        </div>
        <div>
          <h3 className={styles.heading}>Visit</h3>
          <p className={styles.paragraph}>Al Khobar, 34628 - Kingdom of Saudi Arabia</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUpper; 