// Import required Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Log the environment variables to the console
console.log('API Key:', process.env.NEXT_PUBLIC_API_KEY);

// Your Firebase configuration (using environment variables for security)
const firebaseConfig = {
    apiKey: "AIzaSyDJZnn7j59UgfNtqM86lSt4d7MjC0MGpqs",
    authDomain: "nouvedb-1328c.firebaseapp.com",
    projectId: "nouvedb-1328c",
    storageBucket: "nouvedb-1328c.appspot.com",
    messagingSenderId:"837053990744",
    appId: "1:837053990744:web:addfa838555c45fc0f472d",
    measurementId: "G-TQLTR7C06P"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Export the Firebase app, Firestore, and Storage for use in other files
export { app, db, storage };
