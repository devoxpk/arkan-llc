import { db } from '../firebase'; // Assuming `db` is your Firestore instance
import { doc, setDoc, arrayUnion } from 'firebase/firestore';

export default async function saveContactInfo(contact, email) {
    try {
        // Define references to 'emails' and 'contact' documents in 'userContacts' collection
        const emailDocRef = doc(db, 'userContacts', 'emails');
        const contactDocRef = doc(db, 'userContacts', 'contact');

        // Update emails array in the 'emails' document
        await setDoc(emailDocRef, {
            emails: arrayUnion(email)  // Add email to the 'emails' array
        }, { merge: true });

        // Update contacts array in the 'contact' document
        await setDoc(contactDocRef, {
            contacts: arrayUnion(contact)  // Add contact to the 'contacts' array
        }, { merge: true });

        console.log('Contact info saved successfully!');
    } catch (error) {
        console.error('Error saving contact info:', error);
    }
};
