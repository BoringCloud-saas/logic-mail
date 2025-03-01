import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

import axios from "axios"
import jwt from "jsonwebtoken"


export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const authorizationCode = url.searchParams.get("code");

        if (!authorizationCode) {
            return NextResponse.json({ message: "Authorization failed, please try again later !" }, { status: 400 });
        }

        const tokenUrl = "https://oauth2.googleapis.com/token";
        const params = new URLSearchParams();

        params.append("code", authorizationCode);
        params.append("client_id", process.env.GOOGLE_CLIENT_ID || "");
        params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET || "");
        params.append("redirect_uri", process.env.GOOGLE_CALLBACK_URL || "");
        params.append("grant_type", "authorization_code");

        const tokenResponse = await axios.post(tokenUrl, params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const accessToken = tokenResponse.data.access_token;
        const refreshToken = tokenResponse.data.refresh_token || null;

        const userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
        const userInfoResponse = await axios.get(userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const { sub, name, given_name, family_name, email } = userInfoResponse.data;
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.sub, sub))
            .limit(1);
        
        if (existingUser.length > 0) {
            const userAccessToken = existingUser[0].access_token;
            await db
                .update(users)
                .set({access_token: accessToken})
                .where(eq(users.access_token, userAccessToken));
        } else {
            await db.insert(users).values({
                access_token: accessToken,
                refresh_token: refreshToken,
                sub,
                name,
                given_name,
                family_name,
                email,
                historyID: 'default',
            });
        }

        const SECRET = process.env.SECRET
        if (!SECRET) {
            console.log("secret env missing in callback")
            return NextResponse.json({ message: "ENV failed, please try again later !", status: 400 })
        }
        const payload = {
            token: accessToken
        }
        const jsonwebtoken = jwt.sign(payload, SECRET, { expiresIn: "24h" })

        const response = NextResponse.redirect("https://ff354dcf4c06.ngrok.app/home")
        response.cookies.set("auth_token", jsonwebtoken, {
            httpOnly: true,
            secure: true,
            path: "/",
        });
        return response;
    } catch (err) {
        return NextResponse.json({ message: "Signup failed, please try again later !", status: 400 })
    }
}
