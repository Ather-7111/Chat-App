"use server";
import {connect} from "../db";

export async function getAllMessages(userId, otherUserId, chatId, loadIndex) {
    try {
        console.log("hijra", userId, otherUserId, chatId, loadIndex);
        let prisma = await connect();
        const allMessagesLength = await prisma.message.count();

        console.log("hijra6", allMessagesLength - (15 * loadIndex) < 0);
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
            skip: (allMessagesLength - (15 * loadIndex) < 0) ? 0 : allMessagesLength - (15 * loadIndex),
            take:(allMessagesLength - (15 * loadIndex) < 0) ? ((allMessagesLength - (15 * loadIndex))+15)  : 15,
            // limit:15,
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
        console.log("sigma-hijra", messages.length)
        messages.forEach((e) => {
            delete e.attachementUrl
        })
        return messages.map((msg) => ({
            ...msg,
            from: msg.senderId,
            to: msg.receiverId,
            allMessagesLength: allMessagesLength
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
