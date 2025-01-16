import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// Import or initialize the model here
// Make sure to replace the following line with your actual model import
const model = require('your-model-path'); // e.g., '@google/generative-ai'

// Import necessary enums or constants for safety settings
// Replace with actual imports based on your model's SDK
const HarmCategory = { HARM_CATEGORY_HARASSMENT: 'harassment' };
const HarmBlockThreshold = { BLOCK_MEDIUM_AND_ABOVE: 'medium_and_above' };

// Define the path to data.json
const dataFilePath = path.join(process.cwd(), 'data.json');

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
    let history;
    if (dataParam) {
        history = dataParam; // Use provided dataParam directly
    } else if (auth === "nouve") {
        history = [
            {
                role: "user",
                parts: [{ text: "You are Nouve, a friendly assistant for Nouve, a business that offers old money clothing articles " }],
            },
            {
                role: "model",
                parts: [{ text: "Hello! Welcome to Nouve. My name is Nouve. What's your name?" }],
            },
        ];
    } else if(auth === 'devox'){
        history = [
            {
                role: "user",
                parts: [{ text: "You are Devox, a friendly assistant for Devox, a business that offers anime embroidery and DTF printed shirts..." }],
            },
            {
                role: "model",
                parts: [{ text: "Hello! Welcome to Devox. My name is Devox. What can I help you with today?" }],
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

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userInput = searchParams.get('msg');
    const authState = searchParams.get('auth');
    const dataParam = searchParams.get('data') ? JSON.parse(searchParams.get('data')) : null;

    try {
        if (!userInput) {
            return NextResponse.json({ success: false, error: "Query parameter 'msg' is required." }, { status: 400 });
        }

        const responseText = await runChat(userInput, authState, dataParam);
        console.log(responseText); // Log response to server console

        return NextResponse.json({ success: true, response: responseText });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ success: false, error: "An error occurred while processing your request." }, { status: 500 });
    }
} 