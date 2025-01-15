import { doc, getDoc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import fetchTrackingData from './fetchtracking';
import emailMarketer from './emailMarketing';
import retargetter from './retargetter';
import dashboardManager from './dashboardWorker';
import orderConfirmation from "./orderConfirmation";

async function serverWorker() {
    if(sessionStorage.getItem('serverWorkerRun')){
        console.log("serverWorker: serverWorker has already been run.");
        return;
    }
    sessionStorage.setItem('serverWorkerRun', 'true');
    console.log("serverWorker: Initiating serverWorker function.");
    const credsDoc = doc(db, "creds", "fetchTracking");
    const batchUpdates = writeBatch(db);
    const currentTime = new Date();
    let hasUpdates = false;

    try {
        // Fetch the document
        console.log("serverWorker: Fetching creds document.");
        const credsSnapshot = await getDoc(credsDoc);

        // Retrieve existing timestamps or set them to null if they don't exist
        const data = credsSnapshot.exists() ? credsSnapshot.data() : {};
        const timePassedFetch = data.timePassed?.toDate() || null;
        const timePassedEmail = data.timePassedEmail?.toDate() || null;
        const timePassedRetarget = data.timePassedRetarget?.toDate() || null;

        console.log("serverWorker: Retrieved timestamps:", { timePassedFetch, timePassedEmail, timePassedRetarget });

        // 1. Check and run fetchTrackingData
        if (timePassedFetch) {
            const fetchTimeDifference = currentTime - timePassedFetch;
            const fetchHoursPassed = fetchTimeDifference / (1000 * 60 * 60);
            console.log(`serverWorker: Hours since last fetchTrackingData: ${fetchHoursPassed}`);

            if (fetchHoursPassed >= 24) {
                console.log("serverWorker: Running fetchTrackingData and dashboardManager.");
                await fetchTrackingData();
                await dashboardManager();
                batchUpdates.set(credsDoc, { timePassed: serverTimestamp() }, { merge: true });
                hasUpdates = true;
                console.log("serverWorker: Updated timePassed timestamp.");
            } else if (fetchHoursPassed >= 20) {
                console.log("serverWorker: Running orderConfirmation.");
                await orderConfirmation();
                // Assuming orderConfirmation doesn't require a timestamp update
            } else {
                console.log("serverWorker: Less than 20 hours since last fetchTrackingData. Skipping...");
            }
        } else {
            console.log("serverWorker: No timePassed timestamp found. Running fetchTrackingData and dashboardManager.");
            await fetchTrackingData();
            await dashboardManager();
            batchUpdates.set(credsDoc, { timePassed: serverTimestamp() }, { merge: true });
            hasUpdates = true;
            console.log("serverWorker: Set initial timePassed timestamp.");
        }

        // 2. Check and run emailMarketer
        if (timePassedEmail) {
            const emailTimeDifference = currentTime - timePassedEmail;
            const emailDaysPassed = emailTimeDifference / (1000 * 60 * 60 * 24);
            console.log(`serverWorker: Days since last emailMarketer: ${emailDaysPassed}`);

            if (emailDaysPassed >= 5) {
                console.log("serverWorker: Running emailMarketer.");
                await emailMarketer();
                batchUpdates.set(credsDoc, { timePassedEmail: serverTimestamp() }, { merge: true });
                hasUpdates = true;
                console.log("serverWorker: Updated timePassedEmail timestamp.");
            } else {
                console.log("serverWorker: Less than 5 days since last emailMarketer. Skipping...");
            }
        } else {
            console.log("serverWorker: No timePassedEmail timestamp found. Running emailMarketer.");
            await emailMarketer();
            batchUpdates.set(credsDoc, { timePassedEmail: serverTimestamp() }, { merge: true });
            hasUpdates = true;
            console.log("serverWorker: Set initial timePassedEmail timestamp.");
        }

        // 3. Check and run retargetter
        if (timePassedRetarget) {
            const retargetTimeDifference = currentTime - timePassedRetarget;
            const retargetDaysPassed = retargetTimeDifference / (1000 * 60 * 60 * 24);
            console.log(`serverWorker: Days since last retargetter: ${retargetDaysPassed}`);

            if (retargetDaysPassed >= 30) {
                console.log("serverWorker: Running retargetter.");
                await retargetter();
                batchUpdates.set(credsDoc, { timePassedRetarget: serverTimestamp() }, { merge: true });
                hasUpdates = true;
                console.log("serverWorker: Updated timePassedRetarget timestamp.");
            } else {
                console.log("serverWorker: Less than 30 days since last retargetter. Skipping...");
            }
        } else {
            console.log("serverWorker: No timePassedRetarget timestamp found. Running retargetter.");
            await retargetter();
            batchUpdates.set(credsDoc, { timePassedRetarget: serverTimestamp() }, { merge: true });
            hasUpdates = true;
            console.log("serverWorker: Set initial timePassedRetarget timestamp.");
        }

        // Commit all timestamp updates at once if there are any
        if (hasUpdates) {
            console.log("serverWorker: Committing batch updates.");
            await batchUpdates.commit();
            console.log("serverWorker: Timestamps updated successfully.");
        } else {
            console.log("serverWorker: No updates to commit.");
        }

    } catch (error) {
        console.error("serverWorker: Error checking or updating tracking data:", error);
    }
}

export default serverWorker;
