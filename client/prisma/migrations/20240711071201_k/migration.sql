-- AlterTable
ALTER TABLE "Attachment" RENAME CONSTRAINT "Attachement_pkey" TO "Attachment_pkey";

-- RenameForeignKey
ALTER TABLE "Attachment" RENAME CONSTRAINT "Attachement_chatId_fkey" TO "Attachment_chatId_fkey";

-- RenameForeignKey
ALTER TABLE "Attachment" RENAME CONSTRAINT "Attachement_messageId_fkey" TO "Attachment_messageId_fkey";
