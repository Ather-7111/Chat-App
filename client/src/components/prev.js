import { useEffect, useRef, useState } from "react";
import { getAllMessages } from "@/lib/actions/message";
import { IoMdSend, IoMdDownload } from "react-icons/io";
import { MdAttachment } from "react-icons/md";
import { getChat } from "@/lib/actions/chat";
import { FaFilePdf, FaFilePowerpoint, FaFileWord } from "react-icons/fa";
import { getAllAttachmentsUsingMsgArray } from "@/lib/actions/attachement";
import Gallery from "react-photo-gallery";

export default function SingleChatPage({ selectedUser, chat, socket }) {
  const [inbox, setInbox] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const chatHistoryRef = useRef(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [ext, setExt] = useState("");
  const [fileT, setFileT] = useState("");

  const loggedInUserId = localStorage.getItem("userId");

  const fileTypes = [
    {
      extension: "pdf",
      icon: <FaFilePdf />,
      background: "https://ja.nsommer.dk/img/pdf.jpg",
      title: "View PDF Attachment",
      filetype: "application/pdf",
    },
    {
      extension: "ppt",
      icon: <FaFilePowerpoint />,
      background:
        "https://kayaconnect.org/pluginfile.php/383349/course/overviewfiles/powerpoint.png",
      title: "View PPT Attachment",
      filetype: "application/vnd.ms-powerpoint",
    },
    {
      extension: "doc",
      icon: <FaFileWord />,
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
        const attachment = attachments.find(
          (att) => att.messageId === message.id
        );
        return {
          ...message,
          attachment,
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
    console.log(event);

    if (!message.trim() && (!file || file.length === 0)) {
      return;
    }

    let newMessages = [];

    if (file && file.length > 0) {
      const readFile = (file) => {
        return new Promise((resolve, reject) => {
          const fileReader = new FileReader();
          fileReader.onloadend = () => {
            const attachmentUrl = fileReader.result;
            console.log("mimeAttachmentUrl", attachmentUrl);
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
        const newMessages = [];
        for (let i = 0; i < file.length; i++) {
          const currentFile = file[i];
          const newMessage = await readFile(currentFile);
          newMessages.push(newMessage);
        }

        setInbox((prevInbox) => [...prevInbox, ...newMessages]);
        setMessage("");
        setFile(null);
        setFilePreview(null);

        console.log("new msgs", newMessages);
        socket.emit("message", newMessages);
      } catch (error) {
        console.error("Error reading files:", error);
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

      console.log("new msg", newMessage);
      socket.emit("message", newMessage);
    }
  };

  useEffect(() => {
    console.log("file extension --------->", ext);
    console.log("inbox-->", inbox);
    console.log("message->", message);
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

  // Extract image attachments for the gallery
  // const imageAttachments = inbox
  //     .filter((msg) => msg.attachment && isImageFile(msg.attachment.url))
  //     .map((msg) => ({
  //         src: msg.attachment.url,
  //         width: 4,
  //         height: 3,
  //     }));

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
            const isSentByCurrentUser = message.senderId === loggedInUserId;
            const containerClass = isSentByCurrentUser
              ? "flex justify-end mb-2"
              : "flex justify-start mb-2";
            const bubbleClass = isSentByCurrentUser
              ? "bg-blue-500 text-white rounded-lg p-2"
              : "bg-gray-300 text-gray-900 rounded-lg p-2";

            const messageClass = isSentByCurrentUser
              ? "flex flex-col items-end"
              : "flex flex-col items-start";

            const fileType = message.attachment
              ? message.attachment.url.split(".").pop()
              : "";
            const fileTypeInfo = fileTypes.find(
              (type) => type.extension === fileType
            );

            return (
              <li key={index} className={containerClass}>
                <div className={messageClass}>
                  {/* Text Messages */}
                  {message.text && (
                    <div className={bubbleClass}>
                      <div className="message-data">{message.text}</div>
                      <span className="message-data-time">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  {/* Image attachments */}
                  {message.attachment && (
                    <div className="attachment">
                      <div className="attachment-preview flex justify-end">
                        {fileTypeInfo && fileTypeInfo.icon}
                      </div>
                      {isImageFile(message.attachment.url) ? (
                        <div className="image-preview mt-2">
                          <img
                            src={message.attachment.url}
                            alt="attachment"
                            className="max-w-xs rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="attachment-info flex flex-col mt-2">
                          <a
                            href={message.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {fileTypeInfo ? fileTypeInfo.title : "View File"}
                          </a>
                          <a
                            href={message.attachment.url}
                            download
                            className="flex items-center text-blue-500 hover:underline mt-1"
                          >
                            <IoMdDownload className="mr-1" />
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* File Previews */}
      {filePreview &&
        filePreview.map((previewUrl, index) => (
          <div
            key={index}
            className="space-x-4 mt-2 border border-black inline-block"
          >
            <img
              src={previewUrl}
              alt={`preview-${index}`}
              className="file-preview w-16 h-16 object-cover rounded"
            />
            {/* <span>{file[index].name}</span> */}
          </div>
        ))}

      {/* Chat input box */}
      <div className="chat-message clearfix p-4 border-t border-gray-200">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-4"
        >
          <input
            type="file"
            onChange={handleFileUpload}
            multiple
            className="hidden"
            id="fileInput"
          />
          <label htmlFor="fileInput">
            <MdAttachment className="text-2xl cursor-pointer" />
          </label>
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow border rounded-full px-4 py-2"
          />
          <button type="submit" className="text-2xl text-blue-500">
            <IoMdSend />
          </button>
        </form>
      </div>
    </div>
  );
}
