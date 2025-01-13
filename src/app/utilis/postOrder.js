import { db } from '../firebase';
import { doc, updateDoc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import sendWhatsapp from './sendWhatsapp'; // Ensure the path is correct
import showMessageBox from './showMessageBox';
const postOrder = async (docId,dashboard=false) => {
  if(dashboard){
    confirm('Are you sure you want to dispatch this order?');
  }
  
    try {
        console.log(`Processing dispatch for docId: ${docId}`);

        // Get the order document
        const orderRef = doc(db, 'orders', docId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error('Order does not exist');
        }

        const orderData = orderSnap.data();
        console.log('Fetched order data:', orderData);

        // Check if the order is already dispatched
        if (orderData.tracking) {
            alert('This order is already dispatched.');
            return;
        }

        // Post order to ShooterDelivery
        const trackingInfo = await postToShooterDelivery(docId, orderData);

        if (!trackingInfo || !trackingInfo.trackingNumber) {
            throw new Error('Failed to retrieve tracking information');
        }

        const { trackingNumber, trackingLink } = trackingInfo;

        // Calculate profit
        const profit = orderData.productSP - orderData.productCP;

        // Update order data with tracking info and profit
        const dispatchedData = {
            ...orderData,
            tracking: trackingNumber,
            trackingLink: trackingLink,
            dispatchedDate: serverTimestamp(),
            profit: profit,
        };

        // Move order to "dispatched" collection
        const dispatchedRef = doc(db, 'dispatched', docId);
        await setDoc(dispatchedRef, dispatchedData);

        // Delete the order from "orders" collection
        await deleteDoc(orderRef);
        console.log('Order moved to dispatched collection');

        // Update finance data
        const financeRef = doc(db, 'bank', 'finance');
        const financeSnap = await getDoc(financeRef);
        if (financeSnap.exists()) {
            const financeData = financeSnap.data();
            const updatedTotalPetrol = (financeData.totalPetrol || 0) + (orderData.petrol || 0);
            const updatedProfit = (financeData.afterProfit || 0) + profit;

            await updateDoc(financeRef, {
                totalPetrol: updatedTotalPetrol,
                afterProfit: updatedProfit,
            });
            console.log('Finance data updated');
        } else {
            console.warn('Finance document not found');
        }

        // Decrement stock
        decrementStock(orderData);

        // Send WhatsApp message
        const customerContact = orderData.Contact.startsWith('0') 
            ? `92${orderData.Contact.slice(1)}`
            : orderData.Contact;
console.log(trackingNumber)
        const message = `DEVOX,\n Thanks for confirming your order, it will be delivered within 3 working days. You can track your order from ${trackingLink}.\n Your tracking is ${trackingNumber} and you will receive daily tracking updates via WhatsApp.`;

        if (dashboard) {
            if (confirm("Do you want to send the dispatch message to the customer?")) {
                await sendWhatsapp([customerContact], [message]);
                console.log('WhatsApp message sent');
            }
            showMessageBox('Success', 'Order has been successfully dispatched and the customer has been notified.', true);
        } else {
            await sendWhatsapp([customerContact], [message]);
            console.log('WhatsApp message sent');
        }

        // Ensure that the tracking number is returned with the correct property name
        return {
            trackingNumber: trackingNumber, // Adjust this if the API uses a different key
        };
    } catch (error) {
        console.error('Error in postOrder:', error);
        showMessageBox('Error', `An error occurred while dispatching the order: ${error.message}`, false);
        throw error;
    }
};

async function postToShooterDelivery(docId, orderData) {
    const {
        Address: address,
        City: city,
        Contact: contact,
        Name: name,
        productSP: amount,
        productsData,
        currentLoc,
    } = orderData;

    const parsedProducts = JSON.parse(productsData);
    const description = parsedProducts
        .map(
            (product) =>
                `${product.productName} (Size: ${product.size}, Quantity: ${product.quantity})`
        )
        .join('\n');

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
    };

    const orderDataForAPI = {
        con_name: name,
        con_ref: docId,
        user_id: "b6a5cd13-164e-4f87-886a-de3111aab87f",
        con_contact: contact,
        con_address: address,
        consign_city: city,
        weight: `0.5Kg`,
        pieces: parsedProducts.length,
        cd_amount: amount,
        desc: `${description}\nCurrent Location: ${currentLoc}`,
        remarks: 'Allow check before pay',
        to_city_id: 204,
        uid: "726",
    };

    const apiUrl = 'https://api.shooterdelivery.com/Apis/add-orderlisting.php';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderDataForAPI),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from API:', errorData);
        throw new Error(errorData.message);
    }

    const responseData = await response.json();
    console.log(responseData)
    if (!responseData || !responseData['Order Tracking']) {
        console.error('Invalid response format:', responseData);
        throw new Error('Invalid response format: Missing "Order Tracking"');
    }

    const orderTracking = responseData['Order Tracking'];
    console.log(`Order placed successfully: ${orderTracking}`);

    return {
        trackingNumber: orderTracking,
        trackingLink: `${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}/tracking`
    };
}

function decrementStock(orderData) {
    const productsData = JSON.parse(orderData.productsData);

    productsData.forEach(product => {
        const productName = product.productName;
        const size = mapSize(product.size);
        const quantityToDecrement = product.quantity;

        const clothsimsRef = doc(db, "clothsims", productName);

        console.log("Updating document in collection 'clothsims' for product:", productName);

        getDoc(clothsimsRef)
            .then(docSnap => {
                if (docSnap.exists()) {
                    console.log("Document exists. Decrementing size:", size);
                    const sizes = docSnap.data();
                    if (sizes.hasOwnProperty(size)) {
                        const updatedQuantity = sizes[size] - quantityToDecrement;
                        sizes[size] = Math.max(updatedQuantity, 0);

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

function mapSize(size) {
    switch (size) {
        case 36:
            return 's';
        case 40:
            return 'm';
        case 45:
            return 'l';
        case 48:
            return 'xl';
        default:
            return null;
    }
}

export default postOrder;