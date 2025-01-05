"use client"
import React, { useEffect, useState } from 'react';

import '../css/dashboard.css'
import { db, storage } from '../firebase'; // Import Firestore and Storage instances
import { doc,updateDoc, getDoc, setDoc, deleteDoc, collection, getDocs,serverTimestamp } from 'firebase/firestore'; // Firestore methods
import { ref, getDownloadURL } from 'firebase/storage'; // Storage methods

import serverWorker from '../utilis/serverworker';
import sendWhatsapp from '../utilis/sendWhatsapp';
import postOrder from '../utilis/postOrder'
function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar.style.left === '-164px') {
        sidebar.style.left = '0px';
    } else if (sidebar.style.left === '0px') {
        sidebar.style.left = '-164px';
    }
}

    
     async function dispatchOrder(orderData, orderDocID) {
        var confirmed = confirm("Are you sure?");
        
        // If the user confirms, perform the dispatch
        if (confirmed) {
            
            let isDispatching = false; // Prevent multiple simultaneous dispatches
    
            if (isDispatching) {
                console.warn("Dispatch already in progress. Skipping duplicate calls.");
                return;
            }
    
            isDispatching = true;
    
            try {
                console.log("Dispatch process started", { orderData, orderDocID });
    
                const docRefOrders = doc(db, "orders", orderDocID);
                const docRefDispatched = doc(db, "dispatched", orderDocID);
                const docRefFinance = doc(db, "bank", "finance");
    
                // Fetch the order document
                const orderDocSnapshot = await getDoc(doc(db, "orders", orderDocID));
                let petrol;
    
                if (orderDocSnapshot.exists()) {
                    const orderDocData = orderDocSnapshot.data();
                    console.log("Order document fetched successfully", orderDocData);
    
                    petrol = orderDocData.petrol;
    
                    // Update orderData with fetched values
                    orderData.petrol = petrol || 0;
                    orderData.tracking = orderDocData.tracking || 0;
                    orderData.trackingLink = orderDocData.trackingLink || "";
                    orderData.profit = orderDocData.profit || 0;
                    orderData.productCP = orderDocData.productCP || 0;
                    orderData.productSP = orderDocData.productSP || 0;
    
                    // Call postOrder with relevant data
                    const postOrderResponse = await postOrder(
                       orderDocID
                    );
    
                    console.log("Response from postOrder", postOrderResponse);
    
                    if (postOrderResponse.tracking) {
                        orderData.tracking = postOrderResponse.tracking;
                        orderData.trackingLink = `${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}/tracking`;
                    }
                }
    
                const sanitizedOrderData = Object.fromEntries(
                    Object.entries(orderData).map(([key, value]) => [key, value === undefined ? "" : value])
                );
    
                console.log("Sanitized order data before dispatch", sanitizedOrderData);
    
                await setDoc(docRefDispatched, sanitizedOrderData);
                console.log("Order moved to dispatched collection successfully");
    
                await deleteDoc(docRefOrders);
                console.log("Order removed from orders collection successfully");
    
                const financeSnapshot = await getDoc(docRefFinance);
                const currentTotalPetrol = financeSnapshot.data().totalPetrol || 0;
                const updatedTotalPetrol = currentTotalPetrol + petrol;
    
                await updateDoc(docRefFinance, { totalPetrol: updatedTotalPetrol });
                console.log("Finance collection updated with petrol value", updatedTotalPetrol);
    
                await decrementStock(orderData);
                console.log("Stock decremented successfully");
    
                const contact = orderData.Contact.substring(0, 11);
    
                if (contact && /^\d{10,12}$/.test(contact)) {
                    let customerContact = contact;
                    if (customerContact.startsWith("0")) {
                        customerContact = "92" + customerContact.slice(1);
                    }
    
                    let message = `Your Order Dispatched from TSOA \n\n` +
                        `Dear ${orderData.Name},\n\n` +
                        `Your ${orderData.productName} has been dispatched!\n\n`;
    
                    if (orderData.tracking) {
                        message += `Tracking Link: ${orderData.trackingLink}\n` +
                            `Tracking Number: ${orderData.tracking}\n\n`;
                    }
    
                    message += `Thank you for choosing TSOA. Feel free to track your order for real-time updates.\n\n` +
                        `Regards,\TSOA Team`;
    
                    console.log("Prepared WhatsApp message", message);
    
                    if (confirm("Do you want to send the dispatch message to the customer?")) {
                        sendWhatsapp(customerContact, message)
                            .then(() => console.log("Message sent successfully for dispatch"))
                            .catch((error) => console.error("Error sending message:", error));
                    }
                } else {
                    console.warn("Invalid customer contact number. Unable to send WhatsApp message.");
                    alert("Invalid customer contact number. Unable to send WhatsApp message.");
                }
            } catch (error) {
                console.error("Error dispatching order: ", error);
                alert(`An error occurred while dispatching: ${error.message}`);
            } finally {
                isDispatching = false;
            }
        };
    
        // Ensure only one event listener is attached
        const dispatchButton = document.querySelector(".dispatchButton"); // Updated to match your HTML
        if (dispatchButton && !dispatchButton.hasAttribute("data-listener-attached")) {
            dispatchButton.addEventListener("click", dispatchOrder);
            dispatchButton.setAttribute("data-listener-attached", "true");
        } else if (!dispatchButton) {
            console.error("Dispatch button not found on the page.");
        }
    
        
    }
export default function DashboardComponent() {
  
    // serverWorker();

    
    
  useEffect(()=>{
    let sortedDocs;
    let editButtons;
    let createdOrdersDisplayed;
        createdOrdersDisplayed = false;
        let createdCounter;
    async function getOrders(collectionID) {
        const loader = document.getElementById('loader');
        loader.style.display = 'block';
        const querySnapshot = await getDocs(collection(db, collectionID));
        document.getElementById('addData').style.display = 'none';
        document.getElementById('count').textContent = querySnapshot.size;
        document.getElementById('circleGraph').style.display = 'none';
        document.getElementById('financeChart').style.display = 'none';

        async function updateConfirm() {
            const querySnapshot = await getDocs(collection(db, 'orders'));
            const confirmButtons = document.querySelectorAll('.confirmButton');
            editButtons = document.querySelectorAll('.editButton');
            if (collectionID === "dispatched") {
                editButtons.forEach(button => button.style.display = 'none');
            }

            confirmButtons.forEach(confirmBtn => {
                let docElement = confirmBtn.closest('div').querySelector('#docid');
                if (docElement) {
                    const docid = docElement.innerText.trim();
                    let found = false;
                    querySnapshot.forEach(docSnapshot => {
                        if (docSnapshot.id === docid) {
                            found = true;
                            const data = docSnapshot.data();
                            if (data && data.confirm) {
                                confirmBtn.innerText = data.confirm;
                                confirmBtn.style.backgroundColor = 'darkblue';
                            } else {
                                console.log('No confirm field found in the document.');
                            }
                        }
                    });
                    if (!found) {
                        console.log('No such document!');
                    }
                } else {
                    console.log('Element with ID "docid" not found in the parent div.');
                }
            });
        }

        if (querySnapshot.empty) {
            document.getElementById('countDisplay').textContent = 0;
            console.log("No documents found!");
            document.getElementById('dataDisplay').innerHTML = "No documents found.";
        } else {
            const title = document.getElementById("title");
            const writes = document.getElementById("writes");
            title.innerHTML = `<strong style="margin-left: 2px;font-weight: bolder;font-size: 20px;">${collectionID === "dispatched" ? "DISPATCHED" : "NEW ORDERS"}</strong>`;
            writes.style.display = 'block';
            const dataDisplay = document.getElementById('dataDisplay');
            dataDisplay.style.display = 'block';
            dataDisplay.innerHTML = "";

            let newCounter = 1;
            createdCounter = 1;
            let createdOrdersDisplayed = false;

            sortedDocs = querySnapshot.docs.sort((a, b) => {
                const dateA = new Date(a.data().Date || a.data().orderedDate);
                const dateB = new Date(b.data().Date || b.data().orderedDate);
                return dateB - dateA;
            });

            for (const doc of sortedDocs) {
                const data = doc.data();
                console.log("Document data:", data);

                const divID = `order-${newCounter}`;
                const orderDiv = document.createElement('div');
                orderDiv.id = divID;
                orderDiv.className = 'orderids';
                await productsData(orderDiv, doc);
                document.body.appendChild(orderDiv);

                if (data.logo) {
                    orderDiv.innerHTML += `<img class="images" id="logoSrc" src="${data.logo}">`;
                }

                if (data.backImage) {
                    if (data.logo) {
                        orderDiv.innerHTML += `<br>`;
                    }
                    orderDiv.innerHTML += `<img class="images" style="height:auto;width:25%" id="backSrc" src="${data.backImage}"><br>`;
                } else if (data.logo) {
                    orderDiv.innerHTML += `<br>`;
                }

                orderDiv.innerHTML += `
                    <strong style="color:green;" id="customerCount">${newCounter}:</strong><br>
                    <strong id="docID">Document ID:</strong> <span id="docid">${doc.id}</span><br>
                    <strong id="customerID">Customer ID:</strong> ${data.customerID}<button class="editButton" data-doc-id="${doc.id}" data-field-name="customerID"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                    <strong id="Name">Name:</strong> ${data.Name}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Name"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;

                if (collectionID === "orders") {
                    orderDiv.innerHTML += `<strong id="Date">Date:</strong> ${data.Date || data.orderedDate}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Date"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;
                } else if (collectionID === "dispatched") {
                    orderDiv.innerHTML += `<strong>Tracking ID:</strong> ${data.tracking}<br>
                        <strong>Tracking Link:</strong> <a href="${data.trackingLink}" target="_blank">${data.trackingLink}</a><br>
                        <strong id="dispatchDate">dispatchedDate:</strong> ${data.dispatchDate}<br>
                        <strong id="orderedDate">orderedDate:</strong> ${data.orderedDate}<br>`;
                }

                orderDiv.innerHTML += `
                    <strong id="Address">Address:</strong> ${data.Address}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Address"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                    <strong id="City">City:</strong> ${data.City}<button class="editButton" data-doc-id="${doc.id}" data-field-name="City"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                    <strong id="Contact">Contact:</strong> ${data.Contact}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Contact"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                    <strong id="Details">Details:</strong> ${data.Details}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Details"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                    <strong id="Email">Email:</strong> ${data.Email}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Email"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;

                if (data.currentLoc) {
                    orderDiv.innerHTML += `<strong id="Email">Current Location:</strong> <a href="${data.currentLoc}">See Current Location</a><button class="editButton" data-doc-id="${doc.id}" data-field-name="currentLoc"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;
                }
                if (data.productSale) {
                    orderDiv.innerHTML += `<strong id="productSell">Product Sale:</strong> ${data.productSale}<button class="editButton" data-doc-id="${doc.id}" data-field-name="productSale"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;
                }
                if (data.backSize) {
                    orderDiv.innerHTML += `<strong id="backSize">Back Print Size:</strong> ${data.backSize}<button class="editButton" data-doc-id="${doc.id}" data-field-name="backSize"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;
                }
                if (data.frontSize) {
                    orderDiv.innerHTML += `<strong id="frontSize">Back Print Size:</strong> ${data.frontSize}<button class="editButton" data-doc-id="${doc.id}" data-field-name="frontSize"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;
                }

                if (data.productID) {
                    orderDiv.innerHTML += `<strong id="productID">Product ID:</strong> ${data.productID}<button class="editButton" data-doc-id="${doc.id}" data-field-name="productID"><span style="font-size:small; opacity:0.7;">✎</span></button>`;
                }
                if (collectionID === "orders") {
                    if (!data.productSP || !data.productCP) {
                        orderDiv.innerHTML += `<span class="preir" style="color:Red;font-weight:bolder;">Not Dispatched yet</span>`;
                    }
                }
                dataDisplay.appendChild(orderDiv);
                newCounter++;

                if (collectionID === "orders") {
                    orderDiv.innerHTML += `
                        <button class="dispatchButton">Dispatch</button>
                        <button id="confirmedButton${newCounter}" style="background-color:green;" class="confirmButton">Confirm</button>
                        <button style="background-color:lightgreen;" class="delayButton">Delay/Book</button>
                        <button style="background-color:red;" class="cancelButton">Cancel</button>
                        <button class="deleteButton">Delete</button>
                    </div>`;
                } else if (collectionID === "dispatched") {
                    orderDiv.innerHTML += `<strong>Petrol:</strong> ${data.petrol}<br>
                        <strong>Profit:</strong> ${data.profit}<br>
                        <button style="background-color:green;margin-top:10px;" class="deliveredButton">Delivered</button>
                        <button style="margin-top:10px" class="returnedButton">Returned</button>
                        <button class="reorderButton" style="margin-top:10px;background-color:red;">Push to orders</button>
                    </div>`;
                }
            }

            if (collectionID === "orders") {
                for (const doc of sortedDocs) {
                    const data = doc.data();
                    if (data.productSP && data.productCP) {
                        if (!createdOrdersDisplayed) {
                            dataDisplay.innerHTML += `<h2 style="color:blue;">Created on Courier</h2>`;
                            createdOrdersDisplayed = true;
                        }

                        const divID = `order-${createdCounter}`;
                        const orderDiv = document.createElement('div');
                        orderDiv.id = divID;
                        orderDiv.className = 'orderids';

                        if (data.logo) {
                            orderDiv.innerHTML += `<img class="images" id="logoSrc" src="${data.logo}"><br>`;
                        }

                        orderDiv.innerHTML += `
                            <strong style="color:green;" id="customerCount">${createdCounter}:</strong><br>
                            <strong id="docID">Document ID:</strong> <span id="docid">${doc.id}</span><br>
                            <strong id="customerID">Customer ID:</strong> ${data.customerID}<button class="editButton" data-doc-id="${doc.id}" data-field-name="customerID"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                            <strong id="Date">Date:</strong> ${data.Date || data.orderedDate}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Date"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                            <strong id="Name">Name:</strong> ${data.Name}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Name"><span style="font-size:small; opacity:0.7;">✎</span></button><hr>
                            <strong id="Address">Address:</strong> ${data.Address}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Address"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                            <strong id="City">City:</strong> ${data.City}<button class="editButton" data-doc-id="${doc.id}" data-field-name="City"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                            <strong id="Contact">Contact:</strong> ${data.Contact}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Contact"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                            <strong id="Details">Details:</strong> ${data.Details}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Details"><span style="font-size:small; opacity:0.7;">✎</span></button><br>
                            <strong id="Email">Email:</strong> ${data.Email}<button class="editButton" data-doc-id="${doc.id}" data-field-name="Email"><span style="font-size:small; opacity:0.7;">✎</span></button><br>`;

                        if (data.productID) {
                            orderDiv.innerHTML += `<strong id="productID">Product ID:</strong> ${data.productID}<button class="editButton"><span style="font-size:small; opacity:0.7;">Edit</span></button>`;
                        }

                        orderDiv.innerHTML += `
                            <div style="border: 2px solid green;background-color: lightgrey;"><strong>ProductSP : ${data.productSP}</strong>
                            <br><strong>Petrol : ${data.petrol}</strong>
                            <br><strong>ProductCP : ${data.productCP}</strong>
                            <br><strong>Tracking Link : ${data.trackingLink}</strong></div>`;

                        orderDiv.innerHTML += `
                            <button class="dispatchButton">Dispatch</button>
                            <button id="confirmedButton${createdCounter}" style="background-color:green;" class="confirmButton">Confirm</button>
                            <button style="background-color:lightgreen;" class="delayButton">Delay/Book</button>
                            <button style="background-color:red;" class="cancelButton">Cancel</button>
                            <button class="deleteButton">Delete</button>
                        </div>`;
                        dataDisplay.appendChild(orderDiv);
                        createdCounter++;
                    }
                }
                await updateConfirm();
                Array.from(editButtons).forEach(button => {
                    button.style.display = 'block';
                    button.addEventListener('click', (event) => {
                        const docId = button.dataset.docId;
                        const fieldName = button.dataset.fieldName;
                        const isDropdown = button.dataset.isDropdown === 'true';
                        editField(docId, fieldName, isDropdown, event);
                    });
                });
                addEventListenersToButtons(querySnapshot);
            } else if (collectionID === "dispatched") {
                addReorderButtonEventListeners(querySnapshot, collectionID);
                addEventListenersToButtons1(querySnapshot);
            }
        }
    }
        
    const login = document.getElementById("login");
    const dispatchForm = document.getElementById("dispatchForm");
    const productSale = document.getElementById("productSale");
    const getFinance = document.getElementById("getFinance");
    const profit = 0;
    const getData = document.getElementById("getData");
    const getDispatch = document.getElementById("getDispatch");
    const getReturns = document.getElementById("getReturns");
    const getDelivered = document.getElementById("getDelivered");
    const getDelayed = document.getElementById("getDelayed");
    const getCancelled = document.getElementById("getCancelled");
    const dataDisplay = document.getElementById("dataDisplay"); // Use getElementById to directly get the div
    const countDisplay = document.getElementById("count"); // Display element for count
    let counter = 1; // Counter for numbering
    const name = document.getElementById("name");
    
    
    
    
    
    let financeData;
    const financeChart = document.getElementById("financeChart");
    
    async function financing(){
    /*finance*/
    try {
    // Get the 'finance' document from the 'bank' collection
    const financeDocRef = doc(db, 'bank', 'finance');
    const financeDocSnap = await getDoc(financeDocRef);
    
    // Check if the document exists
    if (financeDocSnap.exists()) {
        financeData = financeDocSnap.data();
        
         addData.style.display = 'block';
        // Display each piece of data in a div or span
        const financeDisplay = document.createElement('div');
        financeDisplay.innerHTML = `
    
                <p>Total Profit: ${financeData.totalProfit}</p>
                <p>Total Loss: ${financeData.totalLoss}</p>
                <p>Total Petrol: ${financeData.totalPetrol}</p>
                <p>Total Return: ${financeData.totalReturn}</p>
                <p>Total Delivered: ${financeData.totalDelivered}</p>
                <p>Total Delivery: ${financeData.totalDelivery}</p>
                <p>Zakat: ${financeData.zakat}</p>
                <p>Ads: ${financeData.Ads}</p>
                <p>Balance: ${financeData.balance}</p>
                <p><strong>After Profit: </strong>${financeData.afterProfit}</p>
                <p><strong>Profit Percentage: </strong>${((financeData.afterProfit / financeData.totalProfit) * 100).toFixed(2)}%</p>
            `;
    
            
    addData.addEventListener('click',(e)=>{
    financeForm.style.display = 'block';
    });
        // Append the finance display to the dataDisplay div
        dataDisplay.innerHTML = ''; // Clear previous content
        dataDisplay.appendChild(financeDisplay);
        dataDisplay.style.display = 'block'; // Show the data display
    financeChart.style.display = 'block';
        // Initialize and render the chart after fetching data
        initializeChart('financeChart', financeData);
        initializeCircleGraph('circleGraph', financeData);
    } else {
        console.log('Finance document not found');
    }
    } catch (error) {
    console.error('Error fetching finance data:', error);
    }
    }
    
    document.getElementById("changePassword").addEventListener('click',(e)=>{
    const currentPassword = prompt("Enter your current password:");
    if (currentPassword === null) {
    return; // User canceled
    }
    
    const newPassword = prompt("Enter your new password:");
    if (newPassword === null) {
    return; // User canceled
    }
    
    // Fetch password from Firestore
    try {
    const docRef = doc(db, "creds", "login");
    getDoc(docRef).then(docSnapshot => {
        if (docSnapshot.exists()) {
            const correctPassword = docSnapshot.data().pass;
            if (currentPassword === correctPassword) {
                // Update password in Firestore
                updateDoc(docRef, { pass: newPassword })
                    .then(() => {
                        console.log("Password updated successfully!");
                        alert("Password updated successfully!");
                    })
                    .catch(error => {
                        console.error("Error updating password:", error);
                        alert("Error updating password. Please try again later.");
                    });
            } else {
                alert("Incorrect current password");
            }
        } else {
            alert("No such document!");
        }
    });
    } catch (error) {
    console.error("Error fetching password:", error);
    alert("Error fetching password. Please try again later.");
    }
    });
    
    
    if(localStorage.getItem("A98398HBFBB93BNABSN")!=="fabfbuygi328y902340"){
    document.querySelector(".login-box").style.display = 'block';
    }login.addEventListener('click', async () => {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("pass");
    const sidebar = document.querySelector(".sidebar");
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    // Fetch password from Firestore
    try {
    const docRef = doc(db, "creds", "login");
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
        const correctPassword = docSnapshot.data().pass;
        
        if (password === correctPassword) {
            document.getElementById("creds").style.display = 'none';
            sidebar.style.display = 'block';
            localStorage.setItem("A98398HBFBB93BNABSN", "fabfbuygi328y902340");
            financing();
        } else {
            alert("Incorrect password");
        }
    } else {
        alert("No such document!");
    }
    } catch (error) {
    console.error("Error fetching password:", error);
    alert("Error fetching password. Please try again later.");
    }
    
    // Clear the input fields
    usernameInput.value = "";
    passwordInput.value = "";
    });
    
    
    
    if(localStorage.getItem("A98398HBFBB93BNABSN")==="fabfbuygi328y902340"){
    
    document.querySelector(".login-box").style.display = 'none';
    document.getElementById("creds").style.display = 'none';
    const sidebar = document.querySelector(".sidebar");
            sidebar.style.display = 'block';
    financing();
            
    }
    
    const sumbitFinance = document.getElementById("sumbitFinance");
    
    sumbitFinance.addEventListener('click', async (e) => {
    const financeForm = document.getElementById("financeForm");
    const ad = document.getElementById("ad");
    const zakat = document.getElementById("zakat");
    const balance = document.getElementById("balance");
    const service = document.getElementById("service");
    
    
    try {
    const financeDocRef = doc(db, 'bank', 'finance');
    const financeDocSnap = await getDoc(financeDocRef);
    
    if (financeDocSnap.exists()) {
        let financeData = financeDocSnap.data();
    
        // Update finance data
        financeData.Ads += parseFloat(ad.value) || 0;
        financeData.balance += parseFloat(balance.value) || 0;
        financeData.services += parseFloat(service.value) || 0;
        financeData.zakat += parseFloat(zakat.value) || 0;
        
        // Subtract the total amount from afterProfit
        financeData.afterProfit -= parseFloat(ad.value) || 0;
        financeData.afterProfit -= parseFloat(balance.value) || 0;
        financeData.afterProfit -= parseFloat(service.value) || 0;
        financeData.afterProfit -= parseFloat(zakat.value) || 0;
    
        // Update Firestore document
        await updateDoc(financeDocRef, financeData);
    
        const sheetData = {
            ADS:ad.value || "", 
            ZAKAT: parseFloat(zakat.value) || "",
            BALANCE: parseFloat(balance.value) || "",
            SERVICES: parseFloat(service.value) || "",
        };
        
        await fetch(process.env.NEXT_PUBLIC_SHEET_ADS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData),
        });
    console.log(sheetData);
        // Clear input values
        ad.value = "";
        balance.value = "";
        service.value = "";
        zakat.value = "";
    
        financeForm.style.display = 'none';
        alert("Data Submitted Successfully");
    } else {
        console.log('Finance document not found');
    }
    } catch (error) {
    console.error('Error updating finance data:', error);
    // Handle the error appropriately (e.g., show an alert to the user)
    alert('An error occurred while updating finance data. Please try again.');
    }
    });
    
    
    
    const circleGraph = document.getElementById("circleGraph");
    // Function to initialize and render a combined bar chart
    function initializeChart(canvasId, financeData) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Check if there's an existing Chart instance on the canvas
    const existingChart = Chart.getChart(ctx);
    
    // Destroy the existing Chart instance if it exists
    if (existingChart) {
    existingChart.destroy();
    }
    
    // Create a new Chart instance
    new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Total Profit', 'Total Loss', 'Total Petrol', 'Total Delivery', 'Zakat', 'Ads', 'Balance','Services', 'After Profit'],
        datasets: [{
            label: 'Finance Data',
            data: [
                financeData.totalProfit,
                financeData.totalLoss,
                financeData.totalPetrol,
                financeData.totalDelivery,
                financeData.zakat,
                financeData.Ads,
                financeData.balance,
                financeData.services,
                financeData.afterProfit
            ],
            backgroundColor: [
                'rgba(75, 192, 192, 0.1)',
                'rgba(255, 99, 132, 0.1)',
                'rgba(255, 205, 86, 0.1)',
                'rgba(54, 162, 235, 0.1)',
                'rgba(255, 160, 122, 0.1)', // Transparent Color for Ads
                'rgba(138, 43, 226, 0.1)',  // Transparent Color for After Profit
                'rgba(54, 131, 95, 0.1)',
                'rgba(128, 128, 128, 0.1)',   // Transparent Color for Balance
                'rgba(0, 128, 0, 0.1)'      // Transparent Green for After Profit
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(54, 162, 235, 1)',  
                'darkred',   
                'indigo',
                'darkgreen',
                'rgba(128, 128, 128, 1)',
                'green'     // Border color for After Profit
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
    });
    }
    
    
    
    
    
    
    function initializeCircleGraph(elementId, financeData) {
    const canvas = document.getElementById(elementId); // Use the correct ID
    const ctx = canvas.getContext('2d');
    
    // Check if there's an existing Chart instance on the canvas
    const existingChart = Chart.getChart(ctx);
    circleGraph.style.display = 'block';
    
    // Destroy the existing Chart instance if it exists
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Create a new Chart instance
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            
            labels: ['Total Profit', 'Total Loss', 'Total Petrol', 'Total Delivery', 'Zakat', 'Ads', 'Balance','Services', 'After Profit'],
            datasets: [{
                
                label: 'Finance Data',
                data: [
                    financeData.totalProfit,
                    financeData.totalLoss,
                    financeData.totalPetrol,
                    financeData.totalDelivery,
                    financeData.zakat,
                    financeData.Ads,
                    financeData.balance,
                    financeData.services,
                    financeData.afterProfit
                ],
                
                backgroundColor: [
                    'rgba(75, 192, 192, 0.1)',
                    'rgba(255, 99, 132, 0.1)',
                    'rgba(255, 205, 86, 0.1)',
                    'rgba(54, 162, 235, 0.1)',
                    'rgba(250, 160, 122, 0.1)', // Transparent Color for Ads
                    'rgba(138, 43, 226, 0.1)',  // Transparent Color for After Profit
                    'rgba(54, 131, 95, 0.1)',
                    'rgba(128, 128, 128, 0.1)',   // Transparent Color for Balance
                    'rgba(0, 128, 0, 0.1)'      // Transparent Green for After Profit
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(54, 162, 235, 1)',
                    'darkred',
                    'indigo',
                    'darkgreen',
                    'rgba(128, 128, 128, 1)',
                    'green'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    }
    
    const addData = document.getElementById("addData");
    
    
    
    /*Customers Data*/
    const getCustomers = document.getElementById("getCustomers");
    counter = 1;
    
    getCustomers.addEventListener('click', async () => {
        dataDisplay.innerHTML = "";
    dataDisplay.style.display = 'none';
    financeChart.style.display = 'none';
    circleGraph.style.display = 'none';
    addData.style.display = 'none';
    addData.style.display = 'none';
    
    const customerDataDisplay = document.createElement('div');
    customerDataDisplay.id = 'customerDataDisplay';
    customerDataDisplay.style.display = 'none';
    document.body.appendChild(customerDataDisplay);
    const table = document.createElement('table');
    table.border = '1';
    
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    const thCustomerID = document.createElement('th');
    thCustomerID.textContent = 'CustomerID';
    const thName = document.createElement('th');
    thName.textContent = 'Name';
    const thContact = document.createElement('th');
    thContact.textContent = 'Contact';
    const thAddress = document.createElement('th');
    thAddress.textContent = 'Address';
    
    trHead.appendChild(thCustomerID);
    trHead.appendChild(thName);
    trHead.appendChild(thContact);
    trHead.appendChild(thAddress);
    thead.appendChild(trHead);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    tbody.id = 'customerDataBody';
    
    const collections = ['dispatched', 'cancelled', 'returns', 'delayed', 'orders', 'slides_orders', 'women_orders', 'delivered'];
    
    for (const collectionName of collections) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
            counter++;
            const data = doc.data();
            const customerID = data.customerID || '';
            const name = data.Name || '';
            const contact = data.Contact || '';
            console.log(contact);
            const address = data.Address || '';
    
            // Append data to the table
            const tr = document.createElement('tr');
            const tdCustomerID = document.createElement('td');
            tdCustomerID.textContent = customerID;
            const tdName = document.createElement('td');
            tdName.textContent = name;
            const tdContact = document.createElement('td');
            tdContact.textContent = contact;
            const tdAddress = document.createElement('td');
            tdAddress.textContent = address;
    
            tr.appendChild(tdCustomerID);
            tr.appendChild(tdName);
            tr.appendChild(tdContact);
            tr.appendChild(tdAddress);
            tbody.appendChild(tr);
        });
    }
    countDisplay.textContent = counter - 1;
    }
    
    table.appendChild(tbody);
    customerDataDisplay.appendChild(table);
    document.body.appendChild(customerDataDisplay);
    
    // Display the customer data
    customerDataDisplay.style.display = 'block';
    });
    
    /*Dispatch*/
    

    getDispatch.addEventListener('click', async () => {

        getOrders("dispatched");

    });
    
    function addEventListenersToButtons1(querySnapshot) {
        const deliveredButtons = document.querySelectorAll('.deliveredButton');
        const returnedButtons = document.querySelectorAll('.returnedButton');
    console.log("Running Event listener for dispatched");
        deliveredButtons.forEach((dispatchButton, index) => {
            dispatchButton.addEventListener('click', (e) => {
                
                // Find the associated data for this dispatch button based on the current loop iteration
                const currentData = querySnapshot.docs[index].data();
    
                const divID = dispatchButton.parentNode.id;
                const day = new Date().toDateString();
                const time = new Date().toLocaleTimeString();
    
                // Find the corresponding document ID
    
                const orderDocID = querySnapshot.docs[index].id;
                console.log("Retrieved Date from Firestore:", currentData.Date);
                delivered({
                    imgSrc: currentData.imgSrc || 0,
                    logo: currentData.logo || null,
                    customerID: currentData.customerID,
                    Name: currentData.Name,
                    City: currentData.City,
                    Address: currentData.Address,
                    Contact: currentData.Contact,
                    productsData:currentData.productsData,
                    Details: currentData.Details,
                    Email: currentData.Email,
                    productID: currentData.productID,
                    orderedDate: currentData.orderedDate,
                    dispatchDate: currentData.dispatchDate,
                    deliveredDate: day +" " + time,
                    profit: currentData.profit,
                    productCP:currentData.productCP,
                    productSP:currentData.productSP,
                    petrol:currentData.petrol,
                }, orderDocID);
                countDisplay.textContent = parseInt(countDisplay.textContent) - 1;
            
            });
        });
    
        returnedButtons.forEach((returnedButton, index) => {
            returnedButton.addEventListener('click', (e) => {
                const currentData = querySnapshot.docs[index].data();
    
                const divID = returnedButton.parentNode.id;
                const day = new Date().toDateString();
                const time = new Date().toLocaleTimeString();
    
                // Find the corresponding document ID
    
                const orderDocID = querySnapshot.docs[index].id;
                console.log("Retrieved Date from Firestore:", currentData.Date);
                returned({
                    imgSrc: currentData.imgSrc || 0,
                    logo: currentData.logo || null,
                    customerID: currentData.customerID,
                    Name: currentData.Name,
                    City: currentData.City,
                    Address: currentData.Address,
                    Contact: currentData.Contact,
                    productsData:currentData.productsData,
                    Details: currentData.Details,
                    Email: currentData.Email,
                    orderedDate: currentData.orderedDate,
                    dispatchDate: currentData.dispatchDate,
                    returnDate: day + " " + time,
                    productCP:currentData.productCP,
                    productSP:currentData.productSP,
                    petrol:currentData.petrol,
                    profit:currentData.profit,
    
                }, orderDocID);
                countDisplay.textContent = parseInt(countDisplay.textContent) - 1;
                const parentDiv = dispatchButton.parentNode;
    parentDiv.parentNode.removeChild(parentDiv);
            });
        });
        
        document.getElementById('loader').style.display = 'none';
    }
    
    let worksheet;
    
    // Function to create a worksheet
    function createWorksheet(data) {
    const sheetData = [data]; // Wrap the data in an array
    return XLSX.utils.aoa_to_sheet(sheetData);
    }
    
    // Function to add data to the existing worksheet
    function addToWorksheet(worksheet, data) {
    XLSX.utils.sheet_add_aoa(worksheet, data, { origin: -1 });
    }
    
    // Function to download the workbook
    function downloadWorkbook(workbook, filename) {
    XLSX.writeFile(workbook, filename);
    
    // Clear the workbook object
    workbook = null;
    
    // Optionally, remove the download button if necessary
    const downloadButton = document.getElementById("downloadButton");
    if (downloadButton) {
    downloadButton.remove();
    }
    }
    
    
   
    
    
    
   
    
    
    
    
    const localStorageKey = 'productImgUrls';
    let cachedUrls = null;
    
    // Function to fetch and cache all image URLs from Firebase Storage
    const fetchAndCacheAllUrls = async () => {
    try {
    const listRef = ref(storage, '/products'); // Root reference to list all files
    const res = await listAll(listRef);
    
    cachedUrls = {};
    await Promise.all(res.items.map(async (itemRef) => {
        const fullPath = itemRef.fullPath;
        const fileName = fullPath.substring(fullPath.lastIndexOf('/') + 1);
        const url = await getDownloadURL(itemRef);
        cachedUrls[fileName] = url;
    }));
    
    localStorage.setItem(localStorageKey, JSON.stringify(cachedUrls));
    console.log('All image URLs fetched and cached.');
    } catch (error) {
    console.error('Error fetching and caching all URLs:', error);
    }
    };
    
    // Function to get the image URL for a product
    const getImageUrl = async (productName) => {
    // Retrieve cached URLs from local storage if not already cached
    if (!cachedUrls) {
    cachedUrls = JSON.parse(localStorage.getItem(localStorageKey)) || {};
    }
    
    // Check if the URL for the given product name is already cached
    if (cachedUrls[productName]) {
    console.log(`Fetched from local storage: ${cachedUrls[productName]}`);
    return cachedUrls[productName];
    }
    
    // If not found in local storage, fetch and cache all URLs
    await fetchAndCacheAllUrls();
    
    // After fetching and caching, check again
    if (cachedUrls[productName]) {
    console.log(`Fetched from cache after full fetch: ${cachedUrls[productName]}`);
    return cachedUrls[productName];
    } else {
    console.error(`Image not found for product: ${productName}`);
    return null;
    }
    };
    
    
   
   async function productsData(orderDiv,doc){
        try {
         console.log(orderDiv)
            // Replace 'orders' with your actual collection name
            const ordersCollection = collection(db, 'orders'); 
            const ordersSnapshot = await getDocs(ordersCollection);
        
            // Loop through each order document
            
                const orderData = doc.data();
                
                // Parse the productsData JSON string
                const productsData = JSON.parse(orderData.productsData);
        
                
        
                // Create a container for products
                const productsContainer = document.createElement('div');
                productsContainer.className = 'products-container';
        
                // Loop through each product in productsData
                productsData.forEach(product => {
                    // Create a div for each product
                    const productDiv = document.createElement('div');
                    productDiv.className = 'product';
        
                    // Create and append product details
                    const productIdElement = document.createElement('p');
                  
                    productDiv.appendChild(productIdElement);
        
                    const productNameElement = document.createElement('p');
                    productNameElement.textContent = `Name: ${product.productName}`;
                    productDiv.appendChild(productNameElement);
        
                    const productPriceElement = document.createElement('p');
                    productPriceElement.textContent = `Price: ${product.price}`;
                    productDiv.appendChild(productPriceElement);
        
                    const productQuantityElement = document.createElement('p');
                    productQuantityElement.textContent = `Quantity: ${product.quantity}`;
                    productDiv.appendChild(productQuantityElement);
        
                    const productSizeElement = document.createElement('p');
                    productSizeElement.textContent = `Size: ${product.size}`;
                    productDiv.appendChild(productSizeElement);
        
                    const productPicElement = document.createElement('img');
                    productPicElement.src = product.pic;
                    productPicElement.alt = product.productName;
                    productPicElement.style.width = '100px'; // Set a specific width for the image
                    productDiv.appendChild(productPicElement);
        
                    // Append the product div to the products container
                    productsContainer.appendChild(productDiv);
                });
        
                // Append the products container to the order div
                orderDiv.appendChild(productsContainer);
                orderDiv.appendChild(document.createElement('hr')); // Add a horizontal line for separation
            
        } catch (error) {
            console.error("Error fetching orders: ", error);
        }
        }

    getData.addEventListener('click', async () => {
   await getOrders("orders");
    });
    
    function addEventListenersToButtons(querySnapshot) {
    
    const dispatchButtons = document.querySelectorAll('.dispatchButton');
    const deleteButtons = document.querySelectorAll('.deleteButton');
    const confirmButtons = document.querySelectorAll('.confirm Button');
    const cancelButtons = document.querySelectorAll('.cancelButton');
    const delayButtons = document.querySelectorAll('.delayButton');
    
    
  
    
    
    
    
    
    
    
        dispatchButtons.forEach((dispatchButton, index) => {
            dispatchButton.addEventListener('click', () => {
     
    // Find the closest parent div that contains the document ID
    const orderDiv = dispatchButton.closest('.orderids');
    console.log(orderDiv)
    if (!orderDiv) {
        console.error('Order div not found');
        return;
    }
    
    // Get the orderDocID from the span inside the orderDiv
    const orderDocIDElement = orderDiv.querySelector('#docid');
    console.log(orderDocIDElement)
    if (!orderDocIDElement) {
        console.error('Document ID not found');
        return;
    }
    const orderDocID = orderDocIDElement.textContent.trim();
    const day = new Date().toDateString();
                
                const time = new Date().toLocaleTimeString();
    // Retrieve currentData using the extracted orderDocID
    const currentData = querySnapshot.docs.find(doc => doc.id === orderDocID)?.data();
    console.log(currentData)
    if (!currentData) {
        console.error('No data found for the given document ID');
        return;
    }                    
    
     postOrder(orderDocID,true);
                countDisplay.textContent = parseInt(countDisplay.textContent) - 1;
               
            });
        });
    
    
    
        deleteButtons.forEach((deleteButton, index) => {
            deleteButton.addEventListener('click', () => {
                
    const orderDiv = deleteButton.closest('.orderids');
    console.log(orderDiv)
    if (!orderDiv) {
        console.error('Order div not found');
        return;
    }
    
    // Get the orderDocID from the span inside the orderDiv
    const orderDocIDElement = orderDiv.querySelector('#docid');
    console.log(orderDocIDElement)
    if (!orderDocIDElement) {
        console.error('Document ID not found');
        return;
    }
    const orderDocID = orderDocIDElement.textContent.trim();
                deleteOrder(orderDocID, 'orders'); // Specify the collection name ('orders')
                countDisplay.textContent = parseInt(countDisplay.textContent) - 1; // Update the count
            });
        });
    
    
    
    
        confirmButtons.forEach((confirmButton, index) => {
    confirmButton.addEventListener('click', async () => {
    const orderDiv = confirmButton.closest('.orderids');
    if (!orderDiv) {
        console.error('Order div not found');
        return;
    }
    console.log(orderDiv)
    
    // Get the orderDocID from the span inside the orderDiv
    const orderDocIDElement = orderDiv.querySelector('#docid');
    console.log(orderDocIDElement)
    if (!orderDocIDElement) {
        console.error('Document ID not found');
        return;
    }
    const orderDocID = orderDocIDElement.textContent.trim();
    
    // Retrieve currentData using the extracted orderDocID
    const currentData = querySnapshot.docs.find(doc => doc.id === orderDocID)?.data();
    if (!currentData) {
        console.error('No data found for the given document ID');
        return;
    }
    
    console.log(currentData); // Order data
    const contact = currentData.Contact.trim(); // Trim whitespace from the contact number
    const divID = orderDiv.id; // Order div ID
    console.log(divID)
    const day = new Date().toDateString(); // Current date
    const time = new Date().toLocaleTimeString(); // Current time
    
    
    
    
    confirmButton.innerText = 'Confirmed ✓';
    confirmButton.style.backgroundColor = 'darkblue';
    
    if (currentData.confirm !== 'Confirmed ✓' || 'backSize' in currentData || 'frontSize' in currentData) {
    await confirmOrder(orderDocID);
    }
    
    // Validate Pakistani phone number format
    const phoneNumberRegex = /^(\+92|92|0)?\d{10}$/; // Pakistani phone number format
    if (!phoneNumberRegex.test(contact)) {
        alert('Invalid Pakistani phone number. Please enter a valid 10-digit Pakistani phone number.');
        return; // Exit function if phone number is invalid
    }      
    });
    });
    
    
    
    
    
    
        cancelButtons.forEach((cancelButton, index) => {
            cancelButton.addEventListener('click', () => {
                const orderDiv = cancelButton.closest('.orderids');
    if (!orderDiv) {
        console.error('Order div not found');
        return;
    }
    console.log(orderDiv)
    
    // Get the orderDocID from the span inside the orderDiv
    const orderDocIDElement = orderDiv.querySelector('#docid');
    console.log(orderDocIDElement)
    if (!orderDocIDElement) {
        console.error('Document ID not found');
        return;
    }
    const orderDocID = orderDocIDElement.textContent.trim();
    
    // Retrieve currentData using the extracted orderDocID
    const currentData = querySnapshot.docs.find(doc => doc.id === orderDocID)?.data();
    if (!currentData) {
        console.error('No data found for the given document ID');
        return;
    }
    
    console.log(currentData); // Order data
    const contact = currentData.Contact.trim(); // Trim whitespace from the contact number
    const divID = orderDiv.id; // Order div ID
    console.log(divID)
    const day = new Date().toDateString(); // Current date
    const time = new Date().toLocaleTimeString(); // Current time
    
    
                cancelOrder({
                    imgSrc: currentData.imgSrc || 0,
                    logo: currentData.logo || null,
                    customerID: currentData.customerID,
                    Name: currentData.Name,
                    City: currentData.City,
                    Address: currentData.Address,
                    Contact: currentData.Contact,
                    Size: currentData.Size,
                    productName: currentData.productName,
                    Quantity: currentData.Quantity,
                    Details: currentData.Details,
                    Email: currentData.Email,
                    orderedDate: currentData.Date,
                    cancelDate: day + " " + time,
                    productID: currentData.productID,
                }, orderDocID, "orders");
                countDisplay.textContent = parseInt(countDisplay.textContent) - 1;
                const parentDiv = dispatchButton.parentNode;
    parentDiv.parentNode.removeChild(parentDiv);
            });
        });
    
    
    
    
    
        delayButtons.forEach((delayButton, index) => {
            delayButton.addEventListener('click', () => {
                const orderDiv = delayButton.closest('.orderids');
    if (!orderDiv) {
        console.error('Order div not found');
        return;
    }
    console.log(orderDiv)
    
    // Get the orderDocID from the span inside the orderDiv
    const orderDocIDElement = orderDiv.querySelector('#docid');
    console.log(orderDocIDElement)
    if (!orderDocIDElement) {
        console.error('Document ID not found');
        return;
    }
    const orderDocID = orderDocIDElement.textContent.trim();
    
    // Retrieve currentData using the extracted orderDocID
    const currentData = querySnapshot.docs.find(doc => doc.id === orderDocID)?.data();
    if (!currentData) {
        console.error('No data found for the given document ID');
        return;
    }
    
    console.log(currentData); // Order data
    const contact = currentData.Contact.trim(); // Trim whitespace from the contact number
    const divID = orderDiv.id; // Order div ID
    console.log(divID)
    const day = new Date().toDateString(); // Current date
    const time = new Date().toLocaleTimeString(); // Current time
    
    
                delayOrder({
                    imgSrc: currentData.imgSrc || 0,
                    logo: currentData.logo || null,
                    customerID: currentData.customerID,
                    Name: currentData.Name,
                    City: currentData.City,
                    Address: currentData.Address,
                    Contact: currentData.Contact,
                    Size: currentData.Size,
                    productName: currentData.productName,
                    Quantity: currentData.Quantity,
                    Details: currentData.Details,
                    Email: currentData.Email,
                    orderedDate: currentData.Date,
                    delayDate: day + " " + time,
                    productID: currentData.productID,
                }, orderDocID);
                countDisplay.textContent = parseInt(countDisplay.textContent) - 1;
                const parentDiv = dispatchButton.parentNode;
    parentDiv.parentNode.removeChild(parentDiv);
            });
        });
    
        loader.style.display = 'none';
    }
    
    
    
    /*Show Returns*/
    getReturns.addEventListener('click', async () => {
        const querySnapshot = await getDocs(collection(db, 'returns'));
        addData.style.display = 'none';
            circleGraph.style.display = 'none';
            financeChart.style.display = 'none';
        if (querySnapshot.empty) {
            countDisplay.textContent = 0;
            console.log("No documents found!");
            dataDisplay.innerHTML = "No documents found.";
        } else {
            const title = document.getElementById("title");
            const writes = document.getElementById("writes");
            title.innerHTML = `<strong style="margin-left: 2px;font-weight: bolder;font-size: 20px;" >RETURNED ORDERS</strong>`;
            writes.style.display = 'block';
            dataDisplay.style.display = 'block';
            dataDisplay.innerHTML = ""; // Clear previous content
            
            
            counter = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Document data:", data);
    
                const divID = `order-${counter}`;
                // Display the data for each document with numbering
                dataDisplay.innerHTML += `<div  id="${divID}">
                            <strong style="color:green;" id="customerCount">${counter}.</strong><br>
                            <strong id="docID">Document ID:</strong> ${doc.id}<br>
    
    
                                                     <strong id="customerID">Customer ID:</strong> ${data.customerID}<br>
                                                     <strong id="Date">Ordered Date:</strong> ${data.orderedDate}<br>
                                                     <strong id="Date">Dispatched Date:</strong> ${data.dispatchDate}<br>
                                                     <strong id="Date">Returned Date:</strong> ${data.returnDate}<br>
                                                     <strong id="Name">Name:</strong> ${data.Name}<br>
                                                     <strong id="Address">Address:</strong> ${data.Address}<br>
                                                     <strong id="City">City:</strong> ${data.City}<br>
                                                     <strong id="Contact">Contact:</strong> ${data.Contact}<br>
                                                     <strong id="Size">Size:</strong> ${data.Size}<br>
                                                     <strong id="productName">Product Name:</strong> ${data.productName}<br>
                                                     <strong id="Quantity">Quantity:</strong> ${data.Quantity}<br>
                                                     <strong id="Details">Details:</strong> ${data.Details}<br>
                                                     <strong id="Email">Email:</strong> ${data.Email}<br>
                                                     <strong id="productID">Product ID:</strong> ${data.productID}<br>
                                                     <strong>Loss:</strong> ${data.delivery}<br>
    </div>`;
    
                counter++;
            });
    
    
        }
    
        countDisplay.textContent = counter - 1;
    });
    
    
    
    
    
    /*Show Delivered*/
    getDelivered.addEventListener('click', async () => {
    
        const querySnapshot = await getDocs(collection(db, 'delivered'));
        addData.style.display = 'none';
            circleGraph.style.display = 'none';
            financeChart.style.display = 'none';
        if (querySnapshot.empty) {
            
            countDisplay.textContent = 0;
            console.log("No documents found!");
            dataDisplay.innerHTML = "No documents found.";
        } else {
            const title = document.getElementById("title");
            const writes = document.getElementById("writes");
            title.innerHTML = `<strong style="margin-left: 2px;font-weight: bolder;font-size: 20px;" >DELIVERED</strong>`;
            writes.style.display = 'block';
            dataDisplay.style.display = 'block';
            dataDisplay.innerHTML = ""; // Clear previous content
         
            
            counter = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Document data:", data);
    
                const divID = `order-${counter}`;
                // Display the data for each document with numbering
                dataDisplay.innerHTML += `<div  id="${divID}">
                            <strong style="color:red;" id="customerCount">${counter}.</strong><br>
                            <strong id="docID">Document ID:</strong> ${doc.id}<br>
    
    
                                                     <strong id="customerID">Customer ID:</strong> ${data.customerID}<br>
                                                     <strong id="orderedDate">Ordered Date:</strong> ${data.orderedDate}<br>
                                                     <strong id="Date">Dispatched Date:</strong> ${data.dispatchDate}<br>
                                                     <strong id="Date">Delivered Date:</strong> ${data.deliveredDate}<br>
                                                     <strong id="Name">Name:</strong> ${data.Name}<br>
                                                     <strong id="Address">Address:</strong> ${data.Address}<br>
                                                     <strong id="City">City:</strong> ${data.City}<br>
                                                     <strong id="Contact">Contact:</strong> ${data.Contact}<br>
                                                     <strong id="Size">Size:</strong> ${data.Size}<br>
                                                     <strong id="productName">Product Name:</strong> ${data.productName}<br>
                                                     <strong id="Quantity">Quantity:</strong> ${data.Quantity}<br>
                                                     <strong id="Details">Details:</strong> ${data.Details}<br>
                                                     <strong id="Email">Email:</strong> ${data.Email}<br>
                                                     <strong id="productID">Product ID:</strong> ${data.productID}<br>
    
    </div>`;
    
                counter++;
            });
    
    
        }
    
        countDisplay.textContent = counter - 1;
    });
    
    
    
    
    /* Show Delayed */
    getDelayed.addEventListener('click', async () => {
        const querySnapshot = await getDocs(collection(db, 'delayed'));
        addData.style.display = 'none';
            circleGraph.style.display = 'none';
            financeChart.style.display = 'none';
        if (querySnapshot.empty) {
            console.log("No documents found!");
            countDisplay.textContent = 0;
            dataDisplay.innerHTML = "No documents found.";
        } else {
            const title = document.getElementById("title");
            const writes = document.getElementById("writes");
            title.innerHTML = `<strong style="margin-left: 2px;font-weight: bolder;font-size: 20px;" >DELAYED ORDERS</strong>`;
            writes.style.display = 'block';
            dataDisplay.style.display = 'block';
            dataDisplay.innerHTML = ""; // Clear previous content
         
            
            counter = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Document data:", data);
    
                const divID = `order-${counter}`;
                // Display the data for each document with numbering
                dataDisplay.innerHTML += `<div  id="${divID}">
                <strong style="color:red;" id="customerCount">${counter}.</strong><br>
                <strong id="docID">Document ID:</strong> ${doc.id}<br>
    
                <strong id="customerID">Customer ID:</strong> ${data.customerID}<br>
                <strong id="orderedDate">Ordered Date:</strong> ${data.orderedDate}<br>
                <strong id="Date">Delayed Date:</strong> ${data.delayDate}<br>
                <strong id="Name">Name:</strong> ${data.Name}<br>
                <strong id="Address">Address:</strong> ${data.Address}<br>
                <strong id="City">City:</strong> ${data.City}<br>
                <strong id="Contact">Contact:</strong> ${data.Contact}<br>
                <strong id="Size">Size:</strong> ${data.Size}<br>
                <strong id="productName">Product Name:</strong> ${data.productName}<br>
                <strong id="Quantity">Quantity:</strong> ${data.Quantity}<br>
                <strong id="Details">Details:</strong> ${data.Details}<br>
                <strong id="Email">Email:</strong> ${data.Email}<br>
                <strong id="productID">Product ID:</strong> ${data.productID}<br>
    
                <button class="reorderButton" style="background-color:green;">Reorder</button>
            </div>`;
    
                counter++;
            });
    
            // Add event listeners to the newly added buttons
            addReorderButtonEventListeners(querySnapshot, 'delayed');
        }
    
        countDisplay.textContent = counter - 1;
    });
    
    /* Show Cancelled */
    getCancelled.addEventListener('click', async () => {
        const querySnapshot = await getDocs(collection(db, 'cancelled'));
        addData.style.display = 'none';
            circleGraph.style.display = 'none';
            financeChart.style.display = 'none';
    
        if (querySnapshot.empty) {
            
            countDisplay.textContent = 0;
            console.log("No documents found!");
            dataDisplay.innerHTML = "No documents found.";
        } else {
            const title = document.getElementById("title");
            const writes = document.getElementById("writes");
            title.innerHTML = `<strong style="margin-left: 2px;font-weight: bolder;font-size: 20px;" >CANCELLED ORDERS</strong>`;
            writes.style.display = 'block';
            dataDisplay.style.display = 'block';
            dataDisplay.innerHTML = ""; // Clear previous content
           
            counter = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Document data:", data);
    
                const divID = `order-${counter}`;
                // Display the data for each document with numbering
                dataDisplay.innerHTML += `<div  id="${divID}">
                <strong style="color:red;" id="customerCount">${counter}.</strong><br>
                <strong id="docID">Document ID:</strong> ${doc.id}<br>
    
                <strong id="customerID">Customer ID:</strong> ${data.customerID}<br>
                <strong id="orderedDate">Ordered Date:</strong> ${data.orderedDate}<br>
                <strong id="Date">Cancelled Date:</strong> ${data.cancelDate}<br>
                <strong id="Name">Name:</strong> ${data.Name}<br>
                <strong id="Address">Address:</strong> ${data.Address}<br>
                <strong id="City">City:</strong> ${data.City}<br>
                <strong id="Contact">Contact:</strong> ${data.Contact}<br>
                <strong id="Size">Size:</strong> ${data.Size}<br>
                <strong id="productName">Product Name:</strong> ${data.productName}<br>
                <strong id="Quantity">Quantity:</strong> ${data.Quantity}<br>
                <strong id="Details">Details:</strong> ${data.Details}<br>
                <strong id="Email">Email:</strong> ${data.Email}<br>
                <strong id="productID">Product ID:</strong> ${data.productID}<br>
    
                <button class="reorderButton" style="background-color:green;">Reorder</button>
            </div>`;
    
                counter++;
            });
    
            // Add event listeners to the newly added buttons
            addReorderButtonEventListeners(querySnapshot, 'cancelled');
        }
    
        countDisplay.textContent = counter - 1;
    });
    
    
    
    /* Functions */
    /* Functions */


// Function to get decrement value based on size
function decrementValue(size) {
    switch (size) {
        case 's':
        case 'm':
        case 'l':
            return 1; // Decrement value is 1 for all sizes
        default:
            return 0; // Default value if size is not recognized
    }
}

function decrementStock(orderData) {
    // Parse productsData JSON
    const productsData = JSON.parse(orderData.productsData);

    // Update the document in the "clothsims" collection for each product
    productsData.forEach(product => {
        const productName = product.productName; // Get product name from the product object
        let size = product.size; // Use the size directly from the product object
        const quantityToDecrement = decrementValue(size); // Get quantity to decrement

        // Update the document in the "clothsims" collection
        const clothsimsRef = doc(db, "clothsims", productName);
        
        console.log("Updating document in collection 'clothsims' for product:", productName);
        
        getDoc(clothsimsRef)
            .then(docSnap => {
                if (docSnap.exists()) {
                    console.log("Document exists. Decrementing size:", size);
                    const sizes = docSnap.data();
                    if (sizes.hasOwnProperty(size)) {
                        const updatedQuantity = sizes[size] - quantityToDecrement;
                        // Ensure the quantity does not go below 0
                        sizes[size] = Math.max(updatedQuantity, 0);
                        
                        // Update the document
                        return updateDoc(clothsimsRef, sizes).then(() => {
                            console.log("Document updated successfully for product:", productName);
                        });
                    } else {
                        console.log("Size", size, "not found in document for product:", productName);
                    }
                } else {
                    console.log("Document does not exist for product:", productName);
                }
            })
            .catch(error => {
                console.error('Error decrementing quantity for product:', productName, error);
            });
    });
}

function incrementStock(orderData) {
    // Parse productsData JSON
    const productsData = JSON.parse(orderData.productsData);

    // Update the document in the "clothsims" collection for each product
    productsData.forEach(product => {
        const productName = product.productName; // Get product name from the product object
        let size = product.size; // Use the size directly from the product object
        const quantityToIncrement = product.quantity; // Get the quantity from the product object

        // Update the document in the "clothsims" collection
        const clothsimsRef = doc(db, "clothsims", productName);
        
        console.log("Updating document in collection 'clothsims' for product:", productName);
        
        getDoc(clothsimsRef)
            .then(docSnap => {
                if (docSnap.exists()) {
                    console.log("Document exists. Incrementing size:", size);
                    const sizes = docSnap.data();
                    if (sizes.hasOwnProperty(size)) {
                        const updatedQuantity = sizes[size] + quantityToIncrement; // Increment by the product's quantity
                        // Update the quantity
                        sizes[size] = updatedQuantity;
                        console.log("Updated quantity for size", size, ":", sizes[size], "for product:", productName);
                        // Update the document
                        return updateDoc(clothsimsRef, sizes).then(() => {
                            console.log("Document updated successfully for product:", productName);
                        });
                    } else {
                        console.log("Size", size, "not found in document for product:", productName);
                    }
                } else {
                    console.log("Document does not exist for product:", productName);
                }
            })
            .catch(error => {
                console.error('Error incrementing quantity for product:', productName, error);
            });
    });
}

    
    
    


    
    
    
    
    
    
    
    
    
    
    
    
    function cancelOrder(orderData, orderDocID, collection) {
        var confirmed = confirm("Are you sure?");
        if(confirmed){
        try {
            const docRefOrders = doc(db, collection, orderDocID);
            const docRefCancelled = doc(db, "cancelled", orderDocID);
    
            // Check and replace undefined values with empty strings
            const sanitizedOrderData = Object.fromEntries(
                Object.entries(orderData).map(([key, value]) => [key, value === undefined ? "" : value])
            );
    
            // Set data in dispatched collection
            setDoc(docRefCancelled, sanitizedOrderData);
    
            // Delete the document from orders collection
            deleteDoc(docRefOrders);
    
            alert("This order has been cancelled");
        } catch (error) {
            console.error("Error cancelling the order: ", error);
            alert("An error occurred while cancelling.");
        }
    }
    }
    
    function deleteOrder(orderDocID, collection) {
        var confirmed = confirm("Are you sure?");
        if(confirmed){
        try {
            const docRefOrders = doc(db, collection, orderDocID);
    
            // Delete the document from orders collection
            deleteDoc(docRefOrders);
    
            alert("Order deleted successfully");
        } catch (error) {
            console.error("Error deleting order: ", error);
            alert("An error occurred while deleting order.");
        }
    }
    }
    
    
    
    function delivered(orderData, orderDocID) {
    var confirmed = confirm("Are you sure?");
    if(confirmed){
    const deliveredForm = document.getElementById("deliveredForm");
    const deliverButton = document.getElementById("delivered");
    
    // Display the delivered form initially
    deliveredForm.style.display = 'block';
    
    const deliverHandler = async () => {
    try {
        const docRefDispatched = doc(db, "dispatched", orderDocID);
        const docRefDelivered = doc(db, "delivered", orderDocID);
        const docRefFinance = doc(db, "bank", "finance");
        const dispatch = document.getElementById("dispatch");
        const productDeliveryInput = document.getElementById("productDelivery");
        const productDelivery = parseFloat(productDeliveryInput.value) || 0;
    
        if (isNaN(productDelivery)) {
            alert("Please enter a valid delivery amount.");
            return;
        }
    
        const petrolAmount = orderData.petrol || 0;
    
        // Deduct delivery charges from profit
        const profitPetrol = orderData.profit - petrolAmount;
        const profitAfterDelivery = profitPetrol - productDelivery;
    
        // Update the orderData object with the new profit value
        orderData.afterProfit = profitAfterDelivery;
    
        // Check and replace undefined values with empty strings
        const sanitizedOrderData = Object.fromEntries(
            Object.entries(orderData).map(([key, value]) => [key, value === undefined ? "" : value])
        );
    
        // Set data in delivered collection
        await setDoc(docRefDelivered, sanitizedOrderData);
    
        // Delete the document from dispatched collection
        await deleteDoc(docRefDispatched);
    
        // Update finance document with profit after delivery
        const financeSnapshot = await getDoc(docRefFinance);
        const currentAfterProfit = financeSnapshot.data().afterProfit || 0;
        const updatedAfterProfit = currentAfterProfit + profitAfterDelivery;
    
        await updateDoc(docRefFinance, { afterProfit: updatedAfterProfit, totalDelivery: financeSnapshot.data().totalDelivery + productDelivery || 0, totalDelivered: financeSnapshot.data().totalDelivered + 1 });
    
    const tp = orderData.productSP - orderData.productCP;
        const currentTotalProfit = financeSnapshot.data().totalProfit || 0;
        const updatedTotalProfit = currentTotalProfit + tp;  
    
        // Update the finance document
        await updateDoc(docRefFinance, { totalProfit: updatedTotalProfit });
    
        // Display an alert if petrol amount is greater than 0
        if (petrolAmount > 0) {
            alert(`You have to pay ${petrolAmount} for petrol.`);
        }
    
        const sheetData = {
            CUSTOMERID: orderData.customerID || "", 
            CSTNAME: orderData.Name || "",
            PRODUCT_NAME: orderData.productName || "",
            PRODUCT_CP: orderData.productCP || "",
            PRODUCT_SP: orderData.productSP || "",
            PROFIT: orderData.profit || "",
            LOSS: orderData.loss || "",
            PETROL: orderData.petrol || "",
            DELIVERY: productDelivery || "",
            CARD: orderData.card || "",
            OTHERS: orderData.others || "",
            AFTER_PROFIT: orderData.afterProfit || "",
            CITY: orderData.City || "",
            DATE: orderData.orderedDate || "",
            QUANTITY: orderData.Quantity || ""
        };
    
        await fetch(process.env.NEXT_PUBLIC_SHEET_SALES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData),
        });
    
        alert("Congratulations on a successful delivery!");
    
        productDeliveryInput.value = "";
        deliveredForm.style.display = 'none';
        deliverButton.removeEventListener('click', deliverHandler);
    
    } catch (error) {
        console.error("Error delivering order: ", error);
        alert(`An error occurred while delivering: ${error.message}`);
    }
    };
    
    // Remove existing event listeners and add a new one
    deliverButton.removeEventListener('click', deliverHandler);
    deliverButton.addEventListener('click', deliverHandler);
    }
    }
    
    
    function returned(orderData, orderDocID) {
    var confirmed = confirm("Are you sure?");
    if(confirmed){
    const returnedForm = document.getElementById("returnedForm");
    const returnButton = document.getElementById("return");
    
    // Display the returned form initially
    returnedForm.style.display = 'block';
    
    const returnHandler = async (e) => {
    try {
        const docRefDispatched = doc(db, "dispatched", orderDocID);
        const docRefReturn = doc(db, "returns", orderDocID);
        const docRefFinance = doc(db, "bank", "finance");
        const day = new Date().toDateString();
                const time = new Date().toLocaleTimeString();
        const productReturnInput = document.getElementById("productReturn");
        const productReturn = parseFloat(productReturnInput.value) || 0;
    
        if (isNaN(productReturn)) {
            alert("Please enter a valid return amount.");
            return;
        }
    
        orderData.delivery = productReturn;
    
        
        
    
        // Check and replace undefined values with empty strings
        const sanitizedOrderData = Object.fromEntries(
            Object.entries(orderData).map(([key, value]) => [key, value === undefined ? "" : value])
        );
    
        // Set data in returns collection
        await setDoc(docRefReturn, sanitizedOrderData);
    
        // Delete the document from dispatched collection
        await deleteDoc(docRefDispatched);
    await incrementStock(orderData);
    
        // Update finance document with profit after return and totalReturn
        const financeSnapshot = await getDoc(docRefFinance);
        const currentAfterProfit = financeSnapshot.data().afterProfit || 0;
        const updatedAfterProfit = currentAfterProfit - productReturn;
    
        await updateDoc(docRefFinance, {
            afterProfit: updatedAfterProfit,
            totalReturn: financeSnapshot.data().totalReturn + 1,
            totalLoss:financeSnapshot.data().totalLoss + productReturn,
        });
    
        const sheetData = {
            CUSTOMERID: orderData.customerID || "", 
            CSTNAME: orderData.Name || "",
            PRODUCT_NAME: orderData.productName || "",
            PRODUCT_CP: orderData.productCP || "",
            PRODUCT_SP: orderData.productSP || "",
            LOSS: productReturn || "",
            PETROL: orderData.petrol || "",
            DELIVERY: productReturn || "",
            AFTER_PROFIT:"-" + productReturn || "",
            CITY: orderData.City || "",
            DATE: day + " " + time || "",
            QUANTITY: orderData.Quantity || "",
        };
    
        await fetch(process.env.NEXT_PUBLIC_SHEET_SALES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData),
        });
       
    
        alert("Order successfully returned!");
    
        // Reset and hide the returned form
        productReturnInput.value = "";
        returnedForm.style.display = 'none';
    
        returnButton.removeEventListener('click', returnHandler);
    } catch (error) {
        console.error("Error returning order: ", error);
        alert(`An error occurred while returning: ${error.message}`);
    }
    };
    
    // Remove existing event listeners and add a new one
    returnButton.removeEventListener('click', returnHandler);
    returnButton.addEventListener('click', returnHandler);
    }
    }
    
    /*confirm Button*/
    async function confirmOrder(orderDocID) {
    
    var confirmed = confirm("Are you sure?");
    if (confirmed) {
    try {
        const docRefOrders = doc(db, 'orders', orderDocID);
    
        // Get the current document data
        const orderSnapshot = await getDoc(docRefOrders);
        const orderData = orderSnapshot.data();
    
        // Check if the 'confirm' field exists in the document
        const confirmFieldExists = 'confirm' in orderData;
    
        // Set the 'confirm' field to 'Confirmed ✓'
        const updatedData = { confirm: 'Confirmed ✓' };
        if (confirmFieldExists) {
            // If the field exists, update it
            await updateDoc(docRefOrders, updatedData);
        } else {
            // If the field doesn't exist, set it
            await setDoc(docRefOrders, updatedData, { merge: true });
        }
    
        // Check for backSize or frontSize field
        if ('backSize' in orderData || 'frontSize' in orderData) {
            // Confirm sending message to Manufacturer
            var sendToManufacturer = confirm("Do you want to send a message to the Manufacturer?");
            if (sendToManufacturer) {
                // Awake the serverless API and send the message
                
                sendWhatsapp(env.process.NEXT_PUBLIC_OWNER_CONTACT,encoded)
                // Compose the message for the Manufacturer
                let message = `Asslamoalaikum  Ali yeh order banadu yeh mockup hein ${orderData.imgSrc} aur yeh`;
    
                if (orderData.logo !== null) {
                    message += ` ${orderData.logo} front ka logo hein size iska ${orderData.frontSize} yeh hain `;
                }
    
                if (orderData.backImage !== null) {
                    message += `back ka logo yeh hein ${orderData.backImage} iska size ${orderData.backSize} hein reciept bhi bhejta hu tumhe quality ksi design ki achi nah hu tu btadena mjhe`;
                }
    console.log(message)
                // Send the message to the Manufacturer
                sendWhatsapp(process.env.NEXT_PUBLIC_OWNER_CONTACT,message);
            }
        } else {
            // Confirm sending message to the Customer
            var sendToCustomer = confirm("Do you want to send a message to the Customer?");
            if (sendToCustomer) {
                const customerNumber = `92${orderData.Contact}`;
    
                // Compose the message for the Customer
                const message = `*TSOA - ORDER CONFIRMATION*\n\n
    Hey ${orderData.Name},\n\n
    ________________________________\n
    *Order Details:*\n
    - Product: ${orderData.productName}\n
    - Contact: ${customerNumber}\n
    - Delivery Address: ${orderData.Address}, ${orderData.City}\n
    - Size: ${orderData.Size}\n
    - Quantity: ${orderData.Quantity}\n
    ________________________________\n
    *To confirm your order, click the link below:*\n\n
    [tsoa.vercel.app/confirm?doc=${encodeURIComponent(orderDocID)}]\n
    *Note:* It is compulsory to open this link to confirm your order and also recheck your details.\n\n
    Best regards,\n
    TSOA Team`;
    
                // Encode message for URL
                const encodedMessage = encodeURIComponent(message).replace(/%0A/g, '%0A');
    
                // Send the message to the Customer
                sendWhatsapp(customerNumber,encodedMessage)
               
            }
        }
    
    } catch (error) {
        console.error('Error confirming order: ', error);
        alert(`An error occurred while confirming the order: ${error.message}`);
    }
    }
    }
    
    function delayOrder(orderData, orderDocID) {
        var confirmed = confirm("Are you sure?");
    if(confirmed){
        try {
            const docRefOrders = doc(db, "orders", orderDocID);
            const docRefDelayed = doc(db, "delayed", orderDocID);
    
            // Check and replace undefined values with empty strings
            const sanitizedOrderData = Object.fromEntries(
                Object.entries(orderData).map(([key, value]) => [key, value === undefined ? "" : value])
            );
    
            // Set data in delayed collection
            setDoc(docRefDelayed, sanitizedOrderData);
    
            // Delete the document from orders collection
            deleteDoc(docRefOrders);
    
            alert("Order has been delayed/booked successfully");
        } catch (error) {
            console.error("Error delaying order: ", error);
            alert("An error occurred while delaying/bookmarking the order.");
        }
    }
    }
    
    
    
    /* Function to add event listeners to Reorder buttons */
    async function reorderOrder(orderData, orderDocID, collectionName) {
    var confirmed = confirm("Are you sure?");
    if (confirmed) {
    try {
        const docRefOrders = doc(db, "orders", orderDocID);
        const docRefCollection = doc(db, collectionName, orderDocID);
    
        // Check and replace undefined values with empty strings
        const sanitizedOrderData = Object.fromEntries(
            Object.entries(orderData).map(([key, value]) => [key, value === undefined ? "" : value])
        );
    
        // Set data in orders collection
        await setDoc(docRefOrders, sanitizedOrderData);
        console.log("Order data set in 'orders' collection:", sanitizedOrderData);
    
        if (collectionName === "dispatched") {
            // Find the document in clothsims collection
            const productDocRef = doc(db, "clothsims", orderData.productName);
            const productDoc = await getDoc(productDocRef);
    
            if (productDoc.exists()) {
                const productData = productDoc.data();
                console.log("Product data retrieved from 'clothsims':", productData);
    
                let sizeField;
                // Determine the size field based on orderData.size
                if (orderData.size === 36) {
                    sizeField = "s";
                } else if (orderData.size === 40) {
                    sizeField = "m";
                } else if (orderData.size === 45) {
                    sizeField = "l";
                } else {
                    console.error("Size not recognized:", orderData.size);
                    throw new Error("Size not recognized");
                }
    
                // Retrieve the current count of the size field
                const currentSizeCount = productData[sizeField] || 0;
                console.log(`Current count for size field ${sizeField}:`, currentSizeCount);
    
                // Increment the size field
                const updatedSizeCount = currentSizeCount + 1;
                await updateDoc(productDocRef, { [sizeField]: updatedSizeCount });
                console.log(`Incremented size field ${sizeField} to`, updatedSizeCount);
    
                alert("Order has been pushed to orders and inventory updated.");
            } else {
                alert("Product not found in inventory.");
                console.error("Product not found in 'clothsims' collection:", orderData.productName);
            }
        } else {
            alert("Order has been reordered successfully!");
        }
    
        // Delete the document from specified collection
        await deleteDoc(docRefCollection);
        console.log(`Deleted document from ${collectionName} collection:`, orderDocID);
    } catch (error) {
        if (collectionName === "dispatched") {
            alert("An error occurred while pushing the order. Please try again.");
        } else {
            alert("An error occurred while reordering the order. Please try again.");
        }
        console.error("Error reordering order: ", error);
    }
    }
    }
    
    
    
    
    /* Function to add event listeners to Reorder buttons */
    /* Function to add event listeners to Reorder buttons */
    function addReorderButtonEventListeners(querySnapshot, collectionName) {
        const reorderButtons = document.querySelectorAll('.reorderButton');
    
        reorderButtons.forEach((reorderButton, index) => {
            reorderButton.addEventListener('click', () => {
                const currentData = querySnapshot.docs[index].data();
                const orderDocID = querySnapshot.docs[index].id;
    
                reorderOrder(currentData, orderDocID, collectionName);
            });
        });
    }
    
    
    
    document.addEventListener('click', function(event) {
    var sidebar = document.querySelector('.sidebar');
    var sidebarToggle = document.getElementById('sidebarToggle');
    var isClickInsideSidebar = sidebar.contains(event.target);
    var isClickOnToggle = (event.target === sidebarToggle);
    
    if (!isClickInsideSidebar && !isClickOnToggle) {
        sidebar.style.left = '-164px';
    }
    });
    
    
    
    
 
    
    
    
   
    
    async function editField(docId, fieldName, isDropdown = false, event) {
    const selectedDv = document.querySelector(".select");
    const crossBtn = document.querySelector(".cross-button");
    const optionsDv = document.querySelector(".options");
    if(selectedDv || crossBtn || optionsDv){
    selectedDv.remove();
    crossBtn.remove();
    optionsDv.remove();}
    
    try {
    const docRef = doc(db, 'orders', docId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    let newValue;
    
    if (!data) {
        console.error("No data found for document ID:", docId);
        return;
    }
    
    if (isDropdown && fieldName === 'productName') {
        const productNames = await getProductNames(); // Fetch product names for validation
    
        // Create dropdown container
        const container = document.createElement('div');
        container.className = 'select';
        container.style.position = 'absolute';
    
        // Create the cross button
        const crossButton = document.createElement('button');
        crossButton.textContent = '✖';
        crossButton.className = 'cross-button';
        container.appendChild(crossButton);
    
        // Create the selected div
        const selectedDiv = document.createElement('div');
        selectedDiv.className = 'selected';
        selectedDiv.setAttribute('data-default', 'Select');
        selectedDiv.textContent = 'Select';
        container.appendChild(selectedDiv);
    
        // Create the SVG arrow
        const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrowSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        arrowSvg.setAttribute('height', '1em');
        arrowSvg.setAttribute('viewBox', '0 0 512 512');
        arrowSvg.setAttribute('class', 'arrow');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z');
        arrowSvg.appendChild(path);
        selectedDiv.appendChild(arrowSvg);
    
        // Create options container
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
    
        // Add "Type Manually" option
        const manualOptionDiv = document.createElement('div');
        manualOptionDiv.title = 'Type Manually';
        const manualInput = document.createElement('input');
        manualInput.id = 'manual';
        manualInput.name = 'option';
        manualInput.type = 'radio';
        manualOptionDiv.appendChild(manualInput);
        const manualLabel = document.createElement('label');
        manualLabel.className = 'option';
        manualLabel.setAttribute('for', 'manual');
        manualLabel.setAttribute('data-txt', 'Type Manually');
    
        manualOptionDiv.appendChild(manualLabel);
        optionsDiv.appendChild(manualOptionDiv);
    
        // Handle manual option click
        manualLabel.addEventListener('click', () => {
            newValue = prompt("Enter new product name:", "");
            if (newValue) {
                updateProductName(docRef, fieldName, newValue, container);
            }
        });
    
        // Add product names as options
        productNames.forEach((name, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.title = name;
            const optionInput = document.createElement('input');
            optionInput.id = `option-${index}`;
            optionInput.name = 'option';
            optionInput.type = 'radio';
            optionDiv.appendChild(optionInput);
            const optionLabel = document.createElement('label');
            optionLabel.className = 'option';
            optionLabel.setAttribute('for', `option-${index}`);
            optionLabel.setAttribute('data-txt', name); 
            optionDiv.appendChild(optionLabel);
            optionsDiv.appendChild(optionDiv);
    
            // Handle option click
            optionLabel.addEventListener('click', () => {
                updateProductName(docRef, fieldName, name, container);
            });
        });
    
        container.appendChild(optionsDiv);
        document.body.appendChild(container);
    
        // Handle cross button click
       crossButton.addEventListener('click', () => {
    selectedDiv.remove();
    crossButton.remove();
    optionsDiv.remove();
    
    
    });
    
    
    } else if (isDropdown && fieldName === 'Size') {
        const sizes = ['36', '40', '45']; 
    
        // Create dropdown container
        const container = document.createElement('div');
        container.className = 'select';
        container.style.position = 'absolute';
    
        // Create the cross button
        const crossButton = document.createElement('button');
        crossButton.textContent = '✖';
        crossButton.className = 'cross-button';
        container.appendChild(crossButton);
    
        // Create the selected div
        const selectedDiv = document.createElement('div');
        selectedDiv.className = 'selected';
        selectedDiv.setAttribute('data-default', 'Select');
        selectedDiv.textContent = 'Select';
        container.appendChild(selectedDiv);
    
        // Create the SVG arrow
        const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrowSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        arrowSvg.setAttribute('height', '1em');
        arrowSvg.setAttribute('viewBox', '0 0 512 512');
        arrowSvg.setAttribute('class', 'arrow');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z');
        arrowSvg.appendChild(path);
        selectedDiv.appendChild(arrowSvg);
    
        // Create options container
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
    
        // Add size options
        sizes.forEach((size, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.title = size;
            const optionInput = document.createElement('input');
            optionInput.id = `option-size-${index}`;
            optionInput.name = 'option';
            optionInput.type = 'radio';
            optionDiv.appendChild(optionInput);
            const optionLabel = document.createElement('label');
            optionLabel.className = 'option';
            optionLabel.setAttribute('for', `option-size-${index}`);
            optionLabel.setAttribute('data-txt', size);
            optionDiv.appendChild(optionLabel);
            optionsDiv.appendChild(optionDiv);
    
            // Handle option click
            optionLabel.addEventListener('click', () => {
                updateProductName(docRef, fieldName, size, container);
            });
        });
    
        container.appendChild(optionsDiv);
        document.body.appendChild(container);
    
        // Handle cross button click
        crossButton.addEventListener('click', () => {
            selectedDiv.remove();
    crossButton.remove();
    optionsDiv.remove();
        });
    
    } else {
        newValue = prompt(`Edit ${fieldName}:`, data[fieldName]);
        if (newValue === null) return; 
        await updateDoc(docRef, {
            [fieldName]: newValue 
        });
    }
    } catch (error) {
    console.error("Error editing field:", error);
    }
    }
    
    async function getProductNames() {
    // Fetch product names from the clothsims collection
    const productNames = [];
    const querySnapshot = await getDocs(collection(db, 'clothsims'));
    querySnapshot.forEach(doc => {
    productNames.push(doc.id); // Assuming doc.id is the product name
    });
    return productNames;
    }
    // Function to update the product name or size in the document
    async function updateProductName(docRef, fieldName, newValue, container) {
    try {
    await updateDoc(docRef, {
        [fieldName]: newValue // Update the document with the new value
    });
    console.log(`Field '${fieldName}' updated to '${newValue}'`);
    container.remove(); // Remove the dropdown after update
    } catch (error) {
    console.error("Error updating product name or size:", error);
    }
    }
    
    
    
    
    document.getElementById("getProducts").addEventListener("click",(e)=>{
    let url = "/?edit";
    window.location.href = url;
    })
    
    

});














  return (
   <>
   
   <div style={{ display: 'none', position: 'fixed', marginTop: '120%', maxWidth: '50%', marginLeft: '19%' }} id="loader" />

<div className="login-box" style={{ display: 'none' }}>
  <h1 className="login-key" style={{ marginLeft: '34px' }}>TSOA - PANEL</h1>
  <div id="creds" className="login-form">
    <h2 className="login-title">Username:</h2>
    <input id="username" className="form-control" placeholder="username" />
    <h2 className="login-title">Password:</h2>
    <input id="pass" className="form-control" type="password" placeholder="password" />
    <br />
    <button id="login" className="btn btn-outline-primary">Login</button>
    <button id="changePassword" className="btn btn-outline-secondary" style={{ marginTop: '13px', backgroundColor: 'red' }}>Change Password</button>
  </div>
</div>

<div id="writes" style={{ marginTop: '20px', marginLeft: '30px', display: 'none' }}>
  <span id="title">TOTAL WRITES:</span>
  <br />
  <span style={{ color: 'red', fontWeight: 'bolder', fontSize: '75px' }} id="count">0</span>
</div>

<div className="sidebar" style={{ display: 'none',left: '-164px' }}>
  <button id="sidebarToggle"  style={{ color: 'white', backgroundColor: 'black', width: '28px' }} onClick={toggleSidebar}>&#9776;</button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getData">
    <img src="/dashboard/gift.png" alt="gift" />
    NEW ORDERS
  </button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getDispatch">
    <img src="/dashboard/contact.png" alt="contact" />
    DISPATCHED
  </button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getDelivered">
    <img src="/dashboard/delivered.png" alt="delivered" />
    DELIVERED
  </button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getReturns">
    <img src="/dashboard/return.png" alt="return" />
    RETURNED
  </button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getDelayed">
    <img src="/dashboard/delayed.png" alt="delayed" />
    DELAYED
  </button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getCancelled">
    <img src="/dashboard/cancelled.png" alt="cancelled" />
    CANCELLED
  </button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getCustomers">
    <img src="/dashboard/data.png" alt="data" />
    CUSTOMERS DATA
  </button>
  <br />
  <button style={{ marginLeft: '7px' }} id="getProducts">
    <img src="dashboard/ims.png" alt="ims" />
    Add Products
  </button>
  <br />
</div>

<div style={{ display: 'none' }} id="dataDisplay" />

{/* <div className="form-container" id="dispatchForm">
  <label htmlFor="courier">Tracking Number:</label>
  <input type="text" id="tracking" name="tracking" placeholder="Enter Tracking Number" />
  <button id="dispatch">Dispatch</button>
</div> */}

{/* <div className="form-container" id="preDispatchForm">
  <label htmlFor="productCost">Product Cost:</label>
  <input type="number" id="productCost" name="productCost" placeholder="Enter product cost" />
  <label htmlFor="productSale">Product Sale:</label>
  <input type="number" id="productSale" name="productSale" placeholder="Enter product sale" />
  <label htmlFor="petrol">Petrol:</label>
  <input type="number" id="petrol" name="petrol" placeholder="Enter petrol spent" />
  
  <p style={{ display: 'none' }} id="courierPartners">https://leopards.com/leopards-tracking</p>

  <label htmlFor="courierPartner">Select Courier:</label>
  <select id="courierPartner">
    <option value="Leopards">Leopards</option>
    <option value="BarqRaftar">BarqRaftar</option>
    <option value="Ship by PeopleAI">Ship by PeopleAI</option>
    <option value="M&P">M&P</option>
    <option value="Trax">Trax</option>
    <option value="PostEx.">PostEx.</option>
  </select>

  
  <div style={{ display: 'none' }}>
    <label htmlFor="returnLocation">Selected Return Location:</label>
    <select id="returnLocationDropdown"></select>
  </div>

  <label htmlFor="orderWeight">Order Weight:</label>
  <input type="number" id="orderWeight" name="orderWeight" placeholder="Enter order weight" defaultValue="0.5" />
  <label htmlFor="Instructions">Additional Instruction:</label>
  <input type="text" id="Instructions" name="Instructions" placeholder="Enter secondary contact or any other info" />
  <button id="excel">Add to Excel</button>
</div> */}

<div className="form-container" id="deliveredForm">
  <label htmlFor="productDelivery">Delivery Charges:</label>
  <input type="number" id="productDelivery" name="productDelivery" placeholder="Enter product Delivery charges" />
  <button id="delivered">Deliver</button>
</div>

<div className="form-container" id="returnedForm">
  <label htmlFor="productReturn">Delivery Charges:</label>
  <input type="number" id="productReturn" name="productReturn" placeholder="Enter product Delivery charges" />
  <button id="return">Return</button>
</div>

<div className="form-container" id="financeForm">
  <label htmlFor="ad">Add Ad:</label>
  <input type="number" id="ad" name="ad" placeholder="Enter new ad charges" />
  <label htmlFor="zakat">Add Zakat:</label>
  <input type="number" id="zakat" name="zakat" placeholder="Enter new zakat charges" />
  <label htmlFor="balance">Add Balance:</label>
  <input type="number" id="balance" name="balance" placeholder="Enter new balance charges" />
  <label htmlFor="service">Add Service:</label>
  <input type="number" id="service" name="service" placeholder="Enter new service charges" />
  <button id="sumbitFinance" >Submit</button>
</div>

<button style={{ display: 'none', marginLeft: '25px', marginTop: '14px', marginBottom: '25px', color: 'black', backgroundColor: '#e1eded', fontWeight: 'bolder', border: '2px solid skyblue' }} id="addData">ADD NEW DATA</button>

   
   </>
  );
}


