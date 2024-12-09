'use client'
import React from 'react';
import Navbar from '../components/navbar';
import ContactComponent from '../components/contact';
import Footer from '../components/footer';

export default function Contact() {
  if (typeof window !== "undefined") {
  return (
    <>
      <Navbar />
      <ContactComponent />
      <Footer />
    </>
  );}
}
