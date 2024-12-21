'use server'

import { revalidatePath } from "next/cache";
import ProductsServer from "./productsServer";
import { db } from '../firebase'; // Import your Firebase Firestore instance
import { collection, onSnapshot } from "firebase/firestore";

// Function to set up listeners for specified fields
function setupRevalidationListener() {
    const collections = ["creds", "TimeStamp", "TimeStamp"]; // Add your collection names here

    collections.forEach((collectionName) => {
        const colRef = collection(db, collectionName);
        onSnapshot(colRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified" || change.type === "added" || change.type === "removed") {
                    console.log(`Change detected in ${collectionName}. Revalidating /products.`);
                    revalidatePath('/products');
                }
            });
        });
    });
}

// Initialize listeners
setupRevalidationListener();

export async function refreshProducts() {
    console.log("Revalidating /products");
    revalidatePath('/products');
}

export default async function Products({ collectionsToFetch, styleHead = "grid", productsStyle = false, trending = false } = {}) {
    return (
        <div>
            <ProductsServer 
                collectionsToFetch={collectionsToFetch} 
                styleHead={styleHead} 
                productsStyle={productsStyle} 
                trending={trending} 
            />
        </div>
    );
} 