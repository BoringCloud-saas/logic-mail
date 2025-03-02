import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest)  {
    try {
        const body = await request.json();
        const base64Data = body?.message?.data;
        
        if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            const decoded = JSON.parse(buffer.toString());
            const historyID = decoded.historyId

            const eventSourceUrl = "https://2000e77f40f3.ngrok.app/api"

            await fetch(eventSourceUrl, {
                method: "POST",
                body: JSON.stringify({ historyID }),
                headers: {
                  "Content-Type": "application/json",
                },
            });
        } else {
            console.log("No Base64 data found.");
        }
        return NextResponse.json({ message: "success" , status: 200})
    } catch (err) {
        return NextResponse.json({ message: "webhook catch error" , status: 400})
    }
}