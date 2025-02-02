import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import fetchTrackingData from './fetchtracking';
import emailMarketer from './emailMarketing';
import retargetter from './retargetter';
import dashboardManager from './dashboardWorker';
import orderConfirmation from "./orderConfirmation";

// Utility function for exponential backoff
const retryWithBackoff = async (fn, retries = 5, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        console.warn(`Retrying in ${delay} ms... (${retries} retries left)`);
        await new Promise(res => setTimeout(res, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
    }
};

async function serverWorker() {
    
    const concurrencyDoc = doc(db, "control", "serverWorker");
    try {
        await runTransaction(db, async (transaction) => {
            const concurrencySnapshot = await transaction.get(concurrencyDoc);
            const currentTime = new Date();
            const isRunningTimestamp = concurrencySnapshot.exists() ? concurrencySnapshot.data().isRunningTimestamp?.toDate() : null;

            if (concurrencySnapshot.exists() && concurrencySnapshot.data().isRunning) {
                if (isRunningTimestamp && (currentTime - isRunningTimestamp) / (1000 * 60 * 60) < 1) {
                    console.log("serverWorker: Another instance is currently running.");
                    throw new Error("Concurrency control: serverWorker is running.");
                } else {
                    console.log("serverWorker: Detected stale isRunning flag. Resetting...");
                }
            }

            // Mark as running
            transaction.set(concurrencyDoc, { isRunning: true, isRunningTimestamp: serverTimestamp() }, { merge: true });
            console.log("serverWorker: Initiating serverWorker function.");
        });

        const credsDoc = doc(db, "creds", "fetchTracking");

        await runTransaction(db, async (transaction) => {
            const credsSnapshot = await transaction.get(credsDoc);
            const data = credsSnapshot.exists() ? credsSnapshot.data() : {};

            const timePassedFetch = data.timePassedFetch ? data.timePassedFetch.toDate() : null;
            const timePassedOrderConfirmation = data.timePassedOrderConfirmation ? data.timePassedOrderConfirmation.toDate() : null;
            const timePassedEmail = data.timePassedEmail ? data.timePassedEmail.toDate() : null;
            const timePassedRetarget = data.timePassedRetarget ? data.timePassedRetarget.toDate() : null;

            console.log("serverWorker: Retrieved timestamps:", { 
                timePassedFetch, 
                timePassedOrderConfirmation, 
                timePassedEmail, 
                timePassedRetarget 
            });

            let hasUpdates = false;
            const updates = {};

            // 1. Order Confirmation
            if (!timePassedOrderConfirmation) {
                console.log("serverWorker: First run detected. Running orderConfirmation.");
                await orderConfirmation();
                updates.timePassedOrderConfirmation = serverTimestamp();
                hasUpdates = true;
                console.log("serverWorker: Set initial timePassedOrderConfirmation timestamp.");
            } else {
                const currentTime = new Date();
                const hoursPassed = (currentTime - timePassedOrderConfirmation) / (1000 * 60 * 60);
                console.log(`serverWorker: Hours since last orderConfirmation: ${hoursPassed}`);

                if (hoursPassed >= 20) {
                    console.log("serverWorker: Running orderConfirmation.");
                    await orderConfirmation();
                    updates.timePassedOrderConfirmation = serverTimestamp();
                    hasUpdates = true;
                    console.log("serverWorker: Updated timePassedOrderConfirmation timestamp.");
                } else {
                    console.log("serverWorker: Less than 20 hours since last orderConfirmation. Skipping...");
                }
            }

            // 2. Fetch Tracking Data and Dashboard Manager
            if (timePassedFetch) {
                const currentTime = new Date();
                const hoursPassed = (currentTime - timePassedFetch) / (1000 * 60 * 60);
                console.log(`serverWorker: Hours since last fetchTrackingData: ${hoursPassed}`);

                if (hoursPassed >= 24) {
                    console.log("serverWorker: Running fetchTrackingData and dashboardManager.");
                    await retryWithBackoff(fetchTrackingData);
                    await dashboardManager();
                    updates.timePassedFetch = serverTimestamp();
                    hasUpdates = true;
                    console.log("serverWorker: Updated timePassedFetch timestamp.");
                } else {
                    console.log("serverWorker: Less than 24 hours since last fetchTrackingData. Skipping...");
                }
            } else {
                console.log("serverWorker: No timePassedFetch timestamp found. Running fetchTrackingData and dashboardManager.");
                await retryWithBackoff(fetchTrackingData);
                await dashboardManager();
                updates.timePassedFetch = serverTimestamp();
                hasUpdates = true;
                console.log("serverWorker: Set initial timePassedFetch timestamp.");
            }

            // 3. Email Marketer
            if (timePassedEmail) {
                const currentTime = new Date();
                const daysPassed = (currentTime - timePassedEmail) / (1000 * 60 * 60 * 24);
                console.log(`serverWorker: Days since last emailMarketer: ${daysPassed}`);

                if (daysPassed >= 5) {
                    console.log("serverWorker: Running emailMarketer.");
                    await emailMarketer();
                    updates.timePassedEmail = serverTimestamp();
                    hasUpdates = true;
                    console.log("serverWorker: Updated timePassedEmail timestamp.");
                } else {
                    console.log("serverWorker: Less than 5 days since last emailMarketer. Skipping...");
                }
            } else {
                console.log("serverWorker: No timePassedEmail timestamp found. Running emailMarketer.");
                await emailMarketer();
                updates.timePassedEmail = serverTimestamp();
                hasUpdates = true;
                console.log("serverWorker: Set initial timePassedEmail timestamp.");
            }

            // 4. Retargetter
            if (timePassedRetarget) {
                const currentTime = new Date();
                const daysPassed = (currentTime - timePassedRetarget) / (1000 * 60 * 60 * 24);
                console.log(`serverWorker: Days since last retargetter: ${daysPassed}`);

                if (daysPassed >= 30) {
                    console.log("serverWorker: Running retargetter.");
                    await retargetter();
                    updates.timePassedRetarget = serverTimestamp();
                    hasUpdates = true;
                    console.log("serverWorker: Updated timePassedRetarget timestamp.");
                } else {
                    console.log("serverWorker: Less than 30 days since last retargetter. Skipping...");
                }
            } else {
                console.log("serverWorker: No timePassedRetarget timestamp found. Running retargetter.");
                await retargetter();
                updates.timePassedRetarget = serverTimestamp();
                hasUpdates = true;
                console.log("serverWorker: Set initial timePassedRetarget timestamp.");
            }

            if (hasUpdates) {
                transaction.set(credsDoc, updates, { merge: true });
                console.log("serverWorker: Prepared timestamp updates.");
            } else {
                console.log("serverWorker: No updates to commit.");
            }
        });

        console.log("serverWorker: All tasks completed successfully.");

    } catch (error) {
        if (error.message.includes("Concurrency control")) {
            console.error("serverWorker: Concurrency issue detected.", error);
        } else {
            console.error("serverWorker: An error occurred during transaction.", error);
        }
    } finally {
        try {
            await runTransaction(db, async (transaction) => {
                transaction.set(concurrencyDoc, { isRunning: false }, { merge: true });
                console.log("serverWorker: Released concurrency lock.");
            });
        } catch (releaseError) {
            console.error("serverWorker: Failed to release concurrency lock.", releaseError);
        }
    }
}

export default serverWorker;
