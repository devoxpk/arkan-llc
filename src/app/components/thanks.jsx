'use client'
import ThanksComponent from "../components/thanks";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

// Fetch all available document IDs for generating static paths
export async function getStaticPaths() {
    const paths = [];
    try {
        const ordersCollection = collection(db, "orders");
        const snapshot = await getDocs(ordersCollection);

        snapshot.forEach((doc) => {
            paths.push({ params: { docId: doc.id } });
        });
    } catch (error) {
        console.error("Error fetching paths from Firestore:", error);
    }

    return { paths, fallback: "blocking" }; // Blocking ensures proper SSR for non-pre-rendered paths
}

export async function getStaticProps({ params }) {
    const { docId } = params;

    let orderDetails = {
        orderId: "",
        date: "",
        contact: "",
        paymentMethod: "",
        amount: "",
        shippingAddress: "",
        billingAddress: "",
        products: [],
        currentLoc: "",
    };

    try {
        const orderDocRef = doc(db, "orders", docId);
        const orderSnap = await getDoc(orderDocRef);

        if (orderSnap.exists()) {
            const data = orderSnap.data();
            orderDetails = {
                orderId: docId,
                date: data.Date || "N/A",
                contact: data.Contact || "N/A",
                paymentMethod: data.paymentMode || "Cash on Delivery",
                amount: data.productPrice || "N/A",
                shippingAddress: `${data.Address}, ${data.City}`,
                billingAddress: `${data.Address}, ${data.City}`,
                name: `${data.Name.charAt(0).toUpperCase()}${data.Name.slice(1)}`,
                products: JSON.parse(data.productsData || "[]"),
                currentLoc: data.currentLoc || "",
            };
        } else {
            return { notFound: true }; // Handle non-existent documents gracefully
        }
    } catch (error) {
        console.error("Error fetching order details:", error);
        return { notFound: true };
    }

    return {
        props: { orderDetails },
        revalidate: 60, // Optional revalidation every 60 seconds
    };
}

export default function ThanksPage({ orderDetails }) {
    return <ThanksComponent orderDetails={orderDetails} />;
}
