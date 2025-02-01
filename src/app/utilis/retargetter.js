import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
  } from "firebase/firestore";
  import { db } from "../firebase";
  import { v4 as uuidv4 } from "uuid";
  import sendWhatsapp from "./sendWhatsapp";
  
  /**
   * Retarget customers and send promotional messages if criteria are met.
   */
  const retargetter = async (discount = "10%") => {
    try {
      console.log("Starting the retargetter process...");
  
      // Step 1: Clear existing promo codes
      const promosRef = doc(db, "promos", "codes"); // Single document for all promo codes
      console.log("Clearing previous promo codes...");
      await deleteDoc(promosRef);
  
      // Step 2: Fetch emails and contacts from Firestore
      console.log("Fetching userContacts collection...");
      const userContactsRef = collection(db, "userContacts");
  
      // Fetch the `emails` document
      const emailsDocRef = doc(userContactsRef, "emails");
      const emailsDocSnap = await getDoc(emailsDocRef);
  
      // Fetch the `contact` document
      const contactsDocRef = doc(userContactsRef, "contact");
      const contactsDocSnap = await getDoc(contactsDocRef);
  
      // Extract data from the documents, handling undefined cases
      const emailsArray = emailsDocSnap.exists() ? emailsDocSnap.data().emails || [] : [];
      const contactsArray = contactsDocSnap.exists() ? contactsDocSnap.data().contacts || [] : [];
  
      console.log("Fetched emails:", emailsArray);
      console.log("Fetched contacts:", contactsArray);
  
      if (!emailsArray.length && !contactsArray.length) {
        console.error("No emails or contacts found in Firestore.");
        return;
      }
  
      // Collections to check
      const collectionsToCheck = ["orders", "dispatched", "delivered", "delayed", "returns", "cancelled"];
      console.log("Collections to check for matches:", collectionsToCheck);
  
      // Step 3: Filter emails and contacts appearing in more than one document
      const filterEntries = async (entries, field) => {
        const unusedEntries = [];
        for (const entry of entries) {
          console.log(`Checking entry: ${entry}`);
          let occurrenceCount = 0;
  
          for (const collectionName of collectionsToCheck) {
            console.log(`Checking collection: ${collectionName}`);
            const collectionRef = collection(db, collectionName);
            const docs = await getDocs(collectionRef);
  
            for (const doc of docs.docs) {
              const data = doc.data();
              if (data[field] === entry) {
                occurrenceCount += 1;
                if (occurrenceCount > 1) break;
              }
            }
            if (occurrenceCount > 1) break;
          }
  
          if (occurrenceCount <= 1) unusedEntries.push(entry);
        }
        return unusedEntries;
      };
  
      const unusedEmails = await filterEntries(emailsArray, "Email");
      const unusedContacts = await filterEntries(contactsArray, "Contact");
  
      console.log("Unused emails:", unusedEmails);
      console.log("Unused contacts:", unusedContacts);
  
      if (!unusedEmails.length && !unusedContacts.length) {
        console.log("No unused emails or contacts to retarget.");
        return;
      }
  
      // Step 4: Generate and send promo codes
      const promoCodes = {}; // Collect all promo codes to save
  
      // Process emails and generate promo codes
      const emailMessages = [];
      unusedEmails.forEach((email) => {
        const promoCode = uuidv4().slice(0, 4).toUpperCase();
        promoCodes[promoCode] = discount; // Map promo code to discount
  
        const promoMessage = `💥 Special Offer Just For You! 💥\n\nEnjoy ${discount} OFF on your favorite styles at DEVOX! \nUse code ${promoCode} at checkout.\n\n🛒 Shop Now: ${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}\n\nHurry! Offer valid for a limited time. 💌`;
        emailMessages.push(promoMessage); // No URI encoding
      });
  
      // Process contacts and generate promo codes
      const contactMessages = [];
      unusedContacts.forEach((contact) => {
        const promoCode = uuidv4().slice(0, 4).toUpperCase();
        promoCodes[promoCode] = discount; // Map promo code to discount
  
        const promoMessage = `✨ Exclusive Savings Just For You! ✨\n\nYour style deserves ${discount} OFF at DEVOX. \nUse code ${promoCode} at checkout.\n\n Shop Now: ${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}\n\nAct fast—this deal won't last! 🎉`;
        contactMessages.push(promoMessage); // No URI encoding
      });
  
      // Save promo codes to Firestore
      await setDoc(promosRef, promoCodes, { merge: true });
  
      // Step 5: Send email messages
      if (unusedEmails.length > 0) {
        const emailApiUrl = `${process.env.NEXT_PUBLIC_REVIEW_DOMAIN}/send-email?ownemail=${process.env.NEXT_PUBLIC_OWNER_EMAIL}&pass=${process.env.NEXT_PUBLIC_EMAIL_PASS}&emails=${unusedEmails.join(
          ","
        )}&msgs=${emailMessages.join(
          ","
        )}&type=send&subject=${encodeURIComponent("DEVOX - Exclusive Discount Code")}`;
  
        try {
          const emailResponse = await fetch(emailApiUrl, { method: "GET" });
          if (!emailResponse.ok) throw new Error(`Email API failed with status: ${emailResponse.status}`);
          console.log("Email marketing campaign successfully initiated.");
        } catch (error) {
          console.error("Error sending marketing emails:", error);
        }
      }
  
      // Step 6: Send WhatsApp messages
      if (unusedContacts.length > 0) {
        try {
          await sendWhatsapp(unusedContacts, contactMessages); // Send as arrays
          console.log("WhatsApp marketing campaign successfully initiated.");
        } catch (error) {
          console.error("Error sending WhatsApp messages:", error);
        }
      }
    } catch (error) {
      console.error("Error in retargetter function:", error);
    }
  };
  
  export default retargetter;
  