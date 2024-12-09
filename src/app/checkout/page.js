"use client"; // Ensure this is a client component

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../components/navbar";
import Products from "../components/products";
import Footer from "../components/footer";
import Cart from "../components/cart";
import Loader from "../components/loader";
import CheckoutComponent from "../components/checkout"; // Renamed import to avoid conflict

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat");
  if (typeof window !== "undefined") {
  return (
    <>
      <Navbar />
      <Loader />
      <Cart />
      <CheckoutComponent />
      
      <hr />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          background: "black",
          height: "153%",
          color: "white",
        }}
      >
        YOU MAY BE INTERESTED IN
      </div>
      <hr />
      
      {/* Wrap only the Products component in Suspense */}
      <Suspense fallback={<div>Loading Products...</div>}>
        <Products
          collectionsToFetch={cat || "1"} // Provide a default value for `cat` if null
          styleHead="none"
          productsStyle="true"
        />
      </Suspense>
      
      <Footer />
    </>
  );}
}
