"use client";

import { useEffect, useState } from "react";
import SingleChatPage from "../SingleChat/single-chat";
import "./style.css";
import { getAllUsers } from "@/lib/actions/user";
import { createChat } from "@/lib/actions/chat";
import { io } from "socket.io-client";
import { deletenotifications } from "@/lib/actions/notification";
import addNotification from "react-push-notification";

export default function ChatPage() {
  const [allParticipants, setAllParticipants] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chat, setChat] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [notifyText, setNotifyText] = useState("");

  const loggedInUserId = localStorage.getItem("userId");
  const loggedInUserName = localStorage.getItem("userName");

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

      const { senderId } = notification.message;

      if (senderId !== activeChat?.user2ID) {
        setNotifications((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));

        // setNotifyText((prev) => ({
        //   ...prev,
        //   [senderId]: (prev[senderId] || 0) + 1,
        // }));
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
    setChat("");
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

    // Clear the notification text
    // setNotifyText((prev) => ({
    //   ...prev,
    //   [user.id]: 0,
    // }));
  };

  return (
    <div className="container">
      <div className="row clearfix">
        <div className="col-lg-12">
          <div className="card chat-app h-[100vh]">
            <div id="plist" className="people-list h-[100vh]">
              <p>{loggedInUserName}</p>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
                <input
                  type="text"
                  className="w-full border border-gray-400 p-3"
                  placeholder="Search..."
                />
              </div>

              <ul className="list-unstyled chat-list mt-2 mb-0">
                {allParticipants.map((user) => {
                  const { id, name } = user;
                  const notificationCount = notifications[id] || 0;
                  return (
                    <li
                      className="clearfix border-b-2  flex"
                      onClick={() => handleSelectUser(user)}
                      key={id}
                    >
                      <img
                        src="https://bootdey.com/img/Content/avatar/avatar1.png"
                        alt="avatar"
                      />
                      <div className="about w-full flex items-center">
                        <div className="name flex justify-between gap-4 w-full">
                          <div className="flex flex-col">
                            <p className="text-lg">{name}</p>
                          </div>
                          {notificationCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-gray-500/10">
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

            {selectedUser && (
              <SingleChatPage
                selectedUser={selectedUser}
                chat={chat}
                socket={socket}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
