"use client";
// If you're using Next.js 13 or earlier, ensure React is imported
import React, { useEffect,useState } from 'react';
import "../css/checkout.css";
import { db, storage } from '../firebase'; // Import Firestore and Storage instances
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp, arrayUnion } from 'firebase/firestore'; // Firestore methods including arrayUnion
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'; // Storage methods including deleteObject
import Sizes from "./sizes";
import { handleCart } from './cart';
import Description from "./description"
export default function Checkout() {
   useEffect(()=>{document.getElementById('image-details').addEventListener('scroll', function () {
    let element = this;
    let scrollTop = element.scrollTop; // How much has been scrolled from the top
    let scrollHeight = element.scrollHeight; // Total scrollable height
    let clientHeight = element.clientHeight; // Visible height of the element

    // Calculate the scroll percentage
    let scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;

    // Adjust the thumb height based on scroll position
    let thumbHeight = (scrollPercent / 100) * (clientHeight); // Set thumb height as a percentage of the visible area
    element.style.setProperty('--scrollbar-thumb-height', thumbHeight + 'px'); // Set height in pixels

    // Ensure the thumb height doesn't go below a minimum size
    if (thumbHeight < 5) { // Set minimum thumb size in pixels
        element.style.setProperty('--scrollbar-thumb-height', '5px');
    } else if (thumbHeight > clientHeight) { // Ensure the thumb height does not exceed visible height
        element.style.setProperty('--scrollbar-thumb-height', clientHeight + 'px');
    }
});},[])
   
    
    const [cartItems, setCartItems] = useState([]);
    async function loadProductImages() {
        const remove = document.getElementById("image-details");
        // Clear the existing content if needed
        //remove.innerHTML = '';
    
        const params = new URLSearchParams(window.location.search);
        const productName = document.getElementById("productName").innerText;
        const productImagesDiv = document.getElementById('image-details');
    
        const isEditMode = params.has('edit');
    
        if (!productName) {
            console.error('Product name is missing.');
            return;
        }
    
        try {
            // Get the document from Firestore
            const docRef = doc(db, 'productImages', productName);
            const docSnapshot = await getDoc(docRef);
    
            if (docSnapshot.exists()) {
                const images = docSnapshot.data().images || [];
    
                images.forEach((imageUrl, index) => {
                    // Create the slide container for each image
                    const slideDiv = document.createElement('div');
                    slideDiv.classList.add('slide'); // Add the 'slide' class
                    
                    // Create the image element
                    const imgElement = document.createElement('img');
                    imgElement.id = index;
                    imgElement.src = imageUrl;
                    imgElement.style.width = '100%'; // Example styling
                    imgElement.style.height = '100%';
                   
                    
                    
                    imgElement.style.position = 'static';
                    imgElement.style.cursor = 'pointer'; // Make the image appear clickable
    
                    // Set the image's onclick event to trigger the showImage function with imageUrl
                    imgElement.onclick = () => showImage(index, imageUrl);
    
                    // Append the image to the slide container
                    slideDiv.appendChild(imgElement);
    
                    // Append the slide container to the parent container (productImagesDiv)
                    productImagesDiv.appendChild(slideDiv);
    
                    if (isEditMode && localStorage.getItem("A98398HBFBB93BNABSN") == "fabfbuygi328y902340") {
                        // Create the delete icon
                        const deleteIcon = document.createElement('span');
                        deleteIcon.innerHTML = '🗑️';
                        deleteIcon.style.top = '5px';
                        deleteIcon.style.right = '5px';
                        deleteIcon.style.cursor = 'pointer';
                        deleteIcon.style.display = 'flex';
                        deleteIcon.onclick = () => deleteImage(index, imageUrl);
                        slideDiv.appendChild(deleteIcon);
    
                        // Create the pencil icon for editing
                        const pencilIcon = document.createElement('span');
                        pencilIcon.innerHTML = '✏️';
                        pencilIcon.style.display = 'flex';
                        pencilIcon.style.top = '5px';
                        pencilIcon.style.right = '30px';
                        pencilIcon.style.cursor = 'pointer';
                        pencilIcon.onclick = () => editImage(index, imageUrl);
                        slideDiv.appendChild(pencilIcon);
                    }
                });
            }
    
            if (isEditMode && localStorage.getItem("A98398HBFBB93BNABSN") == "fabfbuygi328y902340") {
                // Create the Add Image button
                if(!document.getElementById("addImgBtn")){
                const addIcon = document.createElement('button');
                addIcon.innerHTML = 'Add Image';
                addIcon.id = "addImgBtn";
                addIcon.style.fontSize = '21px';
                addIcon.style.cursor = 'pointer';
                addIcon.style.marginBottom = '3%';
                addIcon.style.marginTop = '3%';
                addIcon.style.backgroundColor = 'white';
                addIcon.style.color = 'black';
                addIcon.style.fontWeight = 'light';
                
                addIcon.onclick = addNewImage;
    
                document.getElementById("productDetails").appendChild(addIcon);
                }
            }
        } catch (error) {
            console.error('Error loading product images:', error);
        }
    
        // Function to display the selected image
        function showImage(index, url) {
            const container = document.getElementById('productImages');
            const images = container.getElementsByTagName('img');
    
            // Remove border from all images
            for (let i = 0; i < images.length; i++) {
                images[i].style.border = 'none';
            }
    
            // Add border to selected image
            const selectedImage = document.getElementById(index);
            if (selectedImage) {
                selectedImage.style.border = '2px solid Black';
            }
    
            // Update the main image
            const main = document.getElementById('MainImg');
            main.src = url;
            main.dataset.selectedImageId = index;
        }
  
  function detectSwipeDirection(startX, endX) {
      const diffX = endX - startX;
  
      if (Math.abs(diffX) > 30) { // Threshold for swipe detection
          return diffX > 0 ? 'left' : 'right';
      }
      return null;
  }
  
 
  
  
  
  // Attach swipe handler to the MainImg element
  const mainImg = document.getElementById('MainImg');

  
  
      async function addNewImage() {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          fileInput.onchange = async () => {
              const file = fileInput.files[0];
              if (file) {
                  const storageRef = ref(storage, `productImages/${productName}/${file.name}`);
                  await uploadBytes(storageRef, file);
                  const imageUrl = await getDownloadURL(storageRef);
  
                  // Update Firestore
                  const docRef = doc(db, 'productImages', productName);
                  const docSnapshot = await getDoc(docRef);
  
                  if (docSnapshot.exists()) {
                      await updateDoc(docRef, {
                          images: arrayUnion(imageUrl)
                      });
                  } else {
                      await setDoc(docRef, {
                          images: [imageUrl]
                      });
                  }
  
                  loadProductImages();
              }
          };
          fileInput.click();
      }
  
      async function editImage(index, imageUrl) {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          fileInput.onchange = async () => {
              const file = fileInput.files[0];
              if (file) {
                  const storageRef = ref(storage, `productImages/${productName}/${file.name}`);
                  await uploadBytes(storageRef, file);
                  const newImageUrl = await getDownloadURL(storageRef);
  
                  // Update Firestore
                  const docRef = doc(db, 'productImages', productName);
                  const docSnapshot = await getDoc(docRef);
  
                  if (docSnapshot.exists()) {
                      const images = docSnapshot.data().images;
                      images[index] = newImageUrl;
  
                      await updateDoc(docRef, { images });
                  }
  
                  loadProductImages();
              }
          };
          fileInput.click();
      }
  
      async function deleteImage(index, imageUrl) {
      const docRef = doc(db, 'productImages', productName);
      const docSnapshot = await getDoc(docRef);
  
      if (docSnapshot.exists()) {
          const images = docSnapshot.data().images;
          images.splice(index, 1);
  
          await updateDoc(docRef, { images });
  
          // Extract and decode the image file name
          const imageFileName = decodeURIComponent(imageUrl.split('/').pop().split('?')[0]);
  
          // Create a reference to the image in Firebase Storage
          const storageRef = ref(storage, `productImages/${productName}/${imageFileName}`);
  
          // Delete the image from Firebase Storage
          await deleteObject(storageRef);
  
          // Reload the images after deletion
          loadProductImages();
      }
    }
  }

  async function deleteReview(productName, docId) {
    try {
        // Reference to the document to delete in the "userReviews" subcollection
      
        const docRef = doc(db, "reviews", productName, "userReviews", docId);

        // Delete the document
        await deleteDoc(docRef);

        // Reload reviews after deletion
        loadReviews(productName);
    } catch (error) {
        console.error("Error deleting document: ", error);
    }
}

    
         
    function showMessageBox(message, subMessage, isSuccess) {
        // Create the message box element
        const messageBox = document.createElement('div');
        messageBox.classList.add('card');
    messageBox.id = 'success';
        // Set the icon color and background color based on success or failure
        const iconColor = isSuccess ? '#269b24' : '#e74c3c'; // Green for success, Red for failure
        const backgroundColor = isSuccess ? '#04e40048' : '#e74c3c'; // Light green or red for background
    
        messageBox.innerHTML = `
            <svg class="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
                    fill-opacity="1"
                    style="fill: ${backgroundColor};"
                ></path>
            </svg>
    
            <div class="icon-container" style="background-color: ${backgroundColor};">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    stroke-width="0"
                    fill="currentColor"
                    stroke="currentColor"
                    class="icon"
                    style="color: ${iconColor};"
                >
                    <path
                        d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
                    ></path>
                </svg>
            </div>
            <div class="message-text-container">
                <p class="message-text">${message}</p>
                <p class="sub-text">${subMessage}</p>
            </div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 15 15"
                stroke-width="0"
                fill="none"
                stroke="currentColor"
                class="cross-icon"
            >
                <path
                    fill="currentColor"
                    d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                    clip-rule="evenodd"
                    fill-rule="evenodd"
                ></path>
            </svg>
        `;
    
        // Append the message box to the body
        document.body.appendChild(messageBox);
    
        // Apply dynamic CSS styles
        const style = document.createElement('style');
        style.innerHTML = `
            .card {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 330px;
                height: 80px;
                border-radius: 8px;
                box-sizing: border-box;
                padding: 10px 15px;
                background-color: #ffffff;
                box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: space-around;
                gap: 15px;
            }
            .wave {
                position: absolute;
                transform: rotate(90deg);
                left: -31px;
                top: 32px;
                width: 80px;
                fill: ${backgroundColor};
            }
            .icon-container {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .message-text-container {
                margin-left: 15px;
            }
            .message-text {
                font-size: 14px;
                color: #333;
            }
            .sub-text {
                font-size: 12px;
                color: #666;
            }
            .cross-icon {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 15px;
                height: 15px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        document.querySelector(".cross-icon").addEventListener ("click",(e)=>{
    console.log("ok")
    document.getElementById("success").remove();
    
    });
    
        // Remove the message box after a delay and redirect if successful
        setTimeout(() => {
            messageBox.remove();
        }, 5000); 
    }
            
   
    
      
    useEffect(() => {
        const initializePage = async () => {
          await addData();
          await loadProductImages();
      
          let productName = document.getElementById("productName").innerText;
      
          // List of color names to be removed from productName
          const colorNames = ["red", "green", "blue", "yellow", "black", "white", "gray", "orange", "purple", "brown", "pink"];
          colorNames.forEach(color => {
            const regex = new RegExp(`\\s*[\\(\\{\\[].*?${color}.*?[\\)\\}\\]]|\\s*\\b\\w*\\b\\s*${color}`, 'gi');
            productName = productName.replace(regex, '');
          });
      
          localStorage.setItem("filteredProduct", productName.trim());
          console.log(productName.trim());
      
          if (productName) {
            updateSizeOptions(productName);
            loadReviews(productName);
          } else {
            console.error("Product name is empty or undefined.");
          }
        };
      
        initializePage();
      }, []);
      

      
    

      async function loadReviews(productName, priority = "new") {
        console.log("Loading Reviews");
    
        const reviewsContainer = document.getElementById("reviews");
        const urlParams = new URLSearchParams(window.location.search);
        const isEditMode = urlParams.has('edit');
    
        let countReviews = 0;
        let totalRating = 0;
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let reviews = []; // Array to store reviews for sorting later
    
        try {
           
            // Clear the reviews container
            reviewsContainer.innerHTML = '';
    
            // Fetch the document references from the "userReviews" subcollection for the given product
            const querySnapshot = await getDocs(collection(db, "reviews", productName, "userReviews"));
    
            if (querySnapshot.empty) {
                const noReviewsMessage = document.createElement('p');
                noReviewsMessage.textContent = 'No reviews available because this functionality is added recently';
                reviewsContainer.appendChild(noReviewsMessage);
            } else {
                querySnapshot.forEach((docSnap) => {
                    if (docSnap.exists()) {
                        countReviews++;
                        const data = docSnap.data();
                        const rating = data.rating;
                        const timestamp = new Date(data.timestamp); // Assuming timestamp is in the format you provided
    
                        // Update total rating and rating counts for average calculation and breakdown
                        totalRating += rating;
                        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    
                        // Prepare review data for sorting
                        reviews.push({
                            id: docSnap.id,
                            data,
                            timestamp,
                            rating,
                            hasImage: Boolean(data.imgSrc)
                        });
                    } else {
                        console.log("No such document!");
                    }
                });
    
                // Sort reviews based on priority
                if (priority === "new") {
                    reviews.sort((a, b) => b.timestamp - a.timestamp); // Newest to oldest
                } else if (priority === "photo") {
                    reviews.sort((a, b) => b.hasImage - a.hasImage || b.timestamp - a.timestamp); // Photos first, then by newest
                } else if (priority === "ratings") {
                    reviews.sort((a, b) => b.rating - a.rating); // High to low ratings
                } else if (priority === "lowestratings") {
                    reviews.sort((a, b) => a.rating - b.rating); // Low to high ratings
                }
    
                // Render sorted reviews
                reviews.forEach((review) => {
                    const { id, data, rating, hasImage } = review;
                    const reviewDiv = document.createElement('div');
                    reviewDiv.value = id;
                    reviewDiv.classList.add('review');
    
                    const imgSrc = hasImage ? `<img src="${data.imgSrc}" alt="Review Image">` : '';
                    const ratingStars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    
                    reviewDiv.innerHTML = `
                        ${imgSrc}
                        <strong>${data.name}</strong>
                        <div class="rating">${ratingStars}</div>
                        <p>${data.review}</p>
                    `;
    
                    // Only add the delete button if in edit mode and authenticated
                    if (isEditMode && localStorage.getItem("A98398HBFBB93BNABSN") === "fabfbuygi328y902340") {
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Delete';
                        deleteButton.style.position = 'absolute';
                        deleteButton.style.top = '-3%';
                        deleteButton.style.backgroundColor = 'red';
                        deleteButton.style.height = '19px';
                        deleteButton.style.cursor = 'pointer';
    
                        deleteButton.onclick = async () => {
                            await deleteReview(productName, id);
                            await loadReviews(productName); // Reload reviews after deletion
                        };
                        reviewDiv.style.position = 'relative';
                        reviewDiv.appendChild(deleteButton);
                    }
    
                    reviewsContainer.appendChild(reviewDiv);
                });
            }
    
            // Calculate average rating and set the totalReviews text
            const averageRating = countReviews > 0 ? (totalRating / countReviews).toFixed(1) : 0.0;
            
            document.querySelector(".countRevs").innerText = countReviews > 0 ? countReviews : 0;
            // Update the main rating display
            document.querySelector("#averageRating").innerText = averageRating;
            document.querySelector(".countRates").innerText = averageRating;
            document.querySelector("#ratingStars").innerText = '★'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating));
    
            // Update the meter lines for each star rating
            [5, 4, 3, 2, 1].forEach(star => {
                const percentage = countReviews > 0 ? (ratingCounts[star] / countReviews) * 100 : 0;
                document.querySelector(`#star${star}Meter`).style.width = `${percentage}%`;
                document.querySelector(`#star${star}Count`).innerText = ratingCounts[star];
            });
        } catch (error) {
            console.error("Error fetching documents: ", error);
        }
    }
    
    





    
