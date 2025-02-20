'use client'
import React, { useState, useEffect, useRef } from 'react';
import styles from './person.module.css';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure correct path to firebase.js

const WeBelieveComponent = ({ initialText, initialHeader, initialTeam }) => {
  const [header, setHeader] = useState(initialHeader || '');
  const [text, setText] = useState(initialText || '');

  const [team, setTeam] = useState(initialTeam || []);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);
  const [newPerson, setNewPerson] = useState({ name: '', position: '', image: '' });

  // Refs for debounce
  const headerTimeoutRef = useRef(null);
  const textTimeoutRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsEditing(urlParams.has('edit'));
  }, []);

  const handleTextChange = async (newHeader, newText) => {
    console.log('handleTextChange called with:', { newHeader, newText });
    setHeader(newHeader);
    setText(newText);

    try {
      const weBelieveDocRef = doc(db, 'weBelieve', 'main');
      await updateDoc(weBelieveDocRef, { header: newHeader, text: newText });
      console.log('Header and text updated successfully.');
    } catch (error) {
      console.error('Error updating text:', error);
    }
  };

  const addPerson = async (name, position, image) => {
    console.log('addPerson called with:', { name, position, image });
    try {
      const weBelieveDocRef = doc(db, 'weBelieve', 'main');
      const weBelieveSnapshot = await getDoc(weBelieveDocRef);
      const data = weBelieveSnapshot.exists() ? weBelieveSnapshot.data() : { header: '', text: '', team: [] };

      const newPerson = { id: Date.now().toString(), name, position, image };
      const updatedTeam = [...data.team, newPerson];
      await updateDoc(weBelieveDocRef, { team: updatedTeam });
      console.log('New person added:', newPerson);
      setTeam(updatedTeam);
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const deletePerson = async (id) => {
    console.log('deletePerson called with ID:', id);
    try {
      const weBelieveDocRef = doc(db, 'weBelieve', 'main');
      const weBelieveSnapshot = await getDoc(weBelieveDocRef);
      if (!weBelieveSnapshot.exists()) {
        console.warn(`weBelieve document does not exist.`);
        return;
      }

      const data = weBelieveSnapshot.data();
      const teamIndex = data.team.findIndex(person => person.id === id);

      if (teamIndex === -1) {
        console.warn(`Person with ID ${id} not found.`);
        return;
      }

      data.team.splice(teamIndex, 1);
      await updateDoc(weBelieveDocRef, { team: data.team });
      console.log(`Person with ID ${id} deleted successfully.`);
      setTeam(data.team);
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  };

  const handleAddPersonSubmit = async (e) => {
    e.preventDefault();
    console.log('handleAddPersonSubmit called');
    if (fileInputRef.current && fileInputRef.current.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(fileInputRef.current.files[0]);
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];
        console.log('Base64 Image:', base64Image);
        await addPerson(newPerson.name, newPerson.position, base64Image);
        setNewPerson({ name: '', position: '', image: '' });
        setShowAddForm(false);
      };
    }
  };

  return (
    <div className={styles.container} style={{    "margin-bottom":" -62px"}}>
      {isEditing ? (
        <input
          type="text"
          value={header}
          onChange={(e) => handleTextChange(e.target.value, text)}
          className={styles.input}
        />
      ) : (
        <h2>{header}</h2>
      )}
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(header, e.target.value)}
          className={styles.input}
        />
      ) : (
        <p>{text}</p>
      )}
      {initialTeam.length > 0 && (
        <h2 style={{fontWeight: 'bolder', fontSize: '27px'}}>Who we are</h2>
      )}
      <div className={styles.team}>
        {team.map((person) => (
          <div key={person.id} className={styles.person}>
            <img src={`data:image/jpeg;base64,${person.image}`} alt={person.name} />
            <h3>{person.name}</h3>
            <p>{person.position}</p>
            {isEditing && (
              <button onClick={() => deletePerson(person.id)} className={styles.deleteButton}>Delete</button>
            )}
          </div>
        ))}
      </div>
      {isEditing && (
        <>
          <button onClick={() => setShowAddForm(true)} className={styles.button}>Add a Person</button>
          {showAddForm && (
            <form onSubmit={handleAddPersonSubmit} className={styles.addForm}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                required
                className={styles.fileInput}
              />
              <input
                type="text"
                placeholder="Name"
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                required
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Position"
                value={newPerson.position}
                onChange={(e) => setNewPerson({ ...newPerson, position: e.target.value })}
                required
                className={styles.input}
              />
              <button type="submit" className={styles.button}>Submit</button>
              <button type="button" onClick={() => setShowAddForm(false)} className={styles.button}>Cancel</button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default WeBelieveComponent; 