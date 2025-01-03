import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Updates a specific field in the Firestore 'orders' collection.
 *
 * @param {string} docid - The document ID of the order to update.
 * @param {string} field - The field name to update.
 * @param {any} value - The new value for the field.
 * @returns {Promise<void>} - A promise that resolves when the update is complete.
 * @throws Will throw an error if the update fails.
 */
export default async function updateOrderField(docid, field, value) {
    if (!docid || !field) {
        throw new Error("Document ID and field are required for updating.");
    }

    try {
        const orderDocRef = doc(db, "orders", docid);
        await updateDoc(orderDocRef, { [field]: value });
        console.log(`Order with ID ${docid} updated successfully: ${field} = ${value}`);
    } catch (error) {
        console.error(`Failed to update order with ID ${docid}:`, error);
        throw error;
    }
}

/**
 * Updates a specific field within a product in the 'orders' collection.
 *
 * @param {string} docid - The document ID of the order to update.
 * @param {number} productIndex - The index of the product in the products array.
 * @param {string} field - The field name to update within the product.
 * @param {any} value - The new value for the field.
 * @returns {Promise<void>} - A promise that resolves when the update is complete.
 * @throws Will throw an error if the update fails.
 */
export async function updateProductField(docid, productIndex, field, value) {
    if (!docid || productIndex === undefined || !field) {
        throw new Error("Document ID, product index, and field are required for updating.");
    }

    try {
        const orderDocRef = doc(db, "orders", docid);
        const orderSnap = await getDoc(orderDocRef);
        if (!orderSnap.exists()) {
            throw new Error("Order not found.");
        }

        const data = orderSnap.data();
        let products = JSON.parse(data.productsData || "[]");

        if (productIndex < 0 || productIndex >= products.length) {
            throw new Error("Invalid product index.");
        }

        const product = products[productIndex];
        const [collectionId, docId] = product.id.split('$').slice(0, 2);
        const productRef = doc(db, collectionId, docId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            throw new Error("Product not found.");
        }

        const productData = productSnap.data();
        const productCP = parseFloat(productData.productCP || '0');
        
        
        const productSP = parseFloat(productData.price || '0');


        if (field === 'quantity') {
            const oldQuantity = product.quantity;
            const oldProductCP = productCP * oldQuantity;
            const newProductCP = productCP * value;
            const oldProductSP = productSP * oldQuantity;
            const newProductSP = productSP * value;
            document.getElementById("totalAmount").innerText = newProductSP;

            // Update the order's productCP and productSP
            const updatedProductCP = parseInt(parseFloat(data.productCP || '0') - oldProductCP + newProductCP);
            const updatedProductSP = parseInt(parseFloat(data.productSP || '0') - oldProductSP + newProductSP);
            await updateDoc(orderDocRef, { productCP: updatedProductCP, productSP: updatedProductSP });

            // Calculate the new total amount using the unit price
            const updatedTotalAmount = products.reduce((total, prod, index) => {
                const prodQuantity = index === productIndex ? value : prod.quantity;
                return total + parseFloat(prod.price || '0') * prodQuantity;
            }, 0);

            // Update the UI amount
            const totalAmountElement = document.querySelector('.priceElement');
            if (totalAmountElement) {
                totalAmountElement.textContent = updatedTotalAmount.toFixed(2);
            }
        }

        // Update the specific field of the product
        products[productIndex][field] = value;

        // Update the 'productsData' field with the new products array
        await updateDoc(orderDocRef, { productsData: JSON.stringify(products) });
        console.log(`Product at index ${productIndex} updated successfully: ${field} = ${value}`);
    } catch (error) {
        console.error(`Failed to update product in order with ID ${docid}:`, error);
        throw error;
    }
}

/**
 * Deletes a specific product from the 'orders' collection.
 *
 * @param {string} docid - The document ID of the order to update.
 * @param {number} productIndex - The index of the product to delete in the products array.
 * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
 * @throws Will throw an error if the deletion fails.
 */
export async function deleteProduct(docid, productIndex) {
    if (!docid || productIndex === undefined) {
        throw new Error("Document ID and product index are required for deleting a product.");
    }

    try {
        const orderDocRef = doc(db, "orders", docid);
        // Fetch the current order data
        const orderSnap = await getDoc(orderDocRef);
        if (!orderSnap.exists()) {
            throw new Error("Order not found.");
        }

        const data = orderSnap.data();
        let products = JSON.parse(data.productsData || "[]");

        if (productIndex < 0 || productIndex >= products.length) {
            throw new Error("Invalid product index.");
        }

        const product = products[productIndex];
        const [collectionId, docId] = product.id.split('$').slice(0, 2);
        const productRef = doc(db, collectionId, docId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            throw new Error("Product not found.");
        }

        const productData = productSnap.data();
        const productCP = parseFloat(productData.productCP || '0');
        const productSP = parseFloat(productData.price || '0');

        const productCPToDecrement = productCP * product.quantity;
        const productSPToDecrement = productSP * product.quantity;

        // Update the order's productCP and productSP
        const updatedProductCP = parseInt(parseFloat(data.productCP || '0') - productCPToDecrement);
        const updatedProductSP = parseInt(parseFloat(data.productSP || '0') - productSPToDecrement);
        await updateDoc(orderDocRef, { productCP: updatedProductCP, productSP: updatedProductSP });

        // Remove the product at the specified index
        products.splice(productIndex, 1);

        // Update the 'productsData' field with the new products array
        await updateDoc(orderDocRef, { productsData: JSON.stringify(products) });
        console.log(`Product at index ${productIndex} deleted successfully from order ${docid}.`);
    } catch (error) {
        console.error(`Failed to delete product from order with ID ${docid}:`, error);
        throw error;
    }
} 