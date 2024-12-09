
import React from 'react';


import Navbar from './components/navbar.js';

import Products from './components/products.js';
import Footer from './components/footer.js';
import Video from './components/video.js';

import Loader from './components/loader.js';
import AboutBrand from './components/aboutbrand'
import Gallery from './components/gallery'
import './globals.css'; 
import CarouselPoster from './components/carouselposter'


export default function Home() {
  
  return (
    <>
      {  /* Components */}
      <Navbar />

      
      
<CarouselPoster/> 
<Video />
<AboutBrand/> 
<Products trending styleHead='none'/>
<Gallery/>
      

      
      
      <Products />
      
      <Loader />
      <Footer />
    </>
  );
}
