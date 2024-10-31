"use client";
import { useState, useEffect } from 'react';
import React from 'react';
import { db, storage } from '../firebase'; // Import Firestore and Storage instances
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs,serverTimestamp } from 'firebase/firestore'; // Firestore methods
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Storage methods
import {handleCart} from "./cart.js"
import Link from "next/link";



let fetchedHeaders = 0;
let cachedHeaders = null;


// Function to fetch headers globally (with caching)
async function fetchHeaders(divID) {
    // Check localStorage first
    const localStorageKey = `headers_${divID}`;
    const localStorageHeaders = localStorage.getItem(localStorageKey);

    if (localStorageHeaders) {
        cachedHeaders = JSON.parse(localStorageHeaders); // Parse the stored string to an array
        console.log("Fetching headers from localStorage:", cachedHeaders);
        console.log(cachedHeaders.header[0])
        return cachedHeaders; 
       
    }

    console.log("Fetching headers from Firebase..."); // Log fetching from Firebase

    try {
        const headerRef = doc(db, divID, 'headers');
        const headerSnap = await getDoc(headerRef);

        if (headerSnap.exists()) {
            const fetchedHeaders = headerSnap.data(); // Assuming this is an array or contains an array field
            cachedHeaders = fetchedHeaders; // Cache the headers data
            console.log("Headers fetched from Firebase:", cachedHeaders);

            // Store in localStorage
            localStorage.setItem(localStorageKey, JSON.stringify(cachedHeaders));
            console.log(JSON.stringify(cachedHeaders))
            return cachedHeaders;
        } else {
            console.log("No header data found!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching header document:", error);
        return null;
    }
}


// Optimized function to fetch data for collections
async function inlist(divID) {
   
  // Fetch headers specific to this collection/divID
  const headers = await fetchHeaders(divID);
  let collectionData = [];

  try {
      const docRef = doc(db, "creds", divID); // Reference to the document that holds the timestamp
      const docSnap = await getDoc(docRef);

      let Timejson;
      if (docSnap.exists()) {
          const docData = docSnap.data();
          const TimeStamp = docData.TimeStamp;
          Timejson = JSON.stringify(TimeStamp);
          console.log(`Timestamp for ${divID}:`, Timejson);

          // Check for the checker in localStorage
          if (Timejson !== localStorage.getItem(`${divID} checker`)) {
            console.log(`Time doesn't match for ${divID}.`);
        
            // Clear the localStorage for this divID
            localStorage.removeItem(divID); 
            
            // Create a timestamp object to save
            const timestampToSave = {
                seconds: TimeStamp.seconds,   // assuming TimeStamp is an object with a seconds property
                nanoseconds: TimeStamp.nanoseconds // assuming TimeStamp has a nanoseconds property
            };
        
            // Update the timestamp in localStorage
            localStorage.setItem(`${divID} checker`, JSON.stringify(timestampToSave)); 
        }
         else {
              console.log(`Time matches for ${divID}, using cached data.`);
              // If timestamp matches, check if there's cached data
              const cachedData = localStorage.getItem(divID);
              if (cachedData) {
                  collectionData = JSON.parse(cachedData); // Use cached data if available
                  console.log(`Using cached data for ${divID}.`);
                  return { collectionData, headers }; // Return cached data with headers
              }
          }
      } else {
          console.log(`Timestamp not found for ${divID}, creating new timestamp.`);
          // If the document does not exist, create a new one
          await setDoc(docRef, {
              TimeStamp: serverTimestamp(),
          });
      }

      // If no cached data, fetch from the database
      const colRef = collection(db, divID);
      const querySnapshot = await getDocs(colRef);

      if (querySnapshot.empty) {
          console.log(`No documents found in the database for ${divID}.`);
          return { collectionData: [], headers }; // Return empty array for no data
      }

      // Fetch and sort data
      querySnapshot.forEach((doc) => {
          const docId = parseInt(doc.id, 10);
          if (docId > 0) { // Assuming IDs start from 1
              collectionData.push({
                  id: docId,
                  ...doc.data(),
              });
          }
      });

      // Sort data numerically by ID
      collectionData.sort((a, b) => a.id - b.id);

      // Store fetched data in localStorage for future use
      localStorage.setItem(divID, JSON.stringify(collectionData));
      console.log(`Fetched data for ${divID} and stored in localStorage.`);

  } catch (error) {
      console.error(`Error fetching data for collection: ${divID}`, error);
  }
 

  return { collectionData, headers }; // Return collection data along with headers for this collection
}









let fetchAndRenderCollections;
let collectionsToFetch = [];

async function inlistDaddy() {
  console.log("Running Daddy of inlist");

  let collectionCount = 0; // Initialize a counter for collections

  try {
    while (true) { // Loop indefinitely until a collection is not found
      collectionCount++; // Increment the collection counter
      const divID = collectionCount.toString(); // Convert count to string for the collection name
      const collectionRef = collection(db, divID); // Use the count as the collection name
      const docRef = doc(collectionRef, "1"); // Specify the document ID to fetch

      const docSnap = await getDoc(docRef); // Fetch the document snapshot

      if (docSnap.exists()) { // Check if the document exists
        console.log(`Document in collection ${divID} exists.`);
        collectionsToFetch.push(divID); // Add the collection ID to the collectionsToFetch array
      } else {
        console.log(`Collection ${divID} not found.`);
        break; // Terminate the loop if collection not found
      }
    }

    console.log(`Total collections found: ${collectionCount - 1}`); // Log total collections found
  } catch (error) {
    console.error("Error fetching collections: ", error);
  }
}

export default function Products({ collectionsToFetch: propCollectionsToFetch, styleHead = 'grid',productsStyle = false }) {
  const [collectionsData, setCollectionsData] = useState({});
  const [headersData, setHeadersData] = useState({}); // State for headers
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [cartItems, setCartItems] = useState([]); // State for cart items

  // Function to sequentially fetch and render collections
   fetchAndRenderCollections = async () => {
      setLoading(true); // Start loading
      setCollectionsData({}); // Reset data
      setHeadersData({}); // Reset headers
           
      try {
        if (!propCollectionsToFetch || propCollectionsToFetch.length === 0) {
          await inlistDaddy(); // Run inlistDaddy if no collections are passed in props
        } else {
          collectionsToFetch = propCollectionsToFetch; // Use collections passed in props
        }
          // Fetch collections one by one and update the state
          for (const collectionId of collectionsToFetch) {
              const { collectionData, headers } = await inlist(collectionId); // Fetch collection and headers
              
              // Update collection data and headers for each collection
              setCollectionsData((prevData) => ({
                  ...prevData,
                  [collectionId]: collectionData,
              }));
              
              setHeadersData((prevHeaders) => ({
                  ...prevHeaders,
                  [collectionId]: headers,
              }));
          }
      } catch (error) {
          console.error("Error fetching data:", error);
      } finally {
          setLoading(false); // Stop loading once data is fetched
      }
  };

  useEffect(() => {
      fetchAndRenderCollections();
  }, [refresh]); 
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
  }, [collectionsData]);

  if (loading) {
      console.log("Loading..");
  }

    

  return (
      <section className="section product">
          <div className="container">
              
              {/* Dynamically render sections for each collection */}
              {Object.keys(collectionsData).map((collectionId) => (
                  <React.Fragment key={collectionId}>
                      <div style={{ display: styleHead, alignItems: 'center', justifyContent: 'center' }} id="headers/">
                          <h4 style={{ width:"100%",display:"flex",justifyContent:"center"}}>
                              {headersData[collectionId]?.header[0] || 'Wait is over'}
                          </h4>
                          <h1
                              style={{
                                  width: '100%',
                                  fontSize: '20px',
                                  color: 'black',
                                  fontWeight: '600',
                              }}
                          >
                              {headersData[collectionId]?.header[1] || 'Winter Collection'}
                          </h1>
                          <hr style={{ border: '1px solid black', margin: '10px 0' }} />
                      </div>
                      <div id={collectionId}>
                      <ul className={`product-list ${productsStyle ? 'responsive-grid' : ''}`}>
                              {/* Check if collectionsData[collectionId] is an array before calling map */}
                              {Array.isArray(collectionsData[collectionId]) &&
    collectionsData[collectionId].map((product) => (
        <li key={product.id} className="product-card">
            <div className="product-card">
                <figure className="card-banner">
                  <Link href={`/checkout?ImageSrc=${product.pic}&pname=${product.productName}&pprice=Rs. ${product.price}&dPrice=${product.dPrice}&cat=${collectionId}`} legacyBehavior>
                    <a >
                        <img
                            src={product.pic}
                            alt={product.productName}
                            loading="lazy"
                            width="800"
                            height="1034"
                            className="w-100"
                        />
                    </a></Link>
                    {product.dPrice ? (
    <div className="card-badge red">
        -{Math.round(((product.dPrice - product.price) / product.dPrice) * 100)}%
    </div>
) : (
    <div className="card-badge green">New</div>
)}


                    <div className="card-actions">
                    <Link
  href={`/checkout?ImageSrc=${product.pic}&pname=${product.productName}&pprice=Rs. ${product.price}&dPrice=${product.dPrice}&cat=${collectionId}`}>
  <button className="card-action-btn" aria-label="Quick view">
    <ion-icon name="eye-outline"></ion-icon>
  </button>
</Link>

                        <button className="card-action-btn cart-btn" onClick={(event) => handleCart(event, product, cartItems, setCartItems)}>
                            <ion-icon name="cart-outline"></ion-icon>
                            <p>{productsStyle ? 'Add' : 'Add to Cart'}</p>
                        </button>
                        <button className="card-action-btn" aria-label="Quick Buy" onClick={(event) => {
        const params = new URLSearchParams(window.location.search);
        document.querySelector(".cartBtn").innerText= "checkout";
        // Extract product details and trim "Rs. " from the price
        const product = {
            pic: params.get("ImageSrc"),
            productName: params.get("pname"),
            price: params.get("pprice")?.replace("Rs. ", ""), 
            id: Date.now() 
        };

        // Call handleCart with the product and cart items
        handleCart(event, product, cartItems, setCartItems);
        localStorage.setItem("purchase","0010");
        
        
    }}>
                            <ion-icon name="bag-handle-outline" aria-hidden="true"></ion-icon>
                        </button>
                    </div>
                </figure>
                <div className="card-content">
                    <h3 className="h4 card-title">
                        <a href="#">{product.productName}</a>
                    </h3>
                    <div className="card-price">
                        <data value={product.price}>
                            {`Rs. ${product.price}`}
                        </data>
                        {product.dPrice && (
    <data className='dcard-price' value={product.dPrice} >Rs. {product.dPrice}</data>
)}

                    </div>
                </div>
            </div>
        </li>
    ))
}


                          </ul>
                      </div>
                  </React.Fragment>
              ))}
          </div>
      </section>
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
  const urlParams = new URLSearchParams(window.location.search);
  const hasEditParam = urlParams.has('edit');
  const correctLocalStorageKey = localStorage.getItem('A98398HBFBB93BNABSN') === 'fabfbuygi328y902340';
  let mainEditButton;

  if (hasEditParam && correctLocalStorageKey) {
    try {
      console.log(checkFetch);
      if(!checkFetch){
        console.log("fetching and rerendering")
      await fetchAndRenderCollections();
      }
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
        mainEditButton.style.position = 'absolute';
        mainEditButton.style.top = '10px';
        mainEditButton.style.right = '10px';
        mainEditButton.style.backgroundColor = 'red'; // Button background color
        mainEditButton.style.color = 'black'; // Text color
        mainEditButton.style.padding = '10px';
        mainEditButton.style.borderRadius = '5px';
        mainEditButton.style.cursor = 'pointer';
        mainEditButton.style.height = '54px';
        mainEditButton.style.position = 'unset';

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
  mainEditButton.innerText = 'Edit';
  mainEditButton.style.backgroundColor = 'black';
  mainEditButton.style.color = 'white';
  
// Replace the element to remove all existing event listeners
const newElement = mainEditButton.cloneNode(true);
mainEditButton.replaceWith(newElement);

// Reassign the event listener to the new element
newElement.addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  mainEdit(divID);
});
}

  // After inlist, append the "Add a Product" card if edit parameters are present
  if (hasEditParam && correctLocalStorageKey) {
      const firstContainer = document.getElementById(divID);
      const newProductCard = document.createElement('div');

// newProductCard.classList.add('product-card');


      newProductCard.innerHTML = `
  <h1>${divID}</h1>    <ul class="product-list">     
                <div class="product-card">
                  <figure class="card-banner">
                    <a >
                      <img
                        src='/poster/addimg.jpg'
                        alt="Add product pic"
                        loading="lazy"
                        width="800"
                        height="1034"
                        class="w-100"
                      />
                    </a>
                    <div class="card-badge red">-25%</div>
                    <div class="card-actions">
                      <button class="card-action-btn" aria-label="Quick view">
                        <ion-icon name="eye-outline"></ion-icon>
                      </button>
                      <button class="card-action-btn cart-btn">
                        <ion-icon name="bag-handle-outline" aria-hidden="true"></ion-icon>
                        <p>Add to Cart</p>
                      </button>
                      <button class="card-action-btn" aria-label="Add to Wishlist">
                        <ion-icon name="heart-outline"></ion-icon>
                      </button>
                    </div>
                  </figure>
                  <div class="card-content">
                    <h3 class="h4 card-title">
                      <a href="#">Add Product Name</a>
                    </h3>
                    <div class="card-price">
                      <data value=>Add Price</data>
                      <data value="65.00">Rs. (Add Original Price)</data>
                    </div>
                  </div>
                </div></ul>
              
      `;
      // Append the new product card at the end of the firstContainer
      firstContainer.appendChild(newProductCard);
  }
  
}



