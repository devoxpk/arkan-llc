
import ThanksComponent from "../../components/thanks";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default async function ThanksServer({ params }) {
    const { docid } = params;

    const decodedDocid = docid.includes('%20') ? docid.replace(/%20/g, ' ') : docid;

    if (!decodedDocid) {
        return <p>Invalid order ID.</p>;
    }

    let orderDetails = null;
    let error = null;

    try {
        const orderDocRef = doc(db, "orders", decodedDocid);
        const orderSnap = await getDoc(orderDocRef);

        if (!orderSnap.exists()) {
            error = "Order not found.";
        } else {
            const data = orderSnap.data();
            const products = JSON.parse(data.productsData || "[]");
            const amount = products.reduce((total, product) => {
                const price = parseFloat(product.price) || 0;
                const quantity = parseInt(product.quantity) || 1;
                return total + price * quantity;
            }, 0);

            orderDetails = {
                orderId: decodedDocid,
                date: data.Date || "N/A",
                contact: data.Contact || "N/A",
                paymentMethod: data.Details || "Cash on Delivery",
                amount: amount.toFixed(2),
                shippingAddress: `${data.Address}, ${data.City}` || "N/A",
                billingAddress: `${data.Address}, ${data.City}` || "N/A",
                name: data.Name 
                    ? `${data.Name.charAt(0).toUpperCase()}${data.Name.slice(1)}` 
                    : "N/A",
                products,
                currentLoc: data.currentLoc || "",
                confirm: data.confirm || "Not Confirmed",
                city: data.City || "N/A",
                customerID: data.customerID || "N/A",
            };
        }
    } catch (err) {
        error = "Failed to fetch order details.";
        console.error(err);
    }

    return (
        <ThanksComponent orderDetails={orderDetails} error={error} docid={decodedDocid} />
    );
}
