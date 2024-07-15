import {useEffect, useRef, useState} from "react";
import {getAllMessages} from "@/lib/actions/message";
import {IoMdSend, IoMdDownload} from "react-icons/io";
import {MdAttachment} from "react-icons/md";
import {getChat} from "@/lib/actions/chat";
import {FaFilePdf, FaFilePowerpoint, FaFileWord} from "react-icons/fa";
import {getAllAttachmentsUsingMsgArray} from "@/lib/actions/attachement";

export default function SingleChatPage({selectedUser, chat, socket}) {
    const [inbox, setInbox] = useState([]);
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const chatHistoryRef = useRef(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState("");
    const [ext, setExt] = useState("");

    const loggedInUserId = localStorage.getItem("userId");

    const fileTypes = [
        {
            extension: 'pdf',
            icon: <FaFilePdf/>,
            background: 'https://ja.nsommer.dk/img/pdf.jpg',
            title: 'View PDF Attachment'
        },
        {
            extension: 'ppt',
            icon: <FaFilePowerpoint/>,
            background: 'https://kayaconnect.org/pluginfile.php/383349/course/overviewfiles/powerpoint.png',
            title: 'View PPT Attachment'
        },
        {
            extension: 'doc',
            icon: <FaFileWord/>,
            background: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaaT53qepmWven1TGX8jrjQxnmwcm4ynllyQ&s',
            title: 'View DOC Attachment'
        },

    ];


    useEffect(() => {
        if (socket && chat && chat.id) {
            socket.emit("joinRoom", chat.id);
            console.log("chat id available", chat.id);

            // Handle incoming messages from socket
            socket.on("message", (message) => {
                console.log("Message from socket:", message);

                // Add incoming message to inbox, but only if it's from another user
                if (message && message.text && message.senderId !== loggedInUserId) {
                    console.log("message-->", message);
                    setInbox((prevInbox) => [...prevInbox, message]);
                } else if (
                    message &&
                    message.attachment.url &&
                    message.senderId !== loggedInUserId
                ) {
                    console.log("attachment message-->", message);
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

            // Extract message IDs for attachment messages
            const msgIds = allMessages
                .filter((message) => !message.text)
                .map((message) => message.id);

            // console.log("MsgIds-->", msgIds);


            // Fetch attachments
            const attachments = await getAllAttachmentsUsingMsgArray(msgIds);
            // console.log("attachments-->", attachments);


            // Combine messages and attachments
            const combinedMessages = allMessages.map((message) => {
                const attachment = attachments.find((att) => att.messageId === message.id);
                return {
                    ...message,
                    attachment,
                };
            });

            console.log("All messages with attachments -->", combinedMessages.length, combinedMessages);
            setInbox(combinedMessages);

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
                const newMessage = {
                    filetype: file.type,
                    senderId: loggedInUserId,
                    receiverId: selectedUser.id,
                    text: message,
                    createdAt: new Date().toISOString(),
                    chatId: chat.id,
                    attachmentUrl
                };

                setInbox((prevInbox) => [...prevInbox, newMessage]);
                setMessage("");
                setFile(null);
                setFilePreview(null);

                socket.emit("message", newMessage);
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
        }
    };

    const handleFileUpload = (event) => {
        const selectedFile = event.target.files[0];
        const fileName = event.target.files[0].name;
        if (selectedFile) {
            setExt(fileName.split(".").pop());
            setFile(selectedFile);
            setFilePreview(URL.createObjectURL(selectedFile));
        }
    };

    useEffect(() => {
        console.log("file extension --------->", ext);
        console.log("inbox-->", inbox)
    }, [ext, inbox]);

    function formatDate(dateString) {
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        const strMinutes = minutes < 10 ? "0" + minutes : minutes;
        return `${hours}:${strMinutes} ${ampm}`;
    }


// Function to check if a file is an image
    const isImageFile = (url) => {
        return /\.(png|jpe?g|gif|bmp)$/i.test(url);
    };

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
                                {/* For text */}
                                {msg.text && <p>{msg.text}</p>}

                                {/* For image attachments */}
                                {msg.attachment?.url && isImageFile(msg.attachment.url) && (
                                    <div className="p-4">
                                        <img
                                            src={msg.attachment.url}
                                            alt="attachment"
                                            className="w-40 h-40"
                                        />
                                    </div>
                                )}


                                {/*/!* For file attachments *!/*/}
                                {msg.attachment?.url && (
                                    <div className="mt-2 w-64">
                                        {fileTypes.find((fileType) => msg.attachment?.url?.endsWith(`.${fileType.extension}`)) && (
                                            <div>
                                                <div
                                                    className="w-full h-36 bg-cover bg-center"
                                                    style={{
                                                        backgroundImage: `url(${fileTypes.find((fileType) => msg.attachment.url.endsWith(`.${fileType.extension}`)).background})`,
                                                    }}
                                                ></div>
                                                <div className="flex justify-between items-center px-3 py-2">
                                                    {fileTypes.find((fileType) => msg.attachment.url.endsWith(`.${fileType.extension}`)).icon}
                                                    <h3 className="text-sm">
                                                        {fileTypes.find((fileType) => msg.attachment.url.endsWith(`.${fileType.extension}`)).title}</h3>
                                                    <a
                                                        href={msg.attachment.url}
                                                        target="_blank"
                                                        download
                                                    >
                                                        <IoMdDownload className="text-xl"/>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <small className="flex justify-end mt-3">
                                    {formatDate(msg.createdAt)}
                                </small>
                            </div>
                        </li>
                    ))}

                </ul>
            </div>

            {/* For images preview before sending */}
            {filePreview && (
                <div className="p-4">
                    <img
                        src={
                            filePreview ||
                            "https://0.academia-photos.com/attachment_thumbnails/58839319/mini_magick20190409-9685-cxv1d2.png?1554825434"
                        }
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
                        <div className="flex justify-center items-center text-3xl">
                            <button type="submit">
                                <IoMdSend/>
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
                            <MdAttachment className="text-3xl cursor-pointer"/>
                        </label>
                        <input type="file" id="file" hidden onChange={handleFileUpload}/>
                    </form>
                </div>
            </div>
        </div>
    );
}
