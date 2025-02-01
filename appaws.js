const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const { DisconnectReason } = require("@whiskeysockets/baileys");
const useFirestoreAuthState = require("./AuthState");
const makeWASocket = require("@whiskeysockets/baileys").default;
const nodemailer = require('nodemailer');
const pino = require('pino');
const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');
const path = require("path");
const app = express();
const https = require('https');


const PORT = process.env.PORT || 8080;
console.log("Server is running");
app.use(cors());

const connections = {}; // Store user connections by auth parameter
const qrCodes = {};     // Store QR codes for each auth

// Main connection logic with enhanced timeout
async function connectionLogic(auth) {
    const firestoreAuthState = await useFirestoreAuthState(auth);

    const sock = makeWASocket({
        printQRInTerminal: true,
        browser: [
            (auth.split('-')[0] || auth).replace(/<icon_regex>/g, '').trim() + ' Bot', // Replace <icon_regex> with the actual regex for your icon
            "Purpose : ", 
            "Whatsapp - Automations"
        ],
        auth: firestoreAuthState.state,
        logger: pino({ level: "silent" }),
        timeoutMs: 60000000000 // Increased timeout to 1 minute
    });
    

    sock.ev.on("connection.update", async (update) => {
        const { connection: connStatus, lastDisconnect, qr } = update || {};

        if (qr) {
            console.log(`QR Code for ${auth}:`, qr);
            qrCodes[auth] = qr;
        }

        if (connStatus === "open") {
            console.log(`Connected to WhatsApp for ${auth}`);
            delete qrCodes[auth];
            connections[auth] = sock;  // Store the socket connection
            return;
        }

        if (connStatus === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log(`Attempting to reconnect for ${auth}...`);
                await connectionLogic(auth); // Retry connection
            } else {
                console.log(`Logged out from WhatsApp for ${auth}. Manual re-authentication needed.`);
                delete qrCodes[auth];
                delete connections[auth];
            }
        }
    });

    sock.ev.on("creds.update", firestoreAuthState.saveCreds);
    return sock;
}

// Helper function to wait until the connection is established
const waitForConnection = (sock) => new Promise((resolve) => {
    const checkInterval = setInterval(() => {
        if (sock?.ev) {
            clearInterval(checkInterval);
            resolve();
        }
    }, 1000); // Check every second
});

// Retry logic for sending a message
const sendMessageWithRetry = async (num, msg, sock, retries = 3, ownerContact, auth) => {
    while (retries > 0) {
        try {
            // Validate if the number exists on WhatsApp
            const [result] = await sock.onWhatsApp(`${num}@s.whatsapp.net`);
            if (!result || !result.exists) {
                console.log(`The number ${num} does not have WhatsApp.`);
                sendOwnerNotification(`The number ${num} does not have WhatsApp.`, auth, ownerContact);
                return "Number validation failed.";
            }

            // Send the message
            await sock.sendMessage(`${num}@s.whatsapp.net`, { text: msg });
            console.log(`Message sent to ${num}`);
            return "Message sent successfully!";
        } catch (error) {
            console.error(`Error sending message to ${num}:`, error);

            // Handle specific errors
            if (error.output?.statusCode === DisconnectReason.connectionLost && retries > 1) {
                console.log("Reconnecting...");
                await connectionLogic(sock.auth); // Retry connection
            } else {
                console.log("Unable to send message, skipping...");
                break; // Exit retry loop for unrecoverable errors
            }
        }
        retries--;
    }
    throw new Error(`Failed to send message to ${num} after multiple attempts.`);
};

app.get("/group-add", async (req, res) => {
    const { auth, groupId, contacts } = req.query;

    if (!auth || !groupId || !contacts) {
        return res.status(400).send("Missing required query parameters: 'auth', 'groupId', or 'contacts'.");
    }

    const contactList = contacts.split(",").map(contact => {
        contact = contact.trim();
        if (contact.startsWith("0")) return "92" + contact.slice(1);
        if (!contact.startsWith("92")) return "92" + contact;
        return contact;
    });

    if (!connections[auth]) {
        console.log(`Initializing connection for ${auth}...`);
        const sock = await connectionLogic(auth);
        connections[auth] = sock;
    }

    const sock = connections[auth];
    try {
        await waitForConnection(sock);

        console.log(`Adding contacts to group: ${groupId}`);
        const response = await sock.groupParticipantsUpdate(
            groupId,
            contactList.map(contact => `${contact}@s.whatsapp.net`),
            "add"
        );

        const addResults = response.map(result => ({
            participant: result.jid,
            status: result.error ? `Failed: ${result.error}` : "Added successfully",
        }));

        res.status(200).send({ message: "Contacts added to group.", addResults });
    } catch (error) {
        console.error("Error adding participants to the group:", error);
        res.status(500).send("Failed to add participants to the group.");
    }
});

