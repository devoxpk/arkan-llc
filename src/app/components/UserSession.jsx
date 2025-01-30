import { useState, useEffect } from "react";
import { useAuth, useSignOut, useSignIn } from "../context/AuthContext";
import showMessageBox from "../utilis/showMessageBox";
import Login from './login';

let handleAuthHelper;
export const handleAuth = async () => {
  await handleAuthHelper();
}

const AuthButton = () => {
  const { user, loginMethod } = useAuth(); // Access user state and login method from AuthContext
  const signIn = useSignIn();
  const signOut = useSignOut();

  const [showLogin, setShowLogin] = useState(false);

  handleAuthHelper = async () => {
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
const openForm = async  () => {
  if(user){
   // Display confirmation message
   const confirmLogout = window.confirm(`Do you want to logout of ${user.displayName}?`);
   if (confirmLogout) {
     // Sign out
     try {
       await signOut();
       showMessageBox("Logged out", "You have been successfully logged out.", false);
     } catch (error) {
       console.error("Error signing out:", error);
       showMessageBox("Error", "Failed to log out. Please try again.", false);
     }
   } else {
     // Open login form
     setShowLogin(true);
   }
 } else {
   // Open login form
   setShowLogin(true);
 }
}
  return (
    <>
      <button className="header-action-btn" onClick={openForm}>
        {user ? (
          <>
            {loginMethod === 'google' ? (
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
            ) : (
              <img
                src="/path/to/default-black-image.png" // Ensure this path is correct and the image exists
                alt="Default Avatar"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  marginRight: "8px",
                }}
              />
            )}
            <p className="header-action-label">{user.displayName}</p>
          </>
        ) : (
          <>
            <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
            <p className="header-action-label">Sign in</p>
          </>
        )}
      </button>
      
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default AuthButton;
