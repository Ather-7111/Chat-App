// const { Prisma, PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// exports.createChat = async function (senderId,receiverId) {
//   try {
//     // console.log("koila", chatCreate);
//     const chat = await prisma.chat.findFirst({
//       where:{
//        user1ID:senderId,
//        user2ID:receiverId
//       }
//     });
//     return chat;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// };
