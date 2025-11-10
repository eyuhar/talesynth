-- AlterTable
ALTER TABLE "story_states" ADD COLUMN     "schemaVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "baseStats" JSONB,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "baseValue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_inventories" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "durability" INTEGER,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "instanceMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "primaryStat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_skills" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_logs" (
    "id" UUID NOT NULL,
    "characterId" UUID,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npc_templates" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npc_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_key_key" ON "items"("key");

-- CreateIndex
CREATE INDEX "character_inventories_characterId_idx" ON "character_inventories"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_key_key" ON "skills"("key");

-- CreateIndex
CREATE INDEX "character_skills_characterId_idx" ON "character_skills"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "character_skills_characterId_skillId_key" ON "character_skills"("characterId", "skillId");

-- CreateIndex
CREATE INDEX "action_logs_characterId_idx" ON "action_logs"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "npc_templates_key_key" ON "npc_templates"("key");

-- AddForeignKey
ALTER TABLE "character_inventories" ADD CONSTRAINT "character_inventories_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventories" ADD CONSTRAINT "character_inventories_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