function mainEdit(divID) {
  console.log(divID);
  console.log("Main works");

  const firstContainer = document.getElementById(divID);
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
    const imagePencilButton = document.createElement('button');
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
          const firebaseImageUrl = await uploadImageToFirebase(file, divId, productTitle);

          // Update Firestore document
          await updateFirestoreDocument(divId, index + 1, { pic: firebaseImageUrl });
          await edittor(divId);
          await mainEdit(divId);
          document.querySelector(".loader").style.display = 'none';
        }
      });
    });

    // Create and position the pencil button for the product title
    const titleContainer = card.querySelector('.card-title');
    const titlePencilButton = document.createElement('button');
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
    const pricePencilButton = document.createElement('button');
    pricePencilButton.textContent = '✎';
    pricePencilButton.style.position = 'absolute';
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


// Create and position the pencil button for the price
const dpriceContainer = card.querySelector('.dcard-price');
const dpricePencilButton = document.createElement('button');
dpricePencilButton.textContent = '✎';
dpricePencilButton.style.position = 'absolute';
dpricePencilButton.style.top = '0';
dpricePencilButton.style.right = '0';
dpricePencilButton.style.backgroundColor = 'transparent'; // Remove background color
dpricePencilButton.style.border = 'none';
dpricePencilButton.style.padding = '5px';
dpricePencilButton.style.cursor = 'pointer';
dpriceContainer.style.position = 'relative';
dpriceContainer.appendChild(pricePencilButton);

