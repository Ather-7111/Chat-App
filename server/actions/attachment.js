const { Prisma, PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllAttachments = async function (query) {
  try {
    const attachment = await prisma.attachment.findMany({
      where: {
        messageId: query,
        // message: { receiver: { id: query } },
      },
      include: {
        message:true ,
        chat: true,
      },
    });
    return attachment;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
