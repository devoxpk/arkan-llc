'use client';
import '../css/tracking.css';
import { useState, useEffect } from 'react';

export default function TrackingComponent() {
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [contact, setContact] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('Track Your Parcel Here');

    const loadingMessages = [
        'Connecting to courier API...',
        'Validating tracking credentials...',
        'Syncing with network nodes...',
        'Retrieving encrypted data packets...',
        'Resolving DNS for courier service...',
        'Decrypting response payload...',
        'Analyzing tracking data streams...',
        'Optimizing data retrieval pipeline...',
        'Please wait...',
        'You are on it...',
        'Just a second...',
    ];

    // Message index to avoid repetition
    let messageIndex = 0;

    // Function to rotate loading messages
    useEffect(() => {
        let messageInterval;
        if (loading) {
            messageInterval = setInterval(() => {
                // Only show new message if index is within bounds
                if (messageIndex < loadingMessages.length - 2) {
                    setLoadingMessage(loadingMessages[messageIndex]);
                    messageIndex++;
                }
            }, 1500); // Change message every 1.5 seconds
        } else {
            setLoadingMessage('Track Your Parcel Here');
            messageIndex = 0; // Reset message index
        }

        return () => clearInterval(messageInterval); // Clear interval on unmount or when loading ends
    }, [loading]);

    const handleTracking = async () => {
        setLoading(true);
        setTrackingData(null);

        const contactNumber = contact || '00000000000';

        try {
            let response = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_API}/get-tracking?auth=${process.env.NEXT_PUBLIC_OWNER_AUTH}&tracking[]=${trackingNumber}&courier[]=leopards&contact[]=${contactNumber}`
            );
            let data = await response.json();

            if (!data.trackingResults || data.trackingResults.length === 0) {
                response = await fetch(
                    `${process.env.NEXT_PUBLIC_SERVER_API}/get-tracking?auth=${process.env.NEXT_PUBLIC_OWNER_AUTH}&tracking[]=${trackingNumber}&courier[]=barq&contact[]=${contactNumber}`
                );
                data = await response.json();
            }

            if (data.trackingResults && data.trackingResults.length > 0) {
                setTrackingData(data.trackingResults[0].trackingDetails);
            } else {
                setTrackingData({ status: 'Not Found', date: 'N/A' });
            }
        } catch (error) {
            console.error('Error fetching tracking data. Please try again later.');
        }

        setTrackingNumber(''); // Clear the tracking number input
        setLoading(false);
    };

    return (
        <>
            <h1
                style={{
                    width: '100%',
                    fontSize: '24px',
                    color: 'black',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginTop: '10%',
                }}
            >
                Tracking
            </h1>
            <hr
                style={{
                    border: '1px solid black',
                    margin: '10px auto',
                    width: '16ch',
                }}
            />

            <div className="tracking-container">
                <div className="tracking-input">
                    <input
                        type="text"
                        placeholder="Enter Tracking Number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                    <button
                        onClick={handleTracking}
                        disabled={loading}
                        className={loading ? 'loading' : ''}
                    >
                        {loading ? 'Tracking' : 'Track'}
                    </button>
                </div>

                {trackingData ? (
                    <div className="tracking-result">
                        <div className="status">
                            <span>{trackingData.status}</span>
                        </div>
                        <div className="date">
                            <span>{trackingData.date}</span>
                        </div>
                    </div>
                ) : (
                    <div className="tracking-placeholder">
                        <span>{loading ? loadingMessage : 'Track Your Parcel Here'}</span>
                    </div>
                )}
            </div>
        </>
    );
}
