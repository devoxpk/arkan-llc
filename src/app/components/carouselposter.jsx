'use client'
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from 'next/link';
import "../css/corouselposter.css";

const FIRST_IMAGE_CACHE_KEY = "cachedFirstImage";


const CarouselPoster = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [firstImage, setFirstImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current slide index
  const [isEditing, setIsEditing] = useState(false);

  const moveToImage = (index) => {
    const galleryContainer = document.querySelector('.gallery-containerx');
    
    if (galleryContainer) {
      galleryContainer.style.transition = 'transform 0.5s ease-in-out'; // Add smooth transition
      galleryContainer.style.transform = `translateX(-${index * 100}%)`;
      setCurrentIndex(index);
    }
  };
  


  
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const docRef = doc(db, 'gallery', 'imgLinks');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const images = data.gallery || [];
          setGalleryImages(images);

          if (images.length > 0) {
            let cachedFirstImage;
            if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
             cachedFirstImage = localStorage.getItem(FIRST_IMAGE_CACHE_KEY);
            }
            if (cachedFirstImage !== images[0]) {
              if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
              localStorage.setItem(FIRST_IMAGE_CACHE_KEY, images[0]);}
              setFirstImage(images[0]);
            } else {
              setFirstImage(cachedFirstImage);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
      }
    };

    const checkEditCondition = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const edit = searchParams.get('edit');
      if (
        edit !== null &&
        
        localStorage.getItem(process.env.NEXT_PUBLIC_PUBLIC_EDIT_KEY) ===
          localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_VALUE)
      ) {
        setIsEditing(true);
      }
    };

    fetchGallery();
    checkEditCondition();
  }, []);

  useEffect(() => {
    if (galleryImages.length < 2) return;

    const slideShow = setInterval(() => {
      const nextIndex = (currentIndex + 1) % galleryImages.length;
      moveToImage(nextIndex);
    }, 5000);

    return () => clearInterval(slideShow);
  }, [currentIndex, galleryImages.length]);

  const handleAddImage = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const storageRef = ref(storage, `gallery/multipleImages/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const docRef = doc(db, 'gallery', 'imgLinks');
        const updatedGallery = [...galleryImages, downloadURL];
        await setDoc(docRef, { gallery: updatedGallery }, { merge: true });
        setGalleryImages(updatedGallery);

        if (galleryImages.length === 0 || galleryImages[0] !== downloadURL) {
          if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);}
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
      await setDoc(docRef, { gallery: updatedGallery }, { merge: true });
      setGalleryImages(updatedGallery);

      if (index === 0 && updatedGallery.length > 0) {
        if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
        localStorage.setItem(FIRST_IMAGE_CACHE_KEY, updatedGallery[0]);}
        setFirstImage(updatedGallery[0]);
      } else if (updatedGallery.length === 0) {
        if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
        localStorage.removeItem(FIRST_IMAGE_CACHE_KEY);}
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
        const storageRef = ref(storage, `gallery/multipleImages/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const updatedGallery = [...galleryImages];
        updatedGallery[index] = downloadURL;

        const docRef = doc(db, 'gallery', 'imgLinks');
        await setDoc(docRef, { gallery: updatedGallery }, { merge: true });
        setGalleryImages(updatedGallery);

        if (index === 0) {
          if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
          localStorage.setItem(FIRST_IMAGE_CACHE_KEY, downloadURL);}
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
            <img src={image} alt={`Gallery ${index}`} className="gallery-imagex" />
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

export default CarouselPoster;
