const { Prisma, PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createNotification = async function (notificationCreate) {
  try {
    // console.log("koilaNotification", notificationCreate);
    const notification = await prisma.notification.create({
      data: notificationCreate,
      include: {
        chat: {
          include: {
           user1: true, 
           user2:true
          },
        },
        message: {
          include: {
           sender: true, 
           receiver:true
          },
        },
      },
    });
    return notification;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

exports.deleteNotification = async function (query) {
  try {

    const notification = await prisma.notification.deleteMany({
      where:{
      chatId:query
      }
    });
    return notification;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
