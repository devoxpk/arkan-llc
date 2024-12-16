import { useEffect, useState } from "react";

function EditModeButton() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditorMode, setIsEditorMode] = useState(false);

    // Check if the `localStorage` key matches the environment variable value
    useEffect(() => {
        let editKeyFromLocalStorage
        if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
         editKeyFromLocalStorage = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
        }
        const editKeyFromEnv = process.env.NEXT_PUBLIC_EDIT_VALUE;

        if (editKeyFromLocalStorage === editKeyFromEnv) {
            setIsEditMode(true);
        }
let urlParams;
        // Initialize `isEditorMode` based on the presence of the `edit` query parameter
        if(typeof window !== "undefined"){
         urlParams = new URLSearchParams(window.location.search);
        }
        if (urlParams.has("edit")) {
            setIsEditorMode(true);
        }
    }, []);

    // Function to toggle edit mode
    const toggleEditMode = () => {
        let urlParams
        if(typeof window !== "undefined"){
         urlParams = new URLSearchParams(window.location.search);
        }

        if (isEditorMode) {
            // If in edit mode, remove the `edit` parameter
            urlParams.delete("edit");
            setIsEditorMode(false);
        } else {
            // If not in edit mode, add the `edit` parameter
            urlParams.set("edit", "true");
            setIsEditorMode(true);
        }

        // Construct the new URL with updated query parameters
        const queryString = urlParams.toString();
        let newUrl;
        if(typeof window !== "undefined"){
         newUrl = queryString
            ? `${window.location.origin}${window.location.pathname}?${queryString}`
            : `${window.location.origin}${window.location.pathname}`;
        
        // Update the browser's location

        window.location.href = newUrl;}
    };

    return (
        <>
            {isEditMode && (
                <button
                    onClick={toggleEditMode}
                    style={{
                        position: "fixed",
                        right: "58px",
                        border: "1px solid black",
                        backgroundColor: "white",
                        color: "black",
                        padding: "10px",
                        bottom: "18px", // Corrected typo: `bottm` to `bottom`
                        zIndex: 9, // Changed string to number for consistency
                    }}
                >
                    {isEditorMode ? "User Mode" : "Edit Mode"}
                </button>
            )}
        </>
    );
}

export default EditModeButton;