// Event listener for the price pencil button
dpricePencilButton.addEventListener('click', async () => {
  const newPrice = prompt('Enter new price:');
  if (newPrice) {
    const divId = firstContainer.id;
    await updateFirestoreDocument(divId, index + 1, { price: newPrice });
    dpriceContainer.querySelector('data').textContent = `Rs. ${newPrice}`;
  }
});



    // Create and position the pencil button for the priority
    const priorityContainer = document.createElement('div');
    priorityContainer.style.position = 'relative';
    priorityContainer.style.marginTop = '10px';
    priorityContainer.textContent = 'Priority: ';

    const priorityInput = document.createElement('input');
    priorityInput.type = 'number';
    priorityInput.style.border = '2px solid black';
    priorityInput.style.width = '60px';
    priorityInput.id = `priority-${productTitle}`;
    priorityInput.value = index + 1; // Set priority based on index
    priorityContainer.appendChild(priorityInput);

    const priorityButton = document.createElement('button');
    priorityButton.textContent = 'Set Priority';
    priorityButton.style.marginLeft = '10px';
    priorityButton.style.padding = '5px';
    priorityButton.style.backgroundColor = '#007bff';
    priorityButton.style.color = '#ffffff';
    priorityButton.style.border = 'none';
    priorityButton.style.borderRadius = '5px';
    priorityButton.style.cursor = 'pointer';
    priorityContainer.appendChild(priorityButton);

    // Event listener for the priority button
    priorityButton.addEventListener('click', async () => {
      const priority = parseInt(priorityInput.value, 10);
      if (!isNaN(priority)) {
        const divId = firstContainer.id;
        await updateFirestoreDocument(divId, index + 1, { priority: priority });
      }
    });

    card.appendChild(priorityContainer);

    // Create the sizes container and fetch size data from Firestore
    const sizesContainer = document.createElement('div');
    sizesContainer.style.marginTop = '10px';

    const sizeHeader = document.createElement('div');
    sizeHeader.textContent = 'Sizes (S, M, L):';
    sizeHeader.style.marginBottom = '5px';
    sizesContainer.appendChild(sizeHeader);

    const sizeData = await getSizeFromFirestore(productTitle, 'sizes');

    const sizes = ['s', 'm', 'l'];
    sizes.forEach(size => {
      const sizeContainer = document.createElement('div');
      sizeContainer.style.marginBottom = '5px';

      const sizeLabel = document.createElement('label');
      sizeLabel.textContent = size;
      sizeLabel.style.marginRight = '5px';
      sizeContainer.appendChild(sizeLabel);

      const sizeInput = document.createElement('input');
      sizeInput.type = 'number';
      sizeInput.style.border = '2px solid black';
      sizeInput.id = `size(${index + 1})-${size}`;
      sizeInput.style.width = '100px';
      sizeInput.value = sizeData[size.toLowerCase()] || ''; // Map sizeData to inputs
      sizeContainer.appendChild(sizeInput);
      sizesContainer.appendChild(sizeContainer);
    });

    // Add submit button to sizes container
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Sizes';
    submitButton.style.marginTop = '10px';
    submitButton.style.padding = '5px';
    submitButton.style.backgroundColor = '#007bff';
    submitButton.style.color = '#ffffff';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '5px';
    submitButton.style.cursor = 'pointer';
    sizesContainer.appendChild(submitButton);

    // Event listener for submit button
    submitButton.addEventListener('click', async () => {
      const newSizes = {};
      sizes.forEach(size => {
        const sizeValue = document.getElementById(`size(${index + 1})-${size}`).value;
        if (sizeValue) {
          newSizes[size] = sizeValue;
        }
      });

      const divId = firstContainer.id;

      // Update Firestore document with new sizes
      await updateFirestoreDocument(divId, index + 1, { sizes: newSizes });
    });

    priceContainer.parentElement.insertBefore(sizesContainer, card.querySelector('.submitOrder'));
  });
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
  
  const credsColRef = collection(db, "creds");
