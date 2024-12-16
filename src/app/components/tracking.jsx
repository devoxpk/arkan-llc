'use client';
import '../css/tracking.css';
import { useState, useEffect } from 'react';

export default function TrackingComponent() {
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
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

    let messageIndex = 0;

    useEffect(() => {
        let messageInterval;
        if (loading) {
            messageInterval = setInterval(() => {
                if (messageIndex < loadingMessages.length - 1) {
                    setLoadingMessage(loadingMessages[messageIndex]);
                    messageIndex++;
                }
            }, 1500);
        } else {
            setLoadingMessage('Track Your Parcel Here');
            messageIndex = 0;
        }

        return () => clearInterval(messageInterval);
    }, [loading]);

    const handleTracking = async () => {
        setLoading(true);
        setTrackingData(null);

        try {
            const response = await fetch('https://api.shooterdelivery.com/Apis/fetch-order-tracking.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    id: trackingNumber,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Process the Shooter API response
            const orderDetails = data.Order_Details || {};
            const statusHistory = data.Status_History || [];

            const trackingInfo = {
                status: orderDetails.status || 'Not Found',
                origin: orderDetails.Origin || 'Unknown',
                destination: orderDetails.Destination || 'Unknown',
                consignee: orderDetails.consignee_name || 'Unknown',
                shipper: orderDetails.Shipper || 'Unknown',
                date: orderDetails.created_at || 'N/A',
                history: statusHistory.map((entry) => ({
                    status: entry.status,
                    date: entry.created_at,
                })),
            };

            setTrackingData(trackingInfo);
        } catch (error) {
            console.error('Error fetching tracking data:', error);
            setTrackingData({ status: 'Error', date: 'N/A' });
        }

        setTrackingNumber('');
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
                            <span>Status: {trackingData.status}</span>
                        </div>
                        <div className="details">
                            <p>Origin: {trackingData.origin}</p>
                            <p>Destination: {trackingData.destination}</p>
                            <p>Consignee: {trackingData.consignee}</p>
                            <p>Shipper: {trackingData.shipper}</p>
                            <p>Date: {trackingData.date}</p>
                        </div>
                        <div className="history">
                            <h3>Status History:</h3>
                            <ul>
                                {trackingData.history.map((entry, index) => (
                                    <li key={index}>
                                        {entry.date}: {entry.status}
                                    </li>
                                ))}
                            </ul>
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
