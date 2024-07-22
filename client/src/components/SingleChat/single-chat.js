import { useEffect, useRef, useState } from "react";
import { getAllMessages } from "@/lib/actions/message";
import { IoMdSend, IoMdDownload } from "react-icons/io";
import { MdAttachment } from "react-icons/md";
import { getChat } from "@/lib/actions/chat";
import { FaFilePdf, FaFilePowerpoint, FaFileWord } from "react-icons/fa";
import {
  getAllAttachmentsUsingMsgArray,
  getAllAttachmentsUsingMsgId,
} from "@/lib/actions/attachement";

export default function SingleChatPage({ selectedUser, chat, socket }) {
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

          for (let i in message.attachments) {
            let msg = {
              chatId: message.message.chatId,
              senderId: loggedInUserId,
              receiverId: selectedUser.id,
            };
            msg.attachmentUrl = message.attachments[i];
            setInbox((prevInbox) => [...prevInbox, msg]);
          }
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
      const attachments = await getAllAttachmentsUsingMsgArray(messageIds);
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

    if (!message.trim() && (!file || file.length === 0)) {
      return;
    }

    const newMessages = [];

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
          setInbox((prevInbox) => [...prevInbox, newMessage]); // Update inbox state with new message
        } catch (error) {
          console.error("Error reading file:", error);
        }
      }
      setMessage("");
      setFile(null);
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
              <li className={containerClass} key={index}>
                <div className={messageClass}>
                  {/* For text */}
                  {message.text && (
                    <div className={bubbleClass}>
                      <div className="message-data">
                        <span className="message-data-time">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      {message.text}
                    </div>
                  )}

                  {/* For images attachments */}
                  {message?.attachments &&
                    message?.attachments.length >= 1 && (
                      <div className="flex flex-wrap justify-start">
                        {message.attachments.map((attachment) => {
                          console.log("attachment:", attachment);
                          console.log("attachment.url:", attachment.url);
                          console.log(
                            "attachment.attachmentUrl:",
                            attachment.attachmentUrl
                          );
                          return (
                            <div
                              key={attachment?.url}
                              className="attachment mb-7"
                            >
                              {isImageFile(
                                attachment?.url || attachment?.attachmentUrl
                              ) ? (
                                <img
                                  src={
                                    attachment?.url || attachment?.attachmentUrl
                                  }
                                  alt="attachment"
                                  className="max-w-xs rounded-lg"
                                />
                              ) : (
                                <div>
                                  <img
                                    src={
                                      attachment?.url ||
                                      attachment?.attachmentUrl
                                    }
                                    alt="attachment"
                                    className="max-w-xs rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/*/!* For file attachments *!/*/}

                  {/* {message?.attachments &&
                    message?.attachments?.length >= 1 &&
                    message?.attachments.map((attachment) => (
                      <div key={attachment.url} className="attachment-info">
                        {!isImageFile(attachment?.url) ? (
                          fileTypes.map((fileType) => {
                            const isSender =
                              message.senderId === loggedInUserId;

                            const attachmentUrl = isSender
                              ? attachment.url || attachment.attachmentUrl
                              : attachment.url;

                            const isMatchingType =
                              attachmentUrl?.endsWith(
                                `.${fileType.extension}`
                              ) ||
                              attachmentUrl?.startsWith(
                                `data:${fileType.filetype}`
                              );

                            if (isMatchingType) {
                              const {
                                background,
                                extension,
                                title,
                                icon,
                              } = fileType;

                              return (
                                <div key={extension} className="flex flex-col">
                                  <div
                                    className="attachment-thumbnail"
                                    style={{
                                      backgroundImage: `url(${background})`,
                                      backgroundSize: "cover",
                                      width: "350px",
                                      height: "200px",
                                      borderRadius: "8px",
                                      backgroundColor: "#f8f9fa",
                                    }}
                                  ></div>
                                  <div className="flex justify-between shadow-lg shadow-slate-300 py-5 px-2 rounded-b-xl">
                                    <div>{icon}</div>
                                    <p className="text-black hover:underline mt-2">
                                      {title || "View File"}
                                    </p>
                                    <a
                                      href={
                                        attachment?.attachmentUrl
                                          ? attachment?.attachmentUrl
                                          : attachment?.url
                                      }
                                      target="_blank"
                                      download
                                      className="flex items-center text-black hover:underline mt-1"
                                    >
                                      <IoMdDownload className="mr-1" />
                                    </a>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })
                        ) : (
                          <img
                            src={attachment?.url}
                            alt="Image attachment"
                            className="attachment-thumbnail"
                            style={{
                              width: "350px",
                              height: "200px",
                              borderRadius: "8px",
                              backgroundColor: "#f8f9fa",
                            }}
                          />
                        )}
                      </div>
                    ))} */}

                  {/* {message?.attachment?.url || message?.attachmentUrl ? (
                    // && (!isImageFile(message?.attachment?.url || message?.attachmentUrl) )
                    <div className="attachment-info flex flex-col mt-2">
                      {fileTypes.map((fileType) => {
                        const isSender = message.senderId === loggedInUserId;

                        const attachmentUrl = isSender
                          ? message?.attachment?.url || message?.attachmentUrl
                          : message?.attachment?.url;

                        // console.log("attachment URL -->", attachmentUrl);

                        const isMatchingType =
                          attachmentUrl?.endsWith(`.${fileType.extension}`) ||
                          attachmentUrl?.startsWith(
                            `data:${fileType.filetype}`
                          );

                        if (isMatchingType) {
                          const { background, extension, title, icon } =
                            fileType;

                          return (
                            <div key={extension} className="flex flex-col">
                              <div
                                className="attachment-thumbnail"
                                style={{
                                  backgroundImage: `url(${background})`,
                                  backgroundSize: "cover",
                                  width: "350px",
                                  height: "200px",
                                  borderRadius: "8px",
                                  backgroundColor: "#f8f9fa",
                                }}
                              ></div>
                              <div className="flex justify-between shadow-lg shadow-slate-300 py-5 px-2 rounded-b-xl">
                                <div>{icon}</div>
                                <p className="text-black hover:underline mt-2">
                                  {title || "View File"}
                                </p>
                                <a
                                  href={
                                    message?.attachmentUrl
                                      ? message?.attachmentUrl
                                      : message?.attachment?.url
                                  }
                                  target="_blank"
                                  download
                                  className="flex items-center text-black hover:underline mt-1"
                                >
                                  <IoMdDownload className="mr-1" />
                                </a>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : null} */}

                  <small className="flex justify-end mt-3">
                    {formatDate(message.createdAt)}
                  </small>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* For images preview before sending */}
      {filePreview && (
        <div className="p-4 flex">
          {filePreview.map((preview, index) => (
            <img
              key={index}
              src={preview}
              alt="preview"
              className="w-20 h-20 object-cover mr-4"
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
