"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../firebase";
import saveContactInfo from "../utilis/saveContact";
import { openDB } from "idb";

// Initialize or access the IndexedDB database
async function getDB() {
  return await openDB("UserDB", 1, {
    upgrade(db) {
      db.createObjectStore("auth", { keyPath: "id" });
    },
  });
}

// Save user details in IndexedDB
async function saveUserDetails(userDetails) {
  const db = await getDB();
  await db.put("auth", { id: "userSession", ...userDetails });
}

// Retrieve user details from IndexedDB
async function getUserDetails() {
  const db = await getDB();
  return await db.get("auth", "userSession");
}

// Clear user details from IndexedDB
async function clearUserDetails() {
  const db = await getDB();
  await db.delete("auth", "userSession");
}

const AuthContext = createContext();

export function useSignOut() {
  const { logOut } = useAuth();
 
  return logOut; // Returning the logOut function (which is the signOut function)
}

export function useSignIn() {
  const { signIn, userDetails } = useAuth(); // Extract signIn and userDetails from AuthContext

  useEffect(() => {
  if (userDetails) { // Ensure userDetails is not undefined or null
    if (userDetails.phoneNumber !== null) {
      saveContactInfo(userDetails.phoneNumber, userDetails.email, "main");
    } else {
      saveContactInfo(null, userDetails.email, "main");
    }
  }
  }, [userDetails]);

  return signIn; // Returning the signIn function
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loginMethod, setLoginMethod] = useState(null); // State to track login method
  const [userDetails, setUserDetailsState] = useState(null); // State for user details

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Determine login method
        const providerId = currentUser.providerData[0]?.providerId;
        const method = providerId === 'google.com' ? 'google' : 'form';
        setLoginMethod(method);

        // Prepare user details
        const details = {
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: method === 'google' ? currentUser.photoURL : "/path/to/default-black-image.png", // Default black image path
          uid: currentUser.uid,
          emailVerified: currentUser.emailVerified,
          phoneNumber: currentUser.phoneNumber,
          providerId: currentUser.providerData[0]?.providerId,
          metadata: {
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime,
          },
          refreshToken: currentUser.refreshToken,
          loginMethod: method, // Store login method
        };

        setUserDetailsState(details); // Update state
        await saveUserDetails(details); // Save to IndexedDB
      } else {
        // Clear user session when logged out
        await clearUserDetails();
        setLoginMethod(null);
        setUserDetailsState(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logOut = () => {
    return signOut(auth);
  };

  const setUserDetails = async (details) => {
    const updatedDetails = { ...details, loginMethod: 'form', photoURL: "/path/to/default-black-image.png" };
    setUserDetailsState(updatedDetails); // Update state
    await saveUserDetails(updatedDetails); // Save to IndexedDB
    setLoginMethod('form');
  };

  return (
    <AuthContext.Provider value={{ user, signIn, logOut, loginMethod, setUserDetails, userDetails }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
