"use client"; // Ensure this is a client component

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../components/navbar";
import Products from "../components/productsServer";
import Footer from "../components/footer";
import Cart from "../components/cart";
import Loader from "../components/loader";
import CheckoutComponent from "../components/checkout"; // Renamed import to avoid conflict

export default function CheckoutPage() {
  // Use the useSearchParams hook inside a Suspense boundary.
  return (
    <Suspense fallback={<div>Loading page...</div>}>
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
      <Suspense fallback={<div>Loading Products...</div>}>
        <Products
          collectionsToFetch={cat || "1"} // Provide a default value for `cat` if null
          styleHead="none"
          productsStyle="true"
        />
      </Suspense>

      <Footer />
    </>
  );
}
