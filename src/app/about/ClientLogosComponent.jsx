'use client'
import React, { useState, useEffect, useRef } from 'react';
import styles from './clientLogos.module.css';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure correct path to firebase.js

const ClientLogosComponent = ({ logos }) => {
  const [localLogos, setLocalLogos] = useState(logos);
  const [indexes, setIndexes] = useState({});
  const searchParams = useSearchParams();
  const isEditMode = searchParams.has('edit');

  const fileInputRef = useRef(null);

  useEffect(() => {
    setLocalLogos(logos);
  }, [logos]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('handleFileChange called with file:', file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        console.log('File read successfully. Base64 string obtained.');
        handleAddImage(base64String); // Automatically upload after setting the image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = async (image) => {
    console.log('handleAddImage called with image:', image);
    try {
      const newLogo = { image };
      const docRef = await addDoc(collection(db, 'clientLogos'), newLogo);
      console.log('Image added with ID:', docRef.id);
      setLocalLogos([...localLogos, { id: docRef.id, ...newLogo }]);
    } catch (error) {
      console.error('Error adding image:', error);
    }
  };

  const handleDelete = async (id) => {
    console.log('handleDelete called with id:', id);
    try {
      const logoRef = doc(db, 'clientLogos', id);
      await deleteDoc(logoRef);
      console.log('Image deleted successfully');
      setLocalLogos(localLogos.filter(logo => logo.id !== id));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleIndexChange = (e, id) => {
    const { value } = e.target;
    setIndexes(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmitIndex = async (id) => {
    const index = indexes[id];
    if (index === undefined || index === '') {
      console.warn('No index provided for id:', id);
      return;
    }

    try {
      const logosSnapshot = await getDocs(collection(db, 'clientLogos'));
      const allLogos = logosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const logoToMove = allLogos.find(logo => logo.id === id);
      if (!logoToMove) {
        throw new Error('Logo not found');
      }

      const filteredLogos = allLogos.filter(logo => logo.id !== id);
      filteredLogos.splice(index, 0, logoToMove);

      // Update all logos' order in Firebase
      await Promise.all(filteredLogos.map((logo, idx) => {
        const logoRef = doc(db, 'clientLogos', logo.id);
        return updateDoc(logoRef, { order: idx });
      }));

      setLocalLogos(filteredLogos);
      setIndexes(prev => ({ ...prev, [id]: '' })); // Reset the input
      console.log('Index changed successfully');
    } catch (error) {
      console.error('Error changing index:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h2 style={{fontWeight: 'lighter', fontSize: '15px'}}>Our Clients</h2>
      <p>Just a sampling of our satisfied clients</p>
      <div className={styles.grid}>
        {localLogos.map((logo, index) => (
          <div key={logo.id} className={styles.logoContainer}>
            <img src={`data:image/png;base64,${logo.image}`} alt={`Client ${index + 1}`} className={styles.logo} />
            {isEditMode && (
              <>
                <button onClick={() => handleDelete(logo.id)} className={styles.editButton}>Delete</button>
                <input
                  type="number"
                  value={indexes[logo.id] || index}
                  onChange={(e) => handleIndexChange(e, logo.id)}
                  placeholder="Index"
                  className={styles.editInput}
                />
                <button onClick={() => handleSubmitIndex(logo.id)} className={styles.submitButton}>Submit</button>
              </>
            )}
          </div>
        ))}
        {isEditMode && (
          <div className={styles.addImageContainer}>
            <input type="file" onChange={handleFileChange} className={styles.fileInput} ref={fileInputRef} />
            <span className={styles.plusIcon} onClick={() => fileInputRef.current.click()}>+</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientLogosComponent; 