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
  const { signIn } = useAuth(); // Extract the signIn function from AuthContext

  if (userDetails) { // Ensure userDetails is not undefined or null
    if (userDetails.phoneNumber !== null) {
      saveContactInfo(userDetails.phoneNumber, userDetails.email, "main");
    } else {
      saveContactInfo(null, userDetails.email, "main");
    }
  }

  return signIn; // Returning the signIn function
}


let userDetails;
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Save the user's details in IndexedDB
         userDetails = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
          providerId: user.providerData[0]?.providerId, // Ensure we access the provider details
          metadata: {
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
          },
          refreshToken: user.refreshToken,
        };

        

        await saveUserDetails(userDetails); // Save user details in IndexedDB
      } else {
        // Clear user session when logged out
        await clearUserDetails();
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

  return (
    <AuthContext.Provider value={{ user, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