app.get("/send-message", async (req, res) => {
    const { num, msg, auth, ownerContact } = req.query;

    if (!auth || !num || !msg) {
        return res.status(400).send("Missing required query parameters: 'auth', 'num', or 'msg'.");
    }

    let numbers = [];
    let messages = [];

    if (Array.isArray(num) && Array.isArray(msg)) {
        numbers = num;
        messages = msg;
    } else if (!Array.isArray(num) && !Array.isArray(msg) && num.includes(",") && msg.includes(",")) {
        numbers = num.split(",");
        messages = msg.split(",");
    } else if (!Array.isArray(num) && !Array.isArray(msg)) {
        numbers = [num];
        messages = [msg];
    } else {
        return res.status(400).send("Invalid input format for 'num' and 'msg'.");
    }

    if (numbers.length !== messages.length) {
        return res.status(400).send("The number of contacts and messages must match.");
    }

    if (!connections[auth]) {
        console.log(`Initializing connection for ${auth}...`);
        const sock = await connectionLogic(auth);
        connections[auth] = sock;
    }

    const sock = connections[auth];

    if (qrCodes[auth]) {
        const qrImageURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodes[auth])}&size=150x150`;

        res.send(`
            <html>
                <head>
                    <title>WhatsApp Login</title>
                    <script>
                        setTimeout(() => {
                            location.reload();
                        }, 20000);
                    </script>
                </head>
                <body>
                    <h1>Logging in as ${auth}</h1>
                    <img src="${qrImageURL}" alt="Scan this QR code with WhatsApp" />
                    <p>Scan the QR code above with your WhatsApp to log in.</p>
                    <pre style="font-weight: bolder; color: red;">
                        *QR code will be refreshed every 20 seconds until you see 'Message sent successfully.' You are not logged in.*
                    </pre>
                </body>
            </html>
        `);
        return;
    }

    try {
        await waitForConnection(sock);

        const results = [];
        for (let i = 0; i < numbers.length; i++) {
            let number = numbers[i].trim();

            if (number.startsWith("0")) {
                number = "92" + number.slice(1);
            } else if (!number.startsWith("92")) {
                number = "92" + number;
            }

            const message = messages[i].trim();
            console.log(`Sending message to ${number}: ${message}`);

            try {
                const response = await sendMessageWithRetry(number, message, sock, 3, ownerContact, auth);
                results.push({ number, status: "success", response });
            } catch (error) {
                console.error(`Failed to send message to ${number}:`, error);
                results.push({ number, status: "failed", error: error.message });
            }
        }

        res.status(200).send(results);
    } catch (error) {
        console.error("Error processing bulk messages:", error);
        res.status(500).send("Failed to process bulk messages.");
    }
});






const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.CHATBOT_API;

// Initialize the generative AI model once
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// Define the function to interact with the Gemini Api
async function runChat(userInput, auth, dataParam = null) {
    const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 500,
    };

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];

    // Conditionally define the chat history based on the 'auth' value or dataParam
    let history = [];
    if (dataParam && Array.isArray(dataParam)) {
        // Ensure each message has a 'parts' property with an array of Parts
        for (const message of dataParam) {
            if (message.parts && Array.isArray(message.parts)) {
                history.push({ role: message.role, parts: message.parts });
            } else {
                console.error("Error: 'parts' is not an array or is undefined in message:", message);
                history.push({ role: message.role, parts: [] });
            }
        }
    } else if (auth === "nouve") {
        history = [
            {
                role: "user",
                parts: [{ text: "You are Nouve, a friendly assistant for Nouve, a business that offers old money clothing articles " }]
            },
            {
                role: "model",
                parts: [{ text: "Hello! Welcome to Nouve. My name is Nouve. What's your name?" }]
            },
        ];
    } else if(auth === 'devox'){
        history = [
            {
                role: "user",
                parts: [{ text: "You are Devox, a friendly assistant for Devox, a business that offers anime embroidery and DTF printed shirts..." }]
            },
            {
                role: "model",
                parts: [{ text: "Hello! Welcome to Devox. My name is Devox. What can I help you with today?" }]
            },
        ];
    }

    const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: history, // Pass the conditionally set history
    });

    const result = await chat.sendMessage(userInput);
    return result.response.text();
}

// Define the route
app.get("/get-response", async (req, res) => {
    try {
        const userInput = req.query.msg; // Get 'msg' query parameter from URL
        const authState = req.query.auth;
        const dataParam = req.query.data ? JSON.parse(req.query.data) : null; // Parse 'data' if provided

        if (!userInput) {
            console.log("msg not exist");
            return res.status(400).send("Query parameter 'msg' is required.");
        }

        // Ensure dataParam is properly formatted
        if (dataParam && Array.isArray(dataParam)) {
            dataParam.forEach(message => {
                if (!message.parts || !Array.isArray(message.parts)) {
                    message.parts = [{ text: message.content || "" }];
                }
            });
        }

        // Cache previous responses if necessary
        const responseText = await runChat(userInput, authState, dataParam);
        console.log(responseText); // Log response to console

        res.status(200).send(responseText); // Send response back to client
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});


const statusFilePath = './status.txt';

app.get("/get-tracking", async (req, res) => {
    const trackingNumbers = req.query.tracking;
    const contacts = req.query.contact;
    const domainReviews = req.query.domainReview;
    const auth = req.query.auth;
    const ownerContact = req.query.ownercontact;

    console.log("Request received:");
    console.log("Tracking numbers:", trackingNumbers);
    console.log("Contacts:", contacts);
    console.log("Auth:", auth);
    console.log("Domain Reviews:", domainReviews);

    if (!trackingNumbers || !Array.isArray(trackingNumbers) ||
        !contacts || !Array.isArray(contacts) ||
        trackingNumbers.length !== contacts.length) {
        console.log("Input validation failed: Arrays must be the same length.");
        console.error("Error: Input validation failed.");
        return res.status(400).json({ error: "Tracking numbers and contacts must be provided in arrays of the same length." });
    }

    let statusData = fs.existsSync(statusFilePath) ? JSON.parse(fs.readFileSync(statusFilePath, 'utf-8')) : {};

    try {
        const trackingResults = [];
        console.log("Status data loaded from file:", statusData);

        for (let i = 0; i < trackingNumbers.length; i++) {
            const trackingNumber = trackingNumbers[i];
            const contact = contacts[i];
            const domainReview = domainReviews ? domainReviews[i] : null;

            console.log(`Fetching tracking details for ${trackingNumber}...`);
            console.log(`Tracking Number: ${trackingNumber}, Contact: ${contact}, Domain Review: ${domainReview}`);

            try {
                const response = await axios.post(
                    "https://api.shooterdelivery.com/Apis/fetch-order-tracking.php",
                    { id: trackingNumber },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Sec-Fetch-Dest': 'empty',
                            'Sec-Fetch-Site': 'cross-site'
                        }
                    }
                );

                console.log(`Response received for ${trackingNumber}:`, response.data);

                const trackingDetails = response.data.Order_Details;
                const statusHistory = response.data.Status_History;

                if (!trackingDetails || trackingDetails.message === "No Records Found" || !statusHistory || statusHistory.length === 0) {
                    console.log(`No valid tracking details found for ${trackingNumber}`);
                    console.error(`Error: No valid tracking details found for ${trackingNumber}`);
                    continue;
                }

                const latestStatus = statusHistory[statusHistory.length - 1]?.status || "Unknown status";
                const previousStatus = statusData[trackingNumber]?.status;
                const attempts = statusData[trackingNumber]?.attempts || 0;

                if (!statusData[trackingNumber] || previousStatus !== latestStatus) {
                    statusData[trackingNumber] = { status: latestStatus, attempts: 0 };

                    if (/refuse/i.test(latestStatus)) {
                        const customerMessage = `You have refused the order. It has been dispatched. Kindly receive the order or, if you are facing issues like fake attempts, let us know.`;
                        await sendCustomerNotification(contact, customerMessage, auth, ownerContact);
                        console.log(`Customer notified about refusal for ${trackingNumber}`);
                        console.log(`Customer Notification: ${customerMessage}`);

                        const ownerMessage = `Order with tracking number ${trackingNumber} has been refused. Kindly investigate the issue.`;
                        await sendOwnerNotification(ownerMessage, auth, ownerContact);
                        console.log(`Owner notified about refusal for ${trackingNumber}`);
                        console.log(`Owner Notification: ${ownerMessage}`);

                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Customer refused the order. Investigate for fake attempts or other issues.`
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                        console.log(`Shipper advice sent for ${trackingNumber}`);
                        console.log(`Shipper Advice: Customer refused the order. Investigate for fake attempts or other issues.`);
                    } else {
                        const trackingMessage = `Tracking Details:\nStatus: ${latestStatus}\nTracking Number: ${trackingNumber}`;
                        await sendCustomerNotification(contact, trackingMessage, auth, ownerContact);
                        console.log(`Customer notified with tracking details for ${trackingNumber}`);
                        console.log(`Customer Notification: ${trackingMessage}`);

                        if (/deliver/i.test(latestStatus) && domainReview) {
                            const reviewMessage = `Thanks for purchasing! You can proceed to this link ${domainReview} to drop a review. Your feedback is valuable to us.`;
                            await sendCustomerNotification(contact, reviewMessage, auth, ownerContact);
                            console.log(`Customer notified for review for ${trackingNumber}`);
                            console.log(`Customer Notification: ${reviewMessage}`);
                            statusData.delivered = statusData.delivered || {};
                            statusData.delivered[trackingNumber] = { contact, status: latestStatus };
                            delete statusData[trackingNumber];
                        }
                    }
                } else {
                    statusData[trackingNumber].attempts += 1;

                    if (statusData[trackingNumber].attempts === 2) {
                        await sendOwnerNotification(`Attempt 2: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nThe order has not progressed. Kindly report to the courier.`, auth, ownerContact);
                        console.log(`Owner notified about attempt 2 for ${trackingNumber}`);
                        console.log(`Owner Notification: Attempt 2: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nThe order has not progressed. Kindly report to the courier.`);

                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Its been same tracking for 3 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} ` 
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                        console.log(`Shipper advice sent for ${trackingNumber}`);
                        console.log(`Shipper Advice: Its been same tracking for 3 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} `);
                    }

                    if (statusData[trackingNumber].attempts === 4) {
                        await sendOwnerNotification(`Attempt 4: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nNo progress on this order, please report to the courier.`, auth, ownerContact);
                        console.log(`Owner notified about attempt 4 for ${trackingNumber}`);
                        console.log(`Owner Notification: Attempt 4: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nNo progress on this order, please report to the courier.`);

                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Its been same tracking for 6 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} ` 
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                        console.log(`Shipper advice sent for ${trackingNumber}`);
                        console.log(`Shipper Advice: Its been same tracking for 6 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} `);
                    }

                    if (statusData[trackingNumber].attempts === 6) {
                        await sendOwnerNotification(`Attempt 6: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nThis is the last notification, next time it will be marked as returned.`, auth, ownerContact);
                        console.log(`Owner notified about attempt 6 for ${trackingNumber}`);
                        console.log(`Owner Notification: Attempt 6: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nThis is the last notification, next time it will be marked as returned.`);

                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Its been same tracking for 9 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} ` 
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                        console.log(`Shipper advice sent for ${trackingNumber}`);
                        console.log(`Shipper Advice: Its been same tracking for 9 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} `);
                    }

                    if (statusData[trackingNumber].attempts
    const trackingNumbers = req.query.tracking;
    const contacts = req.query.contact;
    const domainReviews = req.query.domainReview;
    const auth = req.query.auth;
    const ownerContact = req.query.ownercontact;

    console.log("Request received:");
    console.log("Tracking numbers:", trackingNumbers);
    console.log("Contacts:", contacts);
    console.log("Auth:", auth);
    console.log("Domain Reviews:", domainReviews);

    if (!trackingNumbers || !Array.isArray(trackingNumbers) ||
        !contacts || !Array.isArray(contacts) ||
        trackingNumbers.length !== contacts.length) {
        console.log("Input validation failed: Arrays must be the same length.");
        return res.status(400).json({ error: "Tracking numbers and contacts must be provided in arrays of the same length." });
    }

    let statusData = fs.existsSync(statusFilePath) ? JSON.parse(fs.readFileSync(statusFilePath, 'utf-8')) : {};

    try {
        const trackingResults = [];
        console.log("Status data loaded from file:", statusData);

        for (let i = 0; i < trackingNumbers.length; i++) {
            const trackingNumber = trackingNumbers[i];
            const contact = contacts[i];
            const domainReview = domainReviews ? domainReviews[i] : null;

            console.log(`Fetching tracking details for ${trackingNumber}...`);

            try {
                const response = await axios.post(
                    "https://api.shooterdelivery.com/Apis/fetch-order-tracking.php",
                    { id: trackingNumber },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Sec-Fetch-Dest': 'empty',
                            'Sec-Fetch-Site': 'cross-site'
                        }
                    }
                );

                const trackingDetails = response.data.Order_Details;
                const statusHistory = response.data.Status_History;

                if (!trackingDetails || trackingDetails.message === "No Records Found" || !statusHistory || statusHistory.length === 0) {
                    console.log(`No valid tracking details found for ${trackingNumber}`);
                    continue;
                }

                const latestStatus = statusHistory[statusHistory.length - 1]?.status || "Unknown status";
                const previousStatus = statusData[trackingNumber]?.status;
                const attempts = statusData[trackingNumber]?.attempts || 0;

                if (!statusData[trackingNumber] || previousStatus !== latestStatus) {
                    statusData[trackingNumber] = { status: latestStatus, attempts: 0 };

                    if (/refuse/i.test(latestStatus)) {
                        const customerMessage = `You have refused the order. It has been dispatched. Kindly receive the order or, if you are facing issues like fake attempts, let us know.`;
                        await sendCustomerNotification(contact, customerMessage, auth, ownerContact);
                        console.log(`Customer notified about refusal for ${trackingNumber}`);

                        const ownerMessage = `Order with tracking number ${trackingNumber} has been refused. Kindly investigate the issue.`;
                        await sendOwnerNotification(ownerMessage, auth, ownerContact);

                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Customer refused the order. Investigate for fake attempts or other issues.`
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                        console.log(`Shipper advice sent for ${trackingNumber}`);
                    } else {
                        const trackingMessage = `Tracking Details:\nStatus: ${latestStatus}\nTracking Number: ${trackingNumber}`;
                        await sendCustomerNotification(contact, trackingMessage, auth,ownerContact);
                        console.log(`Customer notified with tracking details for ${trackingNumber}`);

                        if (/deliver/i.test(latestStatus) && domainReview) {
                            const reviewMessage = `Thanks for purchasing! You can proceed to this link ${domainReview} to drop a review. Your feedback is valuable to us.`;
                            await sendCustomerNotification(contact, reviewMessage, auth,ownerContact);
                            console.log(`Customer notified for review for ${trackingNumber}`);
                            statusData.delivered = statusData.delivered || {};
                            statusData.delivered[trackingNumber] = { contact, status: latestStatus };
                            delete statusData[trackingNumber];
                        }
                    }
                } else {
                    statusData[trackingNumber].attempts += 1;

                    if (statusData[trackingNumber].attempts === 2) {
                        await sendOwnerNotification(`Attempt 2: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nThe order has not progressed. Kindly report to the courier.`, auth, ownerContact);

                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Its been same tracking for 3 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} ` 
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                    }

                    if (statusData[trackingNumber].attempts === 4) {
                        await sendOwnerNotification(`Attempt 4: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nNo progress on this order, please report to the courier.`, auth, ownerContact);
                    
                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Its been same tracking for 6 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} ` 
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                    
                    }

                    if (statusData[trackingNumber].attempts === 6) {
                        await sendOwnerNotification(`Attempt 6: Order Details:\n${JSON.stringify(trackingDetails, null, 2)}\nThis is the last notification, next time it will be marked as returned.`, auth, ownerContact);
                    
                        await axios.post(
                            "https://api.shooterdelivery.com/Apis/add-shipperadvice.php",
                            {
                                id: trackingNumber,
                                shipper_advice: `Its been same tracking for 9 days kindly resolve the issue for this the order isnt proceeding for this \n\n ${JSON.stringify(trackingDetails, null, 2)} ` 
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Sec-Fetch-Dest': 'empty',
                                    'Sec-Fetch-Site': 'cross-site'
                                }
                            }
                        );
                    
                    }

                    if (statusData[trackingNumber].attempts === 8) {
                        if (/cancel/i.test(latestStatus)) {
                            statusData.cancelled = statusData.cancelled || {};
                            statusData.cancelled[trackingNumber] = { contact, status: latestStatus };
                            delete statusData[trackingNumber];
                            await sendOwnerNotification(`Tracking ${trackingNumber} with contact ${contact} has been cancelled.`, auth, ownerContact);
                        } else {
                            statusData.returned = statusData.returned || {};
                            statusData.returned[trackingNumber] = { contact, status: latestStatus };
                            delete statusData[trackingNumber];
                            await sendOwnerNotification(`Tracking ${trackingNumber} has been returned.`, auth, ownerContact);
                        }
                    }
                }

                trackingResults.push({ trackingNumber, trackingDetails, contact });

            } catch (error) {
                console.error(`Error fetching tracking for ${trackingNumber}:`, error);
            }
        }

        fs.writeFileSync(statusFilePath, JSON.stringify(statusData, null, 2));
        res.json({ trackingResults });

    } catch (error) {
        console.error("General error during tracking fetch:", error);
        res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
});







app.get("/get-status", (req, res) => {
    try {
        // Check if the file exists
        if (!fs.existsSync(statusFilePath)) {
            return res.status(404).json({ error: "No status data found." });
        }

        // Read and parse the file
        const statuses = JSON.parse(fs.readFileSync(statusFilePath, "utf-8"));
        return res.json({ statuses });
    } catch (error) {
        console.error("Error reading status file:", error);
        return res.status(500).json({ error: "Failed to fetch statuses." });
    }
});

// Helper function to send notifications to the owner
async function sendOwnerNotification(message, auth, OWNER_PHONE_NUMBER) {
    let numbers = Array.isArray(OWNER_PHONE_NUMBER) ? OWNER_PHONE_NUMBER : [OWNER_PHONE_NUMBER];
    let messages = Array.isArray(message) ? message : [message];

    if (numbers.length > 1 && messages.length === 1) {
        messages = new Array(numbers.length).fill(messages[0]);
    }

    if (numbers.length !== messages.length) {
        throw new Error("The number of messages must be equal to the number of contacts.");
    }

    for (let i = 0; i < numbers.length; i++) {
        const whatsappUrl = `https://devlinkapi.servehttp.com:8080/send-message?num=${numbers[i]}&msg=${encodeURIComponent(messages[i])}&auth=${auth}&ownerContact=${owner_phone_number}`;
        await axios.get(whatsappUrl);
    }
}

// Helper function to send notifications to customers
async function sendCustomerNotification(contact, message, auth, ownerContact) {
    let numbers = Array.isArray(contact) ? contact : contact;
    let messages = Array.isArray(message) ? message : message;

    if (!Array.isArray(numbers)) numbers = [numbers];
    if (!Array.isArray(messages)) messages = [messages];

    if (numbers.length !== messages.length) {
        throw new Error("The number of messages must be equal to the number of contacts.");
    }

    for (let i = 0; i < numbers.length; i++) {
        const whatsappUrl = `https://devlinkapi.servehttp.com:8080/send-message?num=${numbers[i]}&msg=${encodeURIComponent(messages[i])}&auth=${auth}&ownerContact=${ownerContact}`;
        await axios.get(whatsappUrl);
    }
}




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Temporary variable to store email login credentials during email sending process
let emailCredentials = null;

async function generateMarketingMessages(
    businessName,
    audience,
    cta,
    website,
    target_audience,
    description,
    goal
) {
    const generationConfig = {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 300,
    };

    const saleEndDate = new Date();
    saleEndDate.setDate(saleEndDate.getDate() + 3);
    const saleEnd = saleEndDate.toLocaleDateString();

    const chat = model.startChat({
        generationConfig,
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ],
        history: [
            {
                role: "user",
                parts: [
                    {
                        text: `You are a marketing assistant. Create a compelling, short, and point-to-point email for the following:
                        - Business Name: ${businessName}
                        - Audience: ${audience}
                        - Call-to-Action: ${cta}
                        - Website: ${website}
                        - Target Audience: ${target_audience}
                        - Goal: ${goal}
                        - Description: ${description}
                        Include a line that says "Hurry up! Sale ends on ${saleEnd}."`,
                    },
                ],
            },
        ],
    });

    const result = await chat.sendMessage(
        "Generate a short and point-to-point marketing email using marketing techniques and customer psychology to catch sales. Do not include discounts or promos."
    );
    return result.response.text();
}

