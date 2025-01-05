import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { router } from 'next/navigation';

/**
 * Deletes an order from the Firestore 'orders' collection.
 *
 * @param {string} docid - The document ID of the order to delete.
 * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
 * @throws Will throw an error if the deletion fails.
 */
export default async function deleteOrder(docid) {
    if (!docid) {
        throw new Error("No document ID provided for deletion.");
    }

    try {
        const orderDocRef = doc(db, "orders", docid);
        await deleteDoc(orderDocRef);
        console.log(`Order with ID ${docid} has been Cancelled successfully.`);
        router.push("/");
    } catch (error) {
        console.error(`Failed to delete order with ID ${docid}:`, error);
        throw error;
    }
} 