// Loader.js
"use client";
import React from 'react';
import '../css/loader.css'; // Optional: If you have any specific styles for the loader
import Image from 'next/image'
const Loader = () => {
  return (
    <div className="loader" style={{zIndex: 10000}}>
      <div className="box">
        <div className="logo">
          <img src='/logo/dwlogo.png' alt='Logo' />
        </div>
      </div>
      <div className="box"></div>
      <div className="box"></div>
      <div className="box"></div>
      <div className="box"></div>
    </div>
  );
};

export default Loader;
