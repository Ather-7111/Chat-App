"use server";
import {connect} from "../db";

export async function getAllMessages(userId, otherUserId, chatId, loadIndex) {
    try {

        let prisma = await connect();
        let allMessagesLength = await prisma.message.findMany({where:{chatId:chatId}});
        allMessagesLength=allMessagesLength.length;
        console.log("loadIndex", loadIndex,"allMessagesLength",allMessagesLength);

        const skipExpression = allMessagesLength - (15 * loadIndex);
        const skipValue = (skipExpression < 0) ? 0 : skipExpression;
        let takeValue = (skipExpression < 0) ? (skipExpression + 15) : 15
        console.log("skip-->", skipValue,"take-->:",takeValue);
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
        console.log("displayedMessagesLength-->", messages.length)
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
