import {useEffect, useRef, useState} from "react";
import {getAllMessages} from "@/lib/actions/message";
import {IoMdSend, IoMdDownload} from "react-icons/io";
import {MdAttachment} from "react-icons/md";
import {getChat} from "@/lib/actions/chat";
import {FaFilePdf, FaFilePowerpoint, FaFileWord} from "react-icons/fa";
import {getAllAttachmentsUsingMsgIds} from "@/lib/actions/attachement";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "react-image-gallery/styles/css/image-gallery.css";
import {Oval} from "react-loader-spinner";
import {FileIcon, defaultStyles} from "react-file-icon"
import InputForm from "@/components/InputForm/inputForm";
import RuntimeAttachmentsOnSender from "@/components/RuntimeAttachmentsOnSender/runtimeAttachmentsOnSender";
import {debounce} from "next/dist/server/utils";
import LoadingAttachments from "@/components/LoadingAttachments/loadingAttachments";


export default function SingleChatPage({
                                           selectedUser,
                                           chat,
                                           socket,
                                           file,
                                           setFile,
                                           filePreview,
                                           setFilePreview,
                                           fileInputRef,
                                           hasMore,
                                           setHasMore
                                       }) {
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
    const [loading, setLoading] = useState(false)
    // const [hasMore, setHasMore] = useState(true);


    const [loadIndex, setLoadIndex] = useState(1)
    const [chatId, setChatId] = useState('')

    const [messagesLength, setMessagesLength] = useState('')


    const loggedInUserId = localStorage.getItem("userId");
    console.log("LoggedInUser-->", loggedInUserId)


    const fileTypes = [
        {id: '1'}
    ];

    useEffect(() => {
        if (socket && chat && chat.id) {
            socket.emit("joinRoom", chat.id);
            console.log("chat id available", chat.id);

            // Handle incoming messages from socket
            socket.on("message", (message) => {
                console.log("Message from socket:", message);

                // Add incoming message to inbox
                if (message && message.text && message.senderId !== loggedInUserId) {
                    console.log("message-->", message);
                    setInbox((prevInbox) => [...prevInbox, message]);

                } else if (message && (message.attachment?.url || message.attachmentUrl)) {
                    console.log("attachment message-->", message);
                    setInbox((prevInbox) => [...prevInbox, message]);

                } else if (Array.isArray(message.attachments)) {
                    console.log("multiple attachment message-->", message);
                    const messageWithAttachments = {
                        ...message,
                        attachments: message.attachments
                    };
                    setInbox((prevInbox) => [...prevInbox, messageWithAttachments]);
                }
            })

            socket.on('messageSent', (message) => {
                console.log("message-------->", message)
                setLoading(false)
            })


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


    const loadMessages = async (count) => {

        try {
            const chat = await getChat(loggedInUserId, selectedUser.id);

            let allMessages = await getAllMessages(
                loggedInUserId,
                selectedUser.id,
                chat.id,
                loadIndex
            )

            setChatId(chat.id)

            console.log("all messages--->", allMessages);

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


            const allMessagesLength = combinedMessages[0].allMessagesLength
            console.log("allMessagesLength-->", allMessagesLength)
            setMessagesLength(allMessagesLength)


            // Scroll to the bottom when messages are loaded
            if (chatHistoryRef.current) {
                chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const handleFileUpload = (event) => {
        console.log("event", event)
        const selectedFiles = event.target.files;
        const previews = [];
        const filesArray = Array.from(selectedFiles);

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            previews.push(URL.createObjectURL(file));
        }

        setFile(filesArray);
        setFilePreview(previews);
    };


    const handleSendMessage = async (event) => {
        event.preventDefault();

        setLoading(true)
        setFile([]);
        setFilePreview(null);

        if (!message.trim() && (!file || file.length === 0)) {
            return;
        }

        const newMessages = [];
        let g = document.getElementById('id')
        console.log("g->", g, selectedUser)
        if (file && file.length > 0) {
            for (let i = 0; i < file.length; i++) {
                const currentFile = file[i];
                const blobUrl = URL.createObjectURL(currentFile);
                console.log("blobUrl-->", blobUrl)
                const readFile = (file) => {
                    return new Promise((resolve, reject) => {
                        const fileReader = new FileReader();
                        console.log("hijra", fileReader)
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

                        console.log("fileReader--->", fileReader)

                        fileReader.onerror = reject;
                        fileReader.readAsDataURL(file);
                    });
                };

                try {
                    const newMessage = await readFile(currentFile);
                    console.log("jijra:", newMessage.attachmentUrl)
                    // delete newMessage.attachmentUrl;
                    newMessages.push(newMessage);
                    console.log("hijra-bhai", newMessages)
                    setInbox((prevInbox) => [...prevInbox, newMessage]);
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            }
            setMessage("");
            setFile([]);
            setUrl(message?.attachmentUrl || message);
            setFilePreview(null);


            if (newMessages.length > 0) {

                socket.emit("message", newMessages);
                console.log("channa-mereya")
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
            setFile([]);
            setFilePreview(null);
            setUrl(message?.attachmentUrl);

            socket.emit("message", newMessage);
        }

        // g.click()

        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        // setLoading(false);
    };

    useEffect(() => {
        // console.log("file extension --------->", ext);
        console.log("inbox-->", inbox);
        console.log("FilePreview", filePreview)
        console.log("file", file)

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


    async function handleLoadPreviousMessages() {
        const newLoadIndex = loadIndex + 1;
        setLoadIndex(newLoadIndex);

        let allDisplayedMessages = await getAllMessages(
            loggedInUserId,
            selectedUser.id,
            chatId,
            newLoadIndex
        );
        console.log("allDisplayedMessages", allDisplayedMessages);

        const messageIds = allDisplayedMessages
            .filter((message) => !message.text)
            .map((message) => message.id);

        const attachments = await getAllAttachmentsUsingMsgIds(messageIds);

        // Combine messages and attachments
        const combinedMessages = allDisplayedMessages.map((message) => {
            const attachmentGroup = attachments.filter(
                (att) => att.messageId === message.id
            );
            return {
                ...message,
                attachments: attachmentGroup,
            };
        });
        console.log("All updated Messages -->", combinedMessages.length, combinedMessages);

        // Prepend previous messages to the existing messages
        const newInbox = [...combinedMessages, ...inbox];
        setInbox(newInbox);


        if (messagesLength === combinedMessages) {
            setHasMore(false)
        }
    }

    useEffect(() => {
        console.log("loadIndex-->", loadIndex)
        console.log("updatedInbox-->", inbox)
    }, [loadIndex, inbox]);


    useEffect(() => {
        const chatHistoryElement = chatHistoryRef.current;
        const handleScroll = () => {
            const scrollTop = chatHistoryElement.scrollTop
            const threshold = -5000;

            // Check if the scroll is at the top to load more messages
            if (scrollTop < threshold && messagesLength > inbox.length) {
                setHasMore(true)
            } else setHasMore(false)
        }

        chatHistoryElement.addEventListener('scroll', handleScroll);
        return () => {
            chatHistoryElement.removeEventListener('scroll', handleScroll);
        }

    }, [inbox, hasMore]);


    function getformat(fileType) {
        let object = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "application/pdf": "pdf",
            "video/mp4": "mp4",
            "application/vnd.ms-powerpoint": "ppt",
            "text/plain": "txt",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/msword": "doc",
            "application/vnd.ms-excel": "xls",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
            "application/zip": "zip",
            "application/x-rar-compressed": "rar",
            "application/x-tar": "tar",
            "application/x-gzip": "gz",
            "audio/mpeg": "mp3",
            "audio/wav": "wav",
            "video/x-msvideo": "avi",
            "video/x-matroska": "mkv",
            "image/gif": "gif",
            "image/bmp": "bmp",
            "image/svg+xml": "svg",
            "text/html": "html",
            "text/css": "css",
            "text/javascript": "js",
            "application/json": "json",
            "application/xml": "xml",
            "application/octet-stream": "bin",
        };
        return object[fileType] || "unknown";
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

            {/*------------- Load Previous Messages Btn --------------*/}
            {
                hasMore && <div className="flex items-center justify-center ">
                    <button className="bg-gray-500 text-white px-3 py-2 my-2 text-xs rounded-2xl"
                            onClick={handleLoadPreviousMessages}
                    >
                        Load previous messages...
                    </button>
                </div>
            }

            <div
                className="chat-history flex-grow flex flex-col-reverse overflow-y-auto p-4"
                ref={chatHistoryRef}
            >
                <ul className="m-b-0">
                    {inbox.map((message, index) => {
                        const isReceiver = message.senderId !== loggedInUserId;

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
                                                                {message.attachments.map((attachment, index) => {
                                                                    const attachmentUrl = attachment?.url || attachment?.attachmentUrl?.url;
                                                                    const fileTypeExtension = attachmentUrl.split('.').pop();

                                                                    return (
                                                                        <div key={attachmentUrl}
                                                                             className="grid-item attachment">
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
                                                                                <div className=" w-[496px]">
                                                                                    <div
                                                                                        key={fileType.title}
                                                                                        className="flex flex-col">
                                                                                        <div
                                                                                            className="attachment-thumbnail rounded-t-xl"
                                                                                            style={{
                                                                                                width: "496px",
                                                                                                height: "250px",
                                                                                                display: "flex",
                                                                                                alignItems: "end",
                                                                                                justifyContent: "center",
                                                                                                overflow: "hidden",
                                                                                                backgroundColor: "lightgray"
                                                                                            }}
                                                                                        >
                                                                                            <FileIcon
                                                                                                extension={fileTypeExtension}
                                                                                                {...defaultStyles[fileTypeExtension]}
                                                                                            />
                                                                                        </div>
                                                                                        <div
                                                                                            className="flex justify-between bg-gray-800 shadow-lg py-5 px-2 rounded-b-xl">
                                                                                            <div
                                                                                                className='w-[20px]'>
                                                                                                <FileIcon
                                                                                                    extension={attachmentUrl.split('.').pop()}
                                                                                                    {...defaultStyles[attachmentUrl.split('.').pop()]}
                                                                                                />
                                                                                            </div>
                                                                                            <p className="text-white hover:underline">
                                                                                                {`View ${fileTypeExtension} attachment`}
                                                                                            </p>
                                                                                            <a
                                                                                                href={attachmentUrl}
                                                                                                target="_blank"
                                                                                                download
                                                                                                className="flex items-center cursor-pointer text-white hover:underline "
                                                                                            >
                                                                                                <IoMdDownload
                                                                                                    className="mr-1"/>
                                                                                            </a>
                                                                                        </div>
                                                                                    </div>

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
                                                                    <>
                                                                        {
                                                                            loading ? <>
                                                                                    <div className="relative mt-2">
                                                                                        <img
                                                                                            src={
                                                                                                message?.attachmentUrl?.startsWith('data:image')
                                                                                                    ? message?.attachmentUrl : message?.attachment?.url
                                                                                            }
                                                                                            alt="attachment12"
                                                                                            className="w-[240px] h-[200px] rounded-lg blur-sm"
                                                                                        />
                                                                                        <div
                                                                                            className="absolute inset-0 flex items-center justify-center">
                                                                                            <Oval
                                                                                                visible={true}
                                                                                                height="50"
                                                                                                width="50"
                                                                                                color="#4fa94d"
                                                                                                ariaLabel="oval-loading"
                                                                                                wrapperStyle={{}}
                                                                                                wrapperClass=""
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </> :
                                                                                <>
                                                                                    <div className="image-preview mt-2">
                                                                                        <img
                                                                                            src={
                                                                                                message?.attachmentUrl?.startsWith('data:image')
                                                                                                    ? message?.attachmentUrl : message?.attachment?.url
                                                                                            }
                                                                                            alt="attachment12"
                                                                                            className="w-[240px] h-[200px] rounded-lg"
                                                                                        />
                                                                                    </div>
                                                                                </>
                                                                        }

                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {loading ? <>
                                                                                <div className="w-[496px]">
                                                                                    <LoadingAttachments
                                                                                        message={message}/>
                                                                                </div>
                                                                            </>
                                                                            : <>
                                                                                <div className="w-[496px]">
                                                                                    <RuntimeAttachmentsOnSender
                                                                                        message={message}/>
                                                                                </div>
                                                                            </>
                                                                        }

                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            }
                                        </>
                                    )}

                                    <small className="flex justify-end">
                                        {formatDate(message?.createdAt || message?.message?.createdAt)}
                                    </small>

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
                    slides={selectedImages?.map((image) => ({
                        src: image?.url,
                    }))}
                />
            )}

            {/*-------------------------------------------------------------*/}


            {/*------------ For images preview before sending ----------------*/}

            {filePreview && file && (
                <div className="p-4 flex flex-wrap">
                    {filePreview.map((preview, index) => {
                        const sFile = file[index];
                        const isImage = sFile.type.startsWith('image/');

                        if (isImage) {
                            return (
                                <img
                                    key={index}
                                    src={preview}
                                    className="w-12 h-12 object-cover mr-1"
                                    alt={`Preview ${index + 1}`}
                                />
                            );
                        } else {
                            return (
                                <div
                                    key={index}
                                    className="w-12 h-12 flex items-center justify-cente mr-1"
                                >
                                    <FileIcon
                                        extension={sFile.name.split('.').pop()}
                                        {...defaultStyles[sFile.name.split('.').pop()]}
                                    />
                                </div>
                            );
                        }
                    })}
                </div>
            )}


            <div className="chat-message border-t border-gray-700">
                <InputForm
                    message={message}
                    setMessage={setMessage}
                    file={file}
                    fileInputRef={fileInputRef}
                    onChange={handleFileUpload}
                    handleSendMessage={handleSendMessage}
                />
            </div>


        </div>
    );
}