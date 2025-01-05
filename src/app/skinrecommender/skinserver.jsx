    // Start of Selection
    'use client'
    import { useState, useEffect } from 'react';
    import { doc, getDoc } from 'firebase/firestore';
    import { db } from '../firebase';
    import './skin.css';
    import Image from 'next/image';
    export default function SkinServer({ purchase = false }) {
      const [selectedSkinTone, setSelectedSkinTone] = useState(null);
      const [error, setError] = useState('');
      const [isFormVisible, setIsFormVisible] = useState(purchase ? !localStorage.getItem('skin') : false);
      const [currentPath, setCurrentPath] = useState('');

      useEffect(() => {
        if (typeof window !== 'undefined') {
          setCurrentPath(window.location.pathname);
          const storedSkin = localStorage.getItem('skin');
          if (window.location.pathname === '/skinrecommender' || purchase) {
            setIsFormVisible(!storedSkin);
            if (storedSkin) {
              setSelectedSkinTone(parseInt(storedSkin, 10));
              skinExecuter(parseInt(storedSkin, 10));
            }
          } else {
            if (storedSkin) {
              setIsFormVisible(false);
            } else {
              setIsFormVisible(false);
            }
          }
        }
      }, [purchase]);

      const toggleFormVisibility = () => {
        if (!purchase) {
          setIsFormVisible(!isFormVisible);
        }
      };

      const handleSkinToneSelect = (tone, e) => {
        e.preventDefault();
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => option.style.border = 'none');
        e.currentTarget.style.border = '2px solid black';
       
        setSelectedSkinTone(tone);
        setError('');
      };

      const handleSubmit = () => {
        if (selectedSkinTone === null) {
          setError('Please select a skin tone.');
          return;
        }
        try {
          localStorage.setItem('skin', selectedSkinTone);
          console.log('Skin tone selected:', selectedSkinTone);
          if (currentPath === '/skinrecommender') {
            skinExecuter(selectedSkinTone);
            setIsFormVisible(false);
          } else {
            skinExecuter(selectedSkinTone);
            setIsFormVisible(false);
          }
        } catch (error) {
          console.error('Error executing skin selection:', error);
        }
      };

      const skinExecuter = async (selectedTone) => {
        const getBackgroundColor = (tone) => {
          switch (tone) {
            case 0:
              return 'rgb(243, 226, 203)';
            case 1:
              return 'rgb(186, 164, 143)';
            case 2:
              return 'rgb(74, 44, 42)';
            default:
              return 'rgb(243, 226, 203)'; // Default to tone 0 color if tone is not recognized
          }
        };

        try {
          const collections = document.querySelectorAll('.collections');
          console.log('Collections found:', collections.length);
          const skinCounts = await Promise.all(Array.from(collections).flatMap((collection) => {
            const collectionId = collection.id;
            console.log('Processing collectionId:', collectionId);
            const products = collection.querySelectorAll('.card-banner');
            return Array.from(products).map(async (product, productIndex) => {
              const docId = productIndex + 1; // Assuming products are 1-indexed within each collection
              console.log('Processing product with docId:', docId);
              if (!collectionId || !docId) {
                console.warn('Missing collectionId or docId for product:', product);
                return null;
              }

              // Fetch the skin array field from the database
              const skinArray = await fetchSkinArrayFromDB(collectionId, docId);
              console.log('Skin array for product:', skinArray);
              return skinArray ? skinArray[selectedTone] : null;
            });
          }));

          console.log('Skin counts:', skinCounts);

          const sortedProducts = Array.from(document.querySelectorAll('.card-banner'))
            .map((product, index) => ({ product, count: skinCounts[index] }))
            .filter(({ count }) => count !== null && count !== undefined) // Filter out products with null or undefined counts
            .sort((a, b) => b.count - a.count);

          sortedProducts.forEach(({ product, count }, index) => {
            console.log(`Product index: ${index}, Count: ${count}`);
            // Remove existing label if any
            const existingLabel = product.querySelector('.recommendation-label');
            if (existingLabel) {
              existingLabel.remove();
            }

            let label = '';
            if (index === 0) {
              label = 'Most Rec';
            } else if (index === sortedProducts.length - 1) {
              label = 'Recomended';
            } else {
              label = 'Mod Rec.';
            }

            const labelElement = document.createElement('div');
            labelElement.className = 'ribbon ribbon-top-right';
            labelElement.innerHTML = `<span style="background-color: ${getBackgroundColor(selectedTone)}; font-weight: bold;">${label}</span>`;
            product.appendChild(labelElement);
            console.log('Label added to product:', label);
          });
        } catch (error) {
          console.error('Error processing skin recommendations:', error);
        }
      };

      const fetchSkinArrayFromDB = async (collectionId, docId) => {
        try {
          // Convert collectionId and docId to strings
          const collectionIdStr = String(collectionId);
          const docIdStr = String(docId);
          console.log(`Fetching skin array for collectionId: ${collectionIdStr}, docId: ${docIdStr}`);

          // Fetch the document from the database
          const docRef = doc(db, collectionIdStr, docIdStr);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log(`Document found for collectionId: ${collectionIdStr}, docId: ${docIdStr}`);
            return docSnap.data().skin;
          } else {
            console.warn(`No document found for collectionId: ${collectionIdStr}, docId: ${docIdStr}`);
            return null;
          }
        } catch (error) {
          console.error('Error fetching skin array from database:', error);
          return null;
        }
      };

      return (
        <>
          {!purchase && (
            <div className="man-icon" onClick={toggleFormVisibility}>
              <Image src='/assets/images/detection.png' alt='Skin Recommendation' width={30} height={20}/>
            </div>
          )}
          {isFormVisible && (
            <div className="skin-tone-container">
              <form className="skin-tone-form">
                <h2>Select Your Skin Tone Family</h2>
                <div className="color-option" onClick={(e) => handleSkinToneSelect(0, e)} style={{ backgroundColor: '#f3e2cb' }}> Fair</div>
                <div className="color-option" onClick={(e) => handleSkinToneSelect(1, e)} style={{ backgroundColor: '#baa48f' }}>Medium</div>
                <div className="color-option" onClick={(e) => handleSkinToneSelect(2, e)} style={{ backgroundColor: '#4A2C2A' }}>Dark</div>
                <button type="button" onClick={handleSubmit}>Submit</button>
                {error && <div className="error-message">{error}</div>}
              </form>
            </div>
          )}
        </>
      );
    }