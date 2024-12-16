    // Start of Selection
    'use client'
    import Navbar from '../components/navbar';
    import Footer from '../components/footer';
    import './faq.css';
    import FaqComponent from './faq';
    import Link from 'next/link';
    
    export default function FAQ() {
      return (
        <>
          <Navbar />
          <FaqComponent />
          <Footer />
        </>
      );
    }
      // You can return null or a placeholder while SSR is happening
