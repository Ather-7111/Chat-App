"use server";
import {connect} from "../db";

export async function getAllMessages(userId, otherUserId, chatId, loadIndex) {
    try {
        console.log("loadIndex", loadIndex);
        let prisma = await connect();
        const allMessagesLength = await prisma.message.count();

        console.log("skip-->", allMessagesLength - (15 * loadIndex));
        const skipExpression = allMessagesLength - (15 * loadIndex);
        const skipValue = (skipExpression < 0) ? 0 : skipExpression;
        let takeValue = ((skipExpression < 0) ? (skipExpression + 15) : 15)
        let maxLoadIndex = (Math.round(allMessagesLength / 15)) + 1
        if (loadIndex > maxLoadIndex) {
            takeValue = 0
        }
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
            skip: skipValue,
            take: takeValue,
            // limit:15,                  || skipExpression <-15 ? 0 :15
            include: {
                sender: true,
                receiver: true,
            },
            // orderBy: {
            //     createdAt: "asc",
            // },
        });
        // console.log(messages.map((msg) => ({
        //   ...msg,
        //   from: msg.senderId,
        //   to: msg.receiverId,
        // })))
        console.log("sigma-bhola", messages)
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
