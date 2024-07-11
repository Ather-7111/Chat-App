// const { createServer } = require("http");
// const next = require("next");
// const { Server } = require("socket.io");

// const dev = process.env.NODE_ENV !== "production";
// const hostname = "localhost";
// const port = 3000;
// const app = next({ dev, hostname, port });
// const handler = app.getRequestHandler();

// app.prepare().then(() => {
//     const httpServer = createServer(handler);

//     const io = new Server(httpServer, {
//         cors: {
//             origin: "*",
//             methods: ["GET", "POST"]
//         }
//     });

//     io.on("connection", (socket) => {
//         console.log("User connected, id:", socket.id);

//         // Join a room
//         socket.on("joinRoom", (roomName) => {
//             socket.join(roomName);
//             console.log(`User ${socket.id} joined room: ${roomName}`);
//         });

//         // Receive and broadcast messages
//         socket.on("message", (message, roomName, id) => {
//             console.log("message", message);
//             if (roomName && roomName.length > 0) {
//                 console.log(`Message received from   ${message.id}: ${message.message} in room: ${roomName}`);
//                 io.to(roomName).emit("message", {message:message.message,id:socket.id});
//             } else {
//                 console.log(`Message received from ${message.id}: ${message.message}`);
//                 io.emit("message",  {message:message.message,id:socket.id});
//             }
//         });



//         // Handle disconnect
//         socket.on("disconnect", () => {
//             console.log("User disconnected", socket.id);
//         });
//     });

//     httpServer.once("error", (err) => {
//         console.error(err);
//         process.exit(1);
//     }).listen(port, () => {
//         console.log(`> Ready on http://${hostname}:${port}`);
//     });
// });
