import React from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import ShowLoader from '../utils/loader'
const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <button className={styles.closeButton} onClick={toggleSidebar}>
        &times;
      </button>
      <nav className={styles.sidebarNav}>
        <Link href="/" onClick={() => { toggleSidebar(); ShowLoader(true); }}>Home</Link>
        <Link href="/about" onClick={() => { toggleSidebar(); ShowLoader(true); }}>About</Link>
        <Link href="/contact" onClick={() => { toggleSidebar(); ShowLoader(true); }}>Contact Us</Link>
      </nav>
      <div className={styles.footer}>
        <h3>Get in Touch</h3>
        <p>Contact: contact@arkangolden.com</p>
        <p>Email: info@arkangolden.com</p>
      </div>
    </div>
  );
};

export default Sidebar; 