"use client"

import { useState, useEffect } from "react"

import Navigation from "./components/Navigation"

import useAuth from "../hooks/useAuth"
import useGmail from "../hooks/useWatchRequest"

export default function Page() {
    // hooks
    const { proveAuth } = useAuth()
    const { useWatchRequest } = useGmail()

    // UI 
    const [username, setUsername] = useState("")

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

    return ( 
        <div className="flex flex-col h-screen w-full p-4 bg-[#fafafa]">
            <Navigation username={username} />
        </div>
    )
}