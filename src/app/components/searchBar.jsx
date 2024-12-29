// components/SearchBar.js
import React, { useState } from "react";
import "../css/searchbar.css";
import { db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";
import Products from './productsClient';
import showMessageBox from "../utilis/showMessageBox";

export let toggleSearchBar;
const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

   toggleSearchBar = () => {
    setIsOpen(!isOpen);
  };

  const handleSearch = async (keyword) => {
    if (keyword === "") {
        showMessageBox("Please enter a keyword", "Find Products entering related keyword", false);
        return;
    }
    console.log('Searching for:', keyword);
    setIsLoading(true);

    const searchResults = []; // Initialize as an array to store results

    try {
        let numericValue = 1;
        const keywordParts = keyword.toLowerCase().split(/\s+|\|/).filter(Boolean);

        while (true) {
            console.log('Checking collection:', numericValue);

            // Fetch headers and desc documents
            const headersDocRef = doc(db, numericValue.toString(), "headers");
            const headersDocSnapshot = await getDoc(headersDocRef);

            const descDocRef = doc(db, numericValue.toString(), "desc");
            const descDocSnapshot = await getDoc(descDocRef);

            if (!headersDocSnapshot.exists() && !descDocSnapshot.exists()) {
                console.log('No collection found for:', numericValue);
                break;
            }

            // Check numeric products within the collection
            let productNumber = 1;
            let productsFound = false;

            while (true) {
                const productDocRef = doc(db, numericValue.toString(), productNumber.toString());
                const productDocSnapshot = await getDoc(productDocRef);
                if (!productDocSnapshot.exists()) break;

                const productData = productDocSnapshot.data();
                if (productData.productName) {
                    const productNameLower = productData.productName.toLowerCase();
                    if (keywordParts.every(part => productNameLower.includes(part))) {
                        searchResults.push({
                            id: productNumber, // Add unique id for reference
                            productName: productData.productName,
                            dPrice: productData.dPrice,
                            productCP: productData.productCP,
                            price: productData.price, // Include the missing price field
                            createdAt: productData.createdAt,
                            pic: productData.pic,
                        });
                        console.log('Found product:', productData.productName);
                        productsFound = true;
                    }
                }

                productNumber++;
            }

            // If no matching product is found, check headers and desc
            if (!productsFound) {
                let headersMatched = false;
                if (headersDocSnapshot.exists()) {
                    const headersData = headersDocSnapshot.data();
                    const headersArray = headersData.header || [];

                    headersMatched = headersArray.some(header => 
                        keywordParts.every(part => header.toLowerCase().includes(part))
                    );
                }

                let descMatched = false;
                if (descDocSnapshot.exists()) {
                    const descData = descDocSnapshot.data();
                    const sectionsArray = descData.sections || [];

                    descMatched = sectionsArray.some(section => {
                        const content = section.content?.toLowerCase() || "";
                        const header = section.header?.toLowerCase() || "";

                        return keywordParts.every(part => 
                            content.includes(part) || header.includes(part)
                        );
                    });
                }

                // If headers or desc matches, push all products of the collection
                if (headersMatched || descMatched) {
                    productNumber = 1;
                    while (true) {
                        const productDocRef = doc(db, numericValue.toString(), productNumber.toString());
                        const productDocSnapshot = await getDoc(productDocRef);
                        if (!productDocSnapshot.exists()) break;

                        const productData = productDocSnapshot.data();
                        searchResults.push({
                            id: productNumber,
                            productName: productData.productName,
                            dPrice: productData.dPrice,
                            productCP: productData.productCP,
                            price: productData.price,
                            createdAt: productData.createdAt,
                            pic: productData.pic,
                        });

                        productNumber++;
                    }
                }
            }

            numericValue++;
        }

        console.log('Search results:', searchResults);

        // Wrap the array in the desired format
        const formattedResults = {
            1: searchResults,
        };

        setSearchResults(formattedResults); // Update state with formatted results
    } catch (error) {
        console.error("Error searching database:", error);
    } finally {
        setIsLoading(false);
    }
};




  return (
    <>
    
      {isOpen && (
        <div className="searchbar-container">
          <button className="close-btn" onClick={toggleSearchBar}>
            ✖
          </button>
          <div className="searchbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.target.value);
                }
              }}
            />
            <span
              className="search-icon"
              onClick={() => {
                const input = document.querySelector(".search-input");
                if (input) handleSearch(input.value);
              }}
            >
               <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
            </span>
          </div>
          <div className="results">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
                <Products 
                collectionData={searchResults} 
                headers={[]} 
                productsStyle={true} 
                styleHead="none" 
                removeActions={false} 
              />

)}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBar;
