'use client';
import '../css/tracking.css';
import { useState } from 'react';

export default function TrackingComponent() {
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [contact, setContact] = useState('');

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
            <h3 style={{
                fontWeight: 'bolder',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'black',
                padding: '10px',
            }}>
                Tracking
            </h3>
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
                        <span>Track Your Parcel Here</span>
                    </div>
                )}
            </div>
        </>
    );
}
