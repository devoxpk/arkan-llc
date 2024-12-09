'use client'
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import './faq.css';
import FaqComponent from './faq';
import Link from 'next/link';

export default function FAQ() {
  // Check if we're on the client side
  if (typeof window !== "undefined") {
    return (
      <>
        <Navbar />
        <FaqComponent />
        <Footer />
      </>
    );}
  
}
  // You can return null or a placeholder while SSR is happening
 
