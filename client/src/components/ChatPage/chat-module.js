'use client'

import {useEffect, useRef, useState} from "react";
import "./style.css";
import {getAllUsers} from "@/lib/actions/user";
import {createChat} from "@/lib/actions/chat";
import {io} from "socket.io-client";
import {deletenotifications} from "@/lib/actions/notification";
import addNotification from "react-push-notification";
import SingleChatPage from "@/components/chat";

export default function ChatPage() {
    const [allParticipants, setAllParticipants] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [chat, setChat] = useState(null);
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const [notifyText, setNotifyText] = useState("");
    const [file, setFile] = useState([]);
    const [filePreview, setFilePreview] = useState(null)
    const [hasMore, setHasMore] = useState(false);


    const loggedInUserId = localStorage.getItem("userId");
    const loggedInUserName = localStorage.getItem("userName");

    const fileInputRef = useRef(null);

    useEffect(() => {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Socket connected--->", newSocket.id);
            newSocket.emit("register", loggedInUserId);
        });

        newSocket.on("connect_error", (error) => {
            console.error("Connection error:", error);
        });

        newSocket.on("notification", (notification) => {
            console.log("Receiving notification:", notification);

            const notificationText = notification.message.text;

            const {senderId} = notification.message;

            if (senderId !== activeChat?.user2ID) {
                setNotifications((prev) => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1,
                }));
            }

            addNotification({
                title: notification.message.sender.name,
                icon: "https://bootdey.com/img/Content/avatar/avatar1.png",
                message: notification.message.text,
                native: true,
                theme: "darkblue",
                closeButton: "Go away",
            });
        });

        return () => {
            newSocket.disconnect();
            console.log("Socket disconnected");
        };
    }, [loggedInUserId, activeChat]);

    useEffect(() => {
        const getAllParticipants = async () => {
            try {
                const users = await getAllUsers();
                const participants = users.filter((user) => user.id !== loggedInUserId);
                setAllParticipants(participants);
                console.log("All participants-->", participants);
            } catch (error) {
                console.error("Failed to fetch participants", error);
            }
        };

        getAllParticipants();
    }, [loggedInUserId]);

    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setHasMore(false)
        setChat("");
        setFile([]);
        setFilePreview(null);
        const chat = await createChat({
            name: "Discussion",
            user1ID: loggedInUserId,
            user2ID: user.id,
        });
        setChat(chat);
        setActiveChat(chat);

        if (socket) {
            socket.emit("joinRoom", chat.id);
            console.log(`User joined room: ${chat.id}`);
        }

        // Clear notifications for the selected user
        setNotifications((prev) => ({
            ...prev,
            [user.id]: 0,
        }));

        // Reset file input field
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };


    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <div className="w-1/4 bg-gray-800 border-r border-gray-700 p-4">
                <div className="mb-4">
                    <p className="text-2xl font-semibold">{loggedInUserName}</p>
                </div>
                <div className="relative mb-4">
                    <input
                        type="text"
                        className="w-full border-2 border-gray-600 bg-gray-700 p-2 rounded-lg text-white"
                        placeholder="Search..."
                    />
                    <span className="absolute top-1/2 right-3 transform -translate-y-1/2">
            <i className="fa fa-search text-gray-400"></i>
          </span>
                </div>
                <ul className="space-y-2">
                    {allParticipants.map((user) => {
                        const {id, name} = user;
                        const notificationCount = notifications[id] || 0;
                        return (
                            <li
                                key={id}
                                className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                                id='id'
                                onClick={() => handleSelectUser(user)}
                            >
                                <img
                                    className="w-10 h-10 rounded-full mr-3"
                                    src="https://bootdey.com/img/Content/avatar/avatar1.png"
                                    alt="avatar"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-lg">{name}</p>
                                        {notificationCount > 0 && (
                                            <span
                                                className="inline-flex items-center rounded-full bg-green-500 px-2
                                                py-1 text-xs font-medium text-white">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="flex-1">
                {selectedUser && (
                    <SingleChatPage
                        selectedUser={selectedUser}
                        chat={chat}
                        socket={socket}
                        file={file}
                        setFile={setFile}
                        filePreview={filePreview}
                        setFilePreview={setFilePreview}
                        fileInputRef={fileInputRef}
                        hasMore={hasMore}
                        setHasMore={setHasMore}
                    />
                )}
            </div>
        </div>
    );
}