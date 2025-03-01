"use client"

import axios from "axios"
import { useState } from "react"

const useAuth = () => {
    const [status, setStatus] = useState<number | null>(null)
    const proveAuth = async () => {
        try {
            const response = await axios.post("https://ff354dcf4c06.ngrok.app/google/auth")
            return response.data.message
        } catch (err) {
            window.location.href = "https://ff354dcf4c06.ngrok.app/signin"
            console.error("auth hook catch err: ", err)
        }
    }

    return { proveAuth, status }
}

export default useAuth