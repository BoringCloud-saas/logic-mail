"use client"

import axios from "axios"
import { useState } from "react"

const useAuth = () => {
    const [status, setStatus] = useState<number | null>(null)
    const proveAuth = async () => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_NGROK_DOMAIN}/google/auth`)
            return response.data.message
        } catch (err) {
            window.location.href = `${process.env.NEXT_PUBLIC_NGROK_DOMAIN}/signin`
            console.error("auth hook catch err: ", err)
        }
    }

    return { proveAuth, status }
}

export default useAuth