'use client';
import AddServiceForm from './AddServiceForm';
import React, { useState, useEffect, useCallback } from 'react';
import ServiceCard from './ServiceCard';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure correct path to firebase.js

const AdminServiceManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      const servicesList = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const updateService = useCallback(async (updatedService) => {
    console.log('Updating service:', updatedService);
    try {
      const serviceRef = doc(db, 'services', updatedService.id);
      await updateDoc(serviceRef, updatedService);
      console.log('Service updated successfully');
      fetchServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  }, [fetchServices]);

  const deleteService = useCallback(async (id) => {
    console.log('Deleting service with id:', id);
    try {
      const serviceRef = doc(db, 'services', id);
      await deleteDoc(serviceRef);
      console.log('Service deleted successfully');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  }, [fetchServices]);

  const handleAddServiceClick = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleServiceAdded = () => {
    fetchServices();
  };

  return (
    <div className="admin-service-manager">
      <h2>Manage Services</h2>
      <button className="add-service-button" onClick={handleAddServiceClick}>
        Add Service
      </button>

      {showForm && <AddServiceForm onClose={handleCloseForm} onServiceAdded={handleServiceAdded} />}
      
      {services.map(service => (
        <ServiceCard
          key={service.id}
          id={service.id}
          title={service.title}
          text={service.text}
          image={service.image}
          reverse={service.reverse}
          onUpdate={updateService}
          onDelete={deleteService}
        />
      ))}
    </div>
  );
};

export default AdminServiceManager; 