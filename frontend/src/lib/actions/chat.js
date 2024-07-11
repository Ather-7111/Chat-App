"use server";
import { connect } from "../db";

export async function createChat(chatCreate) {
  try {
    let prisma = await connect();
    console.log("Creating chat  :", chatCreate);

    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          {
            AND: [
              { user1ID: chatCreate.user1ID },
              { user2ID: chatCreate.user2ID },
            ],
          },
          {
            AND: [
              { user1ID: chatCreate.user2ID },
              { user2ID: chatCreate.user1ID },
            ],
          },
        ],
      },
    });

    if (!existingChat) {
      const chat = await prisma.chat.create({
        data: chatCreate,
        include: {
          user1: true,
          user2: true,
        },
      });
      return chat;
    } else {
      return existingChat;
    }
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

export async function getChat(senderId, receiverId) {
  try {
    let prisma = await connect();
    const chat = await prisma.chat.findFirst({
      where: {
        OR: [
          {
            AND: [{ user1ID: senderId }, { user2ID: receiverId }],
          },
          {
            AND: [{ user1ID: receiverId }, { user2ID: senderId }],
          },
        ],
      },
    });
    return chat;
  } catch (error) {
    console.error("Error fetching chat:", error);
    throw error;
  }
}
