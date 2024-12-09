'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import saveContactInfo from '../utilis/saveContact'

const AuthContext = createContext();
export function useSignOut() {
  const { logOut } = useAuth();
  return logOut;  // Returning the logOut function (which is the signOut function)
}
export function useSignIn() {
  const { signIn } = useAuth();  // Extract the signIn function from AuthContext
  return signIn;  // Returning the signIn function
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);


  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
  
      if (user) {
        // Save the user's details in localStorage
        const userDetails = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
          providerId: user.providerData[0]?.providerId, // Ensure we access the provider details
          metadata: {
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime
          },
          refreshToken: user.refreshToken
        };
        
        if(userDetails.phoneNumber !== null){
          saveContactInfo(userDetails.phoneNumber,userDetails.email,"main")
        }else{
          saveContactInfo(userDetails.phoneNumber,userDetails.email,"main")
        }
        localStorage.setItem('userSession', JSON.stringify(userDetails));
      } else {
        // Clear user session when logged out
        localStorage.removeItem('userSession');
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