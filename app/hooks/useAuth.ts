"use client"

import axios from "axios"
import { useState } from "react"

const useAuth = () => {
    const [status, setStatus] = useState<number | null>(null)
    const proveAuth = async () => {
        try {
            const response = await axios.post("https://27380a317f8c.ngrok.app/google/auth")
            return response.data.message
        } catch (err) {
            window.location.href = "https://27380a317f8c.ngrok.app/signin"
            console.error("auth hook catch err: ", err)
        }
    }

    return { proveAuth, status }
}

export default useAuth