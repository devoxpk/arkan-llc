async function sendWhatsapp(contact, msg) {
    const auth = "Devox-332cewad2";  // Replace with your actual auth token
    const baseUrl = "http://16.171.1.112:8080/send-message";
    const url = `${baseUrl}?num=${contact}&msg=${encodeURIComponent(msg)}&auth=${auth}`;

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
