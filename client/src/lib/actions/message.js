"use server";
import { connect } from "../db";

export async function getAllMessages(userId, otherUserId, chatId) {
  try {
    // console.log("Fetching messages", { userId, otherUserId, chatId });
    let prisma = await connect();
    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId,
        OR: [
          {
            senderId: userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: userId,
          },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    // console.log(messages.map((msg) => ({
    //   ...msg,
    //   from: msg.senderId,
    //   to: msg.receiverId,
    // })))
    return messages.map((msg) => ({
      ...msg,
      from: msg.senderId,
      to: msg.receiverId,
    }));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// export async function handleFile(imageBuffer) {
//   try {
//     console.log("buffer",imageBuffer)
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }
