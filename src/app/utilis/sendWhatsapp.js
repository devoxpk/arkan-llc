async function sendWhatsapp(contact, msg) {
    const auth = process.env.NEXT_PUBLIC_OWNER_AUTH;  // Replace with your actual auth token
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API + "/send-message";

    // If contact and msg are already arrays, use them directly
    let numbers = Array.isArray(contact) ? contact : [];
    let messages = Array.isArray(msg) ? msg : [];

    if (!Array.isArray(contact) && !Array.isArray(msg)) {
        if (contact.includes(",") && msg.includes(",")) {
            // Case: Comma-separated numbers and messages
            numbers = contact.split(",");
            messages = msg.split(",");
        } else {
            // Case: Single number and message provided
            numbers = [contact];
            messages = [msg];
        }
    }

    // Ensure the numbers and messages arrays are of the same length
    if (numbers.length !== messages.length) {
        throw new Error("The number of contacts and messages must match.");
    }

    // Format numbers to start with '92'
    numbers = numbers.map(number => {
        number = number.trim();
        if (number.startsWith("0")) {
            return "92" + number.slice(1);
        } else if (!number.startsWith("92")) {
            return "92" + number;
        }
        return number;
    });

    // Encode messages
    messages = messages.map(message => encodeURIComponent(message.trim()));

    // Construct the URL
    const url = `${baseUrl}?num=${numbers.join(",")}&msg=${messages.join(",")}&auth=${auth}&ownerContact=${process.env.NEXT_PUBLIC_OWNER_CONTACT}`;

    try {
        console.log(url);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to send WhatsApp message: ${response.status}`);
        }

        console.log(`Messages sent to ${numbers.join(",")}: ${messages.join(",")}`);
    } catch (error) {
        console.error("Error sending WhatsApp message:", error);
    }
}

export default sendWhatsapp;
