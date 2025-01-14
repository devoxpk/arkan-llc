"use client";
import { useState, useEffect } from 'react';
import React from 'react';
import { db, storage } from '../firebase'; // Import Firestore and Storage instances
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs,serverTimestamp,onSnapshot } from 'firebase/firestore'; // Firestore methods
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Storage methods
import {handleCart} from "./cart"
import Link from "next/link";
import '../css/products.css'
import Loader from './loader'
import {fetchSizeChart} from './sizes';

import { refreshProducts } from './products';
import showMessageBox from '../utilis/showMessageBox';
import addProduct from './ProductAdd';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function Products({ collectionData, headers, collectionsToFetch = [], styleHead = 'grid', productsStyle = false, trending = false, removeActions = true }) {
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [canEdit, setEdit] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.has('edit')) {
      setEdit(true);
    } else {
      setEdit(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (collectionsToFetch.length > 0) {
          const unsubscribes = collectionsToFetch.map((collectionName) =>
            onSnapshot(collection(db, collectionName), async (snapshot) => {
              for (const change of snapshot.docChanges()) {
                if (['modified', 'removed'].includes(change.type)) {
                  console.log(`${change.type.charAt(0).toUpperCase() + change.type.slice(1)} document:`, change.doc.data());
                  try {
                   await refreshProducts();
                    console.log("Refreshing products"); // await refreshProducts();
                  } catch (error) {
                    console.error('Error refreshing products:', error);
                  }
                }
              }
            })
          );

          return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
          };
        } else {
          console.warn('No collections to fetch.');
        }
      } catch (error) {
        console.error('Error setting up onSnapshot:', error);
      }
    };

    fetchData();
  }, [collectionsToFetch]);


  useEffect(() => {
    console.log("New collectionData:", collectionData);
    console.log("New headers:", headers);
    console.log("New collectionsToFetch:", collectionsToFetch);
    console.log("New styleHead:", styleHead);
    console.log("New productsStyle:", productsStyle);
    console.log("New trending:", trending);
    console.log("New removeActions:", removeActions);
  }, [collectionData, headers, collectionsToFetch, styleHead, productsStyle, trending, removeActions]);

  useEffect(() => {
    const scrollLeftBtn = document.querySelector('.scroll-button-left');
    const scrollRightBtn = document.querySelector('.scroll-button-right');
    const productList = document.querySelector('.product-list'); // Assuming this is your scrollable element

    if (scrollLeftBtn && scrollRightBtn && productList) {
      // Function to smoothly scroll a specific distance
      function smoothScroll(element, distance, duration) {
        const start = element.scrollLeft;
        const target = start + distance;
        const startTime = performance.now();

        function animateScroll(currentTime) {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1); // Cap progress at 1
          const easeInOut = 0.5 - Math.cos(progress * Math.PI) / 2; // Ease-in-out effect

          element.scrollLeft = start + distance * easeInOut;

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        }

        requestAnimationFrame(animateScroll);
      }

      // Scroll to the left
      scrollLeftBtn.addEventListener('click', () => {
        smoothScroll(productList, -250, 500); // Scroll left 250px over 500ms
      });

      // Scroll to the right
      scrollRightBtn.addEventListener('click', () => {
        smoothScroll(productList, 250, 500); // Scroll right 250px over 500ms
      });
    } else {
      console.warn('Scroll buttons or product list element are not available.');
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target); // Stop observing once the effect has been applied
        }
      });
    }, { threshold: 0.1 });

    const products = document.querySelectorAll('.product-card');
    products.forEach((product) => observer.observe(product));

    return () => {
      products.forEach((product) => observer.unobserve(product));
    };
  }, [collectionData]);

  if (loading) {
    console.log("Loading..");
  }

  return (
    <>

    <Loader/>
      {trending && <div className="trending-items-heading">Trending Products</div>}

      <section className={`section product ${trending ? 'trending-items' : ''}`}>
        <div className="container">
          {trending ? (
            <>
              <button className="scroll-button-left" aria-label="Scroll left">&lt;</button>
              <ul className={`product-list ${productsStyle ? 'responsive-grid' : ''}`}>
                {Object.keys(collectionData).map((collectionId) =>
                  Array.isArray(collectionData[collectionId]) &&
                  collectionData[collectionId].map((product) => (
                    <li key={product.id} className="product-card">
                      {/* Product card content */}
                      <div className="product-card">
                        <figure className="card-banner">
                          {canEdit ? (
                            <Image
                              src={product.pic}
                              alt={product.productName}
                              loading="lazy"
                              width="800"
                              height="1034"
                              className="w-100"
                            />
                          ) : (
                            <Link
                              className='checkoutLink'
                              href={`/checkout?ImageSrc=${product.pic}&pname=${product.productName}&pprice=Rs. ${product.price}&dPrice=${product.dPrice}&cat=${collectionId}&ref=${product.id}`}
                              legacyBehavior
                            >
                              <a className='checkoutLink' onClick={() => document.querySelector('.loader').style.display = 'block'}>
                                <Image
                                  src={product.pic}
                                  alt={product.productName}
                                  loading="lazy"
                                  width="800"
                                  height="1034"
                                  className="w-100"
                                />
                              </a>
                            </Link>
                          )}
                          {product.dPrice ? (
                            <div className="card-badge red">
                              -{Math.round(((product.dPrice - product.price) / product.dPrice) * 100)}%
                            </div>
                          ) : (
                            <div className="card-badge green">New</div>
                          )}
                          <div className="card-actions">
                            <Link
                             className='checkoutLink'
                              href={`/checkout?ImageSrc=${product.pic}&pname=${product.productName}&pprice=Rs. ${product.price}&dPrice=${product.dPrice}&cat=${collectionId}&ref=${product.id}`}
                            >
                              <button
                                className="card-action-btn"
                                aria-label="Quick view"
                                onClick={() => document.querySelector('.loader').style.display = 'block'}
                              >
                                <ion-icon name="eye-outline"></ion-icon>
                              </button>
                            </Link>
                            <button
                              className="card-action-btn cart-btn"
                              onClick={(event) => {
                                if (product && product.productName) {
                                  fetchSizeChart(collectionId, product.productName);
                                } else {
                                  console.error('Product name is undefined');
                                }
                                handleCart(event, { ...product, id: product.id }, cartItems, setCartItems);
                              }}
                            >
                              <ion-icon name="cart-outline"></ion-icon>
                              <p>{productsStyle ? 'Add' : 'Add to Cart'}</p>
                            </button>
                            <button
                              className="card-action-btn"
                              aria-label="Quick Buy"
                              onClick={(event) => {
                                let params;
                                if (typeof window !== 'undefined') {
                                  params = new URLSearchParams(window.location.search);
                                }

                                // Log to check if product is defined
                                console.log('Product:', product);

                                if (product && product.productName) {
                                  console.log('Product name is defined:', product.productName);
                                  fetchSizeChart(collectionId, product.productName);
                                } else {
                                  console.error('Product name is undefined');
                                }

                                if (params && params.get('ImageSrc')) {
                                  // Product details from URL parameters
                                  const product = {
                                    pic: params.get('ImageSrc'),
                                    productName: params.get('pname'),
                                    price: params.get('pprice')?.replace('Rs. ', ''),
                                    id: params.get("ref"), // Use encoded productCP as id
                                  };

                                  handleCart(event, product, cartItems, setCartItems);
                                  if (typeof window !== "undefined") {
                                    localStorage.setItem('purchase', '0010');
                                  }
                                } else {
                                  handleCart(event, { ...product, id: product.id }, cartItems, setCartItems);
                                  if (typeof window !== "undefined") {
                                    localStorage.setItem('purchase', '0010');
                                  }
                                }
                              }}
                            >
                              <ion-icon name="bag-handle-outline" aria-hidden="true"></ion-icon>
                            </button>
                          </div>
                        </figure>
                        <div className="card-content">
                          <h3 className="h4 card-title">
                            <a>{product.productName}</a>
                          </h3>
                          <div className="card-price">
                            <data style={{ fontWeight: 'bolder' }} value={product.price}>
                              {`Rs. ${product.price}`}
                            </data>
                            {product.dPrice && (
                              <data className="dcard-price" value={product.dPrice}>
                                Rs. {product.dPrice}
                              </data>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                )}
                <button className="scroll-button-right" aria-label="Scroll right">&gt;</button>
              </ul>
            </>
          ) : (
            Object.keys(collectionData).map((collectionId) => (
              <React.Fragment key={collectionId}>
                <div
                  style={{ display: styleHead, alignItems: 'center', justifyContent: 'center' }}
                  className="headersection"
                  id={`headers/${collectionId}`}
                >
                  <h4 style={{ display: 'flex', justifyContent: 'center' }}>
                    {headers[collectionId]?.header[0] || 'Wait is over'}
                  </h4>
                  <h1 style={{ fontSize: '20px', fontWeight: '600' ,color:'black'}}>
                    {headers[collectionId]?.header[1] || 'Winter Collection'}
                  </h1>
                  <hr style={{ border: '1px solid black', margin: '10px 0' }} />
                </div>

                <div id={collectionId} className="collections">
                  <ul className={`product-list ${productsStyle ? 'responsive-grid' : ''}`}>
                    {Array.isArray(collectionData[collectionId]) &&
                      collectionData[collectionId].map((product) => (
                        <li key={product.id} className="product-card">
                          {/* Product card content */}
                          <div className="product-card">
                            <figure className="card-banner">
                              {canEdit ? (
                                <Image
                                  src={product.pic}
                                  alt={product.productName}
                                  loading="lazy"
                                  width="800"
                                  height="1034"
                                  className="w-100"
                                />
                              ) : (
                                <Link
                                  className='checkoutLink'
                                  href={`/checkout?ImageSrc=${product.pic}&pname=${product.productName}&pprice=Rs. ${product.price}&dPrice=${product.dPrice}&cat=${collectionId}&ref=${product.id}`}
                                  legacyBehavior
                                >
                                  <a className='checkoutLink' onClick={() => document.querySelector('.loader').style.display = 'block'}>
                                    <Image
                                      src={product.pic}
                                      alt={product.productName}
                                      loading="lazy"
                                      width="800"
                                      height="1034"
                                      className="w-100"
                                    />
                                  </a>
                                </Link>
                              )}
                              {product.dPrice ? (
                                <div className="card-badge red">
                                  -{Math.round(((product.dPrice - product.price) / product.dPrice) * 100)}%
                                </div>
                              ) : (
                                <div className="card-badge green">New</div>
                              )}
                              {removeActions && 
                              <div className="card-actions">
                                <Link
                                
                                 className='checkoutLink'
                                  href={`/checkout?ImageSrc=${product.pic}&pname=${product.productName}&pprice=Rs. ${product.price}&dPrice=${product.dPrice}&cat=${collectionId}&ref=${product.id}`}
                                >
                                  <button
                                    className="card-action-btn"
                                    aria-label="Quick view"
                                    onClick={() => document.querySelector('.loader').style.display = 'block'}
                                  >
                                    <ion-icon name="eye-outline"></ion-icon>
                                  </button>
                                </Link>
                                <button
                                  className="card-action-btn cart-btn"
                                  onClick={(event) => {
                                    if (product && product.productName) {
                                        fetchSizeChart(collectionId, product.productName);
                                    } else {
                                        console.error('Product name is undefined');
                                    }
                                    
                                    handleCart(event, { ...product, id: product.id }, cartItems, setCartItems);
                                  }}
                                >
                                  {!productsStyle &&  <ion-icon name="cart-outline"></ion-icon>}
                                  <p>{productsStyle ? 'Add' : 'Add to Cart'}</p>
                                </button>
                                <button
                                  className="card-action-btn"
                                  aria-label="Quick Buy"
                                  onClick={(event) => {
                                    let params;
                                    if (typeof window !== 'undefined') {
                                      params = new URLSearchParams(window.location.search);
                                    }

                                    fetchSizeChart(collectionId,product.productName);

                                    if (params && params.get('ImageSrc')) {
                                      // Product details from URL parameters
                                      if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
                                        localStorage.setItem('purchase', '0010');
                                      }
                                      const product = {
                                        pic: params.get('ImageSrc'),
                                        productName: params.get('pname'),
                                        price: params.get('pprice')?.replace('Rs. ', ''),
                                        id: params.get("ref"), // Use encoded productCP as id
                                      };

                                      if (product && product.productName) {
                                        console.error('Product name is defined');
                                        fetchSizeChart(collectionId, product.productName);
                                    } else {
                                        console.error('Product name is undefined');
                                    }

                                      handleCart(event, product, cartItems, setCartItems);
                                      
                                    } else {
                                      if (product && product.productName) {
                                        if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
                                          localStorage.setItem('purchase', '0010');
                                        }
                                        console.error('Product name is undefined');
                                        fetchSizeChart(collectionId, product.productName);
                                    } else {
                                        console.error('Product name is undefined');
                                    }
                                      handleCart(event, { ...product, id: product.id }, cartItems, setCartItems);
                                     
                                    }
                                  }}
                                >
                                  <ion-icon name="bag-handle-outline" aria-hidden="true"></ion-icon>
                                </button>
                              </div>}
                            </figure>
                            <div className="card-content">
                              <h3 className="h4 card-title">
                                <a>{product.productName}</a>
                              </h3>
                              <div className="card-price">
                                <data style={{ fontWeight: 'bolder' }} value={product.price}>
                                  {`Rs. ${product.price}`}
                                </data>
                                {product.dPrice && (
                                  <data className="dcard-price" value={product.dPrice}>
                                    Rs. {product.dPrice}
                                  </data>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      </section>
    </>
  );
} 






//Admin site


async function edittor1() {
  
  console.log("Creating new div with the next available ID");

  // Get all div elements under .section .container
  const existingDivs = document.querySelectorAll('.section .container > div');
  let maxID = 0;

  // Loop through existing divs to find the maximum ID
  existingDivs.forEach(div => {
    const id = parseInt(div.id, 10); // Convert the ID to a number
    if (!isNaN(id) && id > maxID) {
      maxID = id; // Update maxID if the current ID is greater
    }
  });

  const newID = maxID + 1; // Calculate the new ID
  console.log(`New ID for the div: ${newID}`);

  // Create a new div with the dynamic content
  const newDiv = document.createElement('div');
  newDiv.id = newID;

  // Create static header text and product list
  newDiv.innerHTML = `
  <h2>Add a new category by adding Product</h2>
    <div style="display: grid; align-items: center; justify-content: center;" id="headers/${newID}">
      <h4 style="width: 100%; display: flex; justify-content: center;">
        First Header
      </h4>
      <h1 style="width: 100%; font-size: 20px; color: black; font-weight: 600;">
        Second Header
      </h1>
      <hr style="border: 1px solid black; margin: 10px 0;" />
    </div>
    <ul class="product-list">
    
      
    </ul>
  `;

  // Append the new div inside the .section .container
  const container = document.querySelector('.section .container');
  if (container) {
    container.appendChild(newDiv);
    console.log(`New div with ID ${newID} added successfully.`);
  } else {
    console.error('Container not found.');
  }
}






async function edittor(divID) {
  console.log("Edittor executing....");
  
 

  console.log("Before fetching");

  // Check for URL parameter 'edit' and correct local storage key
  let urlParams;
  if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
  urlParams = new URLSearchParams(window.location.search);
  }
let hasEditParam = false;
let correctLocalStorageKey = false;
let mainEditButton;


  // Safely access window.location and localStorage on the client-side
  if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
   urlParams = new URLSearchParams(window.location.search);
  hasEditParam = urlParams.has('edit');

  correctLocalStorageKey = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY) === process.env.NEXT_PUBLIC_EDIT_VALUE;
  }
  // You can initialize `mainEditButton` if needed
  mainEditButton = document.getElementById('editButton'); // Example of getting an element



  if (hasEditParam && correctLocalStorageKey) {
    try {
     
       // Select the specific container by divID
  const container = document.getElementById(divID); 
  
  if (!container) {
    console.error(`Div with ID ${divID} not found!`);
    return;
  }
  else{
    console.log("Container found"+divID);
  }
      // Fetch collections asynchronously
      
      // Check again if container exists
      const firstContainer = document.getElementById(divID);

      if (!firstContainer) {
        console.error(`Div with ID ${divID} not found after fetching!`);
        return;
      }

      // Create the main edit button if it doesn't exist
      if (!document.getElementById(`Edit-${divID}`)) {
        mainEditButton = document.createElement('button');
        mainEditButton.textContent = '(Fetching Database...)';
        mainEditButton.id = `Edit-${divID}`;
        

        // Append button to the container
        firstContainer.appendChild(mainEditButton);
        console.log("Edit button added");

        // Add a line break to separate the button from the product cards
        const lineBreak = document.createElement('br');
        firstContainer.appendChild(lineBreak);

        // Event listener for the edit button
        mainEditButton.addEventListener('click', () => {
          alert("You can't edit before the inlisting of products properly!");
        });
      }
    } catch (error) {
      console.error("Error fetching collections or appending the button:", error);
    }
  } else {
    console.log("Edit mode not activated or incorrect local storage key.");
  }

  console.log("edittor inlist call");

  

  // After inlist, replace the event listener with the edit functionality
  if (mainEditButton) {
  /* From Uiverse.io by DrashtySoni */ 
  mainEditButton.innerHTML = `
    <button type="button" class="btn-edit" style="border: 1px solid black;">
      <strong>Edit Category</strong>
      <div id="container-stars">
        <div id="stars"></div>
      </div>
      <div id="glow">
        <div class="circle"></div>
        <div class="circle"></div>
      </div>
    </button>
  `;
  
// Replace the element to remove all existing event listeners
const newElement = mainEditButton.cloneNode(true);
mainEditButton.replaceWith(newElement);

// Reassign the event listener to the new element
newElement.addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  mainEdit(divID);
});
}

 
  
}


async function getProductData(divId, docId) {
  try {
    const docRef = doc(db, divId, String(docId));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log(`No such document with divId: ${divId} and docId: ${docId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching product data:', error);
    return null;
  }
}

async function deleteFirestoreDocument(divId, docId) {
  console.log("Deleting document with divId: " + divId + " and docId: " + docId);
  const docRef = doc(db, divId, String(docId));
  
  try {
    await deleteDoc(docRef);
    console.log(`Document with docId: ${docId} deleted successfully.`);

    // Get all documents in the collection
    const collectionRef = collection(db, divId);
    const querySnapshot = await getDocs(collectionRef);

    // Sort documents by docId
    const sortedDocs = querySnapshot.docs.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Update docIds for documents with higher docId than the deleted one
    for (let i = 0; i < sortedDocs.length; i++) {
      const currentDoc = sortedDocs[i];
      const currentDocId = parseInt(currentDoc.id);

      if (currentDocId > docId) {
        const newDocId = currentDocId - 1;
        const newDocRef = doc(db, divId, String(newDocId));
        const docData = currentDoc.data();

        // Delete the current document
        await deleteDoc(currentDoc.ref);

        // Create a new document with the updated docId
        await setDoc(newDocRef, docData);
        console.log(`Document with old docId: ${currentDocId} moved to new docId: ${newDocId}`);
      }
    }
  } catch (error) {
    console.error('Error deleting or updating documents:', error);
  }
}


    // Start of Selection
    async function deleteCollection(divId) {
      try {
        console.log("Starting deletion process for collection with divId: " + divId);
    
        // Delete the specified collection
        const collectionRef = collection(db, divId);
        const querySnapshot = await getDocs(collectionRef);
        for (const document of querySnapshot.docs) {
          await deleteDoc(document.ref);
          console.log(`Deleted document with docId: ${document.id}`);
        }
    
        // Collect all potential collection IDs starting from divId + 1
        const potentialIds = [];
        let currentId = parseInt(divId, 10) + 1;
        while (true) {
          console.log(`Checking collection with ID: ${currentId}`);
          const testCollectionRef = collection(db, String(currentId));
          const testQuerySnapshot = await getDocs(testCollectionRef);
    
          if (testQuerySnapshot.empty) {
            console.log(`Collection with ID: ${currentId} is empty. Stopping search.`);
            break;
          }
    
          potentialIds.push(currentId);
          currentId++;
        }
    
        // Sort the IDs and reorder collections
        potentialIds.sort((a, b) => a - b);
        for (let i = 0; i < potentialIds.length; i++) {
          const currentCollectionId = potentialIds[i];
          console.log(`Processing collection with ID: ${currentCollectionId}`);
          if (currentCollectionId > divId) {
            const newCollectionId = currentCollectionId - 1;
            console.log(`Moving collection from ID: ${currentCollectionId} to new ID: ${newCollectionId}`);
            const currentCollectionRef = collection(db, String(currentCollectionId));
            const newCollectionRef = collection(db, String(newCollectionId));
    
            const currentQuerySnapshot = await getDocs(currentCollectionRef);
            for (const document of currentQuerySnapshot.docs) {
              const newDocRef = doc(db, String(newCollectionId), document.id);
              await setDoc(newDocRef, document.data());
              await deleteDoc(document.ref);
              console.log(`Document with ID: ${document.id} moved to new collection ID: ${newCollectionId}`);
            }
          }
        }
    
        console.log("Deletion and reordering process completed for collection with divId: " + divId);
      } catch (error) {
        console.error('Error deleting or updating collections:', error);
      }
    }

export async function forceRefreshProducts(divId) {
  
    await refreshProducts();
 
    await edittor(divId);
    await mainEdit(divId);
  }




function mainEdit(divID) {
  const checkoutLinks = document.querySelectorAll('.checkoutLink');
  checkoutLinks.forEach(link => {
    link.removeAttribute('onClick');
    link.removeAttribute('href');
  });

  const addItemButton = document.getElementById(`Add-${divID}`);
  const priceContainer = document.querySelector(".card-price");
  priceContainer.style.display = 'flex';
  priceContainer.style.flexDirection = 'column';
  if(!addItemButton){
    addProduct(divID);
  }
  console.log(divID);
  console.log("Main works");
  
  const editBtn = document.getElementById(`Edit-${divID}`);
  

  // Create and position the delete button for the entire collection
  const firstContainer = document.getElementById(divID);
  const deleteCollectionButton = document.createElement('button');
  /* From Uiverse.io by vinodjangid07 */ 
  deleteCollectionButton.innerHTML = `
    <button class="button-delete">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 69 14"
        class="svgIcon bin-top"
      >
        <g clip-path="url(#clip0_35_24)">
          <path
            fill="black"
            d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z"
          ></path>
        </g>
        <defs>
          <clipPath id="clip0_35_24">
            <rect fill="white" height="14" width="69"></rect>
          </clipPath>
        </defs>
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 69 57"
        class="svgIcon bin-bottom"
      >
        <g clip-path="url(#clip0_35_22)">
          <path
            fill="black"
            d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"
          ></path>
        </g>
        <defs>
          <clipPath id="clip0_35_22">
            <rect fill="white" height="57" width="69"></rect>
          </clipPath>
        </defs>
      </svg>
    </button>
  `;

  firstContainer.style.position = 'relative';
  firstContainer.appendChild(deleteCollectionButton);

  // Event listener for the delete collection button
  deleteCollectionButton.addEventListener('click', () => deleteCollection(divID));

  
  console.log(firstContainer);
  
  const stringDiv = divID.toString();
  const escapedDivID = `#${CSS.escape(stringDiv)}`; // Use CSS.escape to safely escape the ID
  console.log(escapedDivID)
  const productCards = Array.from(document.querySelectorAll(`${escapedDivID} .product-card .product-card`));
  
  console.log(divID);

  productCards.forEach(async (card, index) => {
    // Get the product title early on
    const productTitle = card.querySelector('.card-title a').textContent;
    
    // Select all elements with the class 'w-100' (product image)
    const buttons = card.querySelectorAll('.w-100');
    
    // Iterate over the NodeList and remove the 'onclick' event handler from each element
    buttons.forEach(button => {
      button.onclick = null; // This removes the onclick event handler
    });

    // Create and position the pencil button for the product image
    const imageContainer = card.querySelector('.w-100');
    let imagePencilButton = imageContainer.parentElement.querySelector('.image-pencil-button');
    if (imagePencilButton) {
      imagePencilButton.remove();
    }
    imagePencilButton = document.createElement('button');
    imagePencilButton.className = 'image-pencil-button';
    imagePencilButton.textContent = '✎';
    imagePencilButton.style.position = 'absolute';
    imagePencilButton.style.top = '10px';
    imagePencilButton.style.right = '10px';
    imagePencilButton.style.backgroundColor = 'transparent'; // Remove background color
    imagePencilButton.style.border = 'none';
    imagePencilButton.style.padding = '5px';
    imagePencilButton.style.cursor = 'pointer';
    imageContainer.parentElement.style.position = 'relative';
    imageContainer.parentElement.appendChild(imagePencilButton);

    // Event listener for the image pencil button
    imagePencilButton.addEventListener('click', () => {
      const imageFileInput = document.createElement('input');
      imageFileInput.type = 'file';
      imageFileInput.accept = 'image/*';
      imageFileInput.style.display = 'none';
      imageFileInput.click();

      imageFileInput.addEventListener('change', async () => {
        const file = imageFileInput.files[0];
        if (file) {
          const divId = firstContainer.id;

          // Upload to Firestore Storage and get the URL
         
                  try {
                    const firebaseImageUrl = await uploadImageToFirebase(file, divId, productTitle);
                    await updateFirestoreDocument(divId, index + 1, { pic: firebaseImageUrl });
                    
                  } catch (error) {
                    console.error('Error updating product:', error);
                  } finally {
                    await edittor(divId);
                    await mainEdit(divId);
                  }
          
          document.querySelector(".loader").style.display = 'none';
        }
      });
    });

    // Create and position the pencil button for the product title
    const titleContainer = card.querySelector('.card-title');
    let titlePencilButton = titleContainer.querySelector('.title-pencil-button');
    if (titlePencilButton) {
      titlePencilButton.remove();
    }
    titlePencilButton = document.createElement('button');
    titlePencilButton.className = 'title-pencil-button';
    titlePencilButton.textContent = '✎';
    titlePencilButton.style.position = 'absolute';
    titlePencilButton.style.top = '0';
    titlePencilButton.style.right = '0';
    titlePencilButton.style.backgroundColor = 'transparent'; // Remove background color
    titlePencilButton.style.border = 'none';
    titlePencilButton.style.padding = '5px';
    titlePencilButton.style.cursor = 'pointer';
    titleContainer.style.position = 'relative';
    titleContainer.appendChild(titlePencilButton);

    // Event listener for the title pencil button
    titlePencilButton.addEventListener('click', async () => {
      const newTitle = prompt('Enter new product title:');
      if (newTitle) {
        const divId = firstContainer.id;
        titleContainer.querySelector('a').textContent = newTitle;
        await updateFirestoreDocument(divId, index + 1, { productName: newTitle });
      }
    });

    // Create and position the pencil button for the price
    const priceContainer = card.querySelector('.card-price');
    let pricePencilButton = priceContainer.querySelector('.price-pencil-button');
    if (pricePencilButton) {
      pricePencilButton.remove();
    }
    pricePencilButton = document.createElement('button');
    pricePencilButton.className = 'price-pencil-button';
    pricePencilButton.textContent = '✎';
    pricePencilButton.style.position = 'absolute';
    pricePencilButton.style.color = 'black';
    pricePencilButton.style.top = '0';
    pricePencilButton.style.right = '0';
    pricePencilButton.style.backgroundColor = 'transparent'; // Remove background color
    pricePencilButton.style.border = 'none';
    pricePencilButton.style.padding = '5px';
    pricePencilButton.style.cursor = 'pointer';
    priceContainer.style.position = 'relative';
    priceContainer.appendChild(pricePencilButton);

    // Event listener for the price pencil button
    pricePencilButton.addEventListener('click', async () => {
      const newPrice = prompt('Enter new price:');
      if (newPrice) {
        const divId = firstContainer.id;
        await updateFirestoreDocument(divId, index + 1, { price: newPrice });
        priceContainer.querySelector('data').textContent = `Rs. ${newPrice}`;
      }
    });

    // Create and position the pencil button for the cutted price
    try {
      const dpriceContainer = card.querySelector('.dcard-price');
      let dpricePencilButton = dpriceContainer ? dpriceContainer.querySelector('.dprice-pencil-button') : null;

      if (dpricePencilButton) {
        dpricePencilButton.remove();
      }

      if (dpriceContainer) {
        dpricePencilButton = document.createElement('button');
        dpricePencilButton.className = 'dprice-pencil-button';
        dpricePencilButton.textContent = '✎';
        dpricePencilButton.style.position = 'absolute';
        dpricePencilButton.style.top = '0';
        dpricePencilButton.style.right = '0';
        dpricePencilButton.style.color = 'black';
        dpricePencilButton.style.backgroundColor = 'transparent';
        dpricePencilButton.style.border = 'none';
        dpricePencilButton.style.padding = '5px';
        dpricePencilButton.style.cursor = 'pointer';
        dpriceContainer.style.position = 'relative';
        dpriceContainer.appendChild(dpricePencilButton);
      } else {
        const parentPriceContainer = card.querySelector('.card-price');
        if (parentPriceContainer) {
          const dataElement = document.createElement('div');
          dataElement.classList.add('dcard-price');
          dataElement.textContent = 'Add Cutted Price';
          dataElement.style.position = 'relative';
          parentPriceContainer.appendChild(dataElement);

          dpricePencilButton = document.createElement('button');
          dpricePencilButton.className = 'dprice-pencil-button';
          dpricePencilButton.textContent = '✎';
          dpricePencilButton.style.position = 'absolute';
          dpricePencilButton.style.top = '0';
          dpricePencilButton.style.right = '0';
          dpricePencilButton.style.backgroundColor = 'transparent';
          dpricePencilButton.style.border = 'none';
          dpricePencilButton.style.padding = '5px';
          dpricePencilButton.style.cursor = 'pointer';
          dataElement.appendChild(dpricePencilButton);
        } else {
          console.error('Parent price container (.card-price) not found.');
        }
      }

      if (dpricePencilButton) {
        dpricePencilButton.addEventListener('click', async () => {
          const newPrice = prompt('Update cutted price:');
          if (newPrice) {
            const divId = firstContainer.id;
            await updateFirestoreDocument(divId, index + 1, { dPrice: newPrice });
            dpriceContainer.textContent = `Rs. ${newPrice}`;
          }
        });
      }
    } catch (err) {
      console.error(`Error processing dprice for product at index ${index}:`, err);
    }

    // Ensure the 'Add Cost Price' button and field exist for each product
    try {
      const priceContainer = card.querySelector('.card-price');
      if (priceContainer) {
        let costPriceContainer = priceContainer.querySelector('.cost-price');
        if (costPriceContainer) {
          costPriceContainer.remove();
        }
        costPriceContainer = document.createElement('div');
        costPriceContainer.className = 'cost-price';
        costPriceContainer.style.position = 'relative';

        const productData = await getProductData(divID, index + 1);
        if (productData && productData.productCP) {
          costPriceContainer.textContent = `Cost Price: Rs. ${productData.productCP}`;
        } else {
          costPriceContainer.textContent = 'Add Cost Price';
        }

        priceContainer.appendChild(costPriceContainer);

        let costPriceButton = costPriceContainer.querySelector('.cost-price-pencil-button');
        if (costPriceButton) {
          costPriceButton.remove();
        }
        costPriceButton = document.createElement('button');
        costPriceButton.className = 'cost-price-pencil-button';
        costPriceButton.textContent = '✎';
        costPriceButton.style.position = 'absolute';
        costPriceButton.style.top = '0';
        costPriceButton.style.right = '0';
        costPriceButton.style.backgroundColor = 'transparent';
        costPriceButton.style.border = 'none';
        costPriceButton.style.padding = '5px';
        costPriceButton.style.cursor = 'pointer';
        costPriceContainer.appendChild(costPriceButton);

        costPriceButton.addEventListener('click', async () => {
          const newCostPrice = prompt('Add / update cost price:');
          if (newCostPrice) {
            const divId = firstContainer.id;
            await updateFirestoreDocument(divId, index + 1, { productCP: newCostPrice });
            costPriceContainer.textContent = `Cost Price: Rs. ${newCostPrice}`;
            costPriceContainer.appendChild(costPriceButton);
          }
        });
      } else {
        console.error('Price container not found for the product.');
      }
    } catch (err) {
      console.error(`Error appending cost price field for product at index ${index}:`, err);
    }

    // Ensure the headers container and pencil buttons exist
    try {
      const headersContainer = document.getElementById(`headers/${firstContainer.id}`);
      if (!headersContainer) {
        console.error(`No container found with ID headers/${firstContainer.id}`);
        return;
      }

      const attachPencilButton = (tag, index) => {
        const element = headersContainer.querySelector(tag);
        if (!element || element.parentNode.classList.contains('pencil-wrapper')) return;

        // Create a wrapper for the header and pencil button without removing the header element itself
        const wrapper = document.createElement('div');
        wrapper.classList.add('pencil-wrapper');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';

        // Insert the wrapper before the header element and append the header element to the wrapper
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);

        const pencilButton = document.createElement('button');
        pencilButton.textContent = '✎';
        pencilButton.style.marginLeft = '10px';
        pencilButton.style.backgroundColor = 'transparent';
        pencilButton.style.border = 'none';
        pencilButton.style.cursor = 'pointer';

        wrapper.appendChild(pencilButton);

        pencilButton.addEventListener('click', () => {
          const newText = prompt(`Update text for ${tag.toUpperCase()}:`, element.textContent);
          if (newText) {
            const updateData = {};
            updateData[`headerIndex`] = index;
            updateData[`headerText`] = newText;

            updateFirestoreDocument(firstContainer.id, 'headers', updateData);
            // element.textContent = newText;
          }
        });
      };

      attachPencilButton('h4', 0);
      attachPencilButton('h1', 1);

    } catch (err) {
      console.error('Error attaching pencil button to headers:', err);
    }

    // Ensure the priority container and button exist
    let priorityContainer = card.querySelector('.priority-container');
    if (priorityContainer) {
      priorityContainer.remove();
    }
    priorityContainer = document.createElement('div');
    priorityContainer.className = 'priority-container';
    priorityContainer.style.position = 'relative';
    priorityContainer.style.marginTop = '10px';
    priorityContainer.textContent = 'Priority: ';

    const priorityInput = document.createElement('input');
    priorityInput.type = 'number';
    priorityInput.style.border = '2px solid black';
    priorityInput.style.width = '60px';
    priorityInput.id = `priority-${productTitle}`;
    priorityInput.value = index + 1;
    priorityContainer.appendChild(priorityInput);

    const priorityButton = document.createElement('button');
    priorityButton.textContent = 'Set Priority';
    priorityButton.style.marginLeft = '10px';
    priorityButton.style.padding = '5px';
    priorityButton.style.backgroundColor = 'black';
    priorityButton.style.color = '#ffffff';
    priorityButton.style.marginTop = '10px';
    priorityButton.style.border = 'none';
    priorityButton.style.borderRadius = '5px';
    priorityButton.style.cursor = 'pointer';
    priorityContainer.appendChild(priorityButton);

    priorityButton.addEventListener('click', async () => {
      const priority = parseInt(priorityInput.value, 10);
      if (!isNaN(priority)) {
        const divId = firstContainer.id;
        await updateFirestoreDocument(divId, index + 1, { priority: priority });
      }
    });

    card.appendChild(priorityContainer);

    // Ensure the sizes container and inputs exist
    let sizesContainer = card.querySelector('.sizes-container');
    if (sizesContainer) {
      sizesContainer.remove();
    }
    sizesContainer = document.createElement('div');
    sizesContainer.className = 'sizes-container';
    sizesContainer.style.marginTop = '10px';

    const sizeHeader = document.createElement('div');
    sizeHeader.textContent = 'Sizes:';
    sizeHeader.style.marginBottom = '5px';
    sizesContainer.appendChild(sizeHeader);

    const sizeTable = document.createElement('table');
    sizeTable.style.width = '100%';
    sizeTable.style.borderCollapse = 'collapse';

    const sizeTableHeader = document.createElement('thead');
    const sizeTableHeaderRow = document.createElement('tr');
    const sizes = ['S', 'M', 'L', 'XL'];

    sizes.forEach(size => {
      const th = document.createElement('th');
      th.textContent = size;
      th.style.border = '1px solid black';
      th.style.padding = '5px';
      th.style.textAlign = 'center';
      sizeTableHeaderRow.appendChild(th);
    });

    sizeTableHeader.appendChild(sizeTableHeaderRow);
    sizeTable.appendChild(sizeTableHeader);

    const sizeTableBody = document.createElement('tbody');
    const sizeTableBodyRow = document.createElement('tr');

    const sizeData = await getSizeFromFirestore(productTitle, 'sizes');
    sizes.forEach(size => {
      const td = document.createElement('td');
      const sizeInput = document.createElement('input');
      sizeTableBodyRow.style.height = 'none';
      sizeInput.type = 'number';
      sizeInput.style.border = '2px solid black';
      sizeInput.style.width = '100%';
      sizeInput.style.boxSizing = 'border-box';
      sizeInput.id = `size(${index + 1})-${size.toLowerCase()}`;
      sizeInput.value = sizeData[size.toLowerCase()] || '';
      td.appendChild(sizeInput);
      sizeTableBodyRow.appendChild(td);
    });

    sizeTableBody.appendChild(sizeTableBodyRow);
    sizeTable.appendChild(sizeTableBody);
    sizesContainer.appendChild(sizeTable);

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Sizes';
    submitButton.style.marginTop = '10px';
    submitButton.style.padding = '5px';
    submitButton.style.backgroundColor = 'black';
    submitButton.style.color = '#ffffff';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '5px';
    submitButton.style.cursor = 'pointer';
    sizesContainer.appendChild(submitButton);

    submitButton.addEventListener('click', async () => {
      const newSizes = {};
      sizes.forEach(size => {
        const sizeValue = document.getElementById(`size(${index + 1})-${size.toLowerCase()}`).value;
        if (sizeValue) {
          newSizes[size.toLowerCase()] = sizeValue;
        }
      });

      const divId = firstContainer.id;
      await updateFirestoreDocument(divId, index + 1, { sizes: newSizes });
    });

    priceContainer.parentElement.insertBefore(sizesContainer, card.querySelector('.submitOrder'));

    // Create and position the delete button for the product
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.style.position = 'absolute';
    deleteButton.style.top = '373px';
    deleteButton.style.right = '10px';
    deleteButton.style.backgroundColor = 'red';
    deleteButton.style.color = 'white';
    deleteButton.style.border = 'none';
    deleteButton.style.padding = '5px';
    deleteButton.style.cursor = 'pointer';
    card.style.position = 'relative';
    card.appendChild(deleteButton);

    // Event listener for the delete button
    deleteButton.addEventListener('click', async () => {
      const divId = firstContainer.id;
      try {
        await deleteFirestoreDocument(divId, index + 1);
        card.remove();
        console.log(`Product with divId: ${divId} and index: ${index + 1} has been deleted.`);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    });
  });

  // Ensure the category priority container and button exist
  let categoryPriorityContainer = document.getElementById('category-priority-container');
  if (!categoryPriorityContainer) {
    categoryPriorityContainer = document.createElement('div');
    categoryPriorityContainer.id = 'category-priority-container';
    categoryPriorityContainer.className = 'priority-container';
    categoryPriorityContainer.style.position = 'relative';
    categoryPriorityContainer.style.marginTop = '10px';
    categoryPriorityContainer.textContent = 'Category Priority: ';

    const categoryPriorityInput = document.createElement('input');
    categoryPriorityInput.type = 'number';
    categoryPriorityInput.style.border = '2px solid black';
    categoryPriorityInput.style.width = '60px';
    categoryPriorityInput.id = `category-priority-${divID}`;
    categoryPriorityContainer.appendChild(categoryPriorityInput);

    const categoryPriorityButton = document.createElement('button');
    categoryPriorityButton.textContent = 'Set Category Priority';
    categoryPriorityButton.style.marginLeft = '10px';
    categoryPriorityButton.style.padding = '5px';
    categoryPriorityButton.style.backgroundColor = 'black';
    categoryPriorityButton.style.color = '#ffffff';
    categoryPriorityButton.style.marginBottom = '20px';
    categoryPriorityButton.style.border = 'none';
    categoryPriorityButton.style.borderRadius = '5px';
    categoryPriorityButton.style.cursor = 'pointer';
    categoryPriorityContainer.appendChild(categoryPriorityButton);

    categoryPriorityButton.addEventListener('click', async () => {
      document.querySelector(".loader").style.display = 'block';
      const newPriority = parseInt(categoryPriorityInput.value, 10);
      if (!isNaN(newPriority)) {
        const currentCollectionRef = collection(db, String(divID));
        const newCollectionRef = collection(db, String(newPriority));

        const currentQuerySnapshot = await getDocs(currentCollectionRef);
        const newQuerySnapshot = await getDocs(newCollectionRef);

        if (!newQuerySnapshot.empty) {
          // Swap collections
          const tempCollectionRef = collection(db, 'temp');
          for (const document of newQuerySnapshot.docs) {
            const tempDocRef = doc(db, 'temp', document.id);
            await setDoc(tempDocRef, document.data());
            await deleteDoc(document.ref);
          }

          for (const document of currentQuerySnapshot.docs) {
            const newDocRef = doc(db, String(newPriority), document.id);
            await setDoc(newDocRef, document.data());
            await deleteDoc(document.ref);
          }

          const tempQuerySnapshot = await getDocs(tempCollectionRef);
          for (const document of tempQuerySnapshot.docs) {
            const currentDocRef = doc(db, String(divID), document.id);
            await setDoc(currentDocRef, document.data());
            await deleteDoc(document.ref);
          }
          document.querySelector(".loader").style.display = 'none';
          
          showMessageBox(`Swapped collections ${divID} and ${newPriority}`, "Priority updated successfully", true);
        } else {
          document.querySelector(".loader").style.display = 'none';
         showMessageBox(`Collection with ID: ${newPriority} does not exist.`, "Please provide a valid priority", false);
        }
      }
    });

    firstContainer.insertBefore(categoryPriorityContainer, firstContainer.firstChild);
  }
}


// Firebase operation functions
async function uploadImageToFirebase(file, divId, productTitle) {
productTitle = productTitle.replace(/✎/g, '').trim();
  // Create a reference to the file path in storage
  const fileRef = ref(storage, `products/${productTitle}`);

  try {
    // Upload the file
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        error => reject(error),
        async () => {
          // Get the download URL once the upload is complete
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);

        }
      );
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

async function updateFirestoreDocument(divId, docId, updateData) {
 
  // Ensure divId and docId are strings
  const divIdStr = String(divId);
  const docIdStr = String(docId);

  // Loader visibility
  document.querySelector(".loader").style.display = 'block';

  try {
    const categoriesRef = doc(db, divIdStr, docIdStr);
    const categoriesSnapshot = await getDoc(categoriesRef);

    // Create document if it doesn't exist
    if (!categoriesSnapshot.exists()) {
      console.warn(`No document found for docId: ${docIdStr}. Creating a new document.`);
      await setDoc(categoriesRef, { createdAt: serverTimestamp(), ...updateData }, { merge: true });
      console.log(`New document created with docId: ${docIdStr}.`);
      return;
    }

    // Existing document data
    const currentData = categoriesSnapshot.data();
    const previousProductName = currentData?.productName;

    // Case: Update productName and handle related documents
    if (updateData.productName) {
      if (!previousProductName) {
        alert("Please set a name first");
        return;
      }

      await setDoc(categoriesRef, { productName: updateData.productName }, { merge: true });

      const previousClothsimsRef = doc(db, 'clothsims', previousProductName);
      const newClothsimsRef = doc(db, 'clothsims', updateData.productName);

      const previousClothsimsSnapshot = await getDoc(previousClothsimsRef);
      if (previousClothsimsSnapshot.exists()) {
        const previousData = previousClothsimsSnapshot.data();
        await setDoc(newClothsimsRef, { ...previousData, productName: updateData.productName }, { merge: true });
        await deleteDoc(previousClothsimsRef);
        console.log('Old document deleted and new one created.');
      }
    }
    // Case: Update specific fields
    else if (updateData.pic) {
      await setDoc(categoriesRef, { pic: updateData.pic }, { merge: true });
    } else if (updateData.sizes) {
      const { s, m, l, xl } = updateData.sizes;
      const sizesRef = doc(db, 'clothsims', previousProductName);
      const sizesToUpdate = {};
      if (s) sizesToUpdate.s = s;
      if (m) sizesToUpdate.m = m;
      if (l) sizesToUpdate.l = l;
      if (xl) sizesToUpdate.xl = xl;
      await setDoc(sizesRef, sizesToUpdate, { merge: true });
    } else if (updateData.price || updateData.dPrice || updateData.productCP) {
      await setDoc(categoriesRef, updateData, { merge: true });
    }
    // Case: Update headers array
    else if (updateData.headerIndex !== undefined && updateData.headerText) {
      const headersRef = doc(db, divIdStr, 'headers');
      const headersSnapshot = await getDoc(headersRef);
      const updatedHeader = headersSnapshot.exists() ? headersSnapshot.data().header || [] : [];
      updatedHeader[updateData.headerIndex] = updateData.headerText;
      await setDoc(headersRef, { header: updatedHeader }, { merge: true });
    }
    // Case: Swap priorities
    else if (updateData.priority) {
      const newPriorityDocId = String(updateData.priority);
      const newPriorityRef = doc(db, divIdStr, newPriorityDocId);
      const newPrioritySnapshot = await getDoc(newPriorityRef);

      if (newPrioritySnapshot.exists()) {
        const newPriorityData = newPrioritySnapshot.data();
        await setDoc(newPriorityRef, { ...currentData });
        await setDoc(categoriesRef, newPriorityData);
        console.log('Data swapped between documents.');
        const loaderElement = document.querySelector(".loader");
        loaderElement.style.display = 'block';
        
        showMessageBox("Priority updated successfully", "Thanks for Patience", true);
        await edittor(divId);
        await mainEdit(divId);
        loaderElement.style.display = 'none';
      } else {
        console.error(`Document with priority ID: ${newPriorityDocId} does not exist.`);
        alert(`You cannot set a priority for a document that doesn't exist.`);
      }
    } else {
      console.error('No valid field found to update.');
    }
  } catch (error) {
    console.error('Error updating Firestore document:', error);
  } finally {
    // Ensure loader is hidden
    document.querySelector(".loader").style.display = 'none';
  }
}






async function getSizeFromFirestore(docId, sizeField) {
  let trimDocId = docId.replace("✎", "").trim();  // Ensure no trailing/leading spaces or unexpected characters
  console.log("Document ID:", trimDocId); // Log the document ID
  console.log("Size Field:", sizeField); // Log the size field

  try {
      const docRef = doc(db, 'clothsims', trimDocId);
      console.log("Document Reference:", docRef); // Log the document reference

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
          console.log("Document Data:", docSnap.data()); // Log the entire document data
          const data = docSnap.data();
          const sizeData = {
              s: data.s || "",
              m: data.m || "",
              l: data.l || "",
              xl: data.xl || "",
          };
          console.log("Size Data:", sizeData); // Log the retrieved size data
          return sizeData;
      } else {
          console.log("No such document!"); // Log if the document doesn't exist
          return { S: '', M: '', L: '' ,XL:'' };
      }
  } catch (error) {
      console.error("Error getting document:", error); // Log any errors encountered
      return { S: '', M: '', L: '' ,XL:'' };
  }
}

/*
document.addEventListener('DOMContentLoaded', function() {


const elements = document.querySelectorAll('.product-card');

function checkVisibility() {
const windowHeight = window.innerHeight;
const windowTop = window.pageYOffset;

elements.forEach(element => {
  const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
  const elementBottom = elementTop + element.clientHeight;

  if (elementBottom > windowTop && elementTop < windowTop + windowHeight) {
    element.classList.add('in-view');
  } else {
    element.classList.remove('in-view');
  }
});
}

window.addEventListener('scroll', checkVisibility);
window.addEventListener('resize', checkVisibility);
checkVisibility(); // Initial check
});


*/
if (typeof window !== "undefined") {
  window.addEventListener('load', checkEditMode);
}


async function checkEditMode() {
  let checkFetch = true;
  let urlParams;
  if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
    urlParams = new URLSearchParams(window.location.search);
  }

  let hasEditParam = false;
  if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
    urlParams = new URLSearchParams(window.location.search);
    hasEditParam = urlParams.has('edit');
  }

  let correctLocalStorageKey = false;
  let localStorageValue = null;
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    localStorageValue = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
    correctLocalStorageKey = localStorageValue === process.env.NEXT_PUBLIC_EDIT_VALUE;
  }

  if (hasEditParam && correctLocalStorageKey) {
    try {
      setTimeout(async () => {
        const divs = document.querySelectorAll('div[id]');
        for (const div of divs) {
          const id = parseInt(div.id, 10);
          if (!isNaN(id)) {
            await edittor(id.toString());
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error executing editor functions:", error);
    }
  }
}