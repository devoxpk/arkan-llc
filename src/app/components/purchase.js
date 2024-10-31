"use client"
import React, { useEffect } from 'react';
import "../css/purchase.css";
import Cartitem from '../components/cart.js';
import { db } from '../firebase'; 
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs,serverTimestamp } from 'firebase/firestore';




      
function saveCustomerIdToLocalStorage() {
    if (!localStorage.getItem("idstatus")) {
      const customerId = Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("customerNumber", customerId);
      localStorage.setItem("idstatus", "set");
    }
    if (!localStorage.getItem("count")) {
      localStorage.setItem("count", 1);
    }
  }
      saveCustomerIdToLocalStorage();
  


function showMessageBox(message, subMessage, isSuccess) {
    // Create the message box element
    const messageBox = document.createElement('div');
    messageBox.classList.add('cardBox');
messageBox.id = 'success';
    // Set the icon color and background color based on success or failure
    const iconColor = isSuccess ? '#269b24' : '#e74c3c'; // Green for success, Red for failure
    const backgroundColor = isSuccess ? '#04e40048' : '#e74c3c'; // Light green or red for background

    messageBox.innerHTML = `
        <svg class="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
                fill-opacity="1"
                style="fill: ${backgroundColor};"
            ></path>
        </svg>

        <div class="icon-container" style="background-color: ${backgroundColor};">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                stroke-width="0"
                fill="currentColor"
                stroke="currentColor"
                class="icon"
                style="color: ${iconColor};"
            >
                <path
                    d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
                ></path>
            </svg>
        </div>
        <div class="message-text-container">
            <p class="message-text">${message}</p>
            <p class="sub-text">${subMessage}</p>
        </div>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 15 15"
            stroke-width="0"
            fill="none"
            stroke="currentColor"
            class="cross-icon"
        >
            <path
                fill="currentColor"
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                clip-rule="evenodd"
                fill-rule="evenodd"
            ></path>
        </svg>
    `;

    // Append the message box to the body
    document.body.appendChild(messageBox);

    // Apply dynamic CSS styles
    const style = document.createElement('style');
    style.innerHTML = `
        .cardBox {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 330px;
            height: 80px;
            border-radius: 8px;
            box-sizing: border-box;
            padding: 10px 15px;
            background-color: #ffffff;
            box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: space-around;
            gap: 15px;
        }
        .wave {
            position: absolute;
            transform: rotate(90deg);
            left: -31px;
            top: 32px;
            width: 80px;
            fill: ${backgroundColor};
        }
        .icon-container {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .message-text-container {
            margin-left: 15px;
        }
        .message-text {
            font-size: 14px;
            color: #333;
        }
        .sub-text {
            font-size: 12px;
            color: #666;
        }
        .cross-icon {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 15px;
            height: 15px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
    document.querySelector(".cross-icon").addEventListener ("click",(e)=>{
console.log("ok")
document.getElementById("success").remove();

});

    // Remove the message box after a delay and redirect if successful
    setTimeout(() => {
        messageBox.remove();
    }, 5000); 
}
    
export default function PurchaseComponent() {

    

    useEffect(() => {
      saveCustomerIdToLocalStorage();
  
      const submitButton = document.getElementById("submitButton");
      const handleOrderPlacement = async (e) => {
        e.preventDefault();
        submitButton.innerText = "Please Wait...";
  
        const customerName = document.getElementById("customerName").value.trim();
        const userCity = document.getElementById("userCity").value.trim();
        const userAddress = document.getElementById("userAddress").value.trim();
        const userContact = document.getElementById("userContact").value.trim();
        const userEmail = document.getElementById("userEmail").value.trim();
  
        if (!customerName || !userCity || !userAddress || !userContact) {
          showMessageBox("Fill Fields", "Fill all the Required Data", false);
          submitButton.innerText = "Submit";
          return;
        }
  
        try {
          const day = new Date().toDateString();
          const time = new Date().toLocaleTimeString();
          const details = document.getElementById("additionalDetails").value;
          const counts = localStorage.getItem("count");
          const customerId = localStorage.getItem("customerNumber");
          const productsData = localStorage.getItem("cartItems");
          const currentLoc = localStorage.getItem("currentLoc");
          const docRef = doc(db, "orders", `${customerId}(${customerName})-${counts}`);
  const paymentMode=  document.getElementById("paymentMode").innerText;
          const docData = {
            productsData,
            productPrice:subtotal,
            Address: userAddress,
            Contact: userContact,
            Name: customerName,
            City: userCity,
            paymentMode,
            Email: userEmail,
            Date: `${day} ${time}`,
            Details: details,
            customerID: customerId,
            currentLoc,
          };
  
          await setDoc(docRef, docData);
          localStorage.setItem("count", parseInt(counts) + 1);
          
          showMessageBox("Thanks for order", "You will receive confirmation shortly", true);
          
          window.location.href = `thanks?docId=${docRef.id}`;

        } catch (error) {
          console.error("Error adding document: ", error);
          showMessageBox("An error occurred", "Please contact support", false);
        } finally {
          submitButton.innerText = "Submit";
        }
      };
  
      submitButton.addEventListener("click", handleOrderPlacement);
  
      return () => submitButton.removeEventListener("click", handleOrderPlacement);
    }, []);


    
    const items = JSON.parse(localStorage.getItem("cartItems")) || [];

    // Calculate subtotal
    const subtotal = items.reduce((total, item) => {
        return total + parseFloat(item.price) * item.quantity;
    }, 0);

    // Define shipping and tax amounts
    const shipping = 0;
    const tax = 0;

    // Calculate the total
    const total = subtotal + shipping + tax;
    useEffect(() => {
        getUserCity();
    }, []); // Run once when the component mounts

    async function getUserCity() {
        try {
            const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=e77dc31f51f1414aae1c58cf1a96d587');
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const locationData = await response.json();

            const city = locationData.city;
            document.getElementById("shippingAddress").innerText = city;
            document.getElementById("userCity").value = city;
            console.log(city);

            // Ask for precise location and generate map URL
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;

                    var mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                    localStorage.setItem("currentLoc", mapsLink);
                }, function(error) {
                    console.error("Geolocation error: " + error.message);
                });
            }
        } catch (error) {
            console.error("Error fetching data from IP Geolocation API: " + error);
        }
    }

    return (
        <>
            <div id="fabricDiv">
                <h2 id="fabricHead">N O U V E</h2>
                <img id="fabric" style={{ width: "100%" }} src="/poster/fabric.jpg" />
            </div>
<div id="purchaseCartMedia">
            <div className="containerx">
                <div className="card cart">
                    <label className="title">CHECKOUT</label>
                    <div className="steps">
                        <div className="step">
                            <div>
                                <span>SHIPPING</span>
                                <p id='shippingAddress'></p>
                            </div>
                            <hr />

                            <div>
                                <span>PAYMENT METHOD</span>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <p id='paymentMode' style={{ fontWeight: 'bold'}}>Cash on Delivery </p>
                                </div>
                            </div>

                            <hr />

                            <div className="promo">
                                <span>HAVE A PROMO CODE?</span>
                                <form className="form">
                                    <input
                                        className="input_field"
                                        placeholder="Enter a Promo Code"
                                        type="text"
                                    />
                                    <button>Apply</button>
                                </form>
                            </div>
                            <hr />

                            <div className="contact-info">
                                <span>Shipping Details</span>
                                <form className="contact-form" style={{ display: "grid", rowGap: "5%" }}>
                                    <input
                                    id='customerName'
                                        className="input_field"
                                        placeholder="Name"
                                        type="text"
                                        required
                                    />
                                    <input id='userCity'
                                        className="input_field"
                                        placeholder="City"
                                        type="text"
                                        required
                                    />
                                    <input
                                    id='userAddress'
                                        className="input_field"
                                        placeholder="House No, Society / Town, Road / Area"
                                        type="text"
                                        required
                                    />
                                    <input
                                    id='userContact'
                                        className="input_field"
                                        placeholder="Contact"
                                        type="text"
                                        required
                                    />
                                    <input
                                    id='userEmail'
                                        className="input_field"
                                        placeholder="Email (Optional)"
                                        type="email"
                                    />
                                    <input
                                    id='additionalDetails'
                                        className="input_field"
                                        placeholder="Any Additional Details / Info (Optional)"
                                        type="text"
                                    />
                                </form>
                            </div>
                            <hr />

                            <div className="payments" style={{ marginTop: "18%" }}>
            <span>PAYMENT</span>
            <div className="details">
                <span>Subtotal:</span>
                <span> {subtotal.toFixed(2)}</span>
                <span>Shipping:</span>
                <span> {shipping.toFixed(2)}</span>
                <span>Tax:</span>
                <span> {tax.toFixed(2)}</span>
                <span>Total:</span>
                <span> {total.toFixed(2)}</span>
            </div>
        </div>
                        </div>
                    </div>
                </div>

                <div className="card checkout">
                    <div className="footer">
                        <label className="price">PKR {total.toFixed(2)}</label>
                        <button className="checkout-btn" id='submitButton'>Checkout</button>
                    </div>
                </div>
            </div>

            <Cartitem cartStyle={true} /></div>
            <footer style={{ display: 'flex', justifyContent: 'center', color: 'white' }}>
                &copy; All Rights Reserved by&nbsp;<h3 style={{ fontWeight: 'bolder', display: 'inline' }}>Nouve</h3>
            </footer>
        </>
    );
}
