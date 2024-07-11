// "use client";

// import { useEffect, useState } from "react";
// import { io } from "socket.io-client";

// export default function ChatOne() {
//     const [inbox, setInbox] = useState([]);
//     const [message, setMessage] = useState('');
//     const [roomName, setRoomName] = useState('');
//     const [socket, setSocket] = useState(null);

//     useEffect(() => {
//         const newSocket = io("http://localhost:3000");
//         setSocket(newSocket);

//         newSocket.on("message", (message) => {
//             setInbox((prevInbox) => [...prevInbox, message]);
//         });

//         return () => {
//             newSocket.disconnect();
//         };
//     }, []);

//     const handleSendMessage = () => {
//         if (message.trim() !== '' && roomName.trim() !== '') {
//             socket.emit('message', message, roomName);
//             setMessage(message);
//         } else if (message.trim() !== '') {
//             socket.emit("message", message);
//             setMessage(message);
//         }
//     };

//     const handleJoinRoom = () => {
//         if (roomName.trim() !== '') {
//             socket.emit("joinRoom", roomName);
//             setRoomName(roomName);
//         }
//     };

//     return (
//         <>
//             <div>
//                 <div className="flex flex-col gap-5 mt-20 px-10 lg:px-48">
//                     <div className="flex flex-col gap-2 border rounded-lg p-10">
//                         {inbox.map((msg, index) => (
//                             <div key={index} className="border rounded px-4 py-2">
//                                 <p>User's id: {msg.id}</p>
//                                 <p>Message sent: {msg.message}</p>
//                             </div>
//                         ))}
//                     </div>

//                     <div className="flex gap-2 items-center justify-center">
//                         <input
//                             onChange={(e) => setMessage(e.target.value)}
//                             value={message}
//                             type="text"
//                             name="message"
//                             className="flex flex-1 bg-white text-black border rounded px-2 py-1"
//                         />
//                         <button className="w-40" onClick={handleSendMessage}>
//                             Send message
//                         </button>
//                     </div>

//                     <div className="flex gap-2 items-center justify-center">
//                         <input
//                             onChange={(e) => setRoomName(e.target.value)}
//                             value={roomName}
//                             type="text"
//                             name="room"
//                             className="flex flex-1 bg-white text-black border rounded px-2 py-1"
//                         />
//                         <button className="w-40" onClick={handleJoinRoom}>
//                             Join Room
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }

//  HElooooooooooooooooo

import { useEffect, useRef, useState } from "react";
import { getAllMessages } from "@/lib/actions/message";
import { IoMdSend } from "react-icons/io";
import { MdAttachment } from "react-icons/md";
import { getChat } from "@/lib/actions/chat";

export default function SingleChatPage({ selectedUser, chat, socket }) {
  const [inbox, setInbox] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const chatHistoryRef = useRef(null);

  const loggedInUserId = localStorage.getItem("userId");

  useEffect(() => {
    if (socket && chat && chat.id) {
      socket.emit("joinRoom", chat.id);

      // Handle incoming messages from socket
      socket.on("message", (message) => {
        console.log("Message from socket:", message);

        // Add incoming message to inbox, but only if it's from another user
        if (message && message.text && message.senderId !== loggedInUserId) {
          setInbox((prevInbox) => [...prevInbox, message]);
        }
      });

      loadMessages();

      return () => {
        socket.off("message");
      };
    }
  }, [chat, socket]);

  useEffect(() => {
    console.log("Updated inbox:", inbox);
    // Scroll to the bottom whenever inbox updates
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [inbox]);

  const loadMessages = async () => {
    try {
      const chat = await getChat(loggedInUserId, selectedUser.id);
      const allMessages = await getAllMessages(
        loggedInUserId,
        selectedUser.id,
        chat.id
      );

      console.log("All messages:", allMessages.length, allMessages);
      setInbox(allMessages);

      // Scroll to the bottom when messages are loaded
      if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!message.trim() && !file) {
      return;
    }

    let attachmentUrl = null;

    if (file) {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        attachmentUrl = fileReader.result;
        console.log("attachmentUrl---->", attachmentUrl);

        const newMessage = {
          filetype: file?.type || "",
          senderId: loggedInUserId,
          receiverId: selectedUser.id,
          text: message,
          createdAt: new Date().toISOString(),
          chatId: chat.id,
          attachmentUrl,
        };

        setInbox((prevInbox) => [...prevInbox, newMessage]);
        setMessage("");
        setFile(null);
        setFilePreview(null);

        socket.emit("message", newMessage);

        if (chatHistoryRef.current) {
          chatHistoryRef.current.scrollTop =
            chatHistoryRef.current.scrollHeight;
        }
      };
      fileReader.readAsDataURL(file);
    } else {
      const newMessage = {
        filetype: "",
        senderId: loggedInUserId,
        receiverId: selectedUser.id,
        text: message,
        createdAt: new Date().toISOString(),
        chatId: chat.id,
      };

      setInbox((prevInbox) => [...prevInbox, newMessage]);
      setMessage("");

      socket.emit("message", newMessage);

      if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    console.log("message---->", message);
    console.log("inbox------>", inbox);
  }, [message, inbox]);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
  }

  return (
    <div className="chat h-screen flex flex-col">
      <div className="chat-header clearfix">
        <div className="row">
          <div className="col-lg-6">
            <a href="#" data-toggle="modal" data-target="#view_info">
              <img
                src="https://bootdey.com/img/Content/avatar/avatar2.png"
                alt="avatar"
              />
            </a>
            <div className="chat-about">
              <h6 className="m-b-0">{selectedUser.name}</h6>
            </div>
          </div>
        </div>
      </div>
      <div
        className="chat-history flex-grow flex flex-col-reverse overflow-y-auto p-4"
        ref={chatHistoryRef}
      >
        <ul className="m-b-0">
          {inbox.map((msg, index) => (
            <li
              className={`clearfix list-none ${
                msg.senderId === loggedInUserId ? "flex justify-end" : ""
              }`}
              key={index}
            >
              <div
                className={`rounded border px-4 py-2 inline-block ${
                  msg.senderId === loggedInUserId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {msg.text && <p>{msg.text}</p>}
                {msg.attachmentUrl && (
                  <div className="mt-2">
                    <img
                      src={msg.attachmentUrl}
                      alt="Attachment"
                      className="w-32 h-32 object-cover"
                      onError={(event) => {
                        event.target.style.display = "block";
                      }}
                    />
                  </div>
                )}
                <small className="flex justify-end">
                  {formatDate(msg.createdAt)}
                </small>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {filePreview && (
        <div className="p-4">
          <img
            src={filePreview}
            alt="preview"
            className="w-20 h-20 object-cover"
          />
        </div>
      )}
      <div className="chat-message clearfix">
        <div className="input-group mb-0 border border-gray-400 flex">
          <form
            onSubmit={handleSendMessage}
            className="flex justify-center items-center w-full px-4"
          >
            <div className=" flex justify-center items-center text-3xl">
              <button type="submit">
                <IoMdSend />
              </button>
            </div>

            <input
              onChange={(e) => setMessage(e.target.value)}
              value={message}
              name="message"
              className="flex-grow p-5 outline-none resize-none"
              placeholder="Enter text here..."
            />
            <label htmlFor="file">
              <MdAttachment className="text-3xl cursor-pointer" />
            </label>
            <input type="file" id="file" hidden onChange={handleFileUpload} />
          </form>
        </div>
      </div>
    </div>
  );
}
