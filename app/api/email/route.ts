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

                    if (DBH === "default") {
                        console.log("default")
                        await db
                            .update(users)
                            .set({ historyID: historyID })
                            .where(eq(users.sub, sub))
                    } else {
                        const response = await axios.get(
                            `https://gmail.googleapis.com/gmail/v1/users/${sub}/history?startHistoryId=${DBH}&historyTypes=messageAdded`,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    Accept: "application/json",
                                },
                            }
                        );

                        const history = response.data.history;

                        // Interfaces für die Datenstruktur
                        interface Message {
                            id: string;
                            threadId: string;
                            labelIds: string[];
                            snippet?: string;
                            payload?: {
                                headers: Array<{ name: string; value: string }>;
                            };
                        }

                        interface HistoryEntry {
                            id: string;
                            messages?: Message[];
                            messagesAdded?: Array<{ message: Message }>;
                        }

                        interface GmailHistoryResponse {
                            history: HistoryEntry[];
                            historyId: string;
                        }

                        // Funktion zur Extraktion von Headers
                        const getHeaderValue = (headers: Array<{ name: string; value: string }>, headerName: string) => {
                            const header = headers.find((h) => h.name === headerName);
                            return header ? header.value : "Unbekannt";
                        };

                        // Funktion zum Abrufen der vollständigen Nachricht
                        const getFullMessage = async (messageId: string) => {
                            const response = await axios.get(
                                `https://gmail.googleapis.com/gmail/v1/users/${sub}/messages/${messageId}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${accessToken}`,
                                        Accept: "application/json",
                                    },
                                }
                            );
                            return response.data;
                        };

                        // Verarbeitung der History-Einträge
                        const processHistoryEntries = async (history: HistoryEntry[]) => {
                            // Sortiere die History-Einträge nach History ID (absteigend, neueste zuerst)
                            const sortedHistory = history.sort((a, b) => parseInt(b.id) - parseInt(a.id));

                            // Bestimme die Gesamtanzahl der E-Mails
                            const totalEmails = sortedHistory.reduce((count, entry) => count + (entry.messagesAdded ? entry.messagesAdded.length : 0), 0);

                            // Beginne mit der höchsten Nummer (neueste E-Mail)
                            let entryNumber = totalEmails;

                            for (const entry of sortedHistory) {
                                if (entry.messagesAdded && entry.messagesAdded.length > 0) {
                                    console.log("\x1b[36m%s\x1b[0m", `\n--- History Entry ${entryNumber} ---`); // Cyan für Überschrift
                                    console.log("\x1b[33m%s\x1b[0m", `History ID: ${entry.id}`); // Gelb für History ID

                                    // Verarbeite jede hinzugefügte Nachricht
                                    for (const messageAdded of entry.messagesAdded) {
                                        const msg = messageAdded.message;

                                        // Rufe die vollständige Nachricht ab
                                        const fullMessage = await getFullMessage(msg.id);

                                        // Extrahiere Absender, Empfänger und Betreff aus der vollständigen Nachricht
                                        const from = fullMessage.payload ? getHeaderValue(fullMessage.payload.headers, "From") : "Unbekannt";
                                        const to = fullMessage.payload ? getHeaderValue(fullMessage.payload.headers, "To") : "Unbekannt";
                                        const subject = fullMessage.payload ? getHeaderValue(fullMessage.payload.headers, "Subject") : "Kein Betreff";

                                        // Ausgabe im gewünschten Format
                                        console.log("\x1b[32m%s\x1b[0m", `messageAdded: {`); // Grün für messageAdded
                                        console.log("\x1b[35m%s\x1b[0m", `  Absender: ${from}`); // Magenta für Absender
                                        console.log("\x1b[35m%s\x1b[0m", `  Empfänger: ${to}`); // Magenta für Empfänger
                                        console.log("\x1b[35m%s\x1b[0m", `  Betreff: ${subject}`); // Magenta für Betreff
                                        if (fullMessage.snippet) {
                                            console.log("\x1b[35m%s\x1b[0m", `  Inhalt (Auszug): ${fullMessage.snippet}`); // Magenta für Inhalt
                                        }
                                        console.log("\x1b[35m%s\x1b[0m", `  Anzahl der E-Mails im Postfach: ${entry.messagesAdded.length}`); // Magenta für Anzahl
                                        console.log("\x1b[32m%s\x1b[0m", `}`); // Grün für schließende Klammer
                                    }

                                    // Reduziere die Nummer für den nächsten Eintrag
                                    entryNumber--;
                                }
                            }
                        };

                        // Starte die Verarbeitung
                        processHistoryEntries(history);
                    }
                } catch (err) {
                    console.log(err)
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