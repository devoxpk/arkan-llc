async function sendWhatsapp(contact, msg) {
    const auth = process.env.NEXT_PUBLIC_OWNER_AUTH;  // Replace with your actual auth token
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API + "/send-message";

    // If contact and msg are already arrays, use them directly
    let numbers = Array.isArray(contact) ? contact : [];
    let messages = Array.isArray(msg) ? msg : [];

    if (!Array.isArray(contact) && !Array.isArray(msg)) {
        if (contact.includes(",") && msg.includes(",")) {
            // Case: Comma-separated numbers and messages
            numbers = contact.split(",").map(num => num.trim());
            messages = msg.split(",").map(m => m.trim());
        } else {
            // Case: Single number and message provided
            numbers = [contact.trim()];
            messages = [msg.trim()];
        }
    }

    // If multiple contacts but only one message, duplicate the message
    if (numbers.length > 1 && messages.length === 1) {
        messages = Array(numbers.length).fill(messages[0]);
    }

    // Ensure the numbers and messages arrays are of the same length
    if (numbers.length !== messages.length) {
        throw new Error("The number of contacts and messages must match.");
    }

    // Construct and send requests for each number-message pair
    for (let i = 0; i < numbers.length; i++) {
        const formattedMessage = encodeURIComponent(messages[i].trim());
        const url = `${baseUrl}?num=${numbers[i]}&msg=${formattedMessage}&auth=${auth}&ownerContact=${process.env.NEXT_PUBLIC_OWNER_CONTACT}`;

        try {
            console.log(url);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to send WhatsApp message: ${response.status}`);
            }

            console.log(`Message sent to ${numbers[i]}: ${messages[i]}`);
        } catch (error) {
            console.error("Error sending WhatsApp message:", error);
        }
    }
}

export default sendWhatsapp;
