import {useEffect, useRef, useState} from "react";
import {getAllMessages} from "@/lib/actions/message";
import {IoMdSend, IoMdDownload} from "react-icons/io";
import {MdAttachment} from "react-icons/md";
import {getChat} from "@/lib/actions/chat";
import {FaFilePdf, FaFilePowerpoint, FaFileWord} from "react-icons/fa";
import {getAllAttachmentsUsingMsgIds} from "@/lib/actions/attachement";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

export default function SingleChatPage({selectedUser, chat, socket, file, setFile, filePreview, setFilePreview}) {
    const [inbox, setInbox] = useState([]);
    const [message, setMessage] = useState("");
    const chatHistoryRef = useRef(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState("");
    const [ext, setExt] = useState("");
    const [url, setUrl] = useState('')
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [messageId, setMessageId] = useState('')
    const [selectedImages, setSelectedImages] = useState([])


    const loggedInUserId = localStorage.getItem("userId");
    console.log("LoggedInUser-->", loggedInUserId)


    const fileTypes = [
        {
            extension: "pdf",
            icon: <FaFilePdf/>,
            background: "https://ja.nsommer.dk/img/pdf.jpg",
            title: "View PDF Attachment",
            filetype: "application/pdf",
        },
        {
            extension: "ppt",
            icon: <FaFilePowerpoint/>,
            background:
                "https://kayaconnect.org/pluginfile.php/383349/course/overviewfiles/powerpoint.png",
            title: "View PPT Attachment",
            filetype: "application/vnd.ms-powerpoint",
        },
        {
            extension: "doc",
            icon: <FaFileWord/>,
            background:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaaT53qepmWven1TGX8jrjQxnmwcm4ynllyQ&s",
            title: "View DOC Attachment",
            filetype: "application/msword",
        },
    ];

    useEffect(() => {
        if (socket && chat && chat.id) {
            socket.emit("joinRoom", chat.id);
            console.log("chat id available", chat.id);

            // Handle incoming messages from socket
            socket.on("message", (message) => {
                console.log("Message from socket:", message);


                // console.log("hojra",Array.isArray(message.attachments))

                // Add incoming message to inbox
                if (message && message.text && message.senderId !== loggedInUserId) {
                    console.log("message-->", message);
                    setInbox((prevInbox) => [...prevInbox, message]);
                } else if (
                    message &&
                    (message.attachment?.url || message.attachmentUrl)
                ) {
                    console.log("attachment message-->", message);
                    setInbox((prevInbox) => [...prevInbox, message]);
                } else if (Array.isArray(message.attachments)) {
                    console.log("multiple attachment message-->", message);
                    const messageWithAttachments = {
                        ...message,
                        attachments: message.attachments
                    };
                    setInbox((prevInbox) => [...prevInbox, messageWithAttachments]);

                    // for (let i in message.attachments) {
                    //     let msg = {
                    //         chatId: message.message.chatId,
                    //         senderId: loggedInUserId,
                    //         receiverId: selectedUser.id,
                    //     };
                    //     msg.attachmentUrl = message.attachments[i];
                    //     setInbox((prevInbox) => [...prevInbox, msg]);
                    // }
                }
            });

            // Add the sender's message to the inbox immediately
            if (chat.currentMessage) {
                setInbox((prevInbox) => [...prevInbox, chat.currentMessage]);
            }

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

            console.log("hellllllo ather", allMessages);

            // Extract message IDs for attachment messages
            const messageIds = allMessages
                .filter((message) => !message.text)
                .map((message) => message.id);

            // console.log("MsgIds-->", messageIds);

            // Fetch attachments
            const attachments = await getAllAttachmentsUsingMsgIds(messageIds)
            // console.log("attachments-->", attachments);

            // Combine messages and attachments
            const combinedMessages = allMessages.map((message) => {
                const attachmentGroup = attachments.filter(
                    (att) => att.messageId === message.id
                );
                return {
                    ...message,
                    attachments: attachmentGroup,
                };
            });


            console.log(
                "All messages with attachments -->",
                combinedMessages.length,
                combinedMessages
            );
            setInbox(combinedMessages);

            // Scroll to the bottom when messages are loaded
            if (chatHistoryRef.current) {
                chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const handleFileUpload = (event) => {
        const selectedFiles = event.target.files;
        const previews = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            previews.push(URL.createObjectURL(file));
        }

        setFile(selectedFiles);
        setFilePreview(previews);
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();

        setFile(null);
        setFilePreview(null);

        if (!message.trim() && (!file || file.length === 0)) {
            return;
        }

        const newMessages = [];
        let g = document.getElementById('id')
        console.log("hijra", g, selectedUser)
        if (file && file.length > 0) {
            for (let i = 0; i < file.length; i++) {
                const currentFile = file[i];
                const readFile = (file) => {
                    return new Promise((resolve, reject) => {
                        const fileReader = new FileReader();
                        fileReader.onloadend = () => {
                            const attachmentUrl = fileReader.result;
                            const newMessage = {
                                filetype: file.type,
                                senderId: loggedInUserId,
                                receiverId: selectedUser.id,
                                text: message,
                                createdAt: new Date().toISOString(),
                                chatId: chat.id,
                                attachmentUrl,
                            };
                            resolve(newMessage);
                        };
                        fileReader.onerror = reject;
                        fileReader.readAsDataURL(file);
                    });
                };

                try {
                    const newMessage = await readFile(currentFile);
                    newMessages.push(newMessage);
                    setInbox((prevInbox) => [...prevInbox, newMessage]);
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            }
            setMessage("");
            setFile(null);
            setUrl(message?.attachmentUrl || message);
            setFilePreview(null);


            if (newMessages.length > 0) {
                socket.emit("message", newMessages);
            }
        } else {
            const newMessage = {
                filetype: null,
                senderId: loggedInUserId,
                receiverId: selectedUser.id,
                text: message,
                createdAt: new Date().toISOString(),
                chatId: chat.id,
                attachmentUrl: null,
            };

            setInbox((prevInbox) => [...prevInbox, newMessage]);
            setMessage("");
            setFile(null);
            setFilePreview(null);
            setUrl(message?.attachmentUrl);

            socket.emit("message", newMessage);
        }

        // g.click()

    };

    useEffect(() => {
        // console.log("file extension --------->", ext);
        console.log("inbox-->", inbox);
        // console.log("FilePreview", filePreview)
        // console.log("file", file)

    }, [inbox, url, selectedImage, lightboxOpen, selectedImages, file, filePreview]);

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
        if (!url) return false; // Check if URL is valid
        // console.log('Testing URL:', url); // Debugging line
        // console.log(/\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(url))
        return /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(url);
    };


    const handleImageClick = (attachment, index, mId) => {
        setLightboxOpen(true);
        setMessageId(mId);
        const filteredImages = inbox.find((message) => message.id === mId).attachments;
        console.log("filteredImages", filteredImages)
        setSelectedImages(filteredImages);
        setSelectedImage(attachment?.url);
    }

    const isImage = (url) => {
        if (!url) return false;
        const inlineImagePattern = /^data:image/i;
        const imageExtensionsPattern = /\.(png|jpe?g|gif|bmp|webp|svg)$/i;
        return inlineImagePattern.test(url) || imageExtensionsPattern.test(url);
    };
    const attachmentUrl = (message?.attachment?.url || message?.attachmentUrl?.url) || message?.attachmentUrl;

    const attachmentPreview = fileTypes.map((fileType) => fileType.background)


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
                    {inbox.map((message, index) => {

                        console.log("message-->", message);
                        console.log("LU-->", loggedInUserId);
                        console.log("senderId", message?.senderId);

                        const isSentByCurrentUser = message?.senderId === loggedInUserId;
                        console.log("isSentByCurrentUser", isSentByCurrentUser);

                        const isReceiver = message.senderId !== loggedInUserId;
                        console.log("isReceiver", isReceiver);

                        const containerClass = isReceiver
                            ? "flex justify-start mb-2"
                            : "flex justify-end mb-2";

                        const bubbleClass = isReceiver
                            ? "bg-gray-300 text-gray-900 rounded-lg p-2"
                            : "bg-blue-500 text-white rounded-lg p-2";

                        const messageClass = isReceiver
                            ? "flex flex-col items-start"
                            : "flex flex-col items-end";

                        const fileType = message.attachment
                            ? message.attachment.url.split(".").pop()
                            : "";
                        const fileTypeInfo = fileTypes.find(
                            (type) => type.extension === fileType
                        );

                        const images = message.attachments
                            ? message.attachments.map((attachment) => ({
                                src: attachment.url || attachment.attachmentUrl?.url,
                                alt: 'attachment',
                            }))
                            : [
                                {
                                    src: message.attachmentUrl || message.attachment?.url,
                                    alt: 'attachment',
                                },
                            ];

                        return (
                            <li className={containerClass} key={index}>
                                <div className={messageClass}>

                                    {/* For text */}
                                    {message?.text && message?.text !== "" ? (
                                        <div className={bubbleClass}>
                                            <div className="message-data">
                            <span className="message-data-time">
                                {formatDate(message.createdAt)}
                            </span>
                                            </div>
                                            {message.text}
                                        </div>
                                    ) : (
                                        <>
                                            {/* For images display */}
                                            {
                                                (message?.attachments || message?.attachmentUrl ||
                                                    message?.attachment?.url) && (
                                                    <div>
                                                        {message.attachments && message.attachments.length >= 1 ? (
                                                            <div className={`flex flex-wrap w-[496px] 
                                                                    ${(message?.senderId === loggedInUserId) ? 'flex justify-end' : 'flex justify-start'}`}>
                                                                {message.attachments.slice(0, 4).map((attachment, index) => {
                                                                    const attachmentUrl = attachment?.url || attachment?.attachmentUrl?.url;
                                                                    return (
                                                                        <div
                                                                            key={attachmentUrl}
                                                                            className="grid-item attachment border"
                                                                        >
                                                                            {isImage(attachmentUrl) ? (
                                                                                <div>
                                                                                    <img
                                                                                        src={attachmentUrl}
                                                                                        alt="attachment123"
                                                                                        className="w-[240px] h-[200px] rounded-lg cursor-pointer"
                                                                                        onClick={() => handleImageClick(attachment, index, message?.id)}
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="shadow-lg w-[496px]">
                                                                                    {fileTypes.map((fileType) => {
                                                                                        if (attachmentUrl.endsWith(fileType.extension)) {
                                                                                            return (
                                                                                                <div key={fileType.title}
                                                                                                     className="flex flex-col">
                                                                                                    <div
                                                                                                        className="attachment-thumbnail"
                                                                                                        style={{
                                                                                                            backgroundImage: `url(${fileType.background})`,
                                                                                                            backgroundSize: "cover",
                                                                                                            width: "496px",
                                                                                                            height: "200px",
                                                                                                            borderRadius: "8px",
                                                                                                            backgroundColor: "#f8f9fa",
                                                                                                        }}
                                                                                                    ></div>
                                                                                                    <div
                                                                                                        className="flex justify-between shadow-lg shadow-slate-300 py-5 px-2 rounded-b-xl">
                                                                                                        <div>{fileType.icon}</div>
                                                                                                        <p className="black hover:underline mt-2">
                                                                                                            {fileType.title || "View File"}
                                                                                                        </p>
                                                                                                        <a
                                                                                                            href={message?.attachmentUrl ||
                                                                                                                (message?.attachment?.url || message?.attachmentUrl?.url)}
                                                                                                            target="_blank"
                                                                                                            download
                                                                                                            className="flex items-center text-black hover:underline mt-1"
                                                                                                        >
                                                                                                            <IoMdDownload
                                                                                                                className="mr-1"/>
                                                                                                        </a>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                        return null;
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            // to show attachments on sender node in runtime
                                                            <div className="flex">
                                                                {isImage(message?.attachmentUrl || message?.attachment?.url) ? (
                                                                    <div
                                                                        className="image-preview mt-2">
                                                                        <img
                                                                            src={
                                                                                message?.attachmentUrl?.startsWith('data:image')
                                                                                    ? message?.attachmentUrl : message?.attachment?.url
                                                                            }
                                                                            alt="attachment12"
                                                                            className="w-[240px] h-[200px] rounded-lg"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="w-[496px] border border-yellow-600">
                                                                            {fileTypes.map((fileType) => {
                                                                                const fileAttachmentUrl = message?.attachmentUrl || message?.attachment?.url
                                                                                const isSenderUrlExists = fileAttachmentUrl?.startsWith(`data:${fileType.filetype}`)
                                                                                const isReceiverUrlExists = fileAttachmentUrl?.endsWith(fileType.extension)
                                                                                const isFileTypeMatches = fileAttachmentUrl.includes(fileType?.extension || fileType?.filetype)

                                                                                console.log("isMatched--->", isFileTypeMatches)

                                                                                console.log("fileAttachmentUrl", fileAttachmentUrl)
                                                                                console.log("isSenderURLExists", isSenderUrlExists)
                                                                                console.log("isSenderURLExists", isReceiverUrlExists)

                                                                                if (isSenderUrlExists || isReceiverUrlExists) {
                                                                                    return (
                                                                                        <div key={fileType.extension}
                                                                                             className="flex flex-col">
                                                                                            <div
                                                                                                className="attachment-thumbnail"
                                                                                                style={{
                                                                                                    backgroundImage: `url(${fileType.background})`,
                                                                                                    backgroundSize: "cover",
                                                                                                    width: "496px",
                                                                                                    height: "200px",
                                                                                                    borderRadius: "8px",
                                                                                                    backgroundColor: "#f8f9fa",
                                                                                                }}
                                                                                            ></div>
                                                                                            <div
                                                                                                className="flex justify-between shadow-lg shadow-slate-300 py-5 px-2
                                                                                            rounded-b-xl">
                                                                                                <div>{fileType.icon}</div>
                                                                                                <p className="text-black hover:underline mt-2">
                                                                                                    {fileType.title || "View File"}
                                                                                                </p>
                                                                                                <a
                                                                                                    href={message?.attachmentUrl || message?.attachment?.url}
                                                                                                    target="_blank"
                                                                                                    download
                                                                                                    className="flex items-center text-black hover:underline "
                                                                                                >
                                                                                                    <IoMdDownload
                                                                                                        className="mr-1"/>
                                                                                                </a>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            }
                                        </>
                                    )}

                                </div>
                            </li>
                        )
                    })}

                </ul>
            </div>


            {/*---- LightBox modal ----------*/}
            {lightboxOpen && (
                <Lightbox
                    open={lightboxOpen}
                    close={() => setLightboxOpen(false)}
                    slides={selectedImages.map((image) => ({
                        src: image.url,
                    }))}
                />
            )}

            {/*--------------------------------------*/}


            {/* For images preview before sending */}

            {filePreview && (
                <div className="p-4 flex flex-wrap">
                    {filePreview.map((preview, index) => (
                        <img
                            key={index}
                            src={preview}
                            alt={''}
                            className="w-12 h-12 object-cover mr-1"
                        />
                    ))}
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
                        <input
                            type="file"
                            id="file"
                            multiple={true}
                            hidden
                            onChange={handleFileUpload}
                        />
                    </form>
                </div>
            </div>
        </div>
    );
}