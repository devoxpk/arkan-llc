
export const dynamic = 'force-dynamic'; // Ensures the entire page is dynamically rendered
export const revalidate = 0; // Disable caching for this page

import ContactUpper from './contactUpper';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Image from 'next/image';
import ContactForm from '../components/ContactForm';

export default function Contact() {
  return (
    <>
    <Navbar />
    <ContactUpper />
    
    <Image src="heroes/poster1.jpg" alt="Poster" layout="responsive" width={100} height={100} priority />
    <ContactForm />
    <Footer />
    </>
  );
}
