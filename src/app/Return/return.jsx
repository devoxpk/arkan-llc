'use client'
import React, { useState } from 'react';

export default function ReturnComponent() {
    const [open, setOpen] = useState(null);

    const toggleSection = (index) => {
        setOpen(open === index ? null : index);
    };

    return (
        <div className="return-container">
            <h1 className="return-title">Return & Exchange Policy</h1>

            <div className="return-section" onClick={() => toggleSection(1)}>
                <div className="return-heading">
                    Exchange Period
                    <span className="return-icon">{open === 1 ? '-' : '+'}</span>
                </div>
                {open === 1 && (
                    <div className="return-content">
                        Customers have a 7-day window from the day of delivery to easily exchange their products. Customers can apply for exchange within 1 day after receiving the product.
                    </div>
                )}
            </div>

            <div className="return-section" onClick={() => toggleSection(2)}>
                <div className="return-heading">
                    Eligibility for Exchanges
                    <span className="return-icon">{open === 2 ? '-' : '+'}</span>
                </div>
                {open === 2 && (
                    <div className="return-content">
                        For an exchange, the item must remain in its original condition, unworn, unwashed, and with all tags and labels intact. Personalized, custom-made, and final sale items cannot be exchanged unless there is a manufacturing defect or shipping damage.
                    </div>
                )}
            </div>

            <div className="return-section" onClick={() => toggleSection(3)}>
                <div className="return-heading">
                    Exchange Process
                    <span className="return-icon">{open === 3 ? '-' : '+'}</span>
                </div>
                {open === 3 && (
                    <div className="return-content">
                        To exchange, simply message our customer support on WhatsApp at +92 312 1234567. Include your order number, the item(s) you want to exchange, and the reason for the exchange. After that, customers need to send the shipment back via any courier service to the company's warehouse address for the exchange.
                    </div>
                )}
            </div>

            <div className="return-section" onClick={() => toggleSection(4)}>
                <div className="return-heading">
                    Shipping Address for Exchange
                    <span className="return-icon">{open === 4 ? '-' : '+'}</span>
                </div>
                {open === 4 && (
                    <div className="return-content">
                        The customer will be provided with the address for exchange if it confirms our return policy.
                    </div>
                )}
            </div>
        </div>
    );
}
