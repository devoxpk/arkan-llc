'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import styles from './Navbar.module.css';
import Sidebar from './Sidebar';
import Link from 'next/link';
const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <nav className={styles.navbar} >
        <div className={styles.logo}>
          <Link href="/">
            <Image style={{padding:"10px"}} src="/arkanlogo.png" alt="Logo" width={150} height={100} />
          </Link>
        </div>
        <button className={styles.sidebarToggle} onClick={toggleSidebar}>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
        </button>
      </nav>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    </>
  );
};

export default Navbar;