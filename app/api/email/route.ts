import { NextResponse, NextRequest } from "next/server";

import { db } from "@/db/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm";

import axios from "axios"

import jwt, { JwtPayload } from "jsonwebtoken";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body) {
            console.log("No historyID found !");
            return NextResponse.json({ message: 'Something went wrong with historyID' }, { status: 401 });
        }

        const historyID = body.historyID;
        const authToken = request.cookies.get('auth_token');

        if (!authToken) {
            console.log("No auth token found !");
            return NextResponse.json({ message: 'Something went wrong with accessToken' }, { status: 401 });
        }

        const authTokenValue = authToken.value; // Umbenennung der Variablen
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

            const existingUser = await db
                .select()
                .from(users)
                .where(eq(users.access_token, accessToken))
                .limit(1);

            if (existingUser.length > 0) {
                const sub = existingUser[0].sub
                try {
                    const user = await db.select().from(users).where(eq(users.sub, sub)).limit(1);
                    // DBH Database history ID 
                    const DBH = user[0].historyID
                    try {
                        const response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${sub}/history?startHistoryId=47718`, {
                          headers: {
                            Authorization: `Bearer ${accessToken}`,
                          }
                        });
                        console.log(response.data);
                    } catch (err) {
                        console.log("Error occurred:");
                        console.error(err);
                    }
                } catch (err) {
                    console.error(err)
                }
            } else {
                console.log("no user found")
            }
        } catch (err) {
            console.error(err)
        }

        return NextResponse.json({ message: "success", status: 200 })
    } catch (err) {
        return NextResponse.json({ message: "validating email catch error", status: 400 })
    }
}