function updateSizeOptions(productName) {
    try {
        // Access Firestore collection and document
        const productRef = doc(collection(db, "clothsims"), productName);

        // Get document data asynchronously
        getDoc(productRef)
          .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();

                // Convert size fields from strings to integers
                const sizes = {
                    s: parseInt(data.s, 10),
                    m: parseInt(data.m, 10),
                    l: parseInt(data.l, 10)
                };

                // Update size options based on availability
                updateSizeElement(sizes.s, 's1');
                updateSizeElement(sizes.m, 's2');
                updateSizeElement(sizes.l, 's3');
            } else {
                console.error("Document does not exist for product:", productName);
            }
          })
          .catch((error) => {
            console.error("Error getting document:", error);
          });
    } catch (error) {
        console.error("Error updating size options:", error);
    }
}


useEffect(()=>{    document.getElementById('reviewForm').addEventListener('submit', async function(event) {
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
          document.getElementById('reviewFormContainer').style.display = 'none';
          loadReviews(product);
      });
      
      async function uploadImage(file) {
        const storageRef = ref(storage, 'productReviews/' + file.name); // Create a reference to the storage location
        const snapshot = await uploadBytes(storageRef, file); // Upload the file
        const downloadURL = await getDownloadURL(snapshot.ref); // Get the download URL
        return downloadURL;
    }
    
      function generateRandom6Digit() {
          return Math.floor(100000 + Math.random() * 900000);
      }

}, []);
    


    

       
    function getQueryParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    async function addData() {
        console.log("Add Data is Running ");
        
        // Retrieve data from URL query parameters or local storage
        var productName = decodeURIComponent(getQueryParameter("pname")) || localStorage.getItem("productName");
        var productPrice = decodeURIComponent(getQueryParameter("pprice")) || localStorage.getItem("productPrice");
        var productImageSrc = getQueryParameter("ImageSrc") || localStorage.getItem("productImageSrc");
        var dPrice = decodeURIComponent(getQueryParameter("dPrice")) || "";  // Fetch dPrice from query parameters
        var token = getQueryParameter("token");
    
        if (productImageSrc) {
            productImageSrc = productImageSrc.replace(/(products\/)/, 'products%2F');
            productImageSrc = productImageSrc.replace(/ /g, '%20')
                                             .replace(/\(/g, '%28')
                                             .replace(/\)/g, '%29');
            
            if (token) {
                productImageSrc += `&token=${token}`;
            }
        } else {
            productImageSrc = localStorage.getItem("productImageSrc");
        }
    
        // Update the product details in the HTML
        var productNameElement = document.getElementById("productName");
        var productPriceElement = document.getElementById("productPrice");
        var mainImgElement = document.getElementById("MainImg");
        var cuttedProductPriceElement = document.getElementById("cuttedProductPrice");
    
        // Function to load an image and return a Promise
        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(src);
                img.onerror = () => reject(new Error("Image failed to load"));
            });
        }
    
        try {
            // Update product image and wait for it to load
            if (productImageSrc) {
                await loadImage(productImageSrc);
                mainImgElement.src = productImageSrc;
            } else {
                showMessageBox("Image Not found", "Contact Us if not Resolved", false);
            }
    
            // Update product name
            productNameElement.innerText = productName || "Not found";
    
            // Update product price
            productPriceElement.innerText = productPrice || "Not found";
    
            // Update cutted price if dPrice is available
            if (dPrice) {
                cuttedProductPriceElement.innerText = `Rs. ${dPrice}`;
                cuttedProductPriceElement.style.textDecoration = "line-through";  // Apply line-through style
            } else {
                cuttedProductPriceElement.innerText = "Not found";
            }
    
            // Display image-details and hide imgLoading
            document.getElementById("image-details").style.display = 'block';
            document.getElementById("imgLoading").style.display = 'none';
            
        } catch (error) {
            console.error("Error loading image:", error);
            // Handle image load error if needed
        }
    }
    

   

    function displayReviewForm() {
        document.getElementById("reviewFormContainer").style.display = 'block';
    }

    

    return (
        <>
        
        
            <section id="prodetails" className="section-p1">



                
                <div id="imgLoading" >
                    <div className="card">
                        <div className="card-1"></div>
                        <div className="right">
                            <div className="card-2"></div>
                            <div className="card-3"></div>
                            <div className="card-3"></div>
                            <div className="card-3"></div>
                            <div className="card-3"></div>
                            <div className="bottom">
                                <div className="card-4"></div>
                                <div className="card-4"></div>
                                <div className="card-4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                


                <div className="single-pro-image" id="image-details" style={{ display: 'none',borderRadius:"0"}}>
                    <div className='slide'>
                    <img src="" width="100%" id="MainImg" alt="T shirts"  /></div>
                    
                </div>

                <div className="single-pro-details">
                    <div id='productDetails'>
                        <h4 id="productName" style={{color:"black"}}></h4><div style={{display:'flex',columnGap:"3%"}}>

                        
                        <h2  id="productPrice" style={{color:"black"}}></h2>
                        <h2 id="cuttedProductPrice" style={{ textDecoration: "line-through", color: "black" }}
 ></h2></div>

                        
                        <br />
                    </div>
                    <button  style={{    width:" 100%",
    display:" flex",
    borderRadius:"0"}}
    type="submit" 
    className="btn normal"
    onClick={(event) => {
        const params = new URLSearchParams(window.location.search);
        document.querySelector(".cartBtn").innerText= "Add";

        // Extract product details and trim "Rs. " from the price
        const product = {
            pic: params.get("ImageSrc"),
            productName: params.get("pname"),
            price: params.get("pprice")?.replace("Rs. ", ""), // Remove "Rs. " from price
            id: Date.now() // Generate unique ID based on current time
        };

        // Call handleCart with the product and cart items
        handleCart(event, product, cartItems, setCartItems);
    }}
>
    Add to Cart
</button>
<button style={{background:"black",display:"flex",color:"white",width:"100%",marginTop:" 6%",
    justifyContent: "center"}} onClick={(event) => {
        const params = new URLSearchParams(window.location.search);
        document.querySelector(".cartBtn").innerText= "checkout";
        // Extract product details and trim "Rs. " from the price
        const product = {
            pic: params.get("ImageSrc"),
            productName: params.get("pname"),
            price: params.get("pprice")?.replace("Rs. ", ""), 
            id: Date.now() 
        };

        // Call handleCart with the product and cart items
        handleCart(event, product, cartItems, setCartItems);
        localStorage.setItem("purchase","0010");
        
        
    }} >
    Buy it now
</button>

                    
                
                                    

                    <br />
                    <Description/>
                   
                   






                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
    <h2 style={{ marginTop: "20px" ,color:"black",fontWeight:"bolder"}}>Customer Reviews</h2>




    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1 id="averageRating" style={{color:"black",fontWeight:"bolder",fontSize:"20px"}}></h1>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <span id="ratingStars" style={{ color: "orange",fontSize:"27px" }}></span><br />
            
        </div>


        <div class="cardx">
  <div class="stats-wrapper">
    <p class="heading">Rating</p>
    <div class="bottom-wrapper">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="star">
        <g data-name="Layer 2">
          <g data-name="star">
            <rect
              opacity="0"
              transform="rotate(90 12 12)"
              height="24"
              width="24"
            ></rect>
            <path
              d="M17.56 21a1 1 0 0 1-.46-.11L12 18.22l-5.1 2.67a1 1 0 0 1-1.45-1.06l1-5.63-4.12-4a1 1 0 0 1-.25-1 1 1 0 0 1 .81-.68l5.7-.83 2.51-5.13a1 1 0 0 1 1.8 0l2.54 5.12 5.7.83a1 1 0 0 1 .81.68 1 1 0 0 1-.25 1l-4.12 4 1 5.63a1 1 0 0 1-.4 1 1 1 0 0 1-.62.18z"
            ></path>
          </g>
        </g>
      </svg>
      <p class="countRates">4.5</p>
    </div>
  </div>
  <div class="stats-wrapper">
    <p class="heading">Review</p>
    <div class="bottom-wrapper">
      <svg
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        class="thumb"
      >
        <path
          d="M472.06 334l-144.16-6.13c-4.61-.36-23.9-1.21-23.9-25.87 0-23.81 19.16-25.33 24.14-25.88L472.06 270c12.67.13 23.94 14.43 23.94 32s-11.27 31.87-23.94 32zM330.61 202.33L437.35 194C450 194 464 210.68 464 227.88v.33c0 16.32-11.14 29.62-24.88 29.79l-108.45-1.73C304 253 304 236.83 304 229.88c0-22.88 21.8-27.15 26.61-27.55zM421.85 480l-89.37-8.93C308 470.14 304 453.82 304 443.59c0-18.38 13.41-24.6 26.67-24.6l91-3c14.54.23 26.32 14.5 26.32 32s-11.67 31.67-26.14 32.01zm34.36-71.5l-126.4-6.21c-9.39-.63-25.81-3-25.81-26.37 0-12 4.35-25.61 25-27.53l127.19-3.88c13.16.14 23.81 13.49 23.81 31.4s-10.65 32.43-23.79 32.58z"
        ></path>
        <path
          fill="none"
          d="M133.55 238.06A15.85 15.85 0 01126 240a15.82 15.82 0 007.51-1.92zM174.14 168.78l.13-.23-.13.23c-20.5 35.51-30.36 54.95-33.82 62 3.47-7.07 13.34-26.51 33.82-62z"
        ></path>
        <path
          d="M139.34 232.84l1-2a16.27 16.27 0 01-6.77 7.25 16.35 16.35 0 005.77-5.25z"
        ></path>
        <path
          d="M316.06 52.62C306.63 39.32 291 32 272 32a16 16 0 00-14.31 8.84c-3 6.07-15.25 24-28.19 42.91-18 26.33-40.35 59.07-55.23 84.8l-.13.23c-20.48 35.49-30.35 54.93-33.82 62l-1 2a16.35 16.35 0 01-5.79 5.22 15.82 15.82 0 01-7.53 2h-25.31A84.69 84.69 0 0016 324.69v38.61a84.69 84.69 0 0084.69 84.7h48.79a17.55 17.55 0 019.58 2.89C182 465.87 225.34 480 272 480c7.45 0 14.19-.14 20.27-.38a8 8 0 006.2-12.68l-.1-.14C289.8 454.41 288 441 288 432a61.2 61.2 0 015.19-24.77 17.36 17.36 0 000-14.05 63.81 63.81 0 010-50.39 17.32 17.32 0 000-14 62.15 62.15 0 010-49.59 18.13 18.13 0 000-14.68A60.33 60.33 0 01288 239c0-8.2 2-21.3 8-31.19a15.63 15.63 0 001.14-13.64c-.38-1-.76-2.07-1.13-3.17a24.84 24.84 0 01-.86-11.58c3-19.34 9.67-36.29 16.74-54.16 3.08-7.78 6.27-15.82 9.22-24.26 6.14-17.57 4.3-35.2-5.05-48.38z"
        ></path>
      </svg>
      <p style={{width:"50%"}} class="countRevs">1.1k</p>
    </div>
  </div>
  <div class="stats-wrapper">
    <p class="heading">Sells</p>
    <div class="bottom-wrapper">
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="tag">
        <path
          d="M448 183.8v-123A44.66 44.66 0 00403.29 16H280.36a30.62 30.62 0 00-21.51 8.89L13.09 270.58a44.86 44.86 0 000 63.34l117 117a44.84 44.84 0 0063.33 0l245.69-245.61A30.6 30.6 0 00448 183.8zM352 144a32 32 0 1132-32 32 32 0 01-32 32z"
        ></path>
        <path
          d="M496 64a16 16 0 00-16 16v127.37L218.69 468.69a16 16 0 1022.62 22.62l262-262A29.84 29.84 0 00512 208V80a16 16 0 00-16-16z"
        ></path>
      </svg>
      <p class="count">2.1k</p>
    </div>
  </div>
</div>




        <div style={{ width: "200px", marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>5 Star</span>
                <span id="star5Count">0</span>
            </div>
            <div id="star5Meter" style={{ height: "10px", backgroundColor: "orange", width: "0%",borderRadius:"12%" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>4 Star</span>
                <span id="star4Count">0</span>
            </div>
            <div id="star4Meter" style={{ height: "10px", backgroundColor: "gold", width: "0%",borderRadius:"12%" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>3 Star</span>
                <span id="star3Count">0</span>
            </div>
            <div id="star3Meter" style={{ height: "10px", backgroundColor: "grey", width: "0%",borderRadius:"12%" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>2 Star</span>
                <span id="star2Count">0</span>
            </div>
            <div id="star2Meter" style={{ height: "10px", backgroundColor: "lightgray", width: "0%",borderRadius:"12%" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>1 Star</span>
                <span id="star1Count">0</span>
            </div>
            <div id="star1Meter" style={{ height: "10px", backgroundColor: "lightgray", width: "0%",borderRadius:"12%" }}></div>
        </div>
        



        

        
        <div style={{display:"flex"}}>



            
        <button onClick={displayReviewForm} style={{ marginTop: "10px", marginBottom: "7%" }}>Write a Review</button> 
        <label className="popup">
  <input type="checkbox" />
  <div
    className="burger"
    tabIndex="0"
    style={{
      background: "white",
      marginTop: "37%",
      border: "1px solid black",
      borderRadius: "0",
      marginLeft: "22%",
      transform: "scale(1.2)",
      
    }} 
  >
    <span></span>
    <span></span>
    <span></span>
  </div>
  <nav className="popup-window" style={{maringLeft:"-18%",marginTop:"50%"}}>
    <legend>Sort by</legend>
    <ul>
      <li>
        <button onClick={()=>{loadReviews(localStorage.getItem("filteredProduct"),"photo")}}>
          {/* Icon for Photo Priority */}
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
            <path d="M20 5H4v14h16V5zM10 15l-2.5-3h5L10 15z"></path>
          </svg>
          <span>Photo Priority</span>
        </button>
      </li>
      <li>
        <button onClick={()=>{loadReviews(localStorage.getItem("filteredProduct"),"new")}}>
          {/* Icon for Newest */}
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
            <path d="M13 4l-1 1h-3l1-1h3zM6 10h3l-1 1H6zm6 7l-1 1h-3l1-1h3zM19 10h-3l1-1h3z"></path>
          </svg>
          <span>Newest</span>
        </button>
      </li>
      <li>
        <button onClick={()=>{loadReviews(localStorage.getItem("filteredProduct"),"ratings")}}>
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
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.26L7 14.14l-5-4.87 6.91-1.01L12 2z"></path>
          </svg>
          <span>Highest Ratings</span>
        </button>
      </li>
      <li>
        <button onClick={()=>{loadReviews(localStorage.getItem("filteredProduct"),"lowestratings")}}>
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
            <path d="M12 15l-3.09-6.26L2 9.27l5-4.87-1.18-6.86L12 6.23l6.18-3.26L17 9.14l5 4.87-6.91 1.01L12 15z"></path>
          </svg>
          <span>Lowest Ratings</span>
        </button>
      </li>
    </ul>
  </nav>
</label>

</div>

    </div>
    
    <hr/><br/> <div className="reviews" id="reviews"></div>
</div><br/>
<hr/>

                </div>
            </section>
            <div className="review-form" id="reviewFormContainer" style={{ display: 'none', width: '100%', position: 'fixed', maxWidth: '320px', padding: '15px', border: '3px solid grey', textAlign: 'left', top: '100px', left: '8%', background: '#fff', borderRadius: '20px', margin: '0 auto' }}>
  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#333' }}>Post Review</h2>
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

    <button type="submit" id="postReview" style={{ border: '0', background: '#111', color: '#fff', padding: '0.68em', borderRadius: '14px', fontWeight: 'bold' }}>Submit</button>
  </form>
</div>

        </>
    );
}
