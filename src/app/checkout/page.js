"use client"; // Ensure this is a client component

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../components/navbar";
import Products from "../components/products";
import Footer from "../components/footer";
import Cart from "../components/cart";
import Loader from "../components/loader";
import CheckoutComponent from "../components/checkout"; // Renamed import to avoid conflict

export default function CheckoutPage() { // Renamed page component
    const searchParams = useSearchParams();
  const cat = searchParams.get("cat");
    return (
        <>
            <Navbar />
            <Loader />
            <Cart />
            <CheckoutComponent /> <hr/><div style={{
  display: 'flex',
  justifyContent: 'center',
  background: 'black',
  height: '153%',
  color: 'white'
}}>
  YOU MAY BE INTERESTED IN
</div>
<hr />

            <Products collectionsToFetch={cat} styleHead="none" productsStyle="true" />
            <Footer />
        </>
    );
}