app.get('/send-email', async (req, res) => {
    const { ownemail, emails, msgs, type = 'send', pass, jsonData, subject } = req.query;

    if (!ownemail || !pass) {
        return res.status(401).send('User is not logged in. Please provide ownemail and pass.');
    }

    if (!emails) {
        return res.status(400).send('Please provide the emails parameter.');
    }

    emailCredentials = { ownemail, pass };

    let messageArray = [];
    const emailArray = emails.split(',');

    if (type === 'marketing') {
        if (!jsonData) {
            return res.status(400).send('For marketing emails, provide the jsonData parameter.');
        }

        try {
            const data = JSON.parse(decodeURIComponent(jsonData));
            const businessName = data.business?.name;
            const audience = data.campaign?.target_audience;
            const cta = data.campaign?.cta;
            const website = data.business?.website;
            const goal = data.campaign?.goal;
            const description = data.business?.description;
            const target_audience = data.campaign?.target_audience;

            if (!businessName || !audience || !cta) {
                return res.status(400).send('For marketing emails, provide valid businessName, audience, and cta in jsonData.');
            }

            const marketingMessage = await generateMarketingMessages(
                businessName,
                audience,
                cta,
                website,
                target_audience,
                description,
                goal
            );
            messageArray = emailArray.map(() => marketingMessage);
        } catch (error) {
            console.error('Error generating marketing messages:', error);
            return res.status(500).send('Error generating marketing messages.');
        }
    } else {
        if (!msgs) {
            return res.status(400).send('Please provide the msgs parameter for regular emails.');
        }
        messageArray = msgs.split(',');
    }

    if (emailArray.length !== messageArray.length) {
        return res.status(400).send('The number of emails and messages do not match.');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        logger: true,
        debug: true,
        secureConnection: false,
        auth: {
            user: emailCredentials.ownemail,
            pass: emailCredentials.pass,
        },
        tls: {
            rejectUnauthorized: true,
        },
    });

    try {
        for (let i = 0; i < emailArray.length; i++) {
            const mailOptions = {
                from: emailCredentials.ownemail,
                to: emailArray[i],
                subject: subject || (type === 'marketing' ? 'Devox - Special Offer' : 'Devox - Email'),
                text: messageArray[i],
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${emailArray[i]}:`, info.response);
        }

        res.status(200).send(`Emails sent successfully to ${emails}`);
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send emails');
    } finally {
        emailCredentials = null;
    }
});






const options = {
    cert: fs.readFileSync('/etc/ssl/zerossl/certificate.crt'), // Updated path to the certificate file
    key: fs.readFileSync('/etc/ssl/zerossl/private.key'), // Updated path to the private key
    ca: fs.readFileSync('/etc/ssl/zerossl/ca_bundle.crt'), // Updated path to the CA bundle
};

// Create HTTPS server
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server running on https://devlink.servehttp.com`);
});