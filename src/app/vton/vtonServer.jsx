'use server'
import { db } from '../firebase.js';
import { collection, doc, getDoc } from 'firebase/firestore';
import Vton from './vton';

export default async function VtonServer() {
    console.log("Starting VtonServer function to fetch images.");
    const images = [];
    let collectionId = 1;

    while (true) {
        console.log(`Checking collection with ID: ${collectionId}`);
        const collectionRef = collection(db, collectionId.toString());
        let docId = 1;
        let hasDocuments = false;

        while (true) {
            console.log(`Checking document with ID: ${docId} in collection: ${collectionId}`);
            const docRef = doc(collectionRef, docId.toString());
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.log(`No document found with ID: ${docId} in collection: ${collectionId}. Breaking loop.`);
                break;
            }

            const data = docSnap.data();
            console.log(`Document data for ID: ${docId} in collection: ${collectionId}:`, data);

            if (data.pic) {
                console.log(`Found image in document ID: ${docId} in collection: ${collectionId}. Adding to images array.`);
                const imageEntry = { 
                    pic: data.pic, 
                    ref: `${collectionId}/${docId}`, // Full reference path including collection and document ID
                    collectionId: collectionId.toString() // Pass collection ID separately
                };
                if (data.vtonImage) {
                    imageEntry.vtonImage = data.vtonImage;
                }
                images.push(imageEntry);
                hasDocuments = true;
            }

            docId++;
        }

        if (!hasDocuments) {
            console.log(`No documents found in collection: ${collectionId}. Breaking outer loop.`);
            break;
        }

        collectionId++;
    }

    console.log("Finished fetching images. Passing images to Vton component.");
    return <Vton images={images} />;
}