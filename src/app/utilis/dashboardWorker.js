'use client';

import { db } from '../firebase'; // Import your Firebase configuration
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

async function fetchStatusData() {
    try {
        // Fetch statuses from your server
        const response = await fetch(process.env.NEXT_PUBLIC_SERVER_API+"/get-status"); // Replace with your server's actual URL
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const statusData = await response.json();
        console.log("Statuses fetched:", statusData);

        // Fetch all documents from the 'dispatched' collection
        const dispatchedCollection = collection(db, 'dispatched');
        const dispatchedDocsSnapshot = await getDocs(dispatchedCollection);

        const now = new Date().toString(); 

        // Iterate through each document in the 'dispatched' collection
        for (const docSnapshot of dispatchedDocsSnapshot.docs) {
            const docData = docSnapshot.data(); // Data of the document
            const trackingNumber = docData.tracking; // Assume `tracking` is the field name

            let statusCategory = null;
            let statusDetails = null;

            // Check if tracking number exists in any of the status categories
            if (statusData.cancelled && statusData.cancelled[trackingNumber]) {
                statusCategory = 'cancelled';
                statusDetails = statusData.cancelled[trackingNumber];
            } else if (statusData.returned && statusData.returned[trackingNumber]) {
                statusCategory = 'returned';
                statusDetails = statusData.returned[trackingNumber];
            } else if (statusData.delayed && statusData.delayed[trackingNumber]) {
                statusCategory = 'delayed';
                statusDetails = statusData.delayed[trackingNumber];
            } else if (statusData.delivered && statusData.delivered[trackingNumber]) {
                statusCategory = 'delivered';
                statusDetails = statusData.delivered[trackingNumber];
            }

            if (statusCategory && statusDetails) {
                const { contact } = statusDetails;

                // Push to the appropriate Firestore collection based on the status category
                const targetCollection = collection(db, statusCategory);
                const targetDocRef = doc(targetCollection, docSnapshot.id);

                await setDoc(targetDocRef, {
                    ...docData,
                    contact,
                    [`${statusCategory}Date`]: now
                });

                console.log(
                    `Document with tracking ${trackingNumber} added to '${statusCategory}' collection.`
                );
            } else {
                console.log(
                    `Tracking number ${trackingNumber} is not in any of the expected categories.`
                );
            }
        }
    } catch (error) {
        console.error("Error processing status data:", error);
    }
}

export default fetchStatusData;