const querySnapshot = await getDocs(credsColRef);
await setDoc(doc(db, "creds", divId), {
TimeStamp:serverTimestamp(),
});

  console.log(divId, docId, updateData);
  document.querySelector(".loader").style.display = 'block';

  const divIdStr = String(divId);
  const docIdStr = String(docId);

  try {
      const categoriesRef = doc(db, divIdStr, docIdStr);
      const categoriesSnapshot = await getDoc(categoriesRef);

      if (!categoriesSnapshot.exists()) {
          console.warn(`No document found for docId: ${docIdStr}. Creating a new document.`);

          const newData = {};
          newData.createdAt = serverTimestamp();

          if (updateData.productName) newData.productName = updateData.productName;
          if (updateData.pic) newData.pic = updateData.pic;
          if (updateData.sizes) newData.sizes = updateData.sizes;
          if (updateData.price) newData.price = updateData.price;

          await setDoc(categoriesRef, newData, { merge: true });
          console.log(`New document created with docId: ${docIdStr}.`);
          document.querySelector(".loader").style.display = 'none';
          return;
      }

      console.log(`Document with docId: ${docIdStr} already exists.`);

      document.querySelector(".loader").style.display = 'none';
      const currentData = categoriesSnapshot.data();
      const previousProductName = currentData?.productName;
      console.log(previousProductName)
      if (!previousProductName) {
  alert("Please set a name first");
  return;
}

      if (updateData.productName) {
          await setDoc(categoriesRef, { productName: updateData.productName }, { merge: true });

          const previousClothsimsRef = doc(db, 'clothsims', previousProductName);
          const previousClothsimsSnapshot = await getDoc(previousClothsimsRef);

          if (previousClothsimsSnapshot.exists()) {
              const previousData = previousClothsimsSnapshot.data();
              console.log('Previous document data:', previousData);

              const newClothsimsRef = doc(db, 'clothsims', updateData.productName);
              await setDoc(newClothsimsRef, { ...previousData, productName: updateData.productName }, { merge: true });

              await deleteDoc(previousClothsimsRef);
              console.log('Old document deleted.');
          } else {
              console.error('No document found for the previous product name.');
          }
      } else if (updateData.pic) {
          await setDoc(categoriesRef, { pic: updateData.pic }, { merge: true });
      } else if (updateData.sizes) {
          const { s, m, l } = updateData.sizes;
          const sizesRef = doc(db, 'clothsims', previousProductName);
          await setDoc(sizesRef, { s: s || '0', m: m || '0', l: l || '0' }, { merge: true });
      } else if (updateData.price) {
          await setDoc(categoriesRef, { price: updateData.price }, { merge: true });
      } else if (updateData.priority) {
          const newPriorityDocId = String(updateData.priority);
          const collectionRef = collection(db, divIdStr);
          const newPriorityRef = doc(db, divIdStr, newPriorityDocId);
          const newPrioritySnapshot = await getDoc(newPriorityRef);

          if (newPrioritySnapshot.exists()) {
              const newPriorityData = newPrioritySnapshot.data();
              console.log('New priority document data:', newPriorityData);

              const currentDataCopy = { ...currentData };
              await setDoc(newPriorityRef, currentDataCopy);
              await setDoc(categoriesRef, newPriorityData);

              console.log('Data swapped between documents.');
              await edittor(divId);
              await mainEdit(divId);
          } else {
              console.error(`Document with priority ID: ${newPriorityDocId} does not exist.`);
              alert(`You cannot set a priority for a document that doesn't exist in the collection.`);
          }
      } else {
          console.error('No valid field found to update.');
      }
  } catch (error) {
      console.error('Error updating Firestore document:', error);
  }

  document.querySelector(".loader").style.display = 'none';
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
          };
          console.log("Size Data:", sizeData); // Log the retrieved size data
          return sizeData;
      } else {
          console.log("No such document!"); // Log if the document doesn't exist
          return { S: '', M: '', L: '' };
      }
  } catch (error) {
      console.error("Error getting document:", error); // Log any errors encountered
      return { S: '', M: '', L: '' };
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



let checkFetch = true;
const urlParams = new URLSearchParams(window.location.search);
  const hasEditParam = urlParams.has('edit');
  const correctLocalStorageKey = localStorage.getItem('A98398HBFBB93BNABSN') === 'fabfbuygi328y902340';
 
  if (hasEditParam && correctLocalStorageKey) {
console.log("Edittor mode ")
setTimeout(async () => {
  try {
    
      await edittor("1");
    
      await edittor("2");
      await edittor1();
      await edittor("3");
         
 
      console.log("Both edittor functions have been executed.");
  } catch (error) {
      console.error("Error executing edittor functions:", error);
  }
}, 10000); // 10000 milliseconds = 10 seconds
  }else{
    console.log("User   is not in edit mode")

  }
