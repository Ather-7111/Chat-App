"use server";
import { connect } from "../db";

export async function deletenotifications(query) {
  try {
    let prisma = await connect();
    console.log( prisma.notification);
    // console.log("p",p)
    const deleted = await prisma.notification.deleteMany({
      where: {
        chatId: query,
      },
    });
    console.log("hijra", deleted);
    return deleted;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
