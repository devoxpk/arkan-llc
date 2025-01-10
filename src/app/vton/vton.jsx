'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import './vton.css';

import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase.js';

const ModelAndProducts = ({ images = [] }) => {
    const [mainImage, setMainImage] = useState("https://firebasestorage.googleapis.com/v0/b/nouvedb-1328c.appspot.com/o/products%2FWAFFLE%20%7C%20SKIN?alt=media&token=be247bed-9cd0-44b5-abb1-eda16de638bd");

    const convertToBase64 = async (imageUrl) => {
        try {
            const storageRef = ref(storage, imageUrl);
            const downloadURL = await getDownloadURL(storageRef);
            const response = await fetch(downloadURL);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Extract the MIME type from the blob
                    const mimeType = blob.type || 'image/jpeg';
                    const base64data = reader.result;
                    // Replace the data URL's MIME type with the correct one
                    const updatedBase64 = base64data.replace(/^data:.*;base64,/, `data:${mimeType};base64,`);
                    resolve(updatedBase64);
                };
                reader.onerror = () => {
                    reject(new Error("Failed to convert blob to base64"));
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error converting image to base64:", error);
            return null;
        }
    };

    const handleImageClick = async (productImage) => {
        try {
            const productBase64 = await convertToBase64(productImage);
            const mainBase64 = await convertToBase64(mainImage);

            if (productBase64 && mainBase64) {
                const response = await fetch(`http://localhost:5000/tryon_api`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        SOURCE: productBase64,
                        PROFILE: mainBase64,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.statusText}`);
                }

                const data = await response.json();
                if (data.base64Image) {
                    setMainImage(`data:image/jpeg;base64,${data.base64Image}`);
                }
            }
        } catch (error) {
            console.error("Error fetching the new image:", error);
        }
    };

    const handleIconClick = (gender) => {
        // Implement gender-specific functionality if needed
        console.log(`Gender icon clicked: ${gender}`);
    };

    return (
        <div className="model-section">
            <div className="icons-container">
                <div className="icon-box" onClick={() => handleIconClick('male')}>
                    M
                </div>
                <div className="icon-box" onClick={() => handleIconClick('female')}>
                  F
                </div>
            </div>
            <Image src={mainImage} alt="Model" width={500} height={500} className="model-image" />
            <div className="sidebar">
                <div className="color-box fair"></div>
                <div className="color-box dim"></div>
                <div className="color-box dark"></div>
            </div>
            <div className="product-images">
                {images.map((src, index) => (
                    <div key={index} className="product-image-wrapper" onClick={() => handleImageClick(src)}>
                        <Image
                            src={src}
                            alt={`Product ${index + 1}`}
                            width={200}
                            height={200}
                            className="product-image"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModelAndProducts;
