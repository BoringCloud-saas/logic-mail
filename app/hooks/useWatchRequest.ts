"use client"

import axios from "axios"
import { useState } from "react"

const useGmail = () => {
    const useWatchRequest = async () => {
        try {
            const response = await axios.post(" https://d2814b0e5599.ngrok.app/webhook/gmail")
            console.log(response.data)
        } catch (err) {
            console.error("auth hook catch err: ", err)
        }
    }

    return { useWatchRequest }
}

export default useGmail
