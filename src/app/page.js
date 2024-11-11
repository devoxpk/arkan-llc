"use client";

import React from 'react';
import { SessionProvider } from 'next-auth/react';

import Navbar from './components/navbar.js';
import Poster from './components/poster.js';
import Products from './components/products.js';
import Footer from './components/footer.js';
import Video from './components/video.js';
import Cart from './components/cart.js';
import Loader from './components/loader.js';
import Chatbot from './components/chatbot.jsx';
import './globals.css'; 

export default function Home() {
  return (
    <SessionProvider>
      {/* Components */}
      <Navbar />
      <Cart />
      <Poster />
      {/* <Chatbot /> */}
      <Video />
      <Products />
      <Loader />
      <Footer />
    </SessionProvider>
  );
}
