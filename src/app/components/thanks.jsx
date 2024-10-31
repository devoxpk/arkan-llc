"use client";
import "../css/thanks.css";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase"; 

const db = getFirestore(app);

export default function ThanksComponent() {
    const [orderDetails, setOrderDetails] = useState({
        orderId: "",
        date: "",
        contact: "",
        paymentMethod: "",
        amount: "",
        shippingAddress: "",
        billingAddress: "",
        products: [],
        currentLoc: ""
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (typeof window !== "undefined") {
                const queryParams = new URLSearchParams(window.location.search);
                const docId = queryParams.get("docId");

                if (docId) {
                    const orderDocRef = doc(db, "orders", docId);
                    const orderSnap = await getDoc(orderDocRef);

                    if (orderSnap.exists()) {
                        const data = orderSnap.data();
                        setOrderDetails({
                            orderId: docId,
                            date: data.Date || "N/A",
                            contact: data.Contact || "N/A",
                            paymentMethod: data.paymentMode || "Cash on Delivery",
                            amount: data.productPrice || "N/A",
                            shippingAddress: `${data.Address}, ${data.City}`,
                            billingAddress: `${data.Address}, ${data.City}`,
                            city: `${data.City}`,
                            name: `${data.Name.charAt(0).toUpperCase()}${data.Name.slice(1)}`, // Capitalize first letter of name
                            products: JSON.parse(data.productsData || "[]"),
                            currentLoc: data.currentLoc || ""
                        });
                    } else {
                        console.error("No such document!");
                    }
                    setLoading(false);
                }
            }
        };

        fetchOrderDetails();
    }, []);

    if (loading) return <p style={{ width: "100vw", height: "100vh", marginTop: "50vh", marginLeft: "40vw" }}>Loading order details...</p>;

    const { orderId, date, contact, paymentMethod, amount, shippingAddress, billingAddress, city, name, products, currentLoc } = orderDetails;

    // Helper function to map size numbers to descriptions
    const getSizeDescription = (size) => {
        if (size === 36) return "Small";
        if (size === 40) return "Medium";
        if (size === 45) return "Large";
        return "N/A"; // Default case if size doesn't match any
    };

    return (
        <>
            <div className="thanks-component">
                <div className="header">
                    <FaCheckCircle className="success-icon" />
                    <h1>Order #{orderId}</h1>
                </div>
                <div id="thanksCard">
                    <div className="message-section">
                        <p>Thanks {name} for Trusting Nouve.</p>
                        <p>Your order was placed on {date}. Contact us if you have any questions.</p>
                    </div>

                    <div className="order-updates">
                        <h3>Order updates</h3>
                        <p>You may get shipping and delivery updates on WhatsApp.</p>
                    </div>

                    <div className="order-details">
                        <h3>Order details</h3>
                        <div className="details-row">
                            <div>
                                <p><strong>Contact information</strong></p>
                                <p>{contact}</p>
                            </div>
                            <div>
                                <p><strong>Payment method</strong></p>
                                <p>{paymentMethod} - {amount}</p>
                            </div>
                        </div>
                        <div className="details-row">
                            <div>
                                <p><strong>Shipping address</strong></p>
                                <p>{shippingAddress}</p>
                            </div>
                            <div>
                                <p><strong>Billing address</strong></p>
                                <p>{billingAddress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="products">
                        <h3>Products</h3>
                        {products.map((product, index) => (
                            <div key={index} className="product-item">
                                <img src={product.pic} alt={product.productName} />
                                <div className="product-details">
                                    <div className="product-info">
                                        <p><strong>{product.productName}</strong></p>
                                        <p>Size: {getSizeDescription(product.size)}</p> {/* Map size to description */}
                                        <p>Quantity: {product.quantity}</p>
                                    </div>
                                    <div className="product-price">
                                        <p>Price: {product.price}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map Section - Conditionally render if currentLoc exists */}
                {currentLoc && (
                    <div className="map-section">
                        <h3>Location</h3>
                        {(() => {
                            const getCoordinatesFromUrl = (url) => {
                                const regex = /query=(\d+\.\d+),(\d+\.\d+)/;
                                const match = url.match(regex);
                                if (match) {
                                    return { lat: match[1], lon: match[2] };
                                }
                                return null;
                            };

                            const coordinates = currentLoc ? getCoordinatesFromUrl(currentLoc) : null;
                            const lat = coordinates ? coordinates.lat : "0"; 
                            const lon = coordinates ? coordinates.lon : "0"; 

                            return (
                                <iframe
                                    width="100%"
                                    height="300"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=74.2004198,31.3554232,74.2214198,31.3564232&layer=mapnik&marker=${lat},${lon}`}
                                    style={{ border: "1px solid black" }}
                                    allowFullScreen
                                ></iframe>
                            );
                        })()}
                        <p>{shippingAddress}</p>
                    </div>
                )}

                <button className="update-button" onClick={() => window.location.href = "/"}>Continue Shopping</button>
            </div>

            <footer style={{ display: 'flex', justifyContent: 'center', color: 'white' }}>
                &copy; All Rights Reserved by&nbsp;
                <h3 style={{ fontWeight: 'bolder', display: 'inline' }}>Nouve</h3>
            </footer>
        </>
    );
}
