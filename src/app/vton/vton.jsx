'use client'
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import './vton.css';
import { useRouter } from 'next/navigation';
import showMessageBox from '../utilis/showMessageBox'
import Loader from '../components/loader'
import { db } from '../firebase'; // Use the Firestore instance from firebase.js
import { doc, setDoc } from 'firebase/firestore'; // Import setDoc and doc
import axios from 'axios';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const ModelAndProducts = ({ images = [] }) => {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCloth, setSelectedCloth] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("Upper body");
    const [isEditMode, setIsEditMode] = useState(false);

    const router = useRouter();

    // Initialize Firebase Storage
    const storage = getStorage();

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.has("edit")) {
            setIsEditMode(true);
        } else {
            setIsEditMode(false);
        }
    }, []);

const handleTryOn = async () => {
    document.querySelector(".select").style.display = 'none';
    console.log("Try On process started.");
    setIsLoading(true);

    try {
        // Retrieve API keys from environment variables
        const apiKeys = process.env.NEXT_PUBLIC_SEG_API_KEYS.split(',');

        const url = "https://api.segmind.com/v1/try-on-diffusion";

        if (!originalImage) {
            showMessageBox("Error", "Please upload a model image first.", false);
            setIsLoading(false);
            return;
        }

        if (!selectedCloth) {
            showMessageBox("Error", "Please select a cloth image first.", false);
            setIsLoading(false);
            return;
        }

        const modelImage = originalImage.split(',')[1];

        let clothImage;
        if (selectedCloth.vtonImage) {
            clothImage = selectedCloth.vtonImage;
        } else {
            const clothImageResponse = await axios.get(selectedCloth.pic, { responseType: 'arraybuffer' });
            clothImage = Buffer.from(clothImageResponse.data, 'binary').toString('base64');
        }

        const data = {
            "model_image": modelImage,
            "cloth_image": clothImage,
            "category": selectedCategory,
            "num_inference_steps": 35,
            "guidance_scale": 2,
            "seed": 12467,
            "base64": false
        };

        let response;
        for (let i = 0; i < apiKeys.length; i++) {
            try {
                response = await axios.post(url, data, {
                    headers: { 'x-api-key': apiKeys[i], 'Content-Type': 'application/json' },
                    responseType: 'arraybuffer'
                });
                console.log(`API key ${apiKeys[i]} succeeded.`);
                break; // Exit loop if request is successful
            } catch (error) {
                console.warn(`API key ${apiKeys[i]} failed with error: ${error.message}. Trying next key...`);
                if (i === apiKeys.length - 1) {
                    throw new Error("All API keys failed. Please try again later.");
                }
            }
        }

        if (response && response.data) {
            const imageUrl = Buffer.from(response.data, 'binary').toString('base64');
            setUploadedImage(`data:image/jpeg;base64,${imageUrl}`);
            showMessageBox("Success", "Try-on completed successfully.", true);
        } else {
            showMessageBox("Error", "No image data found in the response.", false);
        }
    } catch (error) {
        console.error("Error:", error);
        showMessageBox("Error", error.message || "Error processing try-on. Please try again.", false);
    } finally {
        setIsLoading(false);
        setSelectedCloth(null);
        setSelectedCategory("Upper body");
    }
};

   
    useEffect(() => {
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.display = isLoading ? 'block' : 'none';
        }
    }, [isLoading]);
    

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result);
                setOriginalImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClothClick = (image) => {
        if (!originalImage) {
            showMessageBox("Error", "Please upload your image first.", false);
            return;
        }
        setSelectedCloth(image);
    };

    const closeSelection = () => {
        setSelectedCloth(null);
    };

    const handleAttachImage = useCallback(async (collectionId, docId) => {
        const productRefPath = `${collectionId}/${docId}`;
        console.log("handleAttachImage called with productRefPath:", productRefPath);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (event) => {
            console.log("File input changed, processing selected file.");
            const file = event.target.files[0];
            if (file) {
                console.log(`File selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
                try {
                    // Create a storage reference
                    const storageRef = ref(storage, `vtonImages/${collectionId}/${docId}/${file.name}`);
                    console.log(`Uploading image to Firebase Storage at path: vtonImages/${collectionId}/${docId}/${file.name}`);
                    
                    // Upload the file
                    const snapshot = await uploadBytes(storageRef, file);
                    console.log("Upload successful:", snapshot);
                    
                    // Get the download URL
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    console.log("Download URL obtained:", downloadURL);
                    
                    if (!productRefPath) {
                        console.error("Product reference path is undefined or empty.");
                        throw new Error("Product reference path is undefined or empty.");
                    }
                    
                    // Save the download URL to Firestore
                    const productRef = doc(db, productRefPath); // Use the full reference path
                    await setDoc(productRef, {
                        vtonImage: downloadURL
                    }, { merge: true });
                    router.refresh();
                    console.log("Image URL attached successfully to Firestore.");
                    showMessageBox("Success", "Image attached successfully.", true);
                } catch (error) {
                    console.error("Error uploading image to Firebase Storage or saving URL to Firestore:", error);
                    showMessageBox("Error", "Failed to attach image.", false);
                }
            } else {
                console.log("No file selected, aborting operation.");
            }
        };
        console.log("Triggering file input click to open file dialog.");
        fileInput.click();
    }, []);

    return (<>
        <Loader/>
        <div className="model-section">
            {uploadedImage ? (<>
                
                    <Image src={uploadedImage} alt="Model" width={500} height={500} className="model-image" />
                    <button
                        className="change-image-button"
                        
                        onClick={() => document.getElementById('file').click()}
                    >
                        Change Image
                    </button>
                </>
            ) : (
                <form className="file-upload-form" style={{ padding: "60px" }}>
                    <label className="file-upload-label" htmlFor="file">
                        <div className="file-upload-design">
                            <svg height="1em" viewBox="0 0 640 512">
                                <path
                                    d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z"
                                ></path>
                            </svg>
                            <p>Upload Your</p>
                            <p>Image</p>
                            <span className="browse-button">Browse file</span>
                        </div>
                    </label>
                </form>
            )}

            {/* Ensure the file input is always present */}
            <input type="file" id="file" style={{ display: 'none' }} onChange={handleImageUpload} />

            <div className="product-images">
                {images.map((image, index) => (
                    <div key={index} className="product-image-wrapper" style={{ position: 'relative' }} onClick={() => handleClothClick(image)}>
                        <Image
                            src={image.pic}
                            alt={`Product ${index + 1}`}
                            width={200}
                            height={200}
                            className="product-image"
                        />
                        {isEditMode && (
                            <button
                                className="attach-image-button"
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    padding: '5px 10px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAttachImage(image.collectionId, image.ref.split('/')[1]); // Pass the collectionId and docId
                                }}
                            >
                                Attach Image
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {selectedCloth && (
                <div
                    className="select"
                    style={{
                        width: 'fit-content',
                        cursor: 'pointer',
                        zIndex: "9999",
                        transition: '300ms',
                        color: 'white',
                        overflow: 'hidden',
                        backgroundColor: '#2a2f3b',
                        padding: '20px',
                        borderRadius: '10px',
                        margin: '20px 0'
                    }}
                >
                    <button
                        style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '20px'
                        }}
                        onClick={closeSelection}
                    >
                        ×
                    </button>
                    <div className="options">
                        <div>
                            <input
                                id="upper-body"
                                name="category"
                                type="radio"
                                checked={selectedCategory === "Upper body"}
                                onChange={() => setSelectedCategory("Upper body")}
                            />
                            <label htmlFor="upper-body">Upper Body</label>
                        </div>
                        <div>
                            <input
                                id="lower-body"
                                name="category"
                                type="radio"
                                checked={selectedCategory === "Lower body"}
                                onChange={() => setSelectedCategory("Lower body")}
                            />
                            <label htmlFor="lower-body">Lower Body</label>
                        </div>
                    </div>
                    <button type="button" onClick={handleTryOn} className="try-on-button">
                        Try On
                    </button>
                </div>
            )}
        </div>
        </>
    );
};

export default ModelAndProducts;
