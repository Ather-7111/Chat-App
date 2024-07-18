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
          {inbox.map((msg, index) => (
            <li
              className={`clearfix list-none ${
                msg.senderId === loggedInUserId ? "flex justify-end" : ""
              }`}
              key={index}
            >
              <div
                className={`rounded border p-2 inline-block ${
                  msg.senderId === loggedInUserId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {/* For text */}
                {msg.text && <p>{msg.text}</p>}

                {/* For images attachments */}
                {(msg?.attachmentUrl || msg?.attachment) && (
                  <div>
                    {msg?.attachmentUrl ? (
                      <img
                        src={
                          msg?.attachmentUrl?.startsWith(`data:${msg.filetype}`)
                            ? msg.attachmentUrl
                            : msg.attachment.url
                        }
                        alt="attachment"
                        className="w-40 h-40"
                      />
                    ) : (
                      <div className="grid grid-cols-2">
                        {
                          <img
                            src={msg?.attachment ? msg.attachment.url : null}
                            alt="attachment"
                            className="w-40 h-40"
                          />
                        }
                      </div>
                    )}
                  </div>
                )}

                {/*/!* For file attachments *!/*/}

                {(msg?.attachment?.url || msg?.attachmentUrl) && (
                  <div>
                    {msg?.attachmentUrl ? (
                      // sender node
                      <div>
                        {fileTypes.find((fileType) =>
                          msg?.attachmentUrl.startsWith(`data:${msg.filetype}`)
                        ) && (
                          <div>
                            <div
                              className="w-full h-36 bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${
                                  fileTypes.find((fileType) =>
                                    msg?.attachmentUrl.startsWith(
                                      `data:${msg.filetype}`
                                    )
                                  ).background
                                })`,
                              }}
                            ></div>
                            <div className="flex justify-between items-center px-3 py-2">
                              {
                                fileTypes.find((fileType) =>
                                  msg?.attachmentUrl.startsWith(
                                    `data:${msg.filetype}`
                                  )
                                ).icon
                              }
                              <h3 className="text-sm">
                                {
                                  fileTypes.find((fileType) =>
                                    msg?.attachmentUrl.startsWith(
                                      `data:${msg.filetype}`
                                    )
                                  ).title
                                }
                              </h3>
                              <a
                                href={
                                  msg?.attachmentUrl
                                    ? msg?.attachmentUrl
                                    : msg.attachment.url
                                }
                                target="_blank"
                                download
                              >
                                <IoMdDownload className="text-xl" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // receiver node
                      <div>
                        {fileTypes.find((fileType) =>
                          msg.attachment?.url?.endsWith(
                            `.${fileType.extension}`
                          )
                        ) && (
                          <div>
                            <div
                              className="w-full h-36 bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${
                                  fileTypes.find((fileType) =>
                                    msg.attachment.url.endsWith(
                                      `.${fileType.extension}`
                                    )
                                  ).background
                                })`,
                              }}
                            ></div>
                            <div className="flex justify-between items-center px-3 py-2">
                              {
                                fileTypes.find((fileType) =>
                                  msg.attachment.url.endsWith(
                                    `.${fileType.extension}`
                                  )
                                ).icon
                              }
                              <h3 className="text-sm">
                                {
                                  fileTypes.find((fileType) =>
                                    msg.attachment.url.endsWith(
                                      `.${fileType.extension}`
                                    )
                                  ).title
                                }
                              </h3>
                              <a
                                href={msg.attachment.url}
                                target="_blank"
                                download
                              >
                                <IoMdDownload className="text-xl" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* {(msg?.attachment?.url || msg?.attachmentUrl) && (
                    <div className="mt-2 w-64">
                      {(fileTypes.find((fileType) =>
                        msg.attachment?.url?.endsWith(`.${fileType.extension}`)
                      ) ||
                        fileTypes.find((fileType) =>
                          msg.attachmentUrl?.startsWith(
                            `data:${fileType.filetype}`
                          )
                        )) && (
                        <div>
                          <div
                            className="w-full h-36 bg-cover bg-center"
                            style={{
                              backgroundImage:
                                `url(${
                                  fileTypes.find((fileType) =>
                                    msg.attachment?.url.endsWith(
                                      `.${fileType.extension}`
                                    )    
                                  )?.background
                                })` ||
                                `url(${
                                  fileTypes.find((fileType) =>
                                    msg.attachmentUrl?.startsWith(
                                      `data:${fileType.filetype}`
                                    )
                                  )?.background
                                })`,
                            }}
                          ></div>
                          <div className="flex justify-between items-center px-3 py-2">
                            {
                              fileTypes.find((fileType) =>
                                msg.attachment.url.endsWith(
                                  `.${fileType.extension}`
                                )
                              ).icon
                            }
                            <h3 className="text-sm">
                              {
                                fileTypes.find((fileType) =>
                                  msg.attachment.url.endsWith(
                                    `.${fileType.extension}`
                                  )
                                ).title
                              }
                            </h3>
                            <a
                              href={msg.attachment.url}
                              target="_blank"
                              download
                            >
                              <IoMdDownload className="text-xl" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )} */}

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
