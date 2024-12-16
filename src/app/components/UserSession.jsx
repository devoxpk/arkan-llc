import { useState, useEffect } from "react";
import { useAuth, useSignOut, useSignIn } from "../context/AuthContext";
import showMessageBox from "../utilis/showMessageBox";

const AuthButton = () => {
  const { user } = useAuth(); // Access user state from AuthContext
  const signIn = useSignIn();
  const signOut = useSignOut();

  const handleAuth = async () => {
    if (user) {
      // Sign out
      await signOut();
      showMessageBox("Logged out","You are now Logged out",false)
    } else {
      // Sign in
      try {
        await signIn();
        showMessageBox("Logged in","You are now Logged in",true)

      } catch (error) {
        console.error("Error signing in:", error);
      }
    }
  };

  return (
    <button className="header-action-btn" onClick={handleAuth}>
      {user ? (
        <>
          <img
            src={user.photoURL}
            alt="User Avatar"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          />
          <p className="header-action-label">{user.displayName}</p>
        </>
      ) : (
        <>
          <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
          <p className="header-action-label">Sign in</p>
        </>
      )}
    </button>
  );
};

export default AuthButton;
