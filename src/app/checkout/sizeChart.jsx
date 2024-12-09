"use client"; // Ensure client-side rendering

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // Import for query parameters
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function SizeChart() {
    const searchParams = useSearchParams();
    const cat = searchParams.get("cat"); // Fetch 'cat' query parameter
    const edit = searchParams.get("edit"); // Fetch 'edit' query parameter

    const [chartUrl, setChartUrl] = useState(null); // Holds the current size chart URL
    const [isEditable, setIsEditable] = useState(false); // Determines if the edit mode is enabled
    const [newChart, setNewChart] = useState(null); // Holds the File object for the new chart
    const [previewUrl, setPreviewUrl] = useState(null); // Holds the preview URL for the selected file
    const [uploadProgress, setUploadProgress] = useState(0); // Holds the upload progress percentage

    useEffect(() => {
        console.log("Search Params:", { cat, edit });

        // Check if the 'edit' parameter exists in the URL
        if (edit !== null) {
            const editKey = process.env.NEXT_PUBLIC_EDIT_KEY;
            const editValue = process.env.NEXT_PUBLIC_EDIT_VALUE;

            // Debugging localStorage and edit parameter
            console.log("LocalStorage edit key:", localStorage.getItem(editKey));
            console.log("Expected edit value:", editValue);

            if (localStorage.getItem(editKey) === editValue) {
                setIsEditable(true); // Enable edit mode if localStorage matches the expected values
            } else {
                setIsEditable(false); // Disable edit mode otherwise
            }
        } else {
            setIsEditable(false); // Disable edit mode if 'edit' is not in the URL
        }

        // Fetch the current size chart URL if 'cat' is provided
        const fetchChart = async () => {
            if (cat) {
                const sizeChartDocRef = doc(db, cat, "sizechart");
                try {
                    const docSnap = await getDoc(sizeChartDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setChartUrl(data.chart); // Set the chart URL from Firestore
                        console.log("Fetched chart URL:", data.chart);
                    } else {
                        console.log("No size chart document found.");
                    }
                } catch (error) {
                    console.error("Error fetching size chart:", error);
                }
            }
        };

        fetchChart();
    }, [cat, edit]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewChart(file); // Store the File object
            const fileUrl = URL.createObjectURL(file); // Generate a preview URL
            setPreviewUrl(fileUrl); // Set the preview URL
        }
    };

    const handleSaveChart = async () => {
        if (newChart && cat) {
            const storage = getStorage();
            const storageRef = ref(storage, `sizes/${cat}/${newChart.name}`); // Use the file's name

            const uploadTask = uploadBytesResumable(storageRef, newChart); // Upload the file

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    // Calculate upload progress percentage
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log("Upload is " + progress + "% done");
                    setUploadProgress(progress); // Update state with progress percentage
                },
                (error) => {
                    console.error("Error uploading chart:", error);
                    alert("Error uploading chart.");
                },
                async () => {
                    // Get the download URL once the upload is complete
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log("File available at", downloadURL);

                    // Save the URL in Firestore under the chart field
                    const sizeChartDocRef = doc(db, cat, "sizechart");

                    try {
                        await setDoc(sizeChartDocRef, { chart: downloadURL }, { merge: true });
                        alert("Size chart updated!");
                        setPreviewUrl(null); // Clear the preview after saving
                        setNewChart(null); // Clear the file after saving
                        setChartUrl(downloadURL); // Update the current chart URL
                        setUploadProgress(0); // Reset progress
                    } catch (error) {
                        console.error("Failed to update size chart:", error);
                        alert("Error updating size chart.");
                    }
                }
            );
        } else {
            alert("Please select a file to upload.");
        }
    };

    return (
        <div>
            {/* Render the size chart or a fallback message */}
            {chartUrl ? (
                <img
                    src={chartUrl}
                    alt="Size Chart"
                    style={{ maxWidth: "100%", height: "auto" }}
                />
            ) : (
                <p>No size chart available.</p>
            )}

            {/* Render the edit interface if editable */}
            {isEditable && (
                <div style={{ marginTop: "20px" }}>
                    <label>
                        Upload new size chart:
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </label>

                    {/* Show a preview of the new chart if available */}
                    {previewUrl && (
                        <div style={{ marginTop: "10px" }}>
                            <p>Preview:</p>
                            <img
                                src={previewUrl}
                                alt="New Size Chart Preview"
                                style={{ maxWidth: "100%", height: "auto" }}
                            />
                            <button
                                onClick={handleSaveChart}
                                style={{
                                    marginTop: "10px",
                                    padding: "10px 20px",
                                    backgroundColor: "#007bff",
                                    color: "#fff",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Save
                            </button>
                        </div>
                    )}

                    {/* Display upload progress if uploading */}
                    {uploadProgress > 0 && (
                        <div style={{ marginTop: "10px" }}>
                            <p>Upload Progress: {Math.round(uploadProgress)}%</p>
                            <progress
                                value={uploadProgress}
                                max="100"
                                style={{ width: "100%" }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
