"use client";

import React, { useEffect, useState } from "react";
import { db, storage } from "../firebase";
import Image from 'next/image'
import router from 'next/navigation'
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import showMessageBox from '../utilis/showMessageBox';
import "../css/reviews.css";
import { useReviewVisibility } from '../context/ReviewVisibilityContext'; // Updated import path

let isReviewAvailable = false; // Shared state to track availability
let isAvailable = false; // Initialize to false

const checkReviewAvailability = async (productName) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "reviews", productName, "userReviews")
    );
    isReviewAvailable = !querySnapshot.empty;
    return isReviewAvailable;
  } catch (error) {
    console.error("Error checking review availability:", error);
    return false;
  }
};

const Reviews = ({ productName }) => {
 
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [countReviews, setCountReviews] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({});
  const [showImageIds, setShowImageIds] = useState([]);
  const toggleImage = (reviewId) => {
    setShowImageIds((prev) =>
      prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]
    );
  };

  const [isFormVisible, setIsFormVisible] = useState(false);
  const { isReviewVisible, setIsReviewVisible } = useReviewVisibility();

  useEffect(() => {
    if (productName) {
      loadReviews(productName);
    }
  }, [productName]);

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSliderChange = (name, value) => {
    setReviewForm((prevForm) => ({
      ...prevForm,
      [name]: parseInt(value),
    }));
  };

  const uploadImage = async (file) => {
    const storageRef = ref(storage, `productReviews/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  async function submitReview(event) {
    event.preventDefault();
    document.getElementById("postReview").innerHTML = 'Please Wait';

    const name = document.getElementById('name').value;
    const product = localStorage.getItem("filteredProduct");
    console.log(product);

    const review = document.getElementById('review').value;

    // Get the selected rating value from the radio buttons
    const ratingInputs = document.querySelectorAll('#rating input[name="rating"]');
    let rating = 0;
    for (const input of ratingInputs) {
      if (input.checked) {
        rating = input.value;
        break;
      }
    }

    // Generate stars based on the rating
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    console.log('Submitted Stars:', stars); // Log stars

    let imgSrc = null;
    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
      imgSrc = await uploadImage(imageFile);
    }

    // Set document first
    await setDoc(doc(db, "reviews", product, "userReviews", `${name}_${generateRandom6Digit().toString()}`), {
      name: name,
      review: review,
      imgSrc: imgSrc,
      rating: parseInt(rating),
      timestamp: serverTimestamp()
    });

    // Once document is set, proceed with other actions
    showMessageBox("Posted","Thanks for your feedback",true)
    setIsFormVisible(false);
    loadReviews(product);
  }

  // Function to check if reviews are available
  console.log("Reviews Available:", isAvailable);

  // Modified loadReviews function
  const loadReviews = async (productName, priority = "new") => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "reviews", productName, "userReviews")
      );
  
      let totalRating = 0;
      const ratingCountTemp = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      const fetchedReviews = [];
  
      querySnapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const rating = data.rating;
  
          totalRating += rating;
          ratingCountTemp[rating] = (ratingCountTemp[rating] || 0) + 1;
  
          fetchedReviews.push({
            id: docSnap.id,
            ...data,
            hasImage: Boolean(data.imageUrl), // Ensure it's a boolean
            timestamp: data.timestamp?.toDate().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          });
        }
      });
  
      // Sorting based on priority
      if (priority === "new") {
        fetchedReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      } else if (priority === "ratings") {
        fetchedReviews.sort((a, b) => b.rating - a.rating);
      } else if (priority === "high") {
        fetchedReviews.sort((a, b) => b.rating - a.rating); // High to low ratings
      } else if (priority === "low") {
        fetchedReviews.sort((a, b) => a.rating - b.rating); // Low to high ratings
      } else if (priority === "image") {
        fetchedReviews.sort((a, b) => b.hasImage - a.hasImage); // Reviews with images first
      }
  
      const avgRating = fetchedReviews.length
        ? (totalRating / fetchedReviews.length).toFixed(1)
        : 0;
  
      // Update state
      setReviews(fetchedReviews);
      setAverageRating(avgRating);
      setCountReviews(fetchedReviews.length);
      setRatingCounts(ratingCountTemp);
  
      isAvailable = fetchedReviews.length > 0;
      isReviewAvailable = isAvailable; // Ensure consistency
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };
  
  

  const deleteReview = async (productName, docId) => {
    try {
      await deleteDoc(doc(db, "reviews", productName, "userReviews", docId));
      loadReviews(productName);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  function generateRandom6Digit() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  return (
    <>
      {isFormVisible && (
        <div className="review-form" id="reviewFormContainer">
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#333' }}>Post Review</h2>
          <span onClick={() => setIsFormVisible(false)} style={{color:"black",position:"absolute",right:"16px"}}>X</span>
          <form id="reviewForm" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="hidden" id="product" name="product" />

            <label htmlFor="name" style={{ margin: '0' }}>Name:</label>
            <input type="text" placeholder="Your Name" id="name" name="name" required style={{ outline: '0', background: '#fff', padding: '0.6em', borderRadius: '14px', border: '1px solid #333', color: 'black' }} />

            <label htmlFor="review" style={{ margin: '0' }}>Review:</label>
            <textarea id="review" name="review" required placeholder="Feedback" style={{ outline: '0', background: '#fff', padding: '0.6em', borderRadius: '14px', border: '1px solid #333', color: 'black' }}></textarea>

            <label htmlFor="image" style={{ margin: '0' }}>Upload Image (optional):</label>
            <input type="file" id="image" name="image" accept="image/*" style={{ outline: '0', background: '#fff', padding: '0.6em', borderRadius: '14px', border: '1px solid #333', color: 'black' }} />

            <h3>Rate:</h3>
            <div id="rating">
              <input value="5" name="rating" id="star5" type="radio" />
              <label htmlFor="star5"></label>
              <input value="4" name="rating" id="star4" type="radio" />
              <label htmlFor="star4"></label>
              <input value="3" name="rating" id="star3" type="radio" />
              <label htmlFor="star3"></label>
              <input value="2" name="rating" id="star2" type="radio" />
              <label htmlFor="star2"></label>
              <input value="1" name="rating" id="star1" type="radio" />
              <label htmlFor="star1"></label>
            </div>

            <button type="submit" id="postReview" style={{ border: '0', background: '#111', color: '#fff', padding: '0.68em', borderRadius: '14px', fontWeight: 'bold' }} onClick={submitReview}>Submit</button>
          </form>
        </div>
      )}
      {isReviewVisible && (
        <div className="review-parent">
          <h2>Reviews</h2>
          <span
            style={{
              position: 'absolute',
              right: '21px',
              color: 'black'
            }}
            onClick={() => setIsReviewVisible(false)}
          >
            X
          </span>

          <div className="average-rating">
            <h1>{averageRating}</h1>

            <div style={{ color: "black", display: "flex", justifyContent: "space-between" }}>
              {Array(Math.round(averageRating))
                .fill("★")
                .join("")}
              {Array(5 - Math.round(averageRating))
                .fill("☆")
                .join("")}

              <p style={{ marginTop: "-10%", textDecoration: "underline" }}>Based on {countReviews} reviews</p>
            </div>
          </div>
          <button onClick={() => setIsFormVisible(true)}>Write a Review</button>

          <div className="sortingReviews" style={{ display: "flex", borderBottom: "1px solid #e1e0e0" }}>
            <span style={{
              color: "black",
              textDecoration: "underline",
              textDecorationColor: "black",
              textDecorationThickness: "2px"
            }}>
              SORT BY
            </span>

            <label className="popup">
              <input type="checkbox" />
              <div
                className="burger"
                tabIndex="0"
                style={{
                  marginTop: "-5px",
                  transform: "scale(0.9)",
                }}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
              <nav className="popup-window" style={{ maringLeft: "-18%", marginTop: "50%" }}>
                <legend>Sort by</legend>
                <ul>
  <li>
    <button onClick={() => { loadReviews(localStorage.getItem("filteredProduct"), "ratings") }}>
      {/* Icon for Highest Ratings */}
      <svg
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 24 24"
        height="14"
        width="14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 15l-3.09-6.26L2 9.27l5-4.87-1.18-6.86L12 6.23l6.18-3.26L17 9.14l5 4.87-6.91 1.01L12 15z"></path>
      </svg>
      <span>Highest Ratings</span>
    </button>
  </li>
  <li>
    <button onClick={() => { loadReviews(localStorage.getItem("filteredProduct"), "low") }}>
      {/* Icon for Lowest Ratings */}
      <svg
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 24 24"
        height="14"
        width="14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 9l3.09 6.26L22 14.73l-5 4.87 1.18 6.86L12 17.77l-6.18 3.26L7 14.86l-5-4.87 6.91-1.01L12 9z"></path>
      </svg>
      <span>Lowest Ratings</span>
    </button>
  </li>
  <li>
    <button onClick={() => { loadReviews(localStorage.getItem("filteredProduct"), "image") }}>
      {/* Icon for Image Priority */}
      <svg
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 24 24"
        height="14"
        width="14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2zM5 5h14v14H5zM12 11.5l2.5 3h-5z"></path>
      </svg>
      <span>Image Priority</span>
    </button>
  </li>
</ul>

              </nav>
            </label>
          </div>
          <div className="reviews-container">
            {reviews.map((review) => (
              <div className="review-item" key={review.id}>
                <div style={{ display: "flex", justifyContent: "space-between" }} className="review-name">{review.name}<span>{review.timestamp}</span></div>
                <div
                  className="review-rating"
                  style={{
                    display: "flex", // Align stars in a single line
                    fontSize: "18px", // Adjust font size
                    color: "black", // Set filled star color to black
                  }}
                >
                  <span>
                    {Array(review.rating)
                      .fill("★")
                      .join("")}
                    {Array(5 - review.rating)
                      .fill("☆")
                      .join("")}
                  </span>
                </div>

                <div className="review-text">{review.review}</div>
                {review.imgSrc && (
                  <>
                    <button
                      onClick={() => toggleImage(review.id)}
                      style={{
                        textDecoration: "underline",
                        border: "none",
                        fontSize: "14px",
                        position: "relative",
                        left: "-9px",
                      }}
                    >
                      {showImageIds.includes(review.id) ? "Hide Review Image" : "Show Review Image"}
                    </button>
                    {showImageIds.includes(review.id) && (
                      <img src={review.imgSrc} alt="Review" width={0} height={0} style={{ width: "100px", height: "auto" }}/>
                    )}
                  </>
                )}

                {typeof window !== "undefined" &&
                  new URLSearchParams(window.location.search).has("edit") &&
                  localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY) ===
                  process.env.NEXT_PUBLIC_EDIT_VALUE && (
                    <button
                      className="delete-button"
                      onClick={() => deleteReview(productName, review.id)}
                    >
                      Delete
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

};

export { checkReviewAvailability };
export default Reviews;
