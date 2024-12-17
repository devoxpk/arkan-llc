import {db} from '../firebase'
import {collection, doc, getDoc, getDocs, setDoc, serverTimestamp} from 'firebase/firestore'

import Products from './productsClient.jsx'
let fetchedHeaders = 0;
let cachedHeaders = null;


// Function to fetch headers globally (with caching)
async function fetchHeaders(divID) {
    // Check localStorage first
    const localStorageKey = `headers_${divID}`;
    let localStorageHeaders;
    if (typeof window !== 'undefined') {
     localStorageHeaders = localStorage.getItem(localStorageKey);
    }
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
            if (typeof window !== 'undefined') {
            localStorage.setItem(localStorageKey, JSON.stringify(cachedHeaders));}
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
          if (typeof window !== 'undefined') {
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
        }}
         else {
              console.log(`Time matches for ${divID}, using cached data.`);
              // If timestamp matches, check if there's cached data
              let cachedData;
              if (typeof window !== 'undefined') {
               cachedData = localStorage.getItem(divID);}
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
            const data = doc.data();
            
            // Convert createdAt to ISO string if it exists
            if (data.createdAt && data.createdAt.seconds) {
                data.createdAt = new Date(data.createdAt.seconds * 1000 + data.createdAt.nanoseconds / 1000000).toISOString();
            }

            collectionData.push({
                id: docId,
                ...data,
            });
        }
    });

      // Sort data numerically by ID
      collectionData.sort((a, b) => a.id - b.id);

      // Store fetched data in localStorage for future use
      if (typeof window !== 'undefined') {
      localStorage.setItem(divID, JSON.stringify(collectionData));}
      console.log(`Fetched data for ${divID} and stored in localStorage.`);

  } catch (error) {
      console.error(`Error fetching data for collection: ${divID}`, error);
  }
 

  return { collectionData, headers }; // Return collection data along with headers for this collection
}









let fetchAndRenderCollections;
let collectionsToFetch = [];

fetchAndRenderCollections = async (collectionsToFetchArg = null) => {
  try {
    if (!collectionsToFetchArg || collectionsToFetchArg.length === 0) {
      await inlistDaddy(); // Populate collectionsToFetch if not provided
    } else {
      collectionsToFetch = collectionsToFetchArg; // Use provided collectionsToFetch
    }

    const collectionData = {};
    const headersData = {};

    for (const collectionId of collectionsToFetch) {
      const { collectionData: data, headers } = await inlist(collectionId); // Fetch collection and headers
      collectionData[collectionId] = data;
      headersData[collectionId] = headers;
    }

    return { collectionData, headersData }; // Return fetched data
  } catch (error) {
    console.error("Error fetching data:", error);
    return { collectionData: {}, headersData: {} }; // Return empty data on error
  }
};

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


export default async function ProductsServer({collectionsToFetch,styleHead="grid",productsStyle=false,trending=false }) {
  
  const { collectionData, headersData } = await fetchAndRenderCollections(collectionsToFetch); // Fetch data

  return (
    <Products
      collectionData={collectionData}
      headers={headersData}
      collectionsToFetch={collectionsToFetch}
      styleHead={styleHead}
      productsStyle={productsStyle}
      trending={trending}
    
    />
  );
}
