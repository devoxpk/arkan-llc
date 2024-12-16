'use client';
import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../firebase"; // Client-side Firebase import

const AboutBrandEditor = ({ currentImgLink }) => {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const checkEditCondition = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const edit = searchParams.get("edit");

      if (
        edit !== null &&
        localStorage.getItem(process.env.NEXT_PUBLIC_PUBLIC_EDIT_KEY) ===
          process.env.NEXT_PUBLIC_EDIT_VALUE
      ) {
        setIsEditing(true);
      }
    };

    checkEditCondition();
  }, []);

  const handleEditClick = async () => {
    console.log("Add an image");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const storageRef = ref(storage, `gallery/aboutBrand/${file.name}`);
        await uploadBytes(storageRef, file);

        const downloadURL = await getDownloadURL(storageRef);

        const docRef = doc(db, "gallery", "imgLinks");
        await setDoc(docRef, { aboutBrand: downloadURL }, { merge: true });

        alert("Image updated successfully!");
        // Optionally, you can trigger a re-fetch or state update here
        // For example, using a state lifting mechanism or a global store
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    };

    fileInput.click();
  };

  return (
    <>
      {isEditing && (
        <button
          onClick={handleEditClick}
          className="edit-button"
          style={{
            position: 'relative',
            top: '10px',
            right: '10px',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid black',
            cursor: 'pointer',
            fontSize: '24px',
          }}
          aria-label="Edit About Brand Image"
        >
        Change Image
        </button>
      )}
    </>
  );
};

export default AboutBrandEditor;