import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the path to data.json
const dataFilePath = path.join(process.cwd(), 'data.json');

export async function GET() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        const histories = JSON.parse(data);
        return NextResponse.json({ success: true, histories });
    } catch (error) {
        console.error("Error reading data.json:", error);
        return NextResponse.json({ success: false, error: 'Failed to read data.' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        console.log("POST /api/chatbot called");
        const { entry } = await request.json();
        console.log("Received entry:", entry);
        const data = fs.readFileSync(dataFilePath, 'utf8');
        const histories = JSON.parse(data);
        histories.push(entry);
        fs.writeFileSync(dataFilePath, JSON.stringify(histories, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error writing to data.json:", error);
        return NextResponse.json({ success: false, error: 'Failed to write data.' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { index } = await request.json();
        const data = fs.readFileSync(dataFilePath, 'utf8');
        const histories = JSON.parse(data);
        if (index < 0 || index >= histories.length) {
            return NextResponse.json({ success: false, error: 'Invalid index.' }, { status: 400 });
        }
        histories.splice(index, 1);
        fs.writeFileSync(dataFilePath, JSON.stringify(histories, null, 2));
        return NextResponse.json({ success: true, histories });
    } catch (error) {
        console.error("Error deleting from data.json:", error);
        return NextResponse.json({ success: false, error: 'Failed to delete data.' }, { status: 500 });
    }
} 