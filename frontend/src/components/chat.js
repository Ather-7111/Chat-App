'use client'

import { useEffect, useState } from "react"
import io from "socket.io-client";

export default function Chat() {

    const [socket, setSocket] = useState(undefined)

    const [inbox, setInbox] = useState([])

    const [message, setMessage] = useState('')
    const [roomName, setRoomName] = useState('')

    useEffect(() => {
        const socket = io("http://localhost:3000")

        // to recieve messages from server back to client

        socket.on("message", (message,id) => {
            console.log("hijra",)
            setInbox((inbox) => [...inbox, message])
        })

        setSocket(socket)
    }, [socket])

    const handleSendMessage = () => {
        socket.emit(
            'message', message, roomName
        )
    }

    const handleJoinRoom = () => {
        socket.emit("joinRoom", roomName)
    }

    return <>

        <div>
            <div className="flex flex-col gap-5 mt-20 px-10 lg:px-48">

                {/* Showing the msgs */}
                <div className="flex flex-col gap-2 border rounded-lg p-10 ">
                    {
                        inbox.map((message, index) => {
                            return (
                                <div key={index} className="border rounded px-4 py-2">
                                    {message}
                                </div>
                            )
                        })
                    }
                </div>

                <div className="flex gap-2 items-center justify-center ">
                    <input onChange={(e) => {
                        setMessage(e.target.value)
                    }} type="text" name="message" className="flex flex-1 bg-white text-black  border rounded px-2 py-1" />
                    <button className="w-40" onClick={handleSendMessage}>
                        Send message
                    </button>
                </div>

                <div className="flex gap-2 items-center justify-center">
                    <input onChange={(e) => {
                        setRoomName(e.target.value)
                    }} type="text" name="room" className="flex flex-1 bg-white text-black border rounded px-2 py-1" />
                    <button className="w-40"
                        onClick={handleJoinRoom}
                    >
                        Join Room
                    </button>
                </div>

            </div>
        </div>


    </>
}