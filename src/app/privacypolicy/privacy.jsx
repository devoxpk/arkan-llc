'use client'
import React, { useState } from 'react';
import './PrivacyComponent.css';

export default function PrivacyComponent() {
    const [open, setOpen] = useState(null);

    const toggleSection = (index) => {
        setOpen(open === index ? null : index);
    };

    return (
        <div className="privacy-container">
            <h1 className="privacy-title">Privacy Policy</h1>
            <hr className="privacy-hr" />

            <div className="privacy-section" onClick={() => toggleSection(1)}>
                <div className="privacy-heading">
                    Privacy Commitment
                    <span className="privacy-icon">{open === 1 ? '-' : '+'}</span>
                </div>
                {open === 1 && (
                    <p className="privacy-content">
                        We prioritize the protection of your privacy when using our services. This Privacy Policy outlines how we handle your personal information, and by using our website, you signify your acceptance of this policy and our Terms of Use.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(2)}>
                <div className="privacy-heading">
                    Personal Data
                    <span className="privacy-icon">{open === 2 ? '-' : '+'}</span>
                </div>
                {open === 2 && (
                    <p className="privacy-content">
                        We safeguard all personal data you provide, such as your name, address, email address, phone number, and date of birth. This data is collected when you subscribe to our newsletter or create a profile.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(3)}>
                <div className="privacy-heading">
                    How We Use Your Personal Data
                    <span className="privacy-icon">{open === 3 ? '-' : '+'}</span>
                </div>
                {open === 3 && (
                    <p className="privacy-content">
                        We use the information collected to fulfill our commitments and provide the services you expect. This includes sending relevant information and marketing offers tailored to your interests. Data is retained only as long as needed for services or as legally required, after which it is deleted.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(4)}>
                <div className="privacy-heading">
                    Information Sharing with Third Parties
                    <span className="privacy-icon">{open === 4 ? '-' : '+'}</span>
                </div>
                {open === 4 && (
                    <p className="privacy-content">
                        We may share personal information with third parties or affiliates who perform services on our behalf. Such data sharing is protected through contractual agreements, ensuring no unauthorized disclosure. We do not sell or share your information with unaffiliated parties.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(5)}>
                <div className="privacy-heading">
                    Information We Collect
                    <span className="privacy-icon">{open === 5 ? '-' : '+'}</span>
                </div>
                {open === 5 && (
                    <p className="privacy-content">
                        Personal Information: Name, email, address, phone, and payment details. <br />
                        Non-Personal Information: IP address, browser type, date, and time of visit.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(6)}>
                <div className="privacy-heading">
                    How We Use Your Information
                    <span className="privacy-icon">{open === 6 ? '-' : '+'}</span>
                </div>
                {open === 6 && (
                    <p className="privacy-content">
                        Order Processing: Fulfilling orders and providing customer support. <br />
                        Marketing and Communications: Sending promotions, newsletters, and updates. <br />
                        Legal Obligations: Complying with laws and responding to legal requests.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(7)}>
                <div className="privacy-heading">
                    Information Sharing
                    <span className="privacy-icon">{open === 7 ? '-' : '+'}</span>
                </div>
                {open === 7 && (
                    <p className="privacy-content">
                        Third-Party Service Providers: Engaging partners for business operations. <br />
                        Legal Compliance: Disclosing information to comply with legal obligations.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(8)}>
                <div className="privacy-heading">
                    Your Choices
                    <span className="privacy-icon">{open === 8 ? '-' : '+'}</span>
                </div>
                {open === 8 && (
                    <p className="privacy-content">
                        Opt-out of promotional emails at any time. <br />
                        Update or delete personal information by contacting us directly.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(9)}>
                <div className="privacy-heading">
                    Security
                    <span className="privacy-icon">{open === 9 ? '-' : '+'}</span>
                </div>
                {open === 9 && (
                    <p className="privacy-content">
                        We implement industry-standard security measures to protect your data.
                    </p>
                )}
            </div>

            <div className="privacy-section" onClick={() => toggleSection(10)}>
                <div className="privacy-heading">
                    Changes to This Policy
                    <span className="privacy-icon">{open === 10 ? '-' : '+'}</span>
                </div>
                {open === 10 && (
                    <p className="privacy-content">
                        Periodic updates will be made to this Privacy Policy, with the latest version available on our website.
                    </p>
                )}
            </div>
        </div>
    );
}
