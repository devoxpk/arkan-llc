// page.js 
export const dynamic = 'force-dynamic'; // Forces dynamic rendering for the entire page
export const revalidate = 0; // No caching, revalidation on every request

import Navbar from '../components/navbar';
import Products from '../components/products';
import Footer from '../components/footer';

export default function Shop() {
  return (
    <>
      <Navbar />
      <Products />
      <Footer />
    </>
  );
}
