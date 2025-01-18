import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userInput = searchParams.get('msg');
    const auth = 'devox';

    if (!userInput) {
        return NextResponse.json({ success: false, error: "Query parameter 'msg' is required." }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SERVER_API) {
        console.error('Environment variable NEXT_PUBLIC_SERVER_API is not defined.');
        return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 });
    }

    try {
        // Read data.json
        const dataFilePath = path.join(process.cwd(), 'data.json');
        
        if (!fs.existsSync(dataFilePath)) {
            console.error(`data.json not found at path: ${dataFilePath}`);
            return NextResponse.json({ success: false, error: "Internal data file missing." }, { status: 500 });
        }

        const dataContent = fs.readFileSync(dataFilePath, 'utf8');
        const dataParam = encodeURIComponent(dataContent);

        // Construct the external API URL
        const externalApiUrl = `${process.env.NEXT_PUBLIC_SERVER_API}/get-response?msg=${encodeURIComponent(userInput)}&auth=${auth}&data=${dataParam}`;

        console.log(`Forwarding request to: ${externalApiUrl}`);

        // Forward the request to the external API
        const externalResponse = await fetch(externalApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!externalResponse.ok) {
            const errorText = await externalResponse.text();
            console.error(`External API error: ${externalResponse.statusText} - ${errorText}`);
            throw new Error(`External API error: ${externalResponse.statusText}`);
        }

        const responseData = await externalResponse.json();

        return NextResponse.json({ success: responseData.success, response: responseData.response }, { status: externalResponse.status });
    } catch (error) {
        console.error("Error forwarding request to external API:", error);
        return NextResponse.json({ success: false, error: "Failed to get response from external API." }, { status: 500 });
    }
} 