import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import fetchTrackingData from './fetchtracking';
import emailMarketer from './emailMarketing';
import retargetter from './retargetter';
import dashboardManager from './dashboardWorker'
import orderConfirmation from "./orderConfirmation";

async function serverWorker() {
    const credsDoc = doc(db, "creds", "fetchTracking");

    try {
        // Fetch the document
        const credsSnapshot = await getDoc(credsDoc);
        const currentTime = new Date();

        // Retrieve existing timestamps or set them to null if they don't exist
        const timePassedFetch = credsSnapshot.exists() ? credsSnapshot.data().timePassed?.toDate() : null;
        const timePassedEmail = credsSnapshot.exists() ? credsSnapshot.data().timePassedEmail?.toDate() : null;
        const timePassedRetarget = credsSnapshot.exists() ? credsSnapshot.data().timePassedRetarget?.toDate() : null;

        // 1. Check and run fetchTrackingData
        let fetchRan = false;
        if (timePassedFetch) {
            const fetchTimeDifference = currentTime - timePassedFetch;
            const fetchHoursPassed = fetchTimeDifference / (1000 * 60 * 60);

            if (fetchHoursPassed >= 24) {
                await fetchTrackingData();
                await dashboardManager;
                fetchRan = true;
            }else if(fetchHoursPassed>=20){
               await orderConfirmation();
            } else {
                console.log("Less than 24 hours since last fetchTrackingData. Skipping...");
            }
        } else {
            await fetchTrackingData();
            fetchRan = true;
        }

        // Update timePassed if fetchTrackingData ran
        if (fetchRan) {
            await setDoc(credsDoc, { timePassed: serverTimestamp() }, { merge: true });
        }

        // 2. Check and run emailMarketer
        let emailRan = false;
        if (timePassedEmail) {
            const emailTimeDifference = currentTime - timePassedEmail;
            const emailDaysPassed = emailTimeDifference / (1000 * 60 * 60 * 24);

            if (emailDaysPassed >= 5) {
                await emailMarketer();
                emailRan = true;
            } else {
                console.log("Less than 5 days since last emailMarketing. Skipping...");
            }
        } else {
            await emailMarketer();
            emailRan = true;
        }

        // Update timePassedEmail if emailMarketer ran
        if (emailRan) {
            await setDoc(credsDoc, { timePassedEmail: serverTimestamp() }, { merge: true });
        }

        // 3. Check and run retargetter
        let retargetRan = false;
        if (timePassedRetarget) {
            const retargetTimeDifference = currentTime - timePassedRetarget;
            const retargetDaysPassed = retargetTimeDifference / (1000 * 60 * 60 * 24);

            if (retargetDaysPassed >= 30) {
                await retargetter();
                retargetRan = true;
            } else {
                console.log("Less than 30 days since last retargetter. Skipping...");
            }
        } else {
            await retargetter();
            retargetRan = true;
        }

        // Update timePassedRetarget if retargetter ran
        if (retargetRan) {
            await setDoc(credsDoc, { timePassedRetarget: serverTimestamp() }, { merge: true });
        }

    } catch (error) {
        console.error("Error checking or updating tracking data:", error);
    }
}

export default serverWorker;
