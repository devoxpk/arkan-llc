'use client'
import React, { useState } from 'react';
import './terms.css'

export default function TermComponent() {
    const [open, setOpen] = useState(null);

    const toggleSection = (index) => {
        setOpen(open === index ? null : index);
    };

    return (
        <div className="term-container">
            <h1 className="term-title">Terms of Service</h1>
            <hr className="term-hr" />

            <div className="term-section" onClick={() => toggleSection(1)}>
                <div className="term-heading">
                    1. Acceptance of Terms
                    <span className="term-icon">{open === 1 ? '-' : '+'}</span>
                </div>
                {open === 1 && (
                    <p className="term-content">
                        By accessing or using our services, you agree to comply with and be bound by these terms of service.
                    </p>
                )}
            </div>

            <div className="term-section" onClick={() => toggleSection(2)}>
                <div className="term-heading">
                    2. User Responsibilities
                    <span className="term-icon">{open === 2 ? '-' : '+'}</span>
                </div>
                {open === 2 && (
                    <p className="term-content">
                        Users are responsible for maintaining the confidentiality of their accounts and agree to use the services responsibly.
                    </p>
                )}
            </div>

            <div className="term-section" onClick={() => toggleSection(3)}>
                <div className="term-heading">
                    3. Service Modifications
                    <span className="term-icon">{open === 3 ? '-' : '+'}</span>
                </div>
                {open === 3 && (
                    <p className="term-content">
                        We reserve the right to modify or discontinue any service without notice at any time.
                    </p>
                )}
            </div>

            <div className="term-section" onClick={() => toggleSection(4)}>
                <div className="term-heading">
                    4. User Conduct
                    <span className="term-icon">{open === 4 ? '-' : '+'}</span>
                </div>
                {open === 4 && (
                    <p className="term-content">
                        Users agree not to engage in any conduct that may disrupt or interfere with our services or violate any applicable laws.
                    </p>
                )}
            </div>

            <div className="term-section" onClick={() => toggleSection(5)}>
                <div className="term-heading">
                    5. Intellectual Property
                    <span className="term-icon">{open === 5 ? '-' : '+'}</span>
                </div>
                {open === 5 && (
                    <p className="term-content">
                        All content and materials on our platform are the property we own and are protected by intellectual property laws.
                    </p>
                )}
            </div>

            <div className="term-section" onClick={() => toggleSection(6)}>
                <div className="term-heading">
                    6. Governing Law
                    <span className="term-icon">{open === 6 ? '-' : '+'}</span>
                </div>
                {open === 6 && (
                    <p className="term-content">
                        These terms are governed by and construed in accordance with the laws of Pakistan.
                    </p>
                )}
            </div>

            <div className="term-section" onClick={() => toggleSection(7)}>
                <div className="term-heading">
                    7. Limitation of Liability
                    <span className="term-icon">{open === 7 ? '-' : '+'}</span>
                </div>
                {open === 7 && (
                    <p className="term-content">
                        We will not be liable for any indirect, incidental, or consequential damages arising from the use of our services.
                    </p>
                )}
            </div>

            <div className="term-section" onClick={() => toggleSection(8)}>
                <div className="term-heading">
                    8. Changes to Terms
                    <span className="term-icon">{open === 8 ? '-' : '+'}</span>
                </div>
                {open === 8 && (
                    <p className="term-content">
                        We may update these terms of service periodically. Continued use of the service implies acceptance of the revised terms.
                    </p>
                )}
            </div>
        </div>
    );
}
