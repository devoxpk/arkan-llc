'use client';
import { useState } from 'react';
import showMessage from '../utilis/showMessageBox';
import saveContactInfo from '../utilis/saveContact';

function ContactComponent() {
    const [name, setName] = useState(''); // This is for the user's name
    const [contact, setContact] = useState(''); // This is for the user's phone number
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleNameChange = (e) => setName(e.target.value); // For Name
    const handleContactChange = (e) => setContact(e.target.value); // For Contact Number
    const handleEmailChange = (e) => setEmail(e.target.value);
    const handleMessageChange = (e) => setMessage(e.target.value);

    const handleSubmit = async () => {
        if (!name || !contact || !email || !message) {
            setError('Please fill in all required fields.');
            showMessage('Error', 'Please fill in all required fields.', false);
            return;
        }

        setError('');
        setIsSubmitting(true);

        const apiUrl = `${process.env.NEXT_PUBLIC_SERVER_API}/send-message?num=${encodeURIComponent(contact)}&msg=${encodeURIComponent(message)}&auth=${encodeURIComponent(process.env.NEXT_PUBLIC_OWNER_AUTH)}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
            });

            if (response.ok) {
                await saveContactInfo(contact, email); 
                setSuccess('Message sent successfully!');
                setName('');
                setContact('');
                setEmail('');
                setMessage('');
                showMessage('Success', 'Your message has been sent successfully!', true); // Success message
            } else {
                const data = await response.json();
                setError('Error sending message: ' + (data.message || 'Unknown error'));
                showMessage('Error', 'There was an issue sending your message.', false); // Error message for unsuccessful submission
            }
        } catch (error) {
            setError('Network error: ' + error.message);
            showMessage('Error', 'There was a network issue. Please try again.', false); // Error message for network issue
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <h1 style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'larger',
                fontWeight: 'bolder',
                color: 'white',
                backgroundColor: 'black',
                width: '100%'
            }}>
                Contact
            </h1>
            <div id="contact-form">
                <div className="input-group">
                    <input
                        type="text"
                        id="name"
                        placeholder="Name"
                        value={name}
                        onChange={handleNameChange}
                        required
                    />
                    <input
                        type="email"
                        id="email"
                        placeholder="Email *"
                        value={email}
                        onChange={handleEmailChange}
                        required
                    />
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        id="contact"
                        placeholder="Your Contact Number"
                        value={contact}
                        onChange={handleContactChange}
                        required
                    />
                </div>
                <div className="input-group">
                    <textarea
                        id="message"
                        placeholder="Comment"
                        value={message}
                        onChange={handleMessageChange}
                        required
                    />
                </div>

                <div className="submit-group">
                    <button
                        type="button"
                        id="submit-button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Sending...' : 'Send'}
                    </button>
                </div>

                <style jsx>{`
                    #contact-form {
                        max-width: 500px;
                        margin: 0 auto;
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    .input-group {
                        margin-bottom: 15px;
                        display: flex;
                        gap: 10px;
                    }
                    .input-group input,
                    .input-group textarea {
                        flex: 1;
                        padding: 12px;
                        font-size: 16px;
                        border: 1px solid #ccc;
                        border-radius: 25px;
                        outline: none;
                        box-sizing: border-box;
                    }
                    .input-group textarea {
                        height: 80px;
                        resize: none;
                    }
                    .submit-group {
                        display: flex;
                        justify-content: center;
                    }
                    #submit-button {
                        padding: 12px 24px;
                        background-color: black;
                        color: white;
                        border: none;
                        cursor: pointer;
                        border-radius: 25px;
                        font-size: 16px;
                        width: 100px;
                        text-align: center;
                    }
                    #submit-button:disabled {
                        background-color: #ddd;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </>
    );
}

export default ContactComponent;
