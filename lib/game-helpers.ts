// Helper functions for game logic validation and calculations

import { ITEM_TYPES, XP_CURVE, MAX_SKILL_LEVEL } from "./game-definitions";
import { prisma } from "./prisma";

// ITEM VALIDATION

export interface GeneratedItem {
  type: string;
  name: string;
  description?: string;
  stats: Record<string, number>;
  quantity?: number;
}

/**
 * Validates and clamps AI-generated item stats to allowed ranges
 */
export function validateItem(item: GeneratedItem): GeneratedItem {
  const itemType = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];

  if (!itemType) {
    console.warn(`Unknown item type: ${item.type}`);
    // Return item as-is if type is unknown (allows for unique items)
    return item;
  }

  const validatedStats: Record<string, number> = {};

  for (const [statName, statValue] of Object.entries(item.stats)) {
    const range =
      itemType.stat_ranges[statName as keyof typeof itemType.stat_ranges];

    if (range) {
      const [min, max] = range;
      // Clamp value to valid range
      validatedStats[statName] = Math.max(min, Math.min(max, statValue));

      if (statValue < min || statValue > max) {
        console.warn(
          `Item "${item.name}" stat "${statName}" out of range: ${statValue} (clamped to ${validatedStats[statName]})`
        );
      }
    } else {
      // Stat not defined in type, keep as-is
      validatedStats[statName] = statValue;
    }
  }

  return {
    ...item,
    stats: validatedStats,
    quantity: item.quantity || 1,
  };
}

/**
 * Validates multiple items
 */
export function validateItems(items: GeneratedItem[]): GeneratedItem[] {
  return items.map(validateItem);
}

// SKILL XP & LEVELING

export interface SkillUpdate {
  skillId: string;
  xpGained: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  oldXP: number;
  newXP: number;
}

/**
 * Calculates skill level-up based on XP gained
 * Returns update information
 */
export function calculateSkillLevelUp(
  currentLevel: number,
  currentXP: number,
  xpGained: number
): { newLevel: number; newXP: number; leveledUp: boolean } {
  let level = currentLevel;
  let xp = currentXP + xpGained;
  let leveledUp = false;

  // Level up loop
  while (level < MAX_SKILL_LEVEL) {
    const xpNeeded = XP_CURVE[level];

    if (!xpNeeded) {
      // No more levels defined
      break;
    }

    if (xp >= xpNeeded) {
      xp -= xpNeeded;
      level++;
      leveledUp = true;
    } else {
      break;
    }
  }

  // Cap at max level
  if (level >= MAX_SKILL_LEVEL) {
    level = MAX_SKILL_LEVEL;
    xp = 0; // No more XP needed at max level
  }

  return {
    newLevel: level,
    newXP: xp,
    leveledUp: leveledUp && level > currentLevel,
  };
}

/**
 * Updates a character's skill XP in database
 * Returns skill update information
 */
export async function updateCharacterSkillXP(
  characterId: string,
  skillId: string,
  usageCount: number
): Promise<SkillUpdate | null> {
  // Find skill
  const skill = await prisma.characterSkill.findUnique({
    where: {
      characterId_skillId: {
        characterId,
        skillId,
      },
    },
  });

  if (!skill) {
    console.warn(`Skill ${skillId} not found for character ${characterId}`);
    return null;
  }

  // Calculate XP gain (1 XP per usage for now, can be adjusted)
  const xpGained = usageCount * 1;

  // Calculate level up
  const { newLevel, newXP, leveledUp } = calculateSkillLevelUp(
    skill.level,
    skill.xp,
    xpGained
  );

  // Update in database
  await prisma.characterSkill.update({
    where: { id: skill.id },
    data: {
      level: newLevel,
      xp: newXP,
    },
  });

  return {
    skillId,
    xpGained,
    leveledUp,
    oldLevel: skill.level,
    newLevel,
    oldXP: skill.xp,
    newXP,
  };
}

/**
 * Batch update multiple skills
 */
