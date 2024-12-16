import React from 'react';
import { getDoc, doc } from 'firebase/firestore';
import GalleryClient from './GalleryClient';
import {db} from '../firebase';
const GalleryServer = async () => {
  let galleryImages = [];
  let firstImage = null;

  try {
    const docRef = doc(db, 'gallery', 'imgLinks');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      galleryImages = data.gallery || [];

      if (galleryImages.length > 0) {
        firstImage = galleryImages[0];
      }
    }
  } catch (error) {
    console.error('Error fetching gallery images:', error);
  }

  return (
    <GalleryClient
      galleryImages={galleryImages}
      initialFirstImage={firstImage}
    />
  );
};

export default GalleryServer;