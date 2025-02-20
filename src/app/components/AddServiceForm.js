import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure correct path to firebase.js

const AddServiceForm = ({ onClose, onServiceAdded }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [reverse, setReverse] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newService = {
      title,
      text,
      image: imageBase64, // Storing Base64-encoded image
      reverse,
    };

    try {
      const docRef = await addDoc(collection(db, 'services'), newService);
      console.log('Service added with ID:', docRef.id);
      onServiceAdded(); // Trigger refresh
      onClose();
    } catch (error) {
      console.error('Error adding service:', error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="add-service-form">
      <button type="button" className="close-button" onClick={onClose}>
        &times;
      </button>
      <h2>Add New Service</h2>
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Text:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        ></textarea>
      </div>
      <div>
        <label>Image:</label>
        <input type="file" accept="image/*" onChange={handleImageChange} required />
        {imageBase64 && (
          <img src={imageBase64} alt="Preview" style={{ width: '100px', marginTop: '10px' }} />
        )}
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={reverse}
            onChange={(e) => setReverse(e.target.checked)}
          />
          Reverse Layout
        </label>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Service'}
      </button>
    </form>
  );
};

export default AddServiceForm;