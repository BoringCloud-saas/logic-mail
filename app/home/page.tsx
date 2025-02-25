"use client"

import { useState, useEffect } from "react"

import Navigation from "./components/Navigation"

import useAuth from "../hooks/useAuth"

export default function Page() {
    // hooks
    const { proveAuth } = useAuth()

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

    return ( 
        <div className="flex flex-col h-screen w-full p-4 bg-[#fafafa]">
            <Navigation username={username} />
        </div>
    )
}