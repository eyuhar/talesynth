// Helper functions for character creation and initial setup

import { prisma } from "./prisma";

// INITIAL STATS

export function getInitialStats() {
  return {
    hp: 100,
    maxHp: 100,
  };
}

// STARTER LOADOUT

export interface StarterItem {
  type: string;
  name: string;
  description: string;
  stats: Record<string, number>;
  quantity: number;
  equipped: boolean;
}

export function getStarterItems(): StarterItem[] {
  return [
    {
      type: "weapon_1h_sword",
      name: "Rusty One-Handed Sword",
      description:
        "A worn blade, its edge dulled by years of use. Better than nothing.",
      stats: {
        minDmg: 3,
        maxDmg: 6,
        weight: 2500,
        value: 15,
      },
      quantity: 1,
      equipped: true,
    },
    {
      type: "armor_chest",
      name: "Torn Leather Vest",
      description:
        "Cracked leather armor that has seen better days. Offers minimal protection.",
      stats: {
        armor: 2,
        weight: 3000,
        value: 20,
      },
      quantity: 1,
      equipped: true,
    },
    {
      type: "consumable_food",
      name: "Stale Bread",
      description: "Hard, dry bread. It will keep you alive, barely.",
      stats: {
        healing: 10,
        weight: 200,
        value: 2,
      },
      quantity: 4,
      equipped: false,
    },
  ];
}

export interface StarterSkill {
  skillId: string;
  name: string;
  description: string;
  level: number;
  xp: number;
}

export function getStarterSkills(): StarterSkill[] {
  return [
    {
      skillId: "1h_sword",
      name: "One-Handed Swords",
      description: "Proficiency with single-handed bladed weapons",
      level: 1,
      xp: 0,
    },
    {
      skillId: "1h_axe",
      name: "One-Handed Axes",
      description: "Proficiency with single-handed axes",
      level: 1,
      xp: 0,
    },
    {
      skillId: "dodge",
      name: "Dodge",
      description: "Ability to evade attacks",
      level: 1,
      xp: 0,
    },
    {
      skillId: "parry",
      name: "Parry",
      description: "Ability to deflect attacks with weapon",
      level: 1,
      xp: 0,
    },
    {
      skillId: "diplomacy",
      name: "Diplomacy",
      description: "Art of negotiation and persuasion",
      level: 1,
      xp: 0,
    },
    {
      skillId: "barter",
      name: "Barter",
      description: "Skill in trading and haggling",
      level: 1,
      xp: 0,
    },
    {
      skillId: "survival",
      name: "Survival",
      description: "Knowledge of wilderness survival",
      level: 1,
      xp: 0,
    },
  ];
}

export function getStarterCurrency() {
  return {
    goldCoins: 0,
    silverCoins: 4,
    copperCoins: 5,
  };
}

// CHARACTER CREATION

export async function createCharacterWithLoadout(
  userId: string,
  name: string,
  gender: string
) {
  // Create character
  const character = await prisma.character.create({
    data: {
      name,
      gender,
      currentStats: getInitialStats(),
      ...getStarterCurrency(),
    },
  });

  // Create starter items
  const starterItems = getStarterItems();
  await prisma.characterItem.createMany({
    data: starterItems.map((item) => ({
      characterId: character.id,
      type: item.type,
      name: item.name,
      description: item.description,
      stats: item.stats,
      quantity: item.quantity,
      equipped: item.equipped,
    })),
  });

  // Create starter skills
  const starterSkills = getStarterSkills();
  await prisma.characterSkill.createMany({
    data: starterSkills.map((skill) => ({
      characterId: character.id,
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      level: skill.level,
      xp: skill.xp,
    })),
  });

  return character;
}

// INITIAL STORY PROMPT

export function getInitialStoryPrompt(characterName: string, gender: string) {
  const pronoun =
    gender === "male" ? "he" : gender === "female" ? "she" : "they";
  const possessive =
    gender === "male" ? "his" : gender === "female" ? "her" : "their";

  return `The player character ${characterName} is a wandering sellsword. ${
    pronoun.charAt(0).toUpperCase() + pronoun.slice(1)
  } has just arrived at a war-torn village at dusk after days of travel. Smoke rises from burned buildings in the distance. The village seems mostly intact but shows clear signs of recent conflict. ${
    pronoun.charAt(0).toUpperCase() + pronoun.slice(1)
  } stands at the village entrance, weighing ${possessive} options. Begin the story here.`;
}
