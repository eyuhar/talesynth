/*
  Warnings:

  - You are about to drop the column `schemaVersion` on the `story_states` table. All the data in the column will be lost.
  - You are about to drop the `action_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `character_inventories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `character_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `npc_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skills` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "character_inventories" DROP CONSTRAINT "character_inventories_characterId_fkey";

-- DropForeignKey
ALTER TABLE "character_inventories" DROP CONSTRAINT "character_inventories_itemId_fkey";

-- DropForeignKey
ALTER TABLE "character_skills" DROP CONSTRAINT "character_skills_characterId_fkey";

-- DropForeignKey
ALTER TABLE "character_skills" DROP CONSTRAINT "character_skills_skillId_fkey";

-- AlterTable
ALTER TABLE "story_states" DROP COLUMN "schemaVersion";

-- DropTable
DROP TABLE "action_logs";

-- DropTable
DROP TABLE "character_inventories";

-- DropTable
DROP TABLE "character_skills";

-- DropTable
DROP TABLE "items";

-- DropTable
DROP TABLE "npc_templates";

-- DropTable
DROP TABLE "skills";
