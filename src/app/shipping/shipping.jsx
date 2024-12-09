'use client'
import React, { useState } from 'react';
import Link from 'next/link';


export default function ShippingComponent() {
    const [open, setOpen] = useState(null);

    const toggleSection = (index) => {
        setOpen(open === index ? null : index);
    };

    return (
        <div className="shipping-container">
            <h1 className="shipping-title">Shipping & Delivery</h1>
            <hr className="main-hr" />

            <div className="shipping-section" onClick={() => toggleSection(1)}>
                <div className="shipping-heading">
                    Processing Time
                    <span className="shipping-icon">{open === 1 ? '-' : '+'}</span>
                </div>
                {open === 1 && <p className="shipping-content">Orders are processed within 1 business day.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(2)}>
                <div className="shipping-heading">
                    Shipping Methods
                    <span className="shipping-icon">{open === 2 ? '-' : '+'}</span>
                </div>
                {open === 2 && <p className="shipping-content">We offer Cash on Delivery. Shipping costs are calculated at checkout.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(3)}>
                <div className="shipping-heading">
                    Shipping Destinations
                    <span className="shipping-icon">{open === 3 ? '-' : '+'}</span>
                </div>
                {open === 3 && <p className="shipping-content">We ship nationwide across Pakistan. International orders may be subject to customs duties and taxes.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(4)}>
                <div className="shipping-heading">
                    Order Tracking
                    <span className="shipping-icon">{open === 4 ? '-' : '+'}</span>
                </div>
                {open === 4 && (
                    <p className="shipping-content">
                        You’ll receive a shipping confirmation with a tracking number. Track your shipment for real-time updates. 
                        Tracking updates are sent daily on WhatsApp, and you can also track your package by{' '}
                        <Link href="/tracking" legacyBehavior>
                            <a style={{ color: 'blue', textDecoration: 'underline' }}>clicking here</a>
                        </Link>.
                    </p>
                )}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(5)}>
                <div className="shipping-heading">
                    Delivery Time
                    <span className="shipping-icon">{open === 5 ? '-' : '+'}</span>
                </div>
                {open === 5 && (
                    <p className="shipping-content">
                        Delivery times vary by shipping method and destination. Estimated delivery time is provided at checkout.
                        <ul>
                            <li>For orders from Lahore: Delivery within 1-2 days.</li>
                            <li>For orders outside of Lahore: Delivery within 3 days.</li>
                        </ul>
                    </p>
                )}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(6)}>
                <div className="shipping-heading">
                    Shipping Delays
                    <span className="shipping-icon">{open === 6 ? '-' : '+'}</span>
                </div>
                {open === 6 && <p className="shipping-content">We strive for on-time delivery, but delays may occur due to external factors. Our riders coordinate frequently to ensure timely delivery.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(7)}>
                <div className="shipping-heading">
                    Lost or Stolen Packages
                    <span className="shipping-icon">{open === 7 ? '-' : '+'}</span>
                </div>
                {open === 7 && <p className="shipping-content">If your package is lost or stolen, contact us immediately for assistance.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(8)}>
                <div className="shipping-heading">
                    Address Accuracy
                    <span className="shipping-icon">{open === 8 ? '-' : '+'}</span>
                </div>
                {open === 8 && <p className="shipping-content">Please provide an accurate shipping address. We are not responsible for packages delivered to incorrect addresses.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(9)}>
                <div className="shipping-heading">
                    Shipping Costs
                    <span className="shipping-icon">{open === 9 ? '-' : '+'}</span>
                </div>
                {open === 9 && <p className="shipping-content">Shipping costs are non-refundable and will be deducted from any return refunds.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(10)}>
                <div className="shipping-heading">
                    Parcel Safety
                    <span className="shipping-icon">{open === 10 ? '-' : '+'}</span>
                </div>
                {open === 10 && <p className="shipping-content">Your parcel is securely packaged with protective material to prevent any damage during transit and is delivered in its original form.</p>}
            </div>

            <div className="shipping-section" onClick={() => toggleSection(11)}>
                <div className="shipping-heading">
                    Courier Partner
                    <span className="shipping-icon">{open === 11 ? '-' : '+'}</span>
                </div>
                {open === 11 && <p className="shipping-content">We use Leopards as our primary courier service, a leading company in the industry, to ensure reliable delivery.</p>}
            </div>
        </div>
    );
}
