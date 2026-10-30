-- CreateEnum
CREATE TYPE "AutoReplyKind" AS ENUM ('WELCOME', 'DEFAULT_REPLY');

-- CreateTable
CREATE TABLE "AccountAutoReply" (
    "id" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "welcomeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "welcomeMessage" TEXT NOT NULL DEFAULT '',
    "defaultReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultReplyMessage" TEXT NOT NULL DEFAULT '',
    "defaultReplyCooldownHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountAutoReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoReplyLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT,
    "inboundMessageId" TEXT NOT NULL,
    "inboundText" TEXT NOT NULL,
    "kind" "AutoReplyKind" NOT NULL,
    "status" "DmStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "deliveryUnconfirmed" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoReplyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountAutoReply_instagramAccountId_key" ON "AccountAutoReply"("instagramAccountId");

-- CreateIndex
CREATE INDEX "AutoReplyLog_instagramAccountId_recipientId_createdAt_idx" ON "AutoReplyLog"("instagramAccountId", "recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "AutoReplyLog_workspaceId_createdAt_idx" ON "AutoReplyLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AutoReplyLog_instagramAccountId_inboundMessageId_key" ON "AutoReplyLog"("instagramAccountId", "inboundMessageId");

-- AddForeignKey
ALTER TABLE "AccountAutoReply" ADD CONSTRAINT "AccountAutoReply_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoReplyLog" ADD CONSTRAINT "AutoReplyLog_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

