"use client"

import axios from "axios"
import { useState } from "react"

const useAuth = () => {
    const [status, setStatus] = useState<number | null>(null)
    const proveAuth = async () => {
        try {
            const response = await axios.post("https://d2814b0e5599.ngrok.app/google/auth")
            return response.data.message
        } catch (err) {
            window.location.href = "https://d2814b0e5599.ngrok.app/signin"
            console.error("auth hook catch err: ", err)
        }
    }

    return { proveAuth, status }
}

export default useAuth