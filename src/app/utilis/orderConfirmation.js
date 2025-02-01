import { db } from '../firebase';
import { doc, deleteDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import sendWhatsapp from './sendWhatsapp';

async function handleCancellation(docId, data) {
    try {
      // Add the document to the 'cancelled' collection with additional fields
      const cancelledData = {
        ...data,
        cancelledReason: `Order cancelled due to no response after 3 attempts.`,
        cancelDate: new Date().toISOString(), // Add cancelDate field
      };
      await setDoc(doc(db, 'cancelled', docId), cancelledData);
  
      // Delete the document from the 'orders' collection
      await deleteDoc(doc(db, 'orders', docId));
  
      console.log(`Document ${docId} moved to 'cancelled' collection with cancelDate and deleted from 'orders'.`);
    } catch (error) {
      console.error('Error handling cancellation:', error);
    }
  }
  

async function orderConfirmation() {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));

    querySnapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;

      if (data.Date) {
        const docDate = new Date(data.Date);
        const currentTime = new Date();
        const timeDifference = currentTime - docDate;
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference >= 20) {
          const formattedContact = formatContact(data.Contact);
          const attempts = (data.attempts || 0) + 1;

          if (attempts >= 3) {
            await handleCancellation(docId, data);
            return; // Stop further processing for this document
          }

          // Prepare products data
          const products = JSON.parse(data.productsData);
          const productDetails = products
            .map((product) => `- ${product.productName} (Size: ${product.size}, Qty: ${product.quantity})`)
            .join('\n');
          const totalPrice = products.reduce((sum, product) => sum + parseFloat(product.price), 0);

          // Customize the message based on attempts
          let attemptMessage = '';
          if (attempts === 2) {
            attemptMessage = '*Second Attempt for confirming your order*';
          }

          const message = `*DEVOX - ORDER CONFIRMATION*\n\n${data.Name},\n\n${attemptMessage}\n\n_______________________________\n*Order Details:*\n${productDetails}\n- Total Payment: ${totalPrice}\n- Payment Mode: ${data.paymentMode}\n- Delivery Address: ${data.Address}, ${data.City}\n_______________________________\n*To confirm your order, click the link below:*\n\n[${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}/thanks/${docId}?action=confirm]\n\n*Note:* Recheck your details and confirm your order.\n\nBest regards,\nDevox Team`;

          await sendData([formattedContact], [message]);

          // Update Firestore
          const docRef = doc(db, 'orders', docId);
          await setDoc(docRef, { attempts, confirm: 'pending' }, { merge: true });
        } else {
          console.log('Document is not older than 20 hours. Skipping...');
        }
      }
    });
  } catch (error) {
    console.error('Error processing Firestore data:', error);
  }
}

async function sendData(contacts, messages) {
  try {
    // Directly pass the arrays to sendWhatsapp
    await sendWhatsapp(contacts, messages);
    console.log('Messages sent successfully.');
  } catch (error) {
    console.error('Error sending messages:', error);
  }
}

function formatContact(contact) {
  if (contact.startsWith('92')) {
    return contact;
  } else if (contact.startsWith('0')) {
    return '92' + contact.slice(1);
  } else {
    return '92' + contact;
  }
}

export default orderConfirmation;
