"use client"
import React, { useEffect } from 'react';
import "../css/purchase.css";
import Cartitem from '../components/cart.js';
import { db } from '../firebase'; 
import { doc, getDoc, setDoc, deleteDoc, collection,updateDoc, deleteField,getDocs,serverTimestamp,query,where } from 'firebase/firestore';
import saveContact from '../utilis/saveContact'
import showMessageBox from '../utilis/showMessageBox'


      
function saveCustomerIdToLocalStorage() {
    let customerId;
    if(typeof window !== "undefined"){
    if (!localStorage.getItem("idstatus")) {
       customerId = Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("customerNumber", customerId);
      localStorage.setItem("idstatus", "set");
    }
    if (!localStorage.getItem("count")) {
      localStorage.setItem("count", 1);
    }
  }}
      saveCustomerIdToLocalStorage();
  



    
export default function PurchaseComponent() {

    

    async function validatePromo(event) {
        event.preventDefault(); // Prevent the page from reloading
    
        const promoInput = document.querySelector(".input_field").value.trim();
        if (!promoInput) {
            showMessageBox("Invalid Promo", "Please enter a promo code.", false);
            return;
        }
    
        try {
            // Reference the specific document `codes` inside the `promos` collection
            const promoDocRef = doc(db, "promos", "codes");
    
            // Fetch the document
            const promoDoc = await getDoc(promoDocRef);
    
            if (promoDoc.exists()) {
                const promoData = promoDoc.data();
    
                // Check if the promo code exists as a field in the document
                if (promoData[promoInput] !== undefined) {
                    let discount = promoData[promoInput]; // Get the discount percentage
    
                    // Log discount for debugging
                    console.log("Fetched Discount Value:", discount);
    
                    // Handle discount being a string with a % symbol
                    if (typeof discount === "string" && discount.includes("%")) {
                        discount = discount.replace("%", ""); // Remove % symbol
                    }
    
                    discount = parseFloat(discount); // Parse as a number
    
                    // Log parsed discount for debugging
                    console.log("Parsed Discount Value:", discount);
    
                    // Ensure discount is a valid number
                    if (!isNaN(discount)) {
                        const priceElements = document.querySelectorAll(".priceElement");
    
                        priceElements.forEach(priceElement => {
                            let originalPriceText = priceElement.textContent.replace("PKR", "").trim();
    
                            // Remove unexpected characters and parse as a number
                            originalPriceText = originalPriceText.replace(/[^0-9.]/g, "");
                            const originalPrice = parseFloat(originalPriceText);
    
                            // Log parsed original price
                            console.log("Parsed Original Price:", originalPrice);
    
                            const discountedPrice = originalPrice - (originalPrice * discount) / 100;
    
                            // Update the price element's text content
                            priceElement.textContent = `PKR ${discountedPrice.toFixed(2)}`;
    
                            // Log discounted price
                            console.log("Discounted Price:", discountedPrice);
                        });
    

  const updates = {};
                        updates[promoInput] = deleteField();
                        await updateDoc(promoDocRef, updates);
    

                        // Show success message
                        showMessageBox("Promo Applied", `You have received a ${discount}% discount! `, true);
                    } else {
                        console.error("Invalid discount value:", discount);
                        showMessageBox("Error", "Invalid discount value received.", false);
                    }
                } else {
                    // Promo code not found
                    showMessageBox("Invalid Promo", "Please use a correct promo code.", false);
                }
            } else {
                console.error("Promo codes document does not exist.");
                showMessageBox("Error", "Promo codes are not available.", false);
            }
        } catch (error) {
            console.error("Error validating promo:", error);
            showMessageBox("Error", "An error occurred while applying the promo code.", false);
        }
    }
    

    
  
   
    

    useEffect(() => {
        document.addEventListener('DOMContentLoaded', function () {
            if(typeof window !== "undefined"){
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
        }
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
          let counts;
          let customerId;
          let productsData;
          let currentLoc;
          if(typeof window !== "undefined"){
           counts = localStorage.getItem("count");
           customerId = localStorage.getItem("customerNumber");
           productsData = localStorage.getItem("cartItems");
           currentLoc = localStorage.getItem("currentLoc");
          }
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
          if(typeof window !== "undefined"){
          localStorage.setItem("count", parseInt(counts) + 1);
          }
          
          showMessageBox("Thanks for order", "You will receive confirmation shortly", true);
          saveContact(userContact,userEmail,"purchase")
          window.location.href = `thanks?docId=${docRef.id}`;
          if(typeof window !== "undefined"){
          localStorage.removeItem("cartItems");
          }

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

let items;
    if(typeof window !== "undefined"){
     items = JSON.parse(localStorage.getItem("cartItems")) || [];
    }

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
                    if(typeof window !== "undefined"){
                    localStorage.setItem("currentLoc", mapsLink);
                    }
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
                                    <button onClick={()=>{validatePromo(event)}}>Apply</button>
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
                <span className='priceElement'> {subtotal.toFixed(2)}</span>
                <span>Shipping:</span>
                <span> {shipping.toFixed(2)}</span>
                <span>Tax:</span>
                <span> {tax.toFixed(2)}</span>
                <span>Total:</span>
                <span className='priceElement'> {total.toFixed(2)}</span>
            </div>
        </div>
                        </div>
                    </div>
                </div>

                <div className="card checkout">
                    <div className="footer">
                        <label className="price priceElement">PKR {total.toFixed(2)}</label>
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
