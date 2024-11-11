import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; 

export default async function fetchTrackingData() {
    console.log("Fetching trackings")
    const dispatchedCollection = collection(db, "dispatched");
    const credsDoc = doc(db, "creds", "fetchTracking");

    try {
        // Check if 24 hours have passed since last request
        const credsSnapshot = await getDoc(credsDoc);
        const currentTime = new Date();
        const timePassed = credsSnapshot.exists() ? credsSnapshot.data().timePassed.toDate() : null;

        if (timePassed) {
            const timeDifference = currentTime - timePassed;
            const hoursPassed = timeDifference / (1000 * 60 * 60);

            if (hoursPassed < 24) {
                console.log("Less than 24 hours since last request. Exiting...");
                return;
            }
        }

        let trackingArray = [];
        const snapshot = await getDocs(dispatchedCollection);

        // Build array of tracking numbers, courier info, and contact
        snapshot.forEach((doc) => {
            const data = doc.data();
            const trackingNumber = data.tracking;

            // Skip if trackingNumber is 0
            if (trackingNumber === 0) {
                return;
            }

            const contact = data.Contact;
            const trackingLink = data.trackingLink || ''; // Get the trackingLink field

            // Check if trackingLink contains 'leopards' or 'barq' and append courier info accordingly
            let courier = '';
            if (trackingLink.includes('leopards')) {
                courier = 'leopards';
            } else if (trackingLink.includes('barq')) {
                courier = 'barq';
            }

            // Only add the tracking number if a courier is found
            if (courier) {
                trackingArray.push({ trackingNumber, courier, contact });
            }
        });

        // Log the tracking array to check the couriers and contacts with each tracking number
        console.log("Tracking array to be passed to API:", trackingArray);

        // If trackingArray is empty (no valid couriers), exit the function
        if (trackingArray.length === 0) {
            console.log("No valid couriers found. Exiting...");
            return;
        }

        // Construct URL with tracking numbers, couriers, and contacts as query parameters, with a single auth value
        const auth = "Devox-332cewad2";
        const url = `http://16.171.1.112:8080/get-tracking?auth=${auth}&` +
                    trackingArray.map(({ trackingNumber, courier, contact }) => 
                        `tracking[]=${trackingNumber}&courier=${courier}&contact=${contact}`
                    ).join('&');

        console.log("Request URL:", url);

        // Send the request to API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        console.log("Request sent to API successfully.");

        // Update timePassed in Firestore to current time after successful API call
        await setDoc(credsDoc, { timePassed: serverTimestamp() });

    } catch (error) {
        console.error("Failed to fetch tracking data:", error);
    }
}
