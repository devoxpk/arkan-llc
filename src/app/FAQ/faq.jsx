'use client'
import React, { useState } from 'react';

export default function FaqComponent() {
    const [open, setOpen] = useState(null);

    const toggleFAQ = (index) => {
        setOpen(open === index ? null : index);
    };

    return (
        <div className="faq-container">
            <h1 className="faq-title">FAQs</h1>

           

          
            <div className="faq-item" onClick={() => toggleFAQ(5)}>
                <div className="faq-question">
                    Do we offer Cash on Delivery (COD) as a payment option?
                    <span className="faq-icon">{open === 5 ? '-' : '+'}</span>
                </div>
                {open === 5 && (
                    <div className="faq-answer">
                        Absolutely! Cash on Delivery (COD) is accepted nationwide.
                    </div>
                )}
            </div>

            <div className="faq-item" onClick={() => toggleFAQ(6)}>
                <div className="faq-question">
                    What is the estimated delivery timeframe for my order?
                    <span className="faq-icon">{open === 6 ? '-' : '+'}</span>
                </div>
                {open === 6 && (
                    <div className="faq-answer">
                        Expect your order to arrive within 2-3 business days after confirmation.
                    </div>
                )}
            </div>

            <div className="faq-item" onClick={() => toggleFAQ(7)}>
                <div className="faq-question">
                    How can I verify that my order has been successfully placed?
                    <span className="faq-icon">{open === 7 ? '-' : '+'}</span>
                </div>
                {open === 7 && (
                    <div className="faq-answer">
                        You will receive an order confirmation via whatsapp or call once your order has been placed.
                    </div>
                )}
            </div>

            <div className="faq-item" onClick={() => toggleFAQ(8)}>
                <div className="faq-question">
                    What occurs if my shipment is not delivered according to the scheduled timeline?
                    <span className="faq-icon">{open === 8 ? '-' : '+'}</span>
                </div>
                {open === 8 && (
                    <div className="faq-answer">
                        If you haven't received your parcel as scheduled, please feel free to reach out to our customer service team for assistance. You can contact us via WhatsApp at +92 312 1234567.
                    </div>
                )}
            </div>

            <div className="faq-item" onClick={() => toggleFAQ(9)}>
                <div className="faq-question">
                    Are there any delivery fees that I need to pay?
                    <span className="faq-icon">{open === 9 ? '-' : '+'}</span>
                </div>
                {open === 9 && (
                    <div className="faq-answer">
                        We offer free delivery without any minimum order value requirement nationwide.
                    </div>
                )}
            </div>

            <div className="faq-item" onClick={() => toggleFAQ(10)}>
                <div className="faq-question">
                    How can I ensure that I select the correct size for myself?
                    <span className="faq-icon">{open === 10 ? '-' : '+'}</span>
                </div>
                {open === 10 && (
                    <div className="faq-answer">
                        When placing your order, please refer to the product page for a "SIZE CHART." It contains comprehensive information regarding sizes and their corresponding fits. Simply consult the size chart to determine your perfect size before making your purchase.
                    </div>
                )}
            </div>
        </div>
    );
}
