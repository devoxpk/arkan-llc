'use client';
import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../css/gallery.css";
import Image from 'next/image'
const FIRST_IMAGE_CACHE_KEY = "cachedFirstImageGallery";

const GalleryClient = ({ galleryImages: initialGalleryImages, initialFirstImage }) => {
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
  const [firstImage, setFirstImage] = useState(initialFirstImage);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && initialGalleryImages.length > 0) {
      const cachedFirstImage = localStorage.getItem(FIRST_IMAGE_CACHE_KEY);
      if (cachedFirstImage !== initialGalleryImages[0]) {
        localStorage.setItem(FIRST_IMAGE_CACHE_KEY, initialGalleryImages[0]);
        setFirstImage(initialGalleryImages[0]);
      }
    }
  }, [initialGalleryImages]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const editKeyFromLocalStorage = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
    const expectedValue = process.env.NEXT_PUBLIC_EDIT_VALUE;
    const hasEditParam = urlParams.has('edit');

    if (editKeyFromLocalStorage === expectedValue && hasEditParam) {
      setIsEditing(true);
    }
  }, []);

  const handleAddImage = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const storageRef = ref(storage, `gallery/multipleImages/${file.name}`);
        await uploadBytes(storageRef, file);

        const downloadURL = await getDownloadURL(storageRef);

        const docRef = doc(db, "gallery", "imgLinks");
        const updatedGallery = [...galleryImages, downloadURL];
        await setDoc(docRef, { gallery: updatedGallery }, { merge: true });

        setGalleryImages(updatedGallery);

        if (galleryImages.length === 0 || galleryImages[0] !== downloadURL) {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);
          setFirstImage(downloadURL);
        }

        alert("Image added successfully!");
      } catch (error) {
        console.error("Error adding image:", error);
      }
    };

    fileInput.click();
  };

  const handleDeleteImage = async (index) => {
    try {
      const updatedGallery = galleryImages.filter((_, i) => i !== index);

      const docRef = doc(db, "gallery", "imgLinks");
      await setDoc(docRef, { gallery: updatedGallery }, { merge: true });

      setGalleryImages(updatedGallery);

      if (index === 0 && updatedGallery.length > 0) {
        localStorage.setItem(FIRST_IMAGE_CACHE_KEY, updatedGallery[0]);
        setFirstImage(updatedGallery[0]);
      } else if (updatedGallery.length === 0) {
        localStorage.removeItem(FIRST_IMAGE_CACHE_KEY);
        setFirstImage(null);
      }

      alert("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleEditImage = async (index) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const storageRef = ref(storage, `gallery/multipleImages/${file.name}`);
        await uploadBytes(storageRef, file);

        const downloadURL = await getDownloadURL(storageRef);

        const updatedGallery = [...galleryImages];
        updatedGallery[index] = downloadURL;

        const docRef = doc(db, "gallery", "imgLinks");
        await setDoc(docRef, { gallery: updatedGallery }, { merge: true });

        setGalleryImages(updatedGallery);

        if (index === 0) {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);
          setFirstImage(downloadURL);
        }

        alert("Image updated successfully!");
      } catch (error) {
        console.error("Error editing image:", error);
      }
    };

    fileInput.click();
  };

  return (
    <div className="gallery">
      <div className="gallery-container">
        {firstImage ? (
          <div className="image-wrapper">
          <img src={firstImage} alt="First Image" className="gallery-image" />
            {isEditing && (
              <>
                <button
                  onClick={() => handleDeleteImage(0)}
                  className="delete-button"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleEditImage(0)}
                  className="edit-buttonxx"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        ) : (
          <p>Loading first image...</p>
        )}

        {galleryImages.slice(1).map((image, index) => (
          <div key={index + 1} className="image-wrapper">
            <img src={image} alt={`Gallery ${index + 1}`} className="gallery-image" />
            {isEditing && (
              <>
                <button
                  onClick={() => handleDeleteImage(index + 1)}
                  className="delete-button"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleEditImage(index + 1)}
                  className="edit-buttonxx"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="edit-bar">
          <button onClick={handleAddImage} className="add-button">
            ➕ Add Image
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryClient;