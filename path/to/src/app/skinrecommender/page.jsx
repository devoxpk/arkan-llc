import React, { Suspense } from 'react';
import SkinServer from './skinserver';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Products from '../components/products';

const SkinRecommenderPage = () => {
  return (
    <>
      <Navbar />
      {/* <SkinServer /> */}
      <Suspense fallback={<div>Loading Products...</div>}>
        <Products />
      </Suspense>
      <Footer />
    </>
  );
};

export default SkinRecommenderPage;
