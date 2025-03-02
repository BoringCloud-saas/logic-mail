"use client"

import axios from "axios"

const useEmail = () => {
    const proveEmail = async (ID: string) => {
        try {
            const response = await axios.post("https://2000e77f40f3.ngrok.app/api/email", {
                historyID: ID,
            })
            return response
        } catch (err) {
            console.error("auth hook catch err: ", err)
        }
    }

    return { proveEmail }
}

export default useEmail