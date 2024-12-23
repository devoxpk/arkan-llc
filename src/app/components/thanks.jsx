'use client'

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import "../css/thanks.css";
import Loader from "./loader";
import postOrder from "../utilis/postOrder"; // Ensure postOrder is imported
import updateOrderField, { updateProductField, deleteProduct } from "../utilis/updateOrder"; // Import update and delete functions
import deleteOrder from "../utilis/deleteOrder"; // Add deleteOrder import
import Link from 'next/link';

export default function ThanksPage({ orderDetails, error, docid }) {
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [showCard, setShowCard] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const action = searchParams.get('action');
    const [order, setOrder] = useState(orderDetails); // Initialize order state

    if (!orderDetails && error) return <p>{error}</p>;

    useEffect(() => {
        if (!orderDetails && error) {
            return;
        }

        const initializeMap = async () => {
            // Wait until Leaflet is loaded
            while (!window.L) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log("Initializing map...");
            if (orderDetails) {
                let latitude = null;
                let longitude = null;
                
                if (orderDetails.currentLoc) {
                    console.log("Using currentLoc:", orderDetails.currentLoc);
                    const coordinates = orderDetails.currentLoc.split('query=')[1]?.split(',') || [];
                    latitude = parseFloat(coordinates[0]);
                    longitude = parseFloat(coordinates[1]);
                    
                    if (isNaN(latitude) || isNaN(longitude)) {
                        console.warn("Invalid currentLoc coordinates:", coordinates);
                        latitude = null;
                        longitude = null;
                    }
                }
                
                if (!latitude || !longitude) {
                    console.log("Falling back to city coordinates for:", orderDetails.city);
                    // Define a mapping of cities to their coordinates
                    const cityCoordinates = {
                        "New York": { lat: 40.7128, lng: -74.0060 },
                        "Los Angeles": { lat: 34.0522, lng: -118.2437 },
                        "Chicago": { lat: 41.8781, lng: -87.6298 },
                        // Add more cities as needed
                    };
                    
                    const cityCoord = cityCoordinates[orderDetails.city];
                    if (cityCoord) {
                        latitude = cityCoord.lat;
                        longitude = cityCoord.lng;
                        console.log(`Using coordinates for city ${orderDetails.city}:`, cityCoord);
                    } else {
                        console.error(`No coordinates found for city: ${orderDetails.city}`);
                        return;
                    }
                }
                
                if (latitude && longitude && window.L) {
                    console.log("Initializing Leaflet map with coordinates:", latitude, longitude);
                    const map = window.L.map('map').setView([latitude, longitude], 13);
        
                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© NOUVE STREET MAP',
                    }).addTo(map);
        
                    window.L.marker([latitude, longitude]).addTo(map)
                        
                    console.log("Leaflet map initialized successfully.");
                } else {
                    console.error("Leaflet library is not loaded or coordinates are missing.");
                }
            }
        };

        initializeMap();

        if (action === 'confirm') {
            // Optionally, you can set a state or perform other actions here
            // Currently handled by showing the Confirm button
        }
    }, [orderDetails, action, error]);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            // Dispatch the order and get tracking information
            console.log("Confirming order with docid:", docid);
            const trackingData = await postOrder(docid);
            console.log("Tracking Data Received:", trackingData);
            const tracking = trackingData.trackingNumber;
            const trackingLink = `https://${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}/tracking`;

            // Update Firestore with tracking info if not handled in postOrder
            // Assuming postOrder handles moving the order to dispatched

            setTrackingInfo(tracking);
            setShowCard(true);
        } catch (err) {
            console.error("Error confirming order:", err);
            alert("Failed to confirm the order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteOrder = async () => {
        try {
            await deleteOrder(docid);
            alert("Order canceled successfully.");
            // Optionally, redirect or update UI accordingly
        } catch (error) {
            console.error("Error canceling order:", error);
            alert("Failed to cancel the order. Please try again.");
        }
    };

    const handleRemoveProduct = async (productId) => {
        const productIndex = order.products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            alert("Product not found.");
            return;
        }
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteProduct(docid, productIndex);
                setOrder(prevOrder => {
                    const updatedProducts = prevOrder.products.filter(p => p.id !== productId);
                    // Recalculate amount after deletion
                    const total = updatedProducts.reduce((sum, p) => sum + (p.quantity * parseFloat(p.price)), 0);
                    const newAmount = (total / 2).toFixed(2);
                    return { 
            ...prevOrder,
                        products: updatedProducts,
                        amount: newAmount
                    };
                });
                // Update amount in Firestore
                const total = order.products
                    .filter(p => p.id !== productId)
                    .reduce((sum, p) => sum + (p.quantity * parseFloat(p.price)), 0);
                const newAmount = (total / 2).toFixed(2);
                await updateOrderField(docid, 'amount', newAmount);

                alert("Product deleted successfully and Amount updated.");
            } catch (error) {
                alert("Failed to delete the product. Please try again.");
            }
        }
    };

    const handleEditQuantity = async (productId, currentQuantity, unitPrice) => {
        const newQuantity = prompt("Enter new quantity:", currentQuantity);
        if (newQuantity !== null) {
            const parsedQuantity = parseInt(newQuantity);
            if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
                try {
                    // Update product quantity in Firestore
                    await updateProductField(docid, order.products.findIndex(p => p.id === productId), 'quantity', parsedQuantity);

                    // Update local state
                    setOrder(prevOrder => {
                        const updatedProducts = prevOrder.products.map(p => 
                            p.id === productId ? { ...p, quantity: parsedQuantity, price: (parsedQuantity * parseFloat(p.price)).toString() } : p
                        );
                        
                        // Calculate new amount
                        const total = updatedProducts.reduce((sum, p) => sum + (p.quantity * parseFloat(p.price)), 0);
                        const newAmount = (total / 2).toFixed(2);
                        
                        return { 
                    ...prevOrder,
                            products: updatedProducts,
                            amount: newAmount
                        };
                    });

                    // Update amount in Firestore
                    await updateOrderField(docid, 'amount', (order.amount / 2 + parsedQuantity * unitPrice / 2).toFixed(2));

                    alert("Quantity and Amount updated successfully.");
                } catch (error) {
                    alert("Failed to update quantity and amount. Please try again.");
                }
            } else {
                alert("Invalid quantity entered.");
            }
        }
    };

    const handleEditProductField = async (productId, field, currentValue) => {
        const productIndex = order.products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            alert("Product not found.");
            return;
        }

        const sizeOptions = ["Small", "Medium", "Large", "Extra Large"];
        const sizeMapping = {
            "Small": 36,
            "Medium": 40,
            "Large": 45,
            "Extra Large": 48
        };

        const newSizeLabel = prompt(`Enter new size (${sizeOptions.join(", ")}):`, getSizeLabel(currentValue));
        if (newSizeLabel !== null && sizeOptions.includes(newSizeLabel)) {
            const newSizeValue = sizeMapping[newSizeLabel];
            try {
                // Update size in Firestore
                await updateProductField(docid, productIndex, 'size', newSizeValue);

                // Update local state
                setOrder(prevOrder => {
                    const updatedProducts = [...prevOrder.products];
                    updatedProducts[productIndex].size = newSizeValue;
                    return { ...prevOrder, products: updatedProducts };
                });

                alert("Size updated successfully.");
            } catch (error) {
                alert("Failed to update size. Please try again.");
            }
        } else if (newSizeLabel !== null) {
            alert("Invalid size selected. Please choose from the provided options.");
        }
    };

    const handleEditField = async (field, currentValue) => {
        const newValue = prompt(`Enter new ${field}:`, currentValue);
        if (newValue !== null && newValue.trim() !== "") {
            try {
                // If the field is 'City', also update the city in 'Address'
                if (field === "City") {
                    // Split the address by comma and update the city part
                    const addressParts = order.billingAddress.split(',');
                    if (addressParts.length > 1) {
                        addressParts[1] = ` ${newValue}`;
                        const updatedAddress = addressParts.join(',');

                        // Update both 'City' and 'billingAddress'
                        await updateOrderField(docid, 'city', newValue);
                        await updateOrderField(docid, 'billingAddress', updatedAddress);

                        setOrder(prevOrder => ({
                            ...prevOrder,
                            city: newValue,
                            billingAddress: updatedAddress
                        }));
                        alert(`${field} and Address updated successfully.`);
                    } else {
                        // If address format is unexpected, only update 'City'
                        await updateOrderField(docid, 'city', newValue);
                        setOrder(prevOrder => ({
                            ...prevOrder,
                            city: newValue
                        }));
                        alert(`${field} updated successfully.`);
                    }
                } else {
                await updateOrderField(docid, field, newValue);
            setOrder(prevOrder => ({
                ...prevOrder,
                [field]: newValue
            }));
                alert(`${field} updated successfully.`);
                }
            } catch (error) {
                alert(`Failed to update ${field}. Please try again.`);
            }
        } else {
            alert(`Invalid ${field} entered.`);
        }
    };

    const dismissCard = () => {
        setShowCard(false);
    };

    return (<>
        <navbar style={{ justifyContent: "center", display: "flex", position: "relative", marginTop: "2%" }}>
            <span style={{marginTop:"6px"}}>Thanks {order.name} for Ordering</span>
            <span style={{ backgroundColor: "green", color: "white", borderRadius: "50%", padding: "5px", marginLeft: "10px" }}>
                ✓
            </span>
        </navbar>
        <div className="thanks-component" id="thanksCard">
            {/* First Row: Order Details and Billing Details */}
            <div className="details-row">
                <div className="order-details">
                    <h3>Order Details</h3>
                    <p><strong>Order ID:</strong> {order.customerID}</p>
                    <p><strong>Date:</strong> {order.date}</p>
                    <p>
                        <strong>Contact:</strong> {order.contact} 
                    {action === 'confirm' && (
                            <span 
                            onClick={() => handleEditField('Contact', order.contact)} 
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                title="Edit Contact"
                        >
                                ✎
                            </span>
                    )}
                    </p>
                </div>
                <div className="order-details">
                    <h3>Billing Details</h3>
                    <p>
                        <strong>City:</strong> {order.city} 
                    {action === 'confirm' && (
                            <span 
                            onClick={() => handleEditField('City', order.City)} 
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                title="Edit City"
                        >
                                ✎
                            </span>
                    )}
                    </p>
                    <p>
                        <strong>Address:</strong> {order.billingAddress} 
                    {action === 'confirm' && (
                            <span 
                            onClick={() => handleEditField('Address', order.billingAddress)} 
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                title="Edit Address"
                        >
                                ✎
                            </span>
                    )}
                    </p>
                    <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                    <p>
                        <strong>Amount:</strong> {order.amount}
                    </p>
                </div>
            </div>

            {/* Second Row: Tracking and Product Details */}
            <div className="details-row" id="productDetails">
                <div className="order-updates">
                    <h3>Tracking</h3>
                    <p>
                        {order.confirm.toLowerCase() === "ok"
                            ? "Confirmed"
                            : "Not Confirmed Yet"}
                    </p>
                </div>
                <div className="products">
                    <h3>Product Details</h3>
                    {order.products.length > 0 ? (
                        order.products.map((product) => (
                            <div key={product.id} className="product-item" style={{ position: "relative", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
                                {/* Simple Delete Icon at the Top */}
                                {action === 'confirm' && (
                                    <span 
                                        onClick={() => handleRemoveProduct(product.id)} 
                                        style={{ color: "red", position: "absolute", top: "10px", right: "43px", cursor: "pointer" }}
                                        title="Delete Product"
                                    >
                                        ×
                                    </span>
                                )}
                                <img src={product.pic} alt={product.productName} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                                <div className="product-info">
                                    <p><strong>{product.productName}</strong></p>
                                    <p>Price: {product.price}</p>
                                    <p>
                                        Quantity: {product.quantity}
                                        {action === 'confirm' && (
                                            <span 
                                                onClick={() => handleEditQuantity(product.id, product.quantity, parseFloat(product.price))}
                                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                                title="Edit Quantity"
                                            >
                                                ✎
                                            </span>
                                        )}
                                    </p>
                                    <p>
                                        Size: {getSizeLabel(product.size)} 
                                    {action === 'confirm' && (
                                            <span 
                                                onClick={() => handleEditProductField(product.id, 'size', product.size)} 
                                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                                title="Edit Size"
                                            >
                                                ✎
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No products available.</p>
                    )}
                </div>
            </div>

            {/* Third Row: Map */}
            <div className="map-container">
                <h3>Location</h3>
                { (order.currentLoc || order.city) ? (
                    <div id="map" style={{ height: '300px', width: '100%', borderRadius: '8px' }}></div>
                ) : (
                    <p>Location data is unavailable.</p>
                )}
            </div>
        </div>

        {action === 'confirm' && (
            <>
                <div 
                    className="unique-image" 
                    onClick={handleConfirm} 
                    style={{ position: "fixed", bottom: "20px", right: "20px",zIndex: "1000", cursor: "pointer" }}
                >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                               <path d="M20 7L9.00004 18L3.99994 13" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                </div>
                <button 
                    className="cancel-order-button" 
                    onClick={handleDeleteOrder}
                    style={{ backgroundColor: "red", color: "white", border: "none", padding: "10px 20px", cursor: "pointer" }}
                >
                    Cancel Order
                </button>
            </>
        )}

        {/* Confirmation Card */}
        {showCard && (
            <div className="unique-card">
                <button className="unique-dismiss" type="button" onClick={dismissCard}>×</button>
                <div className="unique-header"> 
                    <div className="unique-div_image_v">
                        <div className="unique-image">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L9.00004 18L3.99994 13" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        </div> 
                    </div> 
                    <div className="unique-content">
                        <span className="unique-title">Order Validated</span> 
                        <p className="unique-message">
                            Thank you for your purchase. Your package will be delivered within 3 days of your purchase.
                            <br />
                            <strong>Tracking Number:</strong> {trackingInfo}
                            <br />
                            <Link style={{color:"blue"}} href={`https://${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}/tracking`} target="_blank" rel="noopener noreferrer">Click Here to Track Your Order</Link>
                        </p> 
                    </div> 
                </div> 
            </div>
        )}
        </>
    );
}

// Add size label mapping function
const getSizeLabel = (size) => {
    switch(size) {
        case 36:
            return 'Small';
        case 40:
            return 'Medium';
        case 45:
            return 'Large';
        case 48:
            return 'XL';
        default:
            return size;
    }
};
