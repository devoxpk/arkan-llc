'use client'
import React, { useState, useEffect } from 'react';
import styles from './about.module.css';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure correct path to firebase.js

const AboutComponent = ({ header, paragraph}) => {
  const [localHeader, setLocalHeader] = useState(header);
  const [localParagraph, setLocalParagraph] = useState(paragraph);

  const handleChange = async (newHeader, newParagraph) => {
    setLocalHeader(newHeader);
    setLocalParagraph(newParagraph);
    console.log('Header:', newHeader);
    console.log('Paragraph:', newParagraph);
    try {
      const aboutDocRef = doc(db, 'about', 'main');
      await updateDoc(aboutDocRef, { header: newHeader, paragraph: newParagraph });
      console.log('About section updated successfully.');
    } catch (error) {
      console.error('Error updating about section:', error);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsEditing(urlParams.has('edit'));
  }, []);

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={styles.container}>
      {isEditing ? (
        <>
          <input
            type="text"
            value={localHeader}
            onChange={(e) => handleChange(e.target.value, localParagraph)}
            className={styles.input}
          />
          <textarea
            value={localParagraph}
            onChange={(e) => handleChange(localHeader, e.target.value)}
            className={styles.textarea}
          />
        </>
      ) : (
        <>
          <h2 className={styles.heading}>{localHeader}</h2>
          <p className={styles.paragraph}>{localParagraph}</p>
        </>
      )}
    </div>
  );
};

export default AboutComponent;
