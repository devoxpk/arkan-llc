"use client"; // Ensure this is a client component

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../components/navbar";
import ProductsWindow from "../components/productsWindow";
import Footer from "../components/footer";
import Cart from "../components/cart";
import Loader from "../components/loader";
import CheckoutComponent from "../components/checkout"; // Renamed import to avoid conflict
import Products from "../components/productsWindow";

export default function CheckoutPage() {
  // Use the useSearchParams hook inside a Suspense boundary.
 
  return (
    <Suspense fallback={<Loader />}>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat");

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
      <Suspense fallback={<Loader />}>
        <Products
          collectionsToFetch={[cat || "1"]} 
          styleHead="none"
          productsStyle="true"
        />
      </Suspense>
      
      <Footer />
    </>
  );
}
