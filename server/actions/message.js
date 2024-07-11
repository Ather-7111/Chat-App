const { Prisma, PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "delzdxubm",
  api_key: "771725587863239",
  api_secret: "VulEUB0_05cxUW1BXUPK7sfDk8c",
});

const bufferToDataURI = (buffer, filetype) => {
  console.log("Filetype", filetype);
  // const mimeType = "image/jpeg";
  //|| "image/png" || "application/pdf" || "video/mp4";
  const base64 = buffer.toString("base64");
  return `data:${filetype};base64,${base64}`;
};

exports.createMessage = async function (messageCreate) {
  try {
    console.log("hi", messageCreate);
    const buffer = messageCreate.buffer;
    const filetype = messageCreate.filetype;
    const mime = messageCreate.mime;
    delete messageCreate.buffer;
    delete messageCreate.filetype;
    delete messageCreate.mime;
    const message = await prisma.message.create({
      data: messageCreate,
      include: {
        sender: true,
        conversation: true,
        receiver: true,
      },
    });

    let resourceType;
    let format;
    switch (filetype) {
      case "application/pdf":
        resourceType = "auto";
        format = "pdf";
        break;
      case "application/vnd.ms-powerpoint":
        resourceType = "auto";
        format = "ppt";
        break;
      // ... more cases
      default:
        resourceType = "auto";
        format = "jpeg" || "png";
    }
    // const dataURI = bufferToDataURI(buffer, filetype);
    if (mime) {
      console.log("sigma", resourceType, filetype);

      const uploadResult = await cloudinary.uploader.upload(mime, {
        format:format,
        resource_type:"raw"
        

      });
      console.log("sigma", uploadResult);
      const Attachment = await prisma.attachment.create({
        data: {
          url: uploadResult.secure_url,
          messageId: message.id,
          chatId: messageCreate.chatId,
        },
        include: {
          message: true,
          chat: true,
        },
      });
      const messageUpdate = await prisma.message.update({
        where: {
          id: message.id,
        },
        data: { attachmentUrl: uploadResult.secure_url },
        include: {
          sender: true,
          conversation: true,
          receiver: true,
        },
      });

      return {
        ...message,
        attachmentUrl: mime ? Attachment.url : null,
      };
    }
    // Include the Attachment URL in the returned message
    else {
      return {
        ...message,
        attachmentUrl: mime ? Attachment.url : null,
      };
    }
  } catch (error) {
    console.log("cloudinary uploading :", error);
    throw error;
  }
};
