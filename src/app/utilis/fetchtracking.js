import { collection, doc, getDocs } from "firebase/firestore";

import { db } from "../firebase";

export default async function fetchTrackingData() {
    const dispatchedCollection = collection(db, "dispatched");
    console.log(dispatchedCollection)

    try {
        let trackingArray = [];
        const snapshot = await getDocs(dispatchedCollection);
        console.log(snapshot)

        // Build array of tracking numbers, contacts, and domainReview URLs
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(data)
            const trackingNumber = data.tracking;
            console.log(trackingNumber)

            // Skip if trackingNumber is 0
            if (trackingNumber === 0) {
                return;
            }

            const contact = data.Contact;
            const productsData = data.productsData || ''; // Get the productsData field

            let productName = '';
            try {
                // Parse productsData and get the productName of the first product
                const products = JSON.parse(productsData);
                if (Array.isArray(products) && products.length > 0) {
                    productName = products[0].productName || ''; // Get the first product's name
                }
            } catch (error) {
                console.error("Failed to parse productsData:", error);
            }
            
            // Only add the tracking number if it has contact and productName
            if (contact && productName) {
                const domainReview = `${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}/checkout?pname=${encodeURIComponent(productName)}&reviewPost=true`;
                trackingArray.push({ trackingNumber, contact, domainReview });
            }
            
        });

        // Log the tracking array to check the contacts and domainReviews with each tracking number
        console.log("Tracking array to be passed to API:", trackingArray);

        // If trackingArray is empty, exit the function
        if (trackingArray.length === 0) {
            console.log("No valid tracking numbers found. Exiting...");
            return;
        }

        // Construct URL with tracking numbers, contacts, domainReviews, and ownercontact
        const auth = process.env.NEXT_PUBLIC_OWNER_AUTH;
        const ownerContact = process.env.NEXT_PUBLIC_OWNER_CONTACT;
        const url = process.env.NEXT_PUBLIC_SERVER_API + `/get-tracking?auth=${auth}&ownercontact=${ownerContact}&` +
            trackingArray.map(({ trackingNumber, contact, domainReview }) =>
                `tracking[]=${trackingNumber}&contact=${contact}&domainReview[]=${encodeURIComponent(domainReview)}`
            ).join('&');

        console.log("Request URL:", url);

        // Send the request to API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        console.log("Request sent to API successfully.");

    } catch (error) {
        console.error("Failed to fetch tracking data:", error);
    }
}
