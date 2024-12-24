// page.js or layout.js
export const dynamic = 'force-dynamic'; // Ensures the entire page is dynamically rendered
export const revalidate = 0; // Disable caching for this page

import Navbar from './components/navbar.js';
import Products from './components/products';
import Footer from './components/footer.js';
import Video from './components/video.js';
import Loader from './components/loader.js';
import AboutBrand from './components/aboutbrand';
import Gallery from './components/gallery';
import CarouselPoster from './components/carouselposter';

export default function Home() {
  return (
    <>
      {/* Components */}
      <Navbar />
      <CarouselPoster />
      <Video />
      <AboutBrand />
      <Products trending styleHead='none' />
      <Gallery />
      <Loader />
      <Footer />
    </>
  );
}
