"use client"

import axios from "axios"
import { useState } from "react"

const useGmail = () => {
    const useWatchRequest = async () => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_NGROK_DOMAIN}/webhook/gmail`)
            console.log(response.data)
        } catch (err) {
            console.error("auth hook catch err: ", err)
        }
    }

    return { useWatchRequest }
}

export default useGmail
