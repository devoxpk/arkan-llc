"use client"; // Ensure this is a client component

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../components/navbar";
import Products from "../components/products";
import Footer from "../components/footer";
import Cart from "../components/cart";
import Loader from "../components/loader";

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat");

  console.log("Category: " + cat);

  // Set initial price range in PKR
  const [priceRange, setPriceRange] = useState([0, 10000]); // Converted to PKR
  const [noProducts, setNoProducts] = useState(false);

  useEffect(() => {
    const products = document.querySelectorAll(".product-card");
    let visibleProductCount = 0;

    products.forEach((product) => {
      const priceElement = product.querySelector(".card-price data");
      const price = parseInt(priceElement.getAttribute("value")); // Assuming the price is in some smaller unit

      if (price >= priceRange[0] && price <= priceRange[1]) {
        product.style.display = "block";
        visibleProductCount++;
        console.log(priceRange[0]+" "+priceRange[1]  + " " + price);
      } else {
        console.log(priceRange[0]+" "+priceRange[1]  + " " + price);

        product.style.display = "none";
      }
    });

    setNoProducts(visibleProductCount === 0);
  }, [priceRange]);

  const handleMinChange = (e) => {
    const minValue = Math.min(parseInt(e.target.value), priceRange[1]);
    setPriceRange([Math.floor(minValue / 100) * 100, priceRange[1]]); // Round down to nearest 100
  };

  const handleMaxChange = (e) => {
    const maxValue = Math.max(parseInt(e.target.value), priceRange[0]);
    setPriceRange([priceRange[0], Math.ceil(maxValue / 100) * 100]); // Round up to nearest 100
  };

  return (
    <>
      <Navbar />
      <Cart />

<hr/>
      <div className="card-conteiner">
        <div className="card-content">
          <div className="card-title">Price <span>Range</span></div>
          <div className="values">
            <div>₨<span id="first">{priceRange[0]}</span></div> -
            <div>₨<span id="second">{priceRange[1]}</span></div>
          </div>
          <small className="current-range">
            Current Range:
            <div>₨<span id="third">{(priceRange[0] + priceRange[1]) / 2}</span></div>
          </small>
          <div className="slider">
            <label className="label-min-value">0</label>
            <label className="label-max-value">10,000</label>
          </div>
          <div className="rangeslider">
            <input 
              className="min input-ranges" 
              name="range_1" 
              type="range" 
              min="0" // Min PKR value
              max="10000" // Max PKR value
              step="100" // Step value to enforce 100 increments
              value={priceRange[0]} 
              onChange={handleMinChange} 
            />
            <input 
              className="max input-ranges" 
              name="range_1" 
              type="range" 
              min="0" // Min PKR value
              max="10000" // Max PKR value
              step="100" // Step value to enforce 100 increments
              value={priceRange[1]} 
              onChange={handleMaxChange} 
            />
          </div>
        </div>
      </div>

      {noProducts && (
        <div className="no-products-message">
          <p>No products found in this price range. Please adjust your filters.</p>
        </div>
      )}

      <Products collectionsToFetch={cat} />
      <Loader />
      <Footer />

      <style jsx>{`
        .filter-heading,
        .price-heading {
          text-align: left;
          color: black;
          margin-left: 20px;
        }

        .price-heading {
          font-weight: bold;
          text-decoration: underline;
        }

        .no-products-message {
        display:none;
          padding: 20px;
          text-align: left;
          background-color: #ffecb3;
          color: #ff6f00;
          font-size: 18px;
          margin: 20px;
          border-radius: 10px;
        }

        .card-conteiner {
          cursor: default;
          --color-primary: #275efe;
          --color-headline: #3f4656;
          --color-text: #99a3ba;
        }

        .card-content {
          width: 100%;
          max-width: 312px;
          padding: 36px 32px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(18, 22, 33, .12);
        }

        .card-content .card-title {
          font-family: inherit;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: var(--color-headline);
        }

        .card-content .card-title span {
          font-weight: 500;
        }

        .card-content .values div, .card-content .current-range div {
          display: inline-block;
          vertical-align: top;
        }

        .card-content .values {
          margin: 0;
          font-weight: 500;
          color: var(--color-primary);
        }

        .card-content .values > div:first-child {
          margin-right: 2px;
        }

        .card-content .values > div:last-child {
          margin-left: 2px;
        }

        .card-content .current-range {
          display: block;
          color: var(--color-text);
          margin-top: 8px;
          font-size: 14px;
        }

        .card-content .slider {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          font-size: .6em;
          color: var(--color-text);
        }

        .input-ranges[type='range'] {
          width: 210px;
          height: 30px;
          overflow: hidden;
          outline: none;
        }

        .input-ranges[type='range'],
        .input-ranges[type='range']::-webkit-slider-runnable-track,
        .input-ranges[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          background: none;
        }

        .input-ranges[type='range']::-webkit-slider-runnable-track {
          width: 200px;
          height: 1px;
          background: var(--color-headline);
        }

        .input-ranges[type='range']:nth-child(2)::-webkit-slider-runnable-track {
          background: none;
        }

        .input-ranges[type='range']::-webkit-slider-thumb {
          position: relative;
          height: 15px;
          width: 15px;
          margin-top: -7px;
          background: #fff;
          border: 1px solid var(--color-headline);
          border-radius: 25px;
          cursor: pointer;
          z-index: 1;
          transition: .5s;
        }

        .input-ranges[type='range']::-webkit-slider-thumb:hover {
          background: #eaefff;
          border: 1px solid var(--color-primary);
          outline: .5px solid var(--color-primary);
        }

        .input-ranges[type='range']::-webkit-slider-thumb:active {
          cursor: grabbing;
        }

        .input-ranges[type='range']:nth-child(1)::-webkit-slider-thumb {
          z-index: 2;
        }

        .rangeslider {
          font-family: sans-serif;
          font-size: 14px;
          position: relative;
          height: 20px;
          width: 210px;
          display: inline-block;
          margin-top: -5px;
        }

        .rangeslider input {
          position: absolute;
        }

        .rangeslider span {
          position: absolute;
          margin-top: 20px;
          left: 0;
        }

        @media (max-width: 768px) {
          .slider {
            width: 100%;
          }

          .filter-heading,
          .price-heading {
            margin-left: 10px;
          }
        }
      `}</style>
    </>
  );
}
