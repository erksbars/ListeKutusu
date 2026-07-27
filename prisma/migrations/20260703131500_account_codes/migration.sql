-- AlterTable
ALTER TABLE "UserList" ADD COLUMN "adminCode" TEXT;
ALTER TABLE "UserList" ADD COLUMN "submitCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserList_adminCode_key" ON "UserList"("adminCode");
CREATE UNIQUE INDEX "UserList_submitCode_key" ON "UserList"("submitCode");
