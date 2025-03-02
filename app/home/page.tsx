"use client"

import { useState, useEffect } from "react"

import Navigation from "./components/Navigation"

import useAuth from "../hooks/useAuth"
import useGmail from "../hooks/useWatchRequest"
import useEmail from "../hooks/useEmail"

export default function Page() {
    // hooks
    const { proveAuth } = useAuth()
    const { useWatchRequest } = useGmail()
    const { proveEmail } = useEmail()

    // UI 
    const [username, setUsername] = useState("")

    // SSE
    const [connectionStatus, setConnectionStatus] = useState<string>("Warte auf Verbindung...");

    useEffect(() => {
        const fetchAuth = async () => {
            const response = await proveAuth()
            console.log(response)
            setUsername(response)
        }
        fetchAuth()
    }, [])

    useEffect(() => {
        const fetchAuth = async () => {
          const response = await useWatchRequest()
        }
        fetchAuth()
    }, [])

    useEffect(() => {
        const createEventSource = () => {
          const eventSource = new EventSource("/api");
    
          eventSource.onopen = () => {
            console.log("Verbindung geöffnet");
            setConnectionStatus("200 OK");
          };
    
          eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);  // Parsen der JSON-Daten
            console.log(data.historyID);
            let ID: string | null = null;  // Deklariere ID außerhalb des Blocks
    
            if (data && data.historyID) {
              ID = String(data.historyID);
            }
    
            if (ID !== null) {
                const fetch = async () => {
                    const response = await proveEmail(ID);
                    if (response?.data.status == 200) {
                        console.log(response.data)
                    }
                }
                fetch();
            }
          };
    
          eventSource.onerror = () => {
            console.error("Verbindung fehlgeschlagen");
            setConnectionStatus("400 Verbindung fehlgeschlagen");
            eventSource.close();  // Schließe die Verbindung bei Fehler
    
            // Versuche, die Verbindung nach 5 Sekunden wieder aufzubauen
            setTimeout(createEventSource, 5000);  // Wiederverbindung nach 5 Sekunden
          };
    
          return eventSource;
        };
    
        const eventSource = createEventSource();
    
        return () => {
          eventSource.close();  // Schließe die Verbindung, wenn die Komponente unmountet
        };
      }, []);

    return ( 
        <div className="flex flex-col h-screen w-full p-4 bg-[#fafafa]">
            <Navigation username={username} />
        </div>
    )
}