"use server";
import { connect } from "../db";

export async function getAllAttachmentsUsingMsgIds(messageIds) {
  try {
    // console.log("msg array:", messageIds);
    let prisma = await connect();
    const attachments = await prisma.attachment.findMany({
      where: {
        message: { id: { in: messageIds } },
      },
      include: {
        message: true,
        chat: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    // console.log("sigma,bhola", attachments, messageIds);
    return attachments;
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
