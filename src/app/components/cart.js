"use client";
import React, { useState, useEffect, useRef } from 'react';
import '../css/cart.css'; // Import your CSS file
import { FaTrash, FaWeight } from 'react-icons/fa'; // Importing a delete icon from react-icons

let handleCart;
let updateCartBadge;
let totalAmount;
const Cart = ({cartStyle = false}) => {
    const [cartItems, setCartItems] = useState(() => {
        const storedCartItems = localStorage.getItem('cartItems');
        return storedCartItems ? JSON.parse(storedCartItems) : [];
    });

    const cartRef = useRef(null); // Create a reference for the cart container

    // Load cart items from localStorage when the cart is opened
    const handleCartOpen = () => {
        // Always fetch the most recent cart items from localStorage
        const storedCartItems = localStorage.getItem('cartItems');
        if (storedCartItems) {
            console.log("Fetching the latest cart items on open");
            setCartItems(JSON.parse(storedCartItems)); // Update state with fresh cart items
        } else {
            console.log("No stored cart items found, initializing empty cart");
            localStorage.setItem("preCartItems", JSON.stringify([])); // Initialize if not present
            setCartItems([]); // Ensure the state is empty if no items are found
        }
        document.querySelector(".cart-card").style.display = "block"; // Open the cart UI
    };
    

    // Attach event listener to the cart icon when component mounts
   useEffect(() => {
    const cartIcon = document.querySelector('#cart-icon');
    
    // Only add the event listener if the element exists
    if (cartIcon) {
        cartIcon.addEventListener('click', handleCartOpen);
    }

    // Clean up the event listener on unmount
    return () => {
        if (cartIcon) {
            cartIcon.removeEventListener('click', handleCartOpen);
        }
    };
}, []);


    // Save cart items to localStorage whenever cartItems changes and update badge
    useEffect(() => {
        
        localStorage.setItem('preCartItems', JSON.stringify(cartItems));
    }, [cartItems]);
    

    updateCartBadge = () => {
        console.log("Updating Cart Badge number");

        // Retrieve cart items from localStorage
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

        // Calculate total quantity
        const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
console.log(`Total Quantity: ${totalQuantity}`);

        // Update the badge inner text
        document.querySelector('.header-action-btn .btn-badge.green').innerText = totalQuantity;
    };

    // Close cart if clicked outside
    if(!cartStyle){
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cartRef.current && !cartRef.current.contains(event.target)) {
                document.querySelector(".cart-card").style.display = "none"; // Close the cart
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);}

    handleCart = (event, product) => {
        event.preventDefault();
        console.log("Current Cart Items:", cartItems);
    
        const uniqueId = Date.now() + Math.random(); // Simple unique ID generation
    
        const existingProductIndex = cartItems.findIndex(item => item.productName === product.productName);
    
        if (existingProductIndex !== -1) {
            // If product already exists, update its quantity
            const updatedCartItems = cartItems.map((item, index) =>
                index === existingProductIndex
                    ? { ...item,}
                    : item
            );
            console.log("Updated existing product quantity:", updatedCartItems[existingProductIndex]);
            setCartItems(JSON.stringify([]));
            setCartItems(updatedCartItems);
            
        } else {
            // If product does not exist, create a new product object and add it to the cart
            const newProduct = {
                ...product,
                id: uniqueId,
                
            };
            console.log("Adding new product to cart:", newProduct);
            setCartItems([...cartItems, newProduct]); // Update state with the new product
        }
    document.querySelector(".custom-dropdown").style.display='block';
        updateCartBadge(); 
    };
    
    const increaseQuantity = (id) => {
        const updatedCartItems = cartItems.map(item =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
        
        setCartItems(updatedCartItems); // Update state with new quantities
        localStorage.setItem('cartItems', JSON.stringify(updatedCartItems)); // Update localStorage with new quantities
    };
    
    const decreaseQuantity = (id) => {
        const updatedCartItems = cartItems.map(item =>
            item.id === id && item.quantity > 1
                ? { ...item, quantity: item.quantity - 1 }
                : item
        );
        
        setCartItems(updatedCartItems); // Update state with new quantities
        localStorage.setItem('cartItems', JSON.stringify(updatedCartItems)); // Update localStorage with new quantities
    };
    
    const deleteItem = (id) => {
        const updatedCartItems = cartItems.filter(item => item.id !== id);
        
        setCartItems(updatedCartItems); // Update state with the remaining items
        localStorage.setItem('cartItems', JSON.stringify(updatedCartItems)); // Update localStorage with remaining items
    
        // Adjust the badge count
        const deletedItem = cartItems.find(item => item.id === id);
        const currentBadgeCount = parseInt(document.querySelector('.header-action-btn .btn-badge.green').innerText) || 0;
        const newBadgeCount = currentBadgeCount - deletedItem.quantity;
        document.querySelector('.header-action-btn .btn-badge.green').innerText = newBadgeCount;
    };
    
    

     totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const shippingAmount = 0;
    if(!cartStyle){
    useEffect(()=>{updateCartBadge();});
}
    return (
<div
    ref={cartRef}
    className={`cart-card ${cartStyle ? 'purchase-cart' : ''}`}
    style={{
        display: cartStyle ? "block" : "none",
       
    }}
>

            <div className="row-both" >
                <div className="col-md-8 cart-cart">
                    <div className="cart-title">
                        <div className="row">
                            <div className="col"><h4><b>{cartStyle ? 'Summary' : 'Shopping Cart'}</b></h4></div>
                            <div style={{ fontWeight: "500", color: "black" }} className="col align-self-center text-right text-muted">
                                {cartItems.reduce((total, item) => total + item.quantity, 0)} items
                            </div>
                        </div>
                    </div>
    
                    {cartItems.length === 0 ? (
                        <p>Your cart is empty.</p>
                    ) : (
                        <div className="row border-top border-bottom cart-items-scroll">
                            {cartItems.map(item => (
                                <div key={item.id}>
                                    <hr />
                                    <div className="row cart-main align-items-center">
                                        <div className="col-2">
                                            <img className="img-fluid" src={item.pic} alt={item.productName} />
                                        </div>
                                        <div className="col">
                                            <div style={{ fontWeight: "500", color: "black" }} className="row text-muted">
                                                {item.productName}
                                            </div>
                                            {/* Add a span for the size below the product name */}
                                            {item.size && (
    <span className="text-muted" style={{ fontSize: "0.9em",fontWeight:"bolder" }} value={item.size}>
    {item.size === 36 ? 'Small' : item.size === 40 ? 'Medium' : item.size === 45 ? 'Large' : 'Unknown'}
    </span>
)}

                                        </div>
                                        <div className="col-quantity">
                                            <button onClick={() => decreaseQuantity(item.id)} className="cart-a">-</button>
                                            <span className="border">{item.quantity}</span>
                                            <button onClick={() => increaseQuantity(item.id)} className="cart-a">+</button>
                                        </div>
                                        <div className="col-price">
                                            <button onClick={() => deleteItem(item.id)} className="cart-close">X</button> {item.price * item.quantity}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <hr />
                    {!cartStyle && (
    <div className="cart-back-to-shop">
        <span
            style={{ cursor: "pointer" }}
            className="text-muted"
            onClick={() => {
                document.querySelector(".cart-card").style.display = "none";
            }}
        >
            Back to shop
        </span>
    </div>
)}

                </div>
    
               {!cartStyle && <div className="col-md-4 cart-summary">
                    <div id='summaryContents'>
                        <div><h5 style={{ fontWeight: "bolder" }} className="cart-h5"><b>Summary</b></h5></div>
                        <hr className="cart-hr" />
                        <div className="row">
                            <div style={{ fontWeight: "bolder" }} className="col">ITEMS {cartItems.reduce((total, item) => total + item.quantity, 0)}</div>
                            <div style={{ fontWeight: "bolder" }} className="col text-right">Rs. {totalAmount}</div>
                        </div>
                        <form className="cart-form">
                            <p>SHIPPING</p>
                            <select className="cart-select">
                                <option className="text-muted">Free-Delivery - Rs. 0.00</option>
                            </select>
                            <div id='cart-promo' style={{ display: "none" }}>
                                <p>GIVE CODE</p>
                                <input id="cart-code" className="cart-input" placeholder="Enter your code" />
                            </div>
                        </form>
                        <div className="row" style={{ borderTop: "1px solid rgba(0,0,0,.1)", padding: " 2vh 0" }}>
                            <div style={{ fontWeight: "bolder" }} className="col">TOTAL PRICE</div>
                            <div style={{ fontWeight: "bolder" }} className="col text-right">Rs. {totalAmount + shippingAmount}</div>
                        </div>
                        <button className="cart-btn">CHECKOUT</button>
                    </div>
                </div>
                }
            </div>
        </div>
    );
};

export { handleCart, updateCartBadge };
export default Cart;
