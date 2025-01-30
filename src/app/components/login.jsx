import React, { useState } from 'react';
import sendWhatsapp from '../utilis/sendWhatsapp';
import showMessageBox from '../utilis/showMessageBox';
import { handleAuth } from './UserSession';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import saveContactInfo from '../utilis/saveContact';
const Login = ({ onClose }) => {
  const { setUserDetails } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    contact: '',
    password: '',
    confirmPassword: '',
    pin: ''
  });
  const [pinSent, setPinSent] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = async () => {
    const { contact, password } = formData;
    // Check Firebase DB for user credentials
    const accountsDocRef = doc(db, 'userContacts', 'accounts');
    const accountsDoc = await getDoc(accountsDocRef);
    if (accountsDoc.exists()) {
      const accountsData = accountsDoc.data();
      if (accountsData[contact] && accountsData[contact][0] === password) {
        showMessageBox("Logged in", "You are now Logged in", true);
        // Update userDetails with loginMethod as 'form'
        await setUserDetails({
          displayName: contact,
          email: null,
          photoURL: "/path/to/default-black-image.png", // Default black image path
          loginMethod: 'form',
        });
        onClose(); // Hide the login form
      } else {
        showMessageBox("Error", "Incorrect password", false);
      }
    } else {
      showMessageBox("Error", "User not found", false);
    }
  };

  const handleSignUp = async () => {
    const { contact, password, confirmPassword } = formData;
    if (password !== confirmPassword) {
      showMessageBox("Error", "Passwords do not match", false);
      return;
    }
    // Generate a random PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPin(pin);
    try {
      await sendWhatsapp(contact, `Your verification PIN is: ${pin}`);
    setPinSent(true);
    showMessageBox("PIN Sent", "A verification PIN has been sent to your WhatsApp.", true);
    } catch (error) {
      showMessageBox("Error", "Failed to send PIN via WhatsApp.", false);
    }
  };

  const verifyPin = async () => {
    const { contact, pin } = formData;

    // Verify the entered PIN with the generated PIN
    if (pin === generatedPin) {
      // Create account in Firebase DB
      const accountsDocRef = doc(db, 'userContacts', 'accounts');
      const accountsDoc = await getDoc(accountsDocRef);
      let accountsData = {};
      if (accountsDoc.exists()) {
        accountsData = accountsDoc.data();
      }
      accountsData[contact] = [formData.password];
      await setDoc(accountsDocRef, accountsData);
      await saveContactInfo(contact, formData.password);
      showMessageBox("Account Created", "Your account has been created and you are now logged in.", true);
      // Update userDetails with loginMethod as 'form'
      await setUserDetails({
        displayName: contact, // Assuming contact is the display name
        email: null, // or fetch email if available
        photoURL: "/path/to/default-black-image.png", // Default black image path
        loginMethod: 'form',
      });
      onClose(); // Hide the login form
    } else {
      showMessageBox("Error", "Incorrect PIN", false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await handleAuth();
      onClose(); // Hide the login form after Google sign-in
    } catch (error) {
      console.error("Error with Google sign-in:", error);
      showMessageBox("Error", "Google sign-in failed.", false);
    }
  };

  return (
    <div className="login-container">
      <style jsx>{`
       
       .login-container{
       border: 1px solid grey;
    border-radius: 11px;
    }

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #ffffff;
  padding: 30px;
  width: 450px;
  border-radius: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  position: relative; /* To position the close button */
}

::placeholder {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.form button {
  align-self: flex-end;
}

.flex-column > label {
  color: #151717;
  font-weight: 600;
}

.inputForm {
  border: 1.5px solid #ecedec;
  border-radius: 10px;
  height: 50px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  transition: 0.2s ease-in-out;
}

.input {
  margin-left: 10px;
  border-radius: 10px;
  border: none;
  width: 100%;
  height: 100%;
}

.input:focus {
  outline: none;
}

.inputForm:focus-within {
  border: 1.5px solid #2d79f3;
}

.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.flex-row > div > label {
  font-size: 14px;
  color: black;
  font-weight: 400;
}

.span {
  font-size: 14px;
  margin-left: 5px;
  color: #2d79f3;
  font-weight: 500;
  cursor: pointer;
}

.button-submit {
  margin: 20px 0 10px 0;
  background-color: #151717;
  border: none;
  color: white;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  height: 50px;
  width: 100%;
  cursor: pointer;
}

.p {
  text-align: center;
  color: black;
  font-size: 14px;
  margin: 5px 0;
}

.btn {
  margin-top: 10px;
  width: 100%;
  height: 50px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  gap: 10px;
  border: 1px solid #ededef;
  background-color: white;
  cursor: pointer;
  transition: 0.2s ease-in-out;
}

.btn:hover {
  border: 1px solid #2d79f3;
  ;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
  
  .form{
  position: fixed;
    left: 3%;
    z-index: 999;
    width: 95%;
}
    @media (min-width: 768px) {
      .form{
        left: 30%;
        width: 50%;
      }
    }

    
      `}</style>
      {/* From Uiverse.io by JohnnyCSilva */} 
      <form className="form">
        <button className="close-button" onClick={onClose}>&times;</button>
        {!pinSent ? (
          <>
            <div className="flex-column">
              <label>Contact</label>
            </div>
            <div className="inputForm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92V23a1 1 0 0 1-1.1 1 19.86 19.86 0 0 1-8.9-3.1 19.86 19.86 0 0 1-8.9-8.9A19.86 19.86 0 0 1 0 3.1 1 1 0 0 1 1 2h6.08a1 1 0 0 1 1 .78 12.05 12.05 0 0 0 .57 2.22 1 1 0 0 1-.24 1.06L5.91 8.91a16 16 0 0 0 7.09 7.09l2.85-2.85a1 1 0 0 1 1.06-.24 12.05 12.05 0 0 0 2.22.57 1 1 0 0 1 .78 1V16.92z"></path>
              </svg>
              <input 
                placeholder="Enter your Contact" 
                className="input" 
                type="text" 
                name="contact" 
                value={formData.contact}
                onChange={handleChange}
              />
            </div>
          
            <div className="flex-column">
              <label>Password </label>
            </div>
            <div className="inputForm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="-64 0 512 512" height="20">
                <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"></path>
                <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0"></path>
              </svg>        
              <input 
                placeholder="Enter your Password" 
                className="input" 
                type="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {isSignUp && (
              <>
                <div className="flex-column">
                  <label>Confirm Password</label>
                </div>
                <div className="inputForm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="-64 0 512 512" height="20">
                    <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"></path>
                    <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0"></path>
                  </svg>        
                  <input 
                    placeholder="Confirm your Password" 
                    className="input" 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          
            <button 
              type="button" 
              className="button-submit" 
              onClick={isSignUp ? handleSignUp : handleSignIn}
              style={{alignItems: "center",
                display: "flex",
                justifyContent: "center",}}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
            <p className="p">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <span className="span" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </span>
            </p>
            <p className="p line">Or With</p>
          
            <div className="flex-row">
              <button 
                type="button" 
                className="btn google"
                onClick={handleGoogleSignIn}
                style={{color: "black"}}
              >
                <svg viewBox="0 0 512 512" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256
                    c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456
                    C103.821,274.792,107.225,292.797,113.47,309.408z" style={{ fill: "#FBBB00" }}></path>
                  <path d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451
                    c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535
                    c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" style={{ fill: "#518EF8" }}></path>
                  <path d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512
                    c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771
                    c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" style={{ fill: "#28B446" }}></path>
                  <path d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012
                    c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0
                    C318.115,0,375.068,22.126,419.404,58.936z" style={{ fill: "#F14336" }}></path>
                </svg>
               Login with Google 
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-column">
              <label>Enter PIN :</label>
            </div>
            <div className="inputForm">
              <input 
                placeholder="Enter your PIN Sent to your WhatsApp" 
                className="input" 
                type="text" 
                name="pin" 
                value={formData.pin}
                onChange={handleChange}
              />
            </div>
            <button 
              type="button" 
              className="button-submit"
              onClick={verifyPin}
              style={{alignItems: "center",
                display: "flex",
                justifyContent: "center",}}
            >
              Verify PIN
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Login;
