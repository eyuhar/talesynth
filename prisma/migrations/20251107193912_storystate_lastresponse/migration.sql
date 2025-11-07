/*
  Warnings:

  - The `last_response` column on the `story_states` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summary` column on the `story_states` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "story_states" DROP COLUMN "last_response",
ADD COLUMN     "last_response" JSONB,
DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB;
