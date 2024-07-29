const {getAllAttachments} = require("./actions/attachment");
const {createMessage, createMultipleMessages} = require("./actions/message");
const {createNotification} = require("./actions/notification");

const io = require("socket.io")(3000, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});

// async function testFunction(){
//   const k = await getAllAttachments("clygzx7p10001pa9k4qiwj21w");
// console.log(k)
// }
// testFunction()

io.on("connection", (socket) => {
    console.log("Socket connected --> id : ", socket.id);

    // When a user connects, join a unique room based on their user ID
    socket.on("register", (userId) => {
        socket.join(userId);
        console.log(
            `User registered with ID: ${userId} and joined room: ${userId}`
        );
    });

    socket.on("joinRoom", (roomName) => {
        socket.join(roomName);
        console.log(`User joined room: ${roomName}`);
    });

    socket.on("message", async (messages) => {
        try {
            if (!Array.isArray(messages)) {
                messages = [messages];
            }

            console.log("messages received into socket-->", messages);

            if (messages.length > 1) {
                const multipleAttachmentMsg = await createMultipleMessages(messages);
                // console.log("multipleAttachmentMsg", multipleAttachmentMsg);
                let multipleSavedMessage = {
                    chatId: multipleAttachmentMsg.message.chatId,
                    messageId: multipleAttachmentMsg.message.id,
                };
                const notification = await createNotification(multipleSavedMessage);
                console.log("mulsic", multipleSavedMessage);
                socket.broadcast.to(multipleSavedMessage.chatId).emit("message", multipleAttachmentMsg);

                io.to(multipleAttachmentMsg.message.receiverId)
                    .emit("notification", notification);

                io.to(multipleAttachmentMsg.message.senderId)
                    .emit("messageSent", "Messages sent successfully");

            } else {
                const message = messages[0];
                const savedMessage = await createMessage({
                    text: message.text,
                    chatId: message.chatId,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    buffer: message.buffer,
                    filetype: message.filetype,
                    mime: message.attachmentUrl,
                });

                console.log("saved Message", savedMessage);

                const notification = await createNotification({
                    chatId: message.chatId,
                    messageId: savedMessage.id,
                });

                socket.broadcast.to(savedMessage.chatId).emit("message", savedMessage);

                io.to(savedMessage.receiverId).emit("notification", notification);

                io.to(savedMessage.senderId).emit('messageSent', "Message sent successfully")
            }
        } catch (error) {
            console.error("Failed to save & broadcast message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

console.log("Server is running on port 3000");

console.log("Server is running on port 3000");
