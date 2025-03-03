import { NextRequest, NextResponse } from "next/server"

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

import axios from "axios"
import jwt, { JwtPayload } from "jsonwebtoken";

export async function POST(request: NextRequest) {
    try {
        const authToken = request.cookies.get('auth_token');

        if (!authToken) {
            console.log("No auth token found !");
            return NextResponse.json({ message: 'Something went wrong with accessToken' }, { status: 401 });
        }
        const authTokenValue = authToken.value;
        const SECRET = process.env.SECRET;
        if (!SECRET) {
            console.log("secret env missing in prove auth");
            return NextResponse.json({ message: "ENV failed, please try again later !", status: 400 });
        }

        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) {
            console.log("cookie header not found");
            return NextResponse.json({ error: "Something went wrong with auth !" }, { status: 401 });
        }

        const cookies = Object.fromEntries(cookieHeader.split("; ").map(c => c.split("=")));
        const token = cookies["auth_token"];
        if (!token) {
            console.log("token not found in cookie");
            return NextResponse.json({ error: "Keine Cookies gefunden" }, { status: 401 });
        }

        try {
            const decoded = jwt.verify(authTokenValue, SECRET) as JwtPayload;
            const accessToken = decoded.token
            const result = await db.select().from(users).where(eq(users.access_token, accessToken));
            if (result.length === 0) {
                return NextResponse.json({ message: 'Auth failed !' }, { status: 401 });
            } else {
                try {
                    const response = await axios.post(
                      "https://gmail.googleapis.com/gmail/v1/users/me/watch",
                      {
                        labelIds: ["INBOX"],  // Überwache nur das INBOX-Label
                        topicName: "projects/the-boring-cloud-450516/topics/SaaSTopic",  // Das Topic, das du verwenden möchtest
                        labelFilterBehavior: "INCLUDE",
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${accessToken}`,  // Bearer Token für Authentifizierung
                        },
                      }
                    );
                
                    console.log("Watch request successful:", response.data);
                    return NextResponse.json({ message: "Watch request successful", data: response.data });
                  } catch (err) {
                    console.error("Error in Watch request:", err);
                    return NextResponse.json({ message: "Failed to create watch request", status: "500" });
                  }
            }
        } catch (err) {
            return NextResponse.json({ message: 'auth with gmail request failed' }, { status: 200 });
        }
    } catch (err) {
        return NextResponse.json({ message: 'Webhook Gmail watch request catch error' }, { status: 401 });
    }
}