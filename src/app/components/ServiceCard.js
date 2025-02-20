'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import styles from './ServiceCard.module.css';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure correct path to firebase.js

const ServiceCard = ({ id, title, text, image, reverse, onUpdate, onDelete }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedText, setEditedText] = useState(text);
  const [editedImage, setEditedImage] = useState(image);
  const [isReversed, setIsReversed] = useState(reverse);

  const searchParams = useSearchParams();
  const isEdit = searchParams.has('edit');

  const handleSaveTitle = () => {
    onUpdate({
      id,
      title: editedTitle,
      text,
      image,
      reverse: isReversed,
    });
    setIsEditingTitle(false);
  };

  const handleSaveText = () => {
    onUpdate({
      id,
      title,
      text: editedText,
      image,
      reverse: isReversed,
    });
    setIsEditingText(false);
  };

  const handleSaveImage = () => {
    onUpdate({
      id,
      title,
      text,
      image: editedImage || '', // Set image as base64 "" when edit
      reverse: isReversed,
    });
    setIsEditingImage(false);
  };

  const handleReverseToggle = () => {
    const newReverse = !isReversed;
    setIsReversed(newReverse);
    onUpdate({
      id,
      title,
      text,
      image,
      reverse: newReverse,
    });
  };

  return (
    <div className={`${styles.serviceCard} ${isReversed ? styles.reverse : ''}`}>
      {isEditingImage ? (
        <>
          <input
            type="file"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setEditedImage(reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <button onClick={handleSaveImage}>Save Image</button>
        </>
      ) : (
        <>
          <Image src={image} alt={title} width={500} height={500} />
          {isEdit && (
            <button onClick={() => setIsEditingImage(true)}>✏️</button>
          )}
        </>
      )}
      <div className={styles.text}>
        {isEditingTitle ? (
          <>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
            <button onClick={handleSaveTitle}>Save</button>
          </>
        ) : (
          <>
            <h3 className={styles.heading}>
              {title}
              {isEdit && (
                <button onClick={() => setIsEditingTitle(true)}>✏️</button>
              )}
            </h3>
          </>
        )}
        {isEditingText ? (
          <>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
            />
            <button onClick={handleSaveText}>Save</button>
          </>
        ) : (
          <>
            <p className={styles.textContent}>
              {text}
              {isEdit && (
                <button onClick={() => setIsEditingText(true)}>✏️</button>
              )}
            </p>
          </>
        )}
        {isEdit && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => onDelete(id)}
              style={{
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
            <button
              onClick={handleReverseToggle}
              style={{
                backgroundColor: 'lightgreen',
                color: 'black',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              {isReversed ? 'Normal Layout' : 'Reverse Layout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;