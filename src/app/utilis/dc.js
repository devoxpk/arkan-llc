import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function dc(trackingNumber) {
    try {
        // Fetch all documents from the 'dispatched' collection
        const dispatchedCollection = collection(db, 'dispatched');
        const dispatchedSnapshot = await getDocs(dispatchedCollection);

        // Find the document with the matching tracking number
        const dispatchedDoc = dispatchedSnapshot.docs.find(doc => doc.data().tracking === trackingNumber);

        if (!dispatchedDoc) {
            throw new Error('Document with the given tracking number not found');
        }

        const dispatchedData = dispatchedDoc.data();
        const dispatchedDate = dispatchedData.dispatchedDate.toDate().toISOString().split('T')[0];

        // Prepare the payload for the API request
        const payload = {
            id: process.env.NEXT_PUBLIC_SHOOTER_ID,
            startDate: dispatchedDate,
            endDate: new Date().toISOString().split('T')[0]
        };

        // Make the API request
        const response = await fetch('https://api.shooterdelivery.com/Apis/fetch-payment-report.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Find the matching order and return the delivery charges
        const matchingOrder = data.find(order => order.order_number === trackingNumber);
        if (matchingOrder) {
            return matchingOrder.total_sc_with_gst;
        } else {
            throw new Error('Tracking number not found in the API response');
        }
    } catch (error) {
        console.error('Error fetching delivery charges:', error);
        throw error;
    }
}
