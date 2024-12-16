"use client";
// If you're using Next.js 13 or earlier, ensure React is imported
import React, { useEffect, useState } from 'react';
import "../css/checkout.css";
import { db, storage } from '../firebase'; // Import Firestore and Storage instances
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp, arrayUnion } from 'firebase/firestore'; // Firestore methods including arrayUnion
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'; // Storage methods including deleteObject
import Sizes from "./sizes";
import Reviews from './reviews'
import { handleCart } from './cart';
import Description from "./description"
import { useReviewVisibility } from './reviews';
import { checkReviewAvailability } from './reviews';

import { useSearchParams } from 'next/navigation';
import { fetchSizeChart } from './sizes';
let isAvailable;
let initializePage;
export default function Checkout() {
    const [renderReviews, setRenderReviews] = useState(isAvailable);

    // Initialize the setter from the custom Hook at the top level
    const setReviewVisibility = useReviewVisibility();

    // Use the custom hook

    // Delay the execution by 5 seconds

    function openSizeChart() {
        fetchSizeChart(getQueryParameter("cat"));
    }
    setTimeout(() => {
        isAvailable = checkReviewAvailability();
        console.log("after 5 sec" + " " + isAvailable); // For debugging
        setRenderReviews(isAvailable)
    }, 5000); // 5000 milliseconds = 5 seconds

    const handleClick = () => {
        setReviewVisibility(true);
    };

    const handleReviewClick = () => {
        setReviewVisibility(true);
    };

    useEffect(() => {
        document.getElementById('image-details').addEventListener('scroll', function () {
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
        });
    }, [])


    const [cartItems, setCartItems] = useState([]);
    async function loadProductImages() {
        // Remove all existing slides with the class 'productImages'
        const existingSlides = document.querySelectorAll('.productImages');
        existingSlides.forEach(slide => slide.remove());

        const params = new URLSearchParams(window.location.search);
        const productName = document.getElementById("productName")?.innerText;
        const productImagesDiv = document.getElementById('image-details');
        const isEditMode = params.has('edit');

        if (!productName) {
            console.error('Product name is missing.');
            return;
        }

        try {
            // Fetch product images from Firestore
            const docRef = doc(db, 'productImages', productName);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                const images = docSnapshot.data().images || [];

                images.forEach((imageUrl, index) => {
                    const imageId = `productimage-${index}`;
                    const slideId = `productImagesSlide-${index}`;

                    // Create slide container
                    const slideDiv = document.createElement('div');
                    slideDiv.classList.add('slide', 'productImages');
                    slideDiv.id = slideId;

                    // Create the image element
                    const imgElement = document.createElement('img');
                    imgElement.id = imageId;
                    imgElement.className = 'productsImages';
                    imgElement.src = imageUrl;
                    imgElement.onclick = () => showImage(imageId, imageUrl);

                    // Append the image to the slide container
                    slideDiv.appendChild(imgElement);

                    if (isEditMode && localStorage.getItem("A98398HBFBB93BNABSN") === "fabfbuygi328y902340") {
                        // Create delete icon
                        const deleteIcon = document.createElement('span');
                        deleteIcon.id = `delete-btn-${index}`;
                        deleteIcon.innerHTML = '🗑️';
                        deleteIcon.style.cursor = 'pointer';
                        deleteIcon.style.marginLeft = '10px';
                        deleteIcon.onclick = () => deleteImage(index);

                        // Create edit icon
                        const editIcon = document.createElement('span');
                        editIcon.id = `edit-btn-${index}`;
                        editIcon.innerHTML = '✏️';
                        editIcon.style.cursor = 'pointer';
                        editIcon.style.marginLeft = '10px';
                        editIcon.onclick = () => editImage(index);

                        // Append buttons to the slide container
                        slideDiv.appendChild(deleteIcon);
                        slideDiv.appendChild(editIcon);
                    }

                    // Append the slide container to the parent container
                    productImagesDiv.appendChild(slideDiv);
                });
            }

            if (isEditMode && localStorage.getItem("A98398HBFBB93BNABSN") === "fabfbuygi328y902340") {
                // Add Image button
                if (!document.getElementById("addImgBtn")) {
                    const addButton = document.createElement('button');
                    addButton.innerHTML = 'Add Image';
                    addButton.id = "addImgBtn";
                    addButton.style.cursor = 'pointer';
                    addButton.onclick = addNewImage;
                    document.getElementById("productDetails").appendChild(addButton);
                }
            }
        } catch (error) {
            console.error('Error loading product images:', error);
        }

        // Function to display the selected image
        function showImage(imageId, url) {
            const images = productImagesDiv.getElementsByTagName('img');
            for (let img of images) {
                img.style.border = 'none';
            }
            const selectedImage = document.getElementById(imageId);
            if (selectedImage) {
                selectedImage.style.border = '2px solid Black';
            }
            const mainImage = document.getElementById('MainImg');
            mainImage.src = url;
            mainImage.dataset.selectedImageId = imageId;
        }

        // Function to add a new image
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

                    const docRef = doc(db, 'productImages', productName);
                    const docSnapshot = await getDoc(docRef);

                    if (docSnapshot.exists()) {
                        await updateDoc(docRef, { images: arrayUnion(imageUrl) });
                    } else {
                        await setDoc(docRef, { images: [imageUrl] });
                    }

                    loadProductImages();
                }
            };
            fileInput.click();
        }

        // Function to edit an image
        async function editImage(index) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = async () => {
                const file = fileInput.files[0];
                if (file) {
                    const storageRef = ref(storage, `productImages/${productName}/${file.name}`);
                    await uploadBytes(storageRef, file);
                    const newImageUrl = await getDownloadURL(storageRef);

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

        // Function to delete an image
        async function deleteImage(index) {
            const docRef = doc(db, 'productImages', productName);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                const images = docSnapshot.data().images;
                const [removedImage] = images.splice(index, 1);
                await updateDoc(docRef, { images });

                const imageFileName = decodeURIComponent(removedImage.split('/').pop().split('?')[0]);
                const storageRef = ref(storage, `productImages/${productName}/${imageFileName}`);

                try {
                    await deleteObject(storageRef);
                } catch (error) {
                    if (error.code === 'storage/object-not-found') {
                        console.warn('Image file not found in Firebase Storage. It might have been already deleted.');
                    } else {
                        console.error('Error deleting image from Firebase Storage:', error);
                    }
                }

                // Reload product images regardless of the outcome
                loadProductImages();
            }
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
        document.querySelector(".cross-icon").addEventListener("click", (e) => {
            console.log("ok")
            document.getElementById("success").remove();

        });

        // Remove the message box after a delay and redirect if successful
        setTimeout(() => {
            messageBox.remove();
        }, 5000);
    }



    useEffect(() => {
        initializePage = async () => {
            await addData();


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

            } else {
                console.error("Product name is empty or undefined.");
            }
        };

        initializePage();
    }, []);









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





    function getQueryParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    const [searchParams] = useSearchParams();



    async function addData() {
        console.log("Add Data is Running ");

        // Retrieve data from URL query parameters or local storage
        var productName =
            decodeURIComponent(getQueryParameter("pname")) ||
            localStorage.getItem("productName");
        var productPrice =
            decodeURIComponent(getQueryParameter("pprice")) ||
            localStorage.getItem("productPrice");
        var productImageSrc =
            getQueryParameter("ImageSrc") || localStorage.getItem("productImageSrc");
        var dPrice = decodeURIComponent(getQueryParameter("dPrice")) || ""; // Fetch dPrice from query parameters
        var token = getQueryParameter("token");

        if (productImageSrc) {
            productImageSrc = productImageSrc.replace(/(products\/)/, "products%2F");
            productImageSrc = productImageSrc
                .replace(/ /g, "%20")
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29");

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
                cuttedProductPriceElement.style.textDecoration = "line-through"; // Apply line-through style
            } else {
                cuttedProductPriceElement.innerText = "Not found";
            }
            await loadProductImages();
            // Display image-details and hide imgLoading
            document.getElementById("image-details").style.display = "block";
            document.getElementById("imgLoading").style.display = "none";
            document.querySelector(".loader").style.display = "none";
        } catch (error) {
            console.error("Error loading image:", error);
            // Handle image load error if needed
        }
    }

    useEffect(() => {
        initializePage()
    }, [searchParams]); // Run whenever searchParams changes







    return (
        <>
            {/* <Edit/> */}
            <Sizes />

            <section id="prodetails" className="section-p1">



                <div id="imgLoading" >
                    <div className="card">
                        <div className="card-1"></div>
                        <div className="right">
                            <div className="card-2"></div>
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




                <div className="single-pro-image" id="image-details" style={{ display: 'none', borderRadius: "0" }}>
                    <div className='slide'>
                        <img width="100%" id="MainImg" alt="T shirts" /></div>

                </div>

                <div className="single-pro-details">
                    <div id='productDetails'>
                        <h4 id="productName" style={{ color: "black" }}></h4><div style={{ display: 'flex', columnGap: "3%" }}>


                            <h2 id="productPrice" style={{ color: "black" }}></h2>
                            <h2 id="cuttedProductPrice" style={{ textDecoration: "line-through", color: "black" }}
                            ></h2></div>


                        <br />
                    </div>
                    <button style={{
                        width: " 100%",
                        display: " flex",
                        borderRadius: "0"
                    }}
                        type="submit"
                        className="btn normal"
                        onClick={(event) => {
                            const params = new URLSearchParams(window.location.search);
                            document.querySelector(".cartBtn").innerText = "Add";

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
                    <button style={{ background: "black", display: "flex", color: "white", width: "100%", marginTop: " 6%",
                        justifyContent: "center" }} onClick={(event) => {
                            const params = new URLSearchParams(window.location.search);
                            document.querySelector(".cartBtn").innerText = "checkout";
                            // Extract product details and trim "Rs. " from the price
                            const product = {
                                pic: params.get("ImageSrc"),
                                productName: params.get("pname"),
                                price: params.get("pprice")?.replace("Rs. ", ""),
                                id: Date.now()
                            };

                            // Call handleCart with the product and cart items
                            handleCart(event, product, cartItems, setCartItems);
                            localStorage.setItem("purchase", "0010");


                        }} >
                        Buy it now
                    </button>




                    <br />

                    <Description />





                    <div>


                        <span
                            onClick={() => {
                                openSizeChart();
                            }}



                            style={{
                                textDecoration: "none",
                                color: "black",
                                fontWeight: "lighter",
                                display: "flex",
                                fontSize: "18px",
                                columnGap: "2%",
                                height: "auto",
                                marginLeft: '4%'
                            }}
                        >
                            <img
                                alt="T shirts"
                                src="/logo/sizecharticon.png"
                                style={{ width: "10%" }}
                            />
                            SIZE GUIDE
                        </span>





                        <Reviews
                            productName={(function () {
                                const value = localStorage.getItem("filteredProduct");
                                console.log("Value fetched from localStorage:", value);
                                return value || "";
                            })()}
                        />

                        {renderReviews && <span
                            style={{ textDecoration: "underline", cursor: "pointer", color: "black", marginLeft: "6px" }}
                            onClick={handleClick}
                        >
                            Reviews
                        </span>}
                    </div>





                </div>
            </section>



        </>
    );
}
