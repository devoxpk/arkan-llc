"use client"
import React, { useEffect } from 'react';
import "../css/purchase.css";
import Cartitem from '../components/cart.js';
import { db } from '../firebase'; 
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs,serverTimestamp } from 'firebase/firestore';
import saveContact from '../utilis/saveContact'
import showMessageBox from '../utilis/showMessageBox'


      
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
  



    
export default function PurchaseComponent() {

    

    useEffect(() => {
        document.addEventListener('DOMContentLoaded', function () {
            // Get references to the input fields
            const nameInput = document.getElementById('customerName');
            const addressInput = document.getElementById('userAddress');
            const contactInput = document.getElementById('userContact');
            const emailInput = document.getElementById("userEmail");
        
            // Check localStorage for cached values
            if (localStorage.getItem('userName')) {
                nameInput.value = localStorage.getItem('userName');
            }
            if (localStorage.getItem('userAddress')) {
                addressInput.value = localStorage.getItem('userAddress');
            }
            if (localStorage.getItem('contact')) {
                contactInput.value = localStorage.getItem('userContact');
            }if (localStorage.getItem('userEmail')) {
                emailInput.value = localStorage.getItem('userEmail');
            }
        
           
            nameInput.addEventListener('input', () => {
                localStorage.setItem('userName', nameInput.value);
            });
        
            addressInput.addEventListener('input', () => {
                localStorage.setItem('userAddress', addressInput.value);
            });
        
            contactInput.addEventListener('input', () => {
                localStorage.setItem('userContact', contactInput.value);
            });
            emailInput.addEventListener('input', () => {
                localStorage.setItem('userEmail', emailInput.value);
            });
        });



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
          saveContact(userContact,userEmail,"purchase")
          window.location.href = `thanks?docId=${docRef.id}`;
          localStorage.removeItem("cartItems");

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
