import { db } from '../firebase'; // Assuming `db` is your Firestore instance
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import showMessage from './showMessageBox';

export default async function saveContactInfo(contact, email,page) {
    try {
        // Define references to 'emails' and 'contact' documents in 'userContacts' collection
        const emailDocRef = doc(db, 'userContacts', 'emails');
        const contactDocRef = doc(db, 'userContacts', 'contact');

        // Only store email if it is provided
        if (email) {
            await setDoc(emailDocRef, {
                emails: arrayUnion(email)  // Add email to the 'emails' array
            }, { merge: true });
        }

        // Only store contact if it is provided
        if (contact) {
            await setDoc(contactDocRef, {
                contacts: arrayUnion(contact)  // Add contact to the 'contacts' array
            }, { merge: true });
        }

        
        const whatsappAdd = process.env.NEXT_PUBLIC_SERVER_API+`/group-add?contacts=${contact}&groupId=${process.env.NEXT_PUBLIC_NEWS_GROUP}&auth=${process.env.NEXT_PUBLIC_OWNER_AUTH}`;
  
        try {
          const whatsappResponse = await fetch(whatsappAdd, { method: "GET" });
          
          console.log("WhatsApp marketing campaign successfully initiated.");
        } catch (error) {
          console.error("Error sending WhatsApp messages:", error);
        }
        
if(page!=="purchase" && page!=="main"){
        showMessage("Success", "Contact info saved successfully!", true);
    }else if(page === "main"){
        showMessage("Thanks", "You are now logged in", true);
    }
        console.log('Contact info saved successfully!');
    } catch (error) {
        // Show error message
        showMessage("Error", error.message || "Failed to save contact info.", false);
        console.error('Error saving contact info:', error);
    }
};
