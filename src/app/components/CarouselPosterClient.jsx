'use client';
import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Link from 'next/link';
import "../css/corouselposter.css";

const FIRST_IMAGE_CACHE_KEY = "cachedFirstImage";

const CarouselPosterClient = ({ galleryImages: initialGalleryImages, initialFirstImage }) => {
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
  const [firstImage, setFirstImage] = useState(initialFirstImage);
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current slide index
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
    if (typeof window === "undefined" || isEditing) return;

    const slideShow = setInterval(() => {
      const nextIndex = (currentIndex + 1) % galleryImages.length;
      moveToImage(nextIndex);
    }, 5000);

    return () => clearInterval(slideShow);
  }, [currentIndex, galleryImages.length, isEditing]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const editKeyFromLocalStorage = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
    const expectedValue = process.env.NEXT_PUBLIC_EDIT_VALUE;
    const hasEditParam = urlParams.has('edit');

    console.log("Edit Key from LocalStorage:", editKeyFromLocalStorage);
    console.log("Expected Value:", expectedValue);
    console.log("URL has 'edit' parameter:", hasEditParam);

    if (editKeyFromLocalStorage === expectedValue && hasEditParam) {
      console.log("Conditions met: Setting isEditing to true");
      setIsEditing(true);
    } else {
      console.log("Conditions not met: isEditing remains", isEditing);
    }
  }, []);

  const moveToImage = (index) => {
    const galleryContainer = document.querySelector('.gallery-containerx');

    if (galleryContainer) {
      galleryContainer.style.transition = 'transform 0.5s ease-in-out'; // Add smooth transition
      galleryContainer.style.transform = `translateX(-${index * 100}%)`;
      setCurrentIndex(index);
    }
  };

  const handleAddImage = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const storageRef = ref(storage, `poster/multipleImages/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const docRef = doc(db, 'gallery', 'imgLinks');
        const updatedGallery = [...galleryImages, downloadURL];
        await setDoc(docRef, { poster: updatedGallery }, { merge: true });
        setGalleryImages(updatedGallery);

        if (galleryImages.length === 0 || galleryImages[0] !== downloadURL) {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);
          setFirstImage(downloadURL);
        }

        alert('Image added successfully!');
      } catch (error) {
        console.error('Error adding image:', error);
      }
    };

    fileInput.click();
  };

  const handleDeleteImage = async (index) => {
    try {
      const updatedGallery = galleryImages.filter((_, i) => i !== index);
      const docRef = doc(db, 'gallery', 'imgLinks');
      await setDoc(docRef, { poster: updatedGallery }, { merge: true });
      setGalleryImages(updatedGallery);

      if (index === 0 && updatedGallery.length > 0) {
        localStorage.setItem(FIRST_IMAGE_CACHE_KEY, updatedGallery[0]);
        setFirstImage(updatedGallery[0]);
      } else if (updatedGallery.length === 0) {
        localStorage.removeItem(FIRST_IMAGE_CACHE_KEY);
        setFirstImage(null);
      }

      alert('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleEditImage = async (index) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const storageRef = ref(storage, `poster/multipleImages/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const updatedGallery = [...galleryImages];
        updatedGallery[index] = downloadURL;

        const docRef = doc(db, 'gallery', 'imgLinks');
        await setDoc(docRef, { poster: updatedGallery }, { merge: true });
        setGalleryImages(updatedGallery);

        if (index === 0) {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);
          setFirstImage(downloadURL);
        }

        alert('Image updated successfully!');
      } catch (error) {
        console.error('Error editing image:', error);
      }
    };

    fileInput.click();
  };

  return (
    <div className="galleryx">
      <div className="text-overlayx">
        <p className="nouve-textx">Discover the</p>
        <p className="nouve-textx bold">NOUVE</p>
        <Link href="/shop" className="discover-now-buttonx">
          Explore Now
        </Link>
        <div className="nav-circlesx">
          {galleryImages.map((_, index) => (
            <button
              key={`nav-${index}`}
              onClick={() => moveToImage(index)}
              className={`circlex ${currentIndex === index ? 'active' : ''}`}
              aria-label={`Navigate to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="gallery-containerx">
        {galleryImages.map((image, index) => (
          <div id={`image-${index}`} key={index} className="image-wrapperx">
            <img src={image} alt={`poster ${index}`} className="gallery-imagex" />
            {isEditing && (
              <>
                <button onClick={() => handleDeleteImage(index)} className="delete-buttonx">
                  Delete
                </button>
                <button onClick={() => handleEditImage(index)} className="edit-buttonx">
                  Edit
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      {isEditing && (
        <div className="edit-barx">
          <button onClick={handleAddImage} className="add-buttonx">
            ➕ Add Image
          </button>
        </div>
      )}
    </div>
  );
};

export default CarouselPosterClient;