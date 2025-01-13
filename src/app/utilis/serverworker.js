    import { doc, getDoc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
    import { db } from "../firebase";
    import fetchTrackingData from './fetchtracking';
    import emailMarketer from './emailMarketing';
    import retargetter from './retargetter';
    import dashboardManager from './dashboardWorker';
    import orderConfirmation from "./orderConfirmation";
    
    async function serverWorker() {
        const credsDoc = doc(db, "creds", "fetchTracking");
        const batchUpdates = writeBatch(db);
        const currentTime = new Date();
        let hasUpdates = false;
    
        try {
            // Fetch the document
            const credsSnapshot = await getDoc(credsDoc);
    
            // Retrieve existing timestamps or set them to null if they don't exist
            const data = credsSnapshot.exists() ? credsSnapshot.data() : {};
            const timePassedFetch = data.timePassed?.toDate() || null;
            const timePassedEmail = data.timePassedEmail?.toDate() || null;
            const timePassedRetarget = data.timePassedRetarget?.toDate() || null;
    
            // 1. Check and run fetchTrackingData
            if (timePassedFetch) {
                const fetchTimeDifference = currentTime - timePassedFetch;
                const fetchHoursPassed = fetchTimeDifference / (1000 * 60 * 60);
    
                if (fetchHoursPassed >= 24) {
                    await fetchTrackingData();
                    await dashboardManager();
                    batchUpdates.set(credsDoc, { timePassed: serverTimestamp() }, { merge: true });
                    hasUpdates = true;
                } else if (fetchHoursPassed >= 20) {
                    await orderConfirmation();
                    // Assuming orderConfirmation doesn't require a timestamp update
                } else {
                    console.log("Less than 20 hours since last fetchTrackingData. Skipping...");
                }
            } else {
                await fetchTrackingData();
                await dashboardManager();
                batchUpdates.set(credsDoc, { timePassed: serverTimestamp() }, { merge: true });
                hasUpdates = true;
            }
    
            // 2. Check and run emailMarketer
            if (timePassedEmail) {
                const emailTimeDifference = currentTime - timePassedEmail;
                const emailDaysPassed = emailTimeDifference / (1000 * 60 * 60 * 24);
    
                if (emailDaysPassed >= 5) {
                    await emailMarketer();
                    batchUpdates.set(credsDoc, { timePassedEmail: serverTimestamp() }, { merge: true });
                    hasUpdates = true;
                } else {
                    console.log("Less than 5 days since last emailMarketer. Skipping...");
                }
            } else {
                await emailMarketer();
                batchUpdates.set(credsDoc, { timePassedEmail: serverTimestamp() }, { merge: true });
                hasUpdates = true;
            }
    
            // 3. Check and run retargetter
            if (timePassedRetarget) {
                const retargetTimeDifference = currentTime - timePassedRetarget;
                const retargetDaysPassed = retargetTimeDifference / (1000 * 60 * 60 * 24);
    
                if (retargetDaysPassed >= 30) {
                    await retargetter();
                    batchUpdates.set(credsDoc, { timePassedRetarget: serverTimestamp() }, { merge: true });
                    hasUpdates = true;
                } else {
                    console.log("Less than 30 days since last retargetter. Skipping...");
                }
            } else {
                await retargetter();
                batchUpdates.set(credsDoc, { timePassedRetarget: serverTimestamp() }, { merge: true });
                hasUpdates = true;
            }
    
            // Commit all timestamp updates at once if there are any
            if (hasUpdates) {
                await batchUpdates.commit();
                console.log("Timestamps updated successfully.");
            }
    
        } catch (error) {
            console.error("Error checking or updating tracking data:", error);
        }
    }
    
    export default serverWorker;
