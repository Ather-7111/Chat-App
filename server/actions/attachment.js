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

exports.createAttachments = async function (attachmentArray) {
  try {
    const attachments = await prisma.attachment.createMany({
      data:attachmentArray,
      include: {
        message: true,
        chat: true,
      },
    });
    return attachments;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

exports.getAttachment = async function (query) {
  try {
    const attachment = await prisma.attachment.findFirst({
      where: {
        messageId: query,
        // message: { receiver: { id: query } },
      },
      include: {
        message: true,
        chat: true,
      },
    });
    return attachment;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

