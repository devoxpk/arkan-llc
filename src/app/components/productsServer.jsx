import { db } from '../firebase.js'
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'

import Products from './productsClient.jsx'

// Function to fetch headers globally
async function fetchHeaders(divID) {
    console.log("Fetching headers from Firebase..."); // Log fetching from Firebase

    try {
        const headerRef = doc(db, divID, 'headers');
        const headerSnap = await getDoc(headerRef);

        if (headerSnap.exists()) {
            const fetchedHeaders = headerSnap.data(); // Assuming this is an array or contains an array field
            console.log("Headers fetched from Firebase:", fetchedHeaders);

            return fetchedHeaders;
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

        console.log(`Fetched data for ${divID}.`);

    } catch (error) {
        console.error(`Error fetching data for collection: ${divID}`, error);
    }

    return { collectionData, headers }; // Return collection data along with headers for this collection
}



let collectionsToFetch = [];

async function fetchAndRenderCollections(collectionsToFetchArg = null) {
    let isFetching = false; // Moved inside function
    console.log("fetchAndRenderCollections started with argument:", collectionsToFetchArg);

    try {
        let collections = [];

        if (!collectionsToFetchArg || collectionsToFetchArg.length === 0) {
            console.log("No collectionsToFetchArg provided. Calling inlistDaddy to retrieve collections.");
            collections = await inlistDaddy(); // Populate collections if not provided
            console.log("Collections retrieved from inlistDaddy:", collections);
        } else {
            // Filter out null or undefined values and remove duplicates
            collections = collectionsToFetchArg.filter(id => id != null);
            collections = [...new Set(collections)];
            console.log("Using provided collectionsToFetchArg after filtering and deduplication:", collections);
        }

        if (collections.length === 0) {
            console.warn("No collections to fetch after processing collectionsToFetchArg.");
            return { collectionData: {}, headersData: {}, collections: [] };
        }

        const collectionData = {};
        const headersData = {};

        for (const collectionId of collections) {
            console.log(`Fetching data for collectionId: ${collectionId}`);
            const { collectionData: data, headers } = await inlist(collectionId); // Fetch collection and headers
            if (data && headers) {
                collectionData[collectionId] = data;
                headersData[collectionId] = headers;
                console.log(`Successfully fetched data for collectionId: ${collectionId}`);
            } else {
                console.warn(`No data fetched for collectionId: ${collectionId}`);
            }
        }

        console.log("All collections fetched and processed successfully.");
        return { collectionData, headersData, collections };
    } catch (error) {
        console.error("Error in fetchAndRenderCollections:", error);
        return { collectionData: {}, headersData: {}, collections: [] };
    }
}

async function inlistDaddy() {
    console.log("Running Daddy of inlist");
    collectionsToFetch = [];
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
                if (!collectionsToFetch.includes(divID)) { // Prevent adding duplicates
                    collectionsToFetch.push(divID); // Add the collection ID to the collectionsToFetch array
                }
            } else {
                console.log(`Collection ${divID} not found.`);
                break; // Terminate the loop if collection not found
            }

        }
        console.log(`Total collections found: ${collectionCount - 1}`); // Log total collections found
        return collectionsToFetch;
    } catch (error) {
        console.error("Error fetching collections: ", error);
        return collectionsToFetch; // Return whatever has been fetched so far in case of error
    }
}

export default async function ProductsServer({ collectionsToFetch = [], styleHead = 'grid', productsStyle = false, trending = false }) {
    console.log("collectionsToFetch",collectionsToFetch);
    let cachedHeaders = null; // Moved inside function

    const { collectionData, headersData, collections } = await fetchAndRenderCollections(collectionsToFetch);

    return (
        <Products
            collectionData={collectionData || {}}
            headers={headersData || {}}
            collectionsToFetch={collections || []}
            styleHead={styleHead}
            productsStyle={productsStyle}
            trending={trending}
        />
    );
}
