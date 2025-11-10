/*
  Warnings:

  - You are about to drop the column `stats` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the `story_states` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `currentStats` to the `characters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `characters` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_user_id_fkey";

-- DropForeignKey
ALTER TABLE "story_states" DROP CONSTRAINT "story_states_character_id_fkey";

-- DropIndex
DROP INDEX "characters_user_id_idx";

-- AlterTable
ALTER TABLE "characters" DROP COLUMN "stats",
DROP COLUMN "user_id",
ADD COLUMN     "copperCoins" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "currentStats" JSONB NOT NULL,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "goldCoins" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "silverCoins" SMALLINT NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "story_states";

-- CreateTable
CREATE TABLE "stories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "progress" JSONB,
    "lastResponse" JSONB,
    "summary" JSONB,
    "character_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_items" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stats" JSONB NOT NULL,
    "quantity" SMALLINT NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_skills" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "skill_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" SMALLINT NOT NULL DEFAULT 1,
    "xp" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stories_character_id_key" ON "stories"("character_id");

-- CreateIndex
CREATE INDEX "stories_user_id_idx" ON "stories"("user_id");

-- CreateIndex
CREATE INDEX "character_items_character_id_idx" ON "character_items"("character_id");

-- CreateIndex
CREATE INDEX "character_items_type_idx" ON "character_items"("type");

-- CreateIndex
CREATE INDEX "character_skills_character_id_idx" ON "character_skills"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "character_skills_character_id_skill_id_key" ON "character_skills"("character_id", "skill_id");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_items" ADD CONSTRAINT "character_items_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
