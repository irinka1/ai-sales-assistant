-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_PROGRESS', 'WAITING_DECISION', 'DEAL_CLOSED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "telegramId" TEXT,
    "message" TEXT NOT NULL,
    "service" TEXT,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "aiScore" INTEGER,
    "aiSummary" TEXT,
    "aiRecommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
