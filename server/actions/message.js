const {Prisma, PrismaClient} = require("@prisma/client");
const {getAllAttachments} = require("./attachment");
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

function getformat(fileType) {
    let object = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "application/pdf": "pdf",
        "video/mp4": "mp4",
        "application/vnd.ms-powerpoint": "ppt",
        "text/plain": "txt",
        "application/vnd.openxmlformats": "docx",
        "application/vnd.ms-excel": "xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "application/x-zip-compressed": "zip",
        "": "data:application/octet-stream",
    };
    return object[fileType];
}

exports.createMessage = async function (messageCreate) {
    try {
        // console.log("hi", messageCreate);
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

        // let resourceType;
        // let format;
        // switch (filetype) {
        //   // case "application/pdf":
        //   //   resourceType = "auto";
        //   //   format = "pdf";
        //   //   break;
        //   case "application/vnd.ms-powerpoint":
        //     // resourceType = "auto";
        //     format = "ppt";
        //     break;
        //   case "text/plain":
        //     // resourceType = "auto";
        //     format = "txt";
        //     break;
        //   // ... more cases
        //   default:
        //     resourceType = "auto";
        //     format = null;
        // }

        // const dataURI = bufferToDataURI(buffer, filetype);
        if (mime) {
            // console.log("sigma", resourceType, filetype);

            const uploadResult = await cloudinary.uploader.upload(mime, {
                format: getformat(filetype),
                resource_type: "auto",
            });

            console.log("sigma", uploadResult);
            const attachment = await prisma.attachment.create({
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
            // const attachments=await getAllAttachments(message.id)

            return {
                ...message,
                // attachmentUrl: mime ? Attachment.url : null,
                attachment,
            };
        }
        // Include the Attachment URL in the returned message
        else {
            return {
                ...message,
            };
        }
    } catch (error) {
        console.log("cloudinary uploading :", error);
        throw error;
    }
};

exports.createMultipleMessages = async function (messageCreate) {
    try {
        let returnedMessages = []
        // console.log("hi", messageCreate);
        for (let i in messageCreate) {
            // const buffer = messageCreate[i].buffer;

            const filetype = messageCreate[i].filetype;
            const mime = messageCreate[i].attachmentUrl;
            // delete messageCreate[i].buffer;
            delete messageCreate[i].filetype;
            delete messageCreate[i].attachmentUrl;
            const message = await prisma.message.create({
                data: messageCreate[i],
                include: {
                    sender: true,
                    conversation: true,
                    receiver: true,
                },
            });


            // let resourceType;
            // let format;
            // switch (filetype) {
            //   // case "application/pdf":
            //   //   resourceType = "auto";
            //   //   format = "pdf";
            //   //   break;
            //   case "application/vnd.ms-powerpoint":
            //     // resourceType = "auto";
            //     format = "ppt";
            //     break;
            //   case "text/plain":
            //     // resourceType = "auto";
            //     format = "txt";
            //     break;
            //   // ... more cases
            //   default:
            //     resourceType = "auto";
            //     format = null;
            // }

            // const dataURI = bufferToDataURI(buffer, filetype);
            // if (mime) {
            // console.log("sigma", resourceType, filetype);

            const uploadResult = await cloudinary.uploader.upload(mime, {
                format: getformat(filetype),
                resource_type: "auto",
            });

            console.log("sigma", uploadResult);
            const attachment = await prisma.attachment.create({
                data: {
                    url: uploadResult.secure_url,
                    messageId: message.id,
                    chatId: messageCreate[i].chatId,
                },
                include: {
                    message: true,
                    chat: true,
                },
            });
            returnedMessages.push({message: message, attachment: attachment});
            // const attachments=await getAllAttachments(message.id)
        }
        return {
            returnedMessages
            // ...message,
            // // attachmentUrl: mime ? Attachment.url : null,
            // attachment,
        };
        // }
        // Include the Attachment URL in the returned message

    } catch (error) {
        console.log("cloudinary uploading :", error);
        throw error;
    }
};
