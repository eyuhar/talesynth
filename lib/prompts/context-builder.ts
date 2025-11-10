import { BASE_PROMPT } from "./base-prompt";
import {
  ITEM_TYPES_PROMPT,
  SKILLS_PROMPT,
  COMBAT_PROMPT,
} from "./item-combat-prompt";
import { OUTPUT_FORMAT_PROMPT } from "./output-format-prompt";

export function buildSystemPrompt(): string {
  return [
    BASE_PROMPT,
    ITEM_TYPES_PROMPT,
    SKILLS_PROMPT,
    COMBAT_PROMPT,
    OUTPUT_FORMAT_PROMPT,
  ].join("\n\n---\n\n");
}

export function buildCharacterContext(
  character: any,
  inventory: any[],
  skills: any[]
) {
  return {
    character: {
      name: character.name,
      gender: character.gender,
      current_stats: character.currentStats,
      currency: {
        gold: character.goldCoins,
        silver: character.silverCoins,
        copper: character.copperCoins,
      },
    },
    inventory: inventory.map((item) => ({
      type: item.type,
      name: item.name,
      stats: item.stats,
      quantity: item.quantity,
      equipped: item.equipped,
    })),
    skills: skills.map((skill) => ({
      skillId: skill.skillId,
      name: skill.name,
      level: skill.level,
    })),
  };
}

export function buildCombatContext(enemies: any[]) {
  if (!enemies || enemies.length === 0) return null;

  return {
    enemies: enemies.map((enemy) => ({
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      armor: enemy.armor,
      minDmg: enemy.minDmg,
      maxDmg: enemy.maxDmg,
    })),
  };
}
