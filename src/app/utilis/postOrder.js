import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const postOrder = async (docId) => {
  try {
    console.log(`Fetching document for docId: ${docId}`);

    // Fetch document from Firebase
    const docRef = doc(db, 'orders', docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`No document found for docId: ${docId}`);
      throw new Error('Document does not exist');
    }

    const data = docSnap.data();

    // Check if tracking exists
    if (data.tracking) {
      alert('This order is already placed on courier.');
      return;
    }

    console.log(`Document data:`, data);

    // Extract necessary fields
    const {
      Address: address,
      City: city,
      Contact: contact,
      Name: name,
      productSP: amount,
      productsData,
      currentLoc,
    } = data;

    // Generate description from productsData
    const parsedProducts = JSON.parse(productsData);
    const description = parsedProducts
      .map(
        (product) =>
          `${product.productName} (Size: ${product.size}, Quantity: ${product.quantity})`
      )
      .join('\n');

    console.log(`Generated description: ${description}`);

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    const orderData = {
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

    console.log(`Order data being sent:`, orderData);

    const apiUrl = 'https://api.shooterdelivery.com/Apis/add-orderlisting.php';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from API:', errorData);
      throw new Error(errorData.message);
    }

    const responseData = await response.json();

    if (!responseData || !responseData['Order Tracking']) {
      console.error('Invalid response format:', responseData);
      throw new Error('Invalid response format: Missing "Order Tracking"');
    }

    const orderTracking = responseData['Order Tracking'];
    console.log(`Order placed successfully: ${orderTracking}`);

    return orderTracking;
  } catch (error) {
    console.error('Error posting order:', error);
    throw error;
  }
};

export default postOrder;