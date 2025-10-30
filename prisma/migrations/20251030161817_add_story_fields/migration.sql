/*
  Warnings:

  - You are about to drop the column `storyState` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "storyState";

-- CreateTable
CREATE TABLE "StoryState" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "progress" JSONB,
    "lastResponse" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryState_characterId_key" ON "StoryState"("characterId");

-- AddForeignKey
ALTER TABLE "StoryState" ADD CONSTRAINT "StoryState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
