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

    socket.on("message", async (message) => {
        // console.log("multiple message hijra", message)
        if (message.length > 1) {
            console.log("multiple message", message)
            const multipleAttachmentMsg = await createMultipleMessages(message)
            console.log("multipleAttachmentMsg", multipleAttachmentMsg)


        } else {
            try {
                console.log("message received into socket-->", message);
                if (message?.filetype) {
                    message = message[0]
                }
                const savedMessage = await createMessage({
                    text: message.text,
                    chatId: message.chatId,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    buffer: message.buffer,
                    filetype: message.filetype,
                    mime: message.attachmentUrl,
                });
                console.log("saved Message", savedMessage)

                const notification = await createNotification({
                    chatId: message.chatId,
                    messageId: savedMessage.id,
                });

                socket.broadcast.to(savedMessage.chatId).emit("message", savedMessage);

                io.to(savedMessage.receiverId).emit("notification", notification);
            } catch (error) {
                console.error("Failed to save & broadcast message:", error);
            }
        }
    });


    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});


console.log("Server is running on port 3000");
