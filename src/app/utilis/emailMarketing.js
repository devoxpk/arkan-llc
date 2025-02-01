import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Ensure firebase.js exports the properly initialized `db`

let isApiCalled = false; // Flag to ensure the API is not called multiple times

/**
 * Fetch emails and call the marketing API.
 */
const emailMarketer = async () => {
  if (isApiCalled) {
    console.warn("API call already in progress. Skipping duplicate call.");
    return;
  }

  try {
    isApiCalled = true; // Set the flag to indicate API call has started

    // Step 1: Fetch emails from Firestore
    const emailsDocRef = doc(collection(db, "userContacts"), "emails"); // Replace "emails" with the actual document ID
    const emailsDoc = await getDoc(emailsDocRef);

    if (!emailsDoc.exists()) {
      console.error("No emails found in Firestore.");
      return;
    }

    const emailsArray = emailsDoc.data().emails; // Assuming Firestore has a field `emails` that's an array
    if (!emailsArray || emailsArray.length === 0) {
      console.error("Emails array is empty.");
      return;
    }

    // Convert emails array into a comma-separated string
    const emails = emailsArray.join(",");

    // Step 2: Prepare API data
    const jsonData = {
      business: {
        name: "DEVOX",
        description: "Direct Embosed Anime Embroidery Brand with Premium Quality Embroidery and Stitching ",
        website: process.env.NEXT_PUBLIC_REVIEW_DOMAIN,
        support_email: process.env.NEXT_PUBLIC_OWNER_EMAIL,
      },
      campaign: {
        goal: "Encourage the audience to make a purchase.",
        target_audience: "Customers interested in Anime Embroidery and Stitching",
        cta: "Explore our premium collection today.",
      },
    };

    const apiUrl = process.env.NEXT_PUBLIC_SERVER_API+`/send-email?ownemail=${process.env.NEXT_PUBLIC_OWNER_EMAIL}&pass=${process.env.NEXT_PUBLIC_EMAIL_PASS}&emails=${emails}&subject=Devox%20-%20Sale%20Ending&jsonData=${encodeURIComponent(
      JSON.stringify(jsonData)
    )}&type=marketing`;

    // Step 3: Trigger the API call without awaiting the response
    fetch(apiUrl).catch((error) =>
      console.error("API call encountered an error but will not retry:", error)
    );

    console.log("Email marketing campaign initiated successfully.");
  } catch (error) {
    console.error("Error in emailMarketer function:", error);
  } finally {
    isApiCalled = false; // Reset the flag after the function execution
  }
};

export default emailMarketer;
