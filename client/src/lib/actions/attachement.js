"use server";
import { connect } from "../db";

export async function getAllAttachmentsUsingMsgArray(messageArray) {
  try {
    console.log("msg array:", messageArray);
    let prisma = await connect();
    const attachments = await prisma.attachment.findMany({
      where: {
        message: { id: 
            { in: 
                [...messageArray]
             } 
            },
      },
      include: {
        message: true,
        chat: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    console.log(
     "sigma,bhola", attachments,messageArray
    );
    return attachments
    // messages.map((msg) => ({
    //   ...msg,
    //   from: msg.senderId,
    //   to: msg.receiverId,
    // })
// );
  } catch (error) {
    console.log(error);
    throw error;
  }
}
