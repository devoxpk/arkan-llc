import React from 'react';

import Navbar from './components/navbar.js';
import Poster from './components/poster.js';
import Products from './components/products.js';
import Footer from './components/footer.js';
import Video from './components/video.js';
import Cart from './components/cart.js';
import Loader from './components/loader.js';

import './globals.css'; 

export default function Home() {
  return (
    <>
        
    
      {/* Components */}
     
      <Navbar />
      <Cart />
      <Poster />
      <Video />
      <Products />
      <Loader />
      <Footer />
    </>
  );
}
