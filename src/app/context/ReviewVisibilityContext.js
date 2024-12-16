'use client'
import React, { createContext, useContext, useState } from 'react';

// Create the Context
const ReviewVisibilityContext = createContext();

// Create a Provider Component
export const ReviewVisibilityProvider = ({ children }) => {
  const [isReviewVisible, setIsReviewVisible] = useState(false);

  return (
    <ReviewVisibilityContext.Provider value={{ isReviewVisible, setIsReviewVisible }}>
      {children}
    </ReviewVisibilityContext.Provider>
  );
};

// Custom Hook to use the Review Visibility Context
export const useReviewVisibility = () => {
  const context = useContext(ReviewVisibilityContext);
  if (!context) {
    throw new Error('useReviewVisibility must be used within a ReviewVisibilityProvider');
  }
  return context;
};