async function sendWhatsapp(contact, msg) {
    const auth =process.env.NEXT_PUBLIC_OWNER_AUTH;  // Replace with your actual auth token
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API+"/send-message";
    const url = `${baseUrl}?num=${contact}&msg=${encodeURIComponent(msg)}&auth=${auth}&ownerContact=${process.env.NEXT_PUBLIC_OWNER_CONTACT}`;

    try {
        console.log(url)
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to send WhatsApp message: ${response.status}`);
        }

        console.log(`Message sent to ${contact}: ${msg}`);
    } catch (error) {
        console.error("Error sending WhatsApp message:", error);
    }
}

export default sendWhatsapp;
