'use client'
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../css/gallery.css";

const FIRST_IMAGE_CACHE_KEY = "cachedFirstImageGallery";

const CarouselPoster = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [firstImage, setFirstImage] = useState(null); // For the cached first image
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const docRef = doc(db, "gallery", "imgLinks");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const images = data.gallery || [];

          // Update the gallery
          setGalleryImages(images);

          // Handle caching for the first image
          if (images.length > 0) {
            let cachedFirstImageGallery;
            if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
             cachedFirstImageGallery = localStorage.getItem(FIRST_IMAGE_CACHE_KEY);}
            if (cachedFirstImageGallery !== images[0]) {
              // Update the cache if the first image URL has changed
              if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
              localStorage.setItem(FIRST_IMAGE_CACHE_KEY, images[0]);}
              setFirstImage(images[0]);
            } else {
              setFirstImage(cachedFirstImageGallery); // Use the cached image
            }
          }
        }
      } catch (error) {
        console.error("Error fetching gallery images:", error);
      }
    };

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

    // Load the cached first image immediately
    let cachedFirstImageGallery;
    if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
     cachedFirstImageGallery = localStorage.getItem(FIRST_IMAGE_CACHE_KEY);}
    if (cachedFirstImageGallery) {
      setFirstImage(cachedFirstImageGallery);
    }

    // Fetch gallery images and check edit conditions
    fetchGallery().then(() => {
      checkEditCondition();
    });
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
        const updatedGallery = [...galleryImages, downloadURL]; // Add to the gallery (including the first image if not cached)
        await setDoc(docRef, { gallery: updatedGallery }, { merge: true });

        setGalleryImages(updatedGallery);

        // If it's the first image, update the cache
        if (galleryImages.length === 0 || galleryImages[0] !== downloadURL) {
          if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);}
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

      // Update the first image cache if the first image was deleted
      if (index === 0 && updatedGallery.length > 0) {
        if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
        localStorage.setItem(FIRST_IMAGE_CACHE_KEY, updatedGallery[0]);}
        setFirstImage(updatedGallery[0]);
      } else if (updatedGallery.length === 0) {
        if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
        localStorage.removeItem(FIRST_IMAGE_CACHE_KEY);}
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

        // Replace the image at the specified index
        const updatedGallery = [...galleryImages];
        updatedGallery[index] = downloadURL;

        const docRef = doc(db, "gallery", "imgLinks");
        await setDoc(docRef, { gallery: updatedGallery }, { merge: true });

        setGalleryImages(updatedGallery);

        // Update the first image cache if the first image was edited
        if (index === 0) {
          if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);}
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
        {/* Display the first image (cached or from DB) */}
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

        {/* Display the remaining images from the gallery */}
        {galleryImages.slice(1).map((image, index) => (
          <div key={index + 1} className="image-wrapper">
            <img src={image} alt={`Gallery ${index + 1}`} className="gallery-image" />
            {isEditing && (
              <>
                <button
                  onClick={() => handleDeleteImage(index + 1)} // Adjusted index since we skip the first image
                  className="delete-button"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleEditImage(index + 1)} // Adjusted index for edit
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

export default CarouselPoster;
