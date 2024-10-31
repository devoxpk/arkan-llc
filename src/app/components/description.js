import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Import Firestore instance
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore methods

export default function Description() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat'); // Get the 'cat' URL parameter, which is the collection name
    let editMode = params.get('edit'); // Check if 'edit' parameter exists

    // Correctly handle editMode assignment
    if (editMode === '') {
        editMode = true;
    } else {
        editMode = false;
    }

    const [description, setDescription] = useState(''); // State to hold description
    const [loading, setLoading] = useState(true); // Loading state
    const [newDescription, setNewDescription] = useState(''); // State for edited description
    const [hasAccess, setHasAccess] = useState(false); // State to manage access to edit

    const validKey = 'fabfbuygi328y902340'; // Required key for edit mode

    useEffect(() => {
        // Fetch the key from localStorage
        const storedKey = localStorage.getItem('A98398HBFBB93BNABSN');
        console.log("Stored key from localStorage:", storedKey); // Debugging: Check the stored key
        console.log("Valid key required:", validKey); // Debugging: Check the valid key

        // Check if the key matches
        if (storedKey === validKey) {
            setHasAccess(true);
            console.log("Access granted for editing."); // Debugging: Access granted
        } else {
            console.log("Access denied for editing."); // Debugging: Access denied
        }

        const fetchDescription = async () => {
            try {
                // Reference to the document with ID 'desc' in the collection named 'cat'
                const docRef = doc(db, cat, 'desc');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log('Fetched data:', data); // Debugging: Check fetched data
                    setDescription(data.description); // Set description from fetched data
                    setNewDescription(data.description); // Pre-fill the textarea in edit mode
                } else {
                    console.log('No such document!'); // Debugging: No document found
                }
            } catch (error) {
                console.error('Error fetching document:', error); // Debugging: Error fetching document
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        console.log("Fetching description for collection:", cat); // Debugging: Log collection
        fetchDescription(); // Call the fetch function
    }, [cat, validKey]);

    // Function to handle description update
    const handleSubmit = async () => {
        try {
            const docRef = doc(db, cat, 'desc');
            await updateDoc(docRef, {
                description: newDescription, // Update the description field
            });
            alert('Description updated successfully!');
        } catch (error) {
            console.error('Error updating document:', error);
            alert('Failed to update description.');
        }
    };

    console.log(hasAccess);
    console.log(editMode);

    // Render loading state, description, or edit form
    return (
        <>
            <br />
            <div>
                {loading ? (
                    <p>Loading...</p> // Loading message
                ) : (
                    <>
                        <h2 style={{ color: 'black', fontWeight: 'bolder' }}>Description</h2>
                        {editMode && hasAccess ? (
                            <div>
                                <textarea style={{border:"1px solid black"}}
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    rows="10"
                                    cols="50"
                                ></textarea>
                                <br />
                                <button onClick={handleSubmit}>Submit</button>
                            </div>
                        ) : (
                            <div>
                                <pre>{description}</pre> {/* Display description with line breaks */}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
