import { NextRequest, NextResponse } from "next/server";

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
            const result = await db.select().from(users).where(eq(users.access_token, accessToken));
            if (result.length === 0) {
                return NextResponse.json({ message: 'Auth failed !' }, { status: 401 });
            } else {
                try {
                    const response = await axios.get("https://www.googleapis.com/oauth2/v3/tokeninfo", {
                        params: { access_token: accessToken },
                    });
                    const data = response.data;
                    const expiresInSeconds = parseInt(data.expires_in, 10);
                    const minutes = Math.floor(expiresInSeconds / 60);
                    const seconds = expiresInSeconds % 60;

                    const result = await db.select().from(users).where(eq(users.access_token, accessToken));
                    const userInfo = result[0]
                    const { name } = userInfo

                    console.log(`Token läuft ab in: ${minutes} Minuten und ${seconds} Sekunden`);
                    return NextResponse.json({ message: name }, { status: 200 });
                } catch (err) {
                    const result = await db.select().from(users).where(eq(users.access_token, accessToken));
                    const refreshToken = result[0].refresh_token
                    const tokenUrl = 'https://oauth2.googleapis.com/token';
                    const tokenResponse = await fetch(tokenUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: process.env.GOOGLE_CLIENT_ID || "",
                            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                            refresh_token: refreshToken,
                            grant_type: "refresh_token",
                        }).toString(),
                    });
                    const data = await tokenResponse.json()
                    const newAccessToken = data.access_token

                    try {
                        await db
                            .update(users)
                            .set({access_token: newAccessToken})
                            .where(eq(users.access_token, accessToken));
                        console.log("access token refreshed in NEON DB !")

                        const SECRET = process.env.SECRET
                        if (!SECRET) {
                            console.log("secret env missing in prove auth")
                            return NextResponse.json({ message: "ENV failed, please try again later !", status: 400 })
                        
                        }
                        const payload = {
                            token: newAccessToken
                        }
                        const jsonwebtoken = jwt.sign(payload, SECRET, { expiresIn: "24h" })
                        const result = await db.select().from(users).where(eq(users.access_token, newAccessToken));
                        const name = result[0].name
                        const response = NextResponse.json({ message: name });
                        response.cookies.set("auth_token", jsonwebtoken, {
                            httpOnly: true,
                            secure: true,
                            path: "/",
                        });
                        return response;
                        
                    } catch (err) {
                        console.error(err)
                    }
                }
            }

        } catch (err) {
            console.log("JWT verification failed", err);
            return NextResponse.json({ error: "JWT verification failed" }, { status: 401 });
        }

        return NextResponse.json({ message: "success", status: 200 });
    } catch (err) {
        console.log("Error in POST request", err);
        return NextResponse.json({ message: "auth catch error", status: 400 });
    }
}
