-- AlterTable
ALTER TABLE "UserList" ADD COLUMN "email" TEXT;
ALTER TABLE "UserList" ADD COLUMN "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserList_email_key" ON "UserList"("email");
