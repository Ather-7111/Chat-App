/*
  Warnings:

  - Added the required column `user2ID` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "user2ID" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_user2ID_fkey" FOREIGN KEY ("user2ID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
