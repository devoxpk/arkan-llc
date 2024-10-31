"use client"
import "../css/sizes.css"
import { useEffect,useState } from "react";
import {updateCartBadge} from "./cart"

export default function Sizes(){
    
    
    function generateRandom() {
        const min = 1000000000; // 10 digit minimum number
        const max = 9999999999; // 10 digit maximum number
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    const [quantity, setQuantity] = useState(1);
    var quantityVar;
    function updateTotalPrice() {
        
        var quantity = document.getElementById("quantity").value;
   
        // Check if the elements exist before trying to access them
        var productPriceElement = document.getElementById("productPrice");
      
    
        if (productPriceElement) {
        // Retrieve product price from localStorage or HTML if not present in localStorage
        let productPrice = localStorage.getItem("firstPrice");
        
        if (!productPrice) {
            // Product price is not in localStorage, fetch it from the HTML element
            var productPriceStr = document.getElementById("productPrice").innerText;
            
            // Extract integer value from productPriceStr
            productPrice = parseInt(productPriceStr.trim().replace("Rs. ", ""), 10);
            
            // Check if productPrice is a valid number
            if (!isNaN(productPrice)) {
                // Store the price in localStorage
                localStorage.setItem("firstPrice", productPrice);
            } else {
                console.error("Invalid product price format in HTML.");
                return; // Exit function if price is invalid
            }
        } else {
            // Convert stored price to integer
            productPrice = parseInt(productPrice, 10);
        }
    
        // Retrieve quantity from an element or variable (assuming `quantity` is defined)
        quantityVar = parseInt(document.getElementById("quantity").value, 10); // Example, adjust as needed
    
        // Check if quantity is a valid number
        if (isNaN(quantityVar)) {
            console.error("Invalid quantity value.");
            return; // Exit function if quantity is invalid
        }
    
        // Calculate total price
        var totalPrice = quantityVar * productPrice;
    
        // Update the price in the HTML
        productPriceElement.innerText = "Rs. " + totalPrice;
    
    } else {
        console.error("Product price element not found.");
    }
    }
    useEffect(() => {
        document.getElementById("quantity").addEventListener("input", updateTotalPrice);
    }, []); 


    let newSize;
    function changeSizeAndStyle(buttonId, size) {
        console.log(buttonId, size);
    
        // Change button styles - reset all buttons first
        document.querySelectorAll('.Sizes').forEach(button => {
            button.style.backgroundColor = '';
            button.style.color = '';
        });
    
        // Get the clicked button element
        const clickedButton = document.getElementById(buttonId);
        if (clickedButton) {
            // Change the clicked button's styles
            clickedButton.style.backgroundColor = 'black';  
            clickedButton.style.color = 'white';  
        } else {
            console.error("Button not found for ID: ", buttonId);
        }
    
        // Store the clicked button ID in localStorage
        localStorage.setItem('clickedSize', buttonId);
    
        // Call the function to change size (ensure this exists)
        changeSize(size);
    }
    
    
    // Function to run on page load and apply saved button styles
    window.onload = function() {
        localStorage.removeItem("purchase");
        const savedButtonId = localStorage.getItem('clickedSize');
        console.log(savedButtonId)
        if (savedButtonId) {
            const savedButton = document.getElementById(savedButtonId);
            if (savedButton) {
                console.log(savedButton)
                savedButton.style.cssText = '';
                savedButton.style.backgroundColor = 'black';
                savedButton.style.color = 'white';
            }
        }
    };

    function changeSize(size) {
        
        newSize = size;
        localStorage.setItem("userSize",size)
        
        if (size === 36) {
            newSize = "Small";
        } else if (size === 40) {
            newSize = "Medium";
        } else if (size === 45) {
            newSize = "Large";
        } else {
            newSize = size; // Fallback to the original size value if it's not 36, 40, or 45
        }
        console.log("Selected Size: " + newSize);
        
    }


    return(<>
<div
  className="custom-dropdown"
 
  ref={(dropdown) => {
    if (dropdown) {
      // Adding event listener to detect clicks outside the dropdown
      document.addEventListener('mousedown', (e) => {
        // Check if the clicked target is outside the dropdown
        if (!dropdown.contains(e.target)) {
          // Hide the dropdown by setting display to 'none'
          dropdown.style.display = 'none';
          
          // Clear 'preCartItems' from localStorage
          localStorage.removeItem('purchase');
          localStorage.removeItem('preCartItems');
        }
      });
    }
  }}
>
    <div style={{display:'flex'}}><h4>SELECT A SIZE</h4></div>
    <hr/>
                       
                       <div id="disappear" >
       <button className="Sizes" id="s1"  onClick={() => changeSizeAndStyle('s1', 36)}>Small</button>
       <button className="Sizes" id="s2"  onClick={() => changeSizeAndStyle('s2', 40)}>Medium</button>
       <button className="Sizes" id="s3" onClick={() => changeSizeAndStyle('s3', 45)}>Large</button>
       
   </div>
   <hr/>
                       

<h4>SELECT QUANTITY</h4>
<hr/>
<div className="number-control">
      <div
        className="number-left"
        onClick={() => {
            const quantityInput = document.getElementById("quantity");
            if(parseInt(quantityInput.value, 10)>1){
                quantityInput.value = parseInt(quantityInput.value, 10) - 1;
                }
            setQuantity(prev => Math.max(1, prev - 1));
            updateTotalPrice();
        }}
        
      >
        
      </div>
      <input
        id="quantity"
        type="number"
        name="number"
        className="number-quantity"
        value={quantity}
        min="1"
        onChange={(e) => setQuantity(Math.max(1, e.target.value))}
      />
      <div
        className="number-right"
        onClick={() => {
            
            const quantityInput = document.getElementById("quantity");
            
            quantityInput.value = parseInt(quantityInput.value, 10) + 1;
            
            ;

            setQuantity(prev => prev + 1);
            updateTotalPrice();
          }}
      >
      </div>  
      </div><hr/>
      
      <button class="cartBtn" onClick={async () => {
    const userSize = localStorage.getItem("userSize");
    if (userSize) {
        const userSizeInt = parseInt(userSize, 10);
        let preCartItems = JSON.parse(localStorage.getItem("preCartItems")) || [];
        const quantityVar = parseInt(document.getElementById("quantity").value, 10);
        const productToAdd = preCartItems.length > 0 ? preCartItems[preCartItems.length - 1] : null;

        console.log(preCartItems.length);

        if (productToAdd) {
            console.log(productToAdd);
            console.log(productToAdd.productName);

            // Check if the product with the same name and size is already in the cart
            const existingProductIndex = preCartItems.findIndex(item => 
                item.productName === productToAdd.productName && item.size === userSizeInt
            );

            // Check for products with the same name but without a size
            const sizeLessProductIndex = preCartItems.findIndex(item => 
                item.productName === productToAdd.productName && !item.size
            );

            if (existingProductIndex !== -1) {
                // If the product exists with the same name and size, just update the quantity
                const existingProduct = preCartItems[existingProductIndex];
                existingProduct.quantity += quantityVar;
            } else if (sizeLessProductIndex !== -1) {
                // If a product exists with the same name but no size, remove it
                preCartItems.splice(sizeLessProductIndex, 1);

                // Create a new entry for the new size
                const newItem = {
                    id: generateRandom(), // Generate a new id for the product
                    productName: productToAdd.productName,
                    price: productToAdd.price,
                    pic: productToAdd.pic,
                    quantity: quantityVar, // Set the quantity directly from user input
                    size: userSizeInt // Add the size directly to the product object
                };
                preCartItems.push(newItem);
            } else {
                // If the product does not exist, create a new product object
                const newItem = {
                    id: generateRandom(), // Generate a new id for the product
                    productName: productToAdd.productName,
                    price: productToAdd.price,
                    pic: productToAdd.pic,
                    quantity: quantityVar, // Set the quantity directly from user input
                    size: userSizeInt // Add the size directly to the product object
                };
                preCartItems.push(newItem);
            }

            // Await the localStorage operations (simulating async behavior)
            await new Promise((resolve) => {
                localStorage.removeItem('preCartItems');
                console.log(JSON.stringify(preCartItems));
                localStorage.setItem("preCartItems", JSON.stringify(preCartItems));
                localStorage.setItem("cartItems", JSON.stringify(preCartItems));
                resolve();
            });
               
                            
            updateCartBadge();
            setTimeout(() => {
                document.querySelector(".custom-dropdown").style.display = 'none';
            }, 1000);
            if(localStorage.getItem("purchase")){
               window.location.href = 'purchase'
                localStorage.removeItem("purchase")
            }
        } else {
            alert("No product found to add to the cart");
        }
    } else {
        alert("Please select a size");
    }
}} >






  <svg class="cart" fill="white" viewBox="0 0 576 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path></svg>
  ADD
  <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512" class="productx"><path d="M211.8 0c7.8 0 14.3 5.7 16.7 13.2C240.8 51.9 277.1 80 320 80s79.2-28.1 91.5-66.8C413.9 5.7 420.4 0 428.2 0h12.6c22.5 0 44.2 7.9 61.5 22.3L628.5 127.4c6.6 5.5 10.7 13.5 11.4 22.1s-2.1 17.1-7.8 23.6l-56 64c-11.4 13.1-31.2 14.6-44.6 3.5L480 197.7V448c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64V197.7l-51.5 42.9c-13.3 11.1-33.1 9.6-44.6-3.5l-56-64c-5.7-6.5-8.5-15-7.8-23.6s4.8-16.6 11.4-22.1L137.7 22.3C155 7.9 176.7 0 199.2 0h12.6z"></path></svg>
</button>
    </div>


</>
    );
}