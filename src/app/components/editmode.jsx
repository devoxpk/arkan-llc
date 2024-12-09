import { useEffect, useState } from "react";

function EditModeButton() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditerMode, setIsEditerMode] = useState(false);

    // Check if the `localStorage` key matches the environment variable value
    useEffect(() => {
      const editKeyFromLocalStorage = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
      const editKeyFromEnv = process.env.NEXT_PUBLIC_EDIT_VALUE;
  
      if (editKeyFromLocalStorage === editKeyFromEnv) {
        setIsEditMode(true);
      }
    }, []);

  // Function to toggle edit mode
 const toggleEditMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const editKeyFromLocalStorage = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
  const editKeyFromEnv = process.env.NEXT_PUBLIC_EDIT_VALUE;
localStorage.setItem("urlParams",urlParams)
  if (urlParams.has("edit") ) {
    // If `edit` parameter exists and keys match, ensure edit mode is enabled
    
    setIsEditerMode(true);
  } else if (isEditerMode) {
    // If in edit mode, remove the `edit` parameter
    urlParams.delete("edit");
    setIsEditerMode(false);
  } else {
    // If not in edit mode, add the `edit` parameter
    urlParams.set("edit", "true");
    setIsEditerMode(true);
  }

  // Construct the new URL with updated query parameters
  const queryString = urlParams.toString();
  const newUrl = queryString
    ? `${window.location.origin}${window.location.pathname}?${queryString}`
    : `${window.location.origin}${window.location.pathname}`;

  // Log the URLs for debugging
  localStorage.setItem("window url", `${window.location.origin}${window.location.pathname}`);
  localStorage.setItem("newUrl", newUrl);

  // Update the browser's location
  window.location.href = newUrl; // This replaces the current location with the updated URL
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
            bottm:"18px",
            zIndex:"9"
          }}
        >
          {isEditerMode ? "Edit Mode" : "User Mode"}
        </button>
      )}
    </>
  );
}

export default EditModeButton;
