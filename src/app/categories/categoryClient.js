"use client"; // Ensure this is a client component

import React, { useState, useEffect, Suspense } from "react";


function CategoryClient({ category }) {
  const [categoryState, setCategory] = useState([category]);
  const [priceRange, setPriceRange] = useState([0, 10000]); // Converted to PKR
  const [noProducts, setNoProducts] = useState(false);

  console.log('xxx')

  useEffect(() => {
    console.log("New category value:", category); // Log the new value
    setCategory([category]); // Pass category as an array
  }, [category]);

  useEffect(() => {
    const products = document.querySelectorAll(".product-card");
    let visibleProductCount = 0;

    products.forEach((product) => {
      const priceElement = product.querySelector(".card-price data");
      const price = parseInt(priceElement.getAttribute("value")); // Assuming the price is in some smaller unit

      if (price >= priceRange[0] && price <= priceRange[1]) {
        product.style.display = "block";
        visibleProductCount++;
      } else {
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
      
      <div className="card-conteiner" style={{ display: "none" }}>
              <div className="card-contentx">
                <div className="card-titlex">
                  Price <span>Range</span>
                </div>
                <div className="values">
                  <div>
                    ₨<span id="first">{priceRange[0]}</span>
                  </div>{" "}
                  -
                  <div>
                    ₨<span id="second">{priceRange[1]}</span>
                  </div>
                </div>
                <small className="current-range">
                  Current Range:
                  <div>
                    ₨<span id="third">{(priceRange[0] + priceRange[1]) / 2}</span>
                  </div>
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

      
    </>
  );
}

export default CategoryClient; 