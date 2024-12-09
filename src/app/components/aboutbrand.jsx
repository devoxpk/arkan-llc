'use client'
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import necessary Firebase storage methods
import { db, storage } from "../firebase"; // Ensure storage is imported
import Link from "next/link";
import  '../css/aboutbrand.css';

const AboutBrand = () => {
  const [imgLink, setImgLink] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const docRef = doc(db, "gallery", "imgLinks");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setImgLink(data.aboutBrand || "");
        }
      } catch (error) {
        console.error("Error fetching image link:", error);
      }
    };

    // Immediately fetch the image
    fetchImage();

    // Check if editing is enabled
    const checkEditCondition = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const edit = searchParams.get("edit");

      if (
        edit !== null &&
        localStorage.getItem(process.env.NEXT_PUBLIC_PUBLIC_EDIT_KEY) ===
          localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_VALUE)
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

        setImgLink(downloadURL);
        alert("Image updated successfully!");
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    };

    fileInput.click();
  };

  return (
    <div className="about-brand">
        {isEditing && (
          <button
            onClick={handleEditClick}
            className="edit-button" 
          >
            ✎
          </button>
        )}
      <div className="image-container">
        {imgLink && (
          <img src={imgLink} alt="Our Brand" className="responsive-image" />
        )}
        
        <h1 id="our-brand">
       
          <Link href="/about">Our Brand</Link>
       
      </h1>
      </div>
    
    </div>
  );
};

export default AboutBrand;