export async function updateMultipleSkills(
  characterId: string,
  skillsUsed: Array<{ skillId: string; usage_count: number }>
): Promise<SkillUpdate[]> {
  const updates: SkillUpdate[] = [];

  for (const { skillId, usage_count } of skillsUsed) {
    const update = await updateCharacterSkillXP(
      characterId,
      skillId,
      usage_count
    );
    if (update) {
      updates.push(update);
    }
  }

  return updates;
}

// COMBAT VALIDATION

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  minDmg: number;
  maxDmg: number;
}

/**
 * Validates enemy health values
 * Corrects obvious errors
 */
export function softValidateEnemies(enemies: Enemy[]): {
  valid: boolean;
  errors: string[];
  correctedEnemies: Enemy[];
} {
  const errors: string[] = [];
  const correctedEnemies = enemies.map((e) => ({ ...e }));

  for (const enemy of correctedEnemies) {
    if (enemy.hp < 0) {
      errors.push(`Enemy ${enemy.name} HP below 0, deleting from array`);
    }
    if (enemy.hp > enemy.maxHp) {
      errors.push(`Enemy ${enemy.name} HP above max, clamping`);
      enemy.hp = enemy.maxHp;
    }
  }

  correctedEnemies.filter((e) => e.hp > 0);

  return {
    valid: errors.length === 0,
    errors,
    correctedEnemies,
  };
}

/**
 * Validates AI-generated enemy stats TO-DO: re-adjust and re-enable if needed
 */
/**
export function validateEnemy(enemy: Enemy, enemyType?: string): Enemy {
  const errors: string[] = [];

  // Get heuristics if enemy type is known
  if (
    enemyType &&
    ENEMY_HEURISTICS[enemyType as keyof typeof ENEMY_HEURISTICS]
  ) {
    const heuristics =
      ENEMY_HEURISTICS[enemyType as keyof typeof ENEMY_HEURISTICS];

    // Validate HP
    if (enemy.maxHp < heuristics.hp[0] || enemy.maxHp > heuristics.hp[1] * 2) {
      errors.push(`Enemy HP out of reasonable range`);
      enemy.maxHp = Math.max(
        heuristics.hp[0],
        Math.min(heuristics.hp[1] * 2, enemy.maxHp)
      );
      enemy.hp = Math.min(enemy.hp, enemy.maxHp);
    }

    // Validate armor
    if (enemy.armor < 0 || enemy.armor > heuristics.armor[1] * 2) {
      errors.push(`Enemy armor out of reasonable range`);
      enemy.armor = Math.max(0, Math.min(heuristics.armor[1] * 2, enemy.armor));
    }
  }

  // General validation
  if (enemy.hp > enemy.maxHp) {
    enemy.hp = enemy.maxHp;
  }
  if (enemy.hp < 0) {
    enemy.hp = 0;
  }
  if (enemy.armor < 0) {
    enemy.armor = 0;
  }
  if (enemy.minDmg < 0) {
    enemy.minDmg = 0;
  }
  if (enemy.maxDmg < enemy.minDmg) {
    enemy.maxDmg = enemy.minDmg;
  }

  if (errors.length > 0) {
    console.warn(`Enemy validation warnings for ${enemy.name}:`, errors);
  }

  return enemy;
}
*/
/**
 * Validates multiple enemies
 */
/**
export function validateEnemies(enemies: Enemy[]): Enemy[] {
  return enemies.map((enemy) => validateEnemy(enemy));
}
*/

// STATS VALIDATION

/**
 * Validates and clamps character stats
 */
export function validateStats(stats: any): any {
  const validated = { ...stats };

  // HP cannot be negative or exceed maxHp
  if (validated.hp < 0) {
    validated.hp = 0;
  }
  if (validated.maxHp && validated.hp > validated.maxHp) {
    validated.hp = validated.maxHp;
  }

  return validated;
}

// CURRENCY VALIDATION

/**
 * Validates currency values
 */
export function validateCurrency(currency: {
  gold?: number;
  silver?: number;
  copper?: number;
}): { gold: number; silver: number; copper: number } {
  const MIN = 0;
  const MAX = 32767;

  return {
    gold: Math.max(MIN, Math.min(MAX, currency.gold || 0)),
    silver: Math.max(MIN, Math.min(MAX, currency.silver || 0)),
    copper: Math.max(MIN, Math.min(MAX, currency.copper || 0)),
  };
}
