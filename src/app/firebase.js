// Import required Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { getAuth } from "firebase/auth";

// Your Firebase configuration (using environment variables for security)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
  };
// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Export the Firebase app, Firestore, and Storage for use in other files
export { app, db, storage };
export const auth = getAuth(app);

// Function to initialize chatbot roles if not present
const initializeChatbotRoles = async () => {
    const rolesRef = doc(db, 'chatbotRoles', 'rolesDoc');
    const docSnap = await getDoc(rolesRef);
    if (!docSnap.exists()) {
        await setDoc(rolesRef, {
            roles: [
                {
                    role: "user",
                    parts: [{ text: "Hi" }]
                },
                {
                    role: "model",
                    parts: [{ text: "Hello! How can I help?" }]
                }
                // Add more roles as needed
            ]
        });
    }
};

// Call the initialization function
initializeChatbotRoles();