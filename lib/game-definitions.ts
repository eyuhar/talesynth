// ITEM TYPE DEFINITIONS

export const ITEM_TYPES = {
  // Weapons - One-Handed
  weapon_1h_sword: {
    stat_ranges: {
      minDmg: [1, 20],
      maxDmg: [3, 25],
      weight: [1000, 4000], // grams (1-4 kg)
      value: [10, 200], // in copper
    },
  },
  weapon_1h_axe: {
    stat_ranges: {
      minDmg: [2, 22],
      maxDmg: [4, 28],
      weight: [1200, 4500],
      value: [12, 220],
    },
  },
  weapon_1h_mace: {
    stat_ranges: {
      minDmg: [3, 18],
      maxDmg: [5, 24],
      weight: [1500, 5000],
      value: [15, 180],
    },
  },
  weapon_dagger: {
    stat_ranges: {
      minDmg: [1, 8],
      maxDmg: [2, 12],
      weight: [200, 800],
      value: [5, 80],
    },
  },

  // Weapons - Two-Handed
  weapon_2h_sword: {
    stat_ranges: {
      minDmg: [8, 30],
      maxDmg: [12, 40],
      weight: [3000, 8000],
      value: [50, 500],
    },
  },
  weapon_2h_axe: {
    stat_ranges: {
      minDmg: [10, 35],
      maxDmg: [15, 45],
      weight: [3500, 9000],
      value: [60, 550],
    },
  },
  weapon_spear: {
    stat_ranges: {
      minDmg: [6, 25],
      maxDmg: [10, 35],
      weight: [2000, 5000],
      value: [30, 300],
    },
  },

  // Ranged Weapons
  weapon_bow: {
    stat_ranges: {
      minDmg: [4, 18],
      maxDmg: [8, 28],
      weight: [800, 2000],
      value: [20, 250],
    },
  },
  weapon_crossbow: {
    stat_ranges: {
      minDmg: [8, 25],
      maxDmg: [12, 35],
      weight: [2000, 4000],
      value: [40, 400],
    },
  },

  // Armor
  armor_helmet: {
    stat_ranges: {
      armor: [1, 8],
      weight: [1000, 3000],
      value: [15, 150],
    },
  },
  armor_chest: {
    stat_ranges: {
      armor: [2, 15],
      weight: [3000, 12000],
      value: [30, 400],
    },
  },
  armor_legs: {
    stat_ranges: {
      armor: [1, 10],
      weight: [2000, 8000],
      value: [20, 250],
    },
  },
  armor_boots: {
    stat_ranges: {
      armor: [1, 5],
      weight: [500, 2000],
      value: [10, 100],
    },
  },
  armor_gloves: {
    stat_ranges: {
      armor: [1, 4],
      weight: [300, 1500],
      value: [8, 80],
    },
  },
  armor_shield: {
    stat_ranges: {
      armor: [2, 12],
      weight: [2000, 6000],
      value: [25, 300],
    },
  },

  // Consumables
  consumable_potion_health: {
    stat_ranges: {
      healing: [10, 100],
      weight: [100, 300],
      value: [5, 80],
    },
  },
  consumable_food: {
    stat_ranges: {
      healing: [5, 30],
      weight: [100, 500],
      value: [1, 20],
    },
  },

  // Miscellaneous
  misc_material: {
    stat_ranges: {
      weight: [50, 2000],
      value: [1, 100],
    },
  },
  misc_jewel: {
    stat_ranges: {
      weight: [10, 100],
      value: [50, 1000],
    },
  },
  misc_key: {
    stat_ranges: {
      weight: [10, 50],
      value: [0, 10], // Keys have little sell value
    },
  },
  misc_document: {
    stat_ranges: {
      weight: [10, 100],
      value: [0, 50],
    },
  },
} as const;

// BASE SKILLS

export const BASE_SKILLS = [
  // Combat Skills - Melee
  {
    id: "1h_sword",
    name: "One-Handed Swords",
    description: "Proficiency with single-handed bladed weapons",
  },
  {
    id: "2h_sword",
    name: "Two-Handed Swords",
    description: "Proficiency with large two-handed blades",
  },
  {
    id: "1h_axe",
    name: "One-Handed Axes",
    description: "Proficiency with single-handed axes",
  },
  {
    id: "2h_axe",
    name: "Two-Handed Axes",
    description: "Proficiency with large two-handed axes",
  },
  {
    id: "blunt",
    name: "Blunt Weapons",
    description: "Proficiency with maces, clubs, and hammers",
  },
  {
    id: "dagger",
    name: "Daggers",
    description: "Proficiency with short blades and knives",
  },
  {
    id: "spear",
    name: "Spears & Polearms",
    description: "Proficiency with spears and pole weapons",
  },

  // Combat Skills - Ranged
  { id: "archery", name: "Archery", description: "Proficiency with bows" },
  {
    id: "crossbow",
    name: "Crossbows",
    description: "Proficiency with crossbows",
  },
  {
    id: "throwing",
    name: "Throwing Weapons",
    description: "Proficiency with thrown weapons",
  },

  // Combat Skills - Defense
  {
    id: "shield",
    name: "Shield Combat",
    description: "Proficiency with shields in combat",
  },
  { id: "dodge", name: "Dodge", description: "Ability to evade attacks" },
  {
    id: "parry",
    name: "Parry",
    description: "Ability to deflect attacks with weapon",
  },

  // Social Skills
  {
    id: "diplomacy",
    name: "Diplomacy",
    description: "Art of negotiation and persuasion",
  },
  {
    id: "intimidation",
    name: "Intimidation",
    description: "Ability to frighten and coerce",
  },
  {
    id: "deception",
    name: "Deception",
    description: "Skill in lying and manipulation",
  },
  {
    id: "barter",
    name: "Barter",
    description: "Skill in trading and haggling",
  },

  // Utility Skills
  {
    id: "stealth",
    name: "Stealth",
    description: "Ability to move unseen and unheard",
  },
  {
    id: "lockpicking",
    name: "Lockpicking",
    description: "Ability to pick locks and bypass mechanisms",
  },
  {
    id: "pickpocket",
    name: "Pickpocket",
    description: "Ability to steal from others unnoticed",
  },
  {
    id: "tracking",
    name: "Tracking",
    description: "Ability to follow trails and find prey",
  },
  {
    id: "survival",
    name: "Survival",
    description: "Knowledge of wilderness survival",
  },
  {
    id: "medicine",
    name: "Medicine",
    description: "Knowledge of healing and treating wounds",
  },

  // Knowledge Skills
  {
    id: "lore_history",
    name: "Historical Lore",
    description: "Knowledge of history and legends",
  },
  {
    id: "lore_arcane",
    name: "Arcane Lore",
    description: "Knowledge of magic and mystical matters",
  },
  {
    id: "lore_nature",
    name: "Nature Lore",
    description: "Knowledge of flora, fauna, and natural phenomena",
  },
] as const;

// XP CURVE

// How much XP is needed to reach each level
export const XP_CURVE: Record<number, number> = {
  1: 10,
  2: 20,
  3: 40,
  4: 80,
  5: 160,
  6: 320,
  7: 640,
  8: 1280,
  9: 2560,
  10: 5120,
};

// Maximum skill level
export const MAX_SKILL_LEVEL = 10;

// ENEMY GENERATION HEURISTICS

export const ENEMY_HEURISTICS = {
  // Common enemies
  bandit: {
    hp: [30, 50],
    armor: [1, 3],
    minDmg: [3, 7],
    maxDmg: [5, 10],
  },
  bandit_elite: {
    hp: [50, 80],
    armor: [3, 5],
    minDmg: [5, 10],
    maxDmg: [8, 15],
  },

  // Animals
  wolf: {
    hp: [20, 35],
    armor: [0, 1],
    minDmg: [4, 8],
    maxDmg: [6, 12],
  },
  bear: {
    hp: [60, 100],
    armor: [2, 4],
    minDmg: [8, 15],
    maxDmg: [12, 20],
  },
  boar: {
    hp: [30, 50],
    armor: [1, 3],
    minDmg: [5, 10],
    maxDmg: [8, 14],
  },

  // Monsters
  goblin: {
    hp: [15, 30],
    armor: [0, 2],
    minDmg: [2, 5],
    maxDmg: [4, 8],
  },
  orc: {
    hp: [50, 80],
    armor: [3, 6],
    minDmg: [6, 12],
    maxDmg: [10, 18],
  },
  troll: {
    hp: [100, 150],
    armor: [5, 10],
    minDmg: [12, 20],
    maxDmg: [18, 30],
  },

  // Undead
  skeleton: {
    hp: [20, 40],
    armor: [2, 4],
    minDmg: [4, 8],
    maxDmg: [6, 12],
  },
  zombie: {
    hp: [30, 50],
    armor: [1, 3],
    minDmg: [5, 10],
    maxDmg: [8, 14],
  },

  // Boss-tier
  dragon: {
    hp: [200, 400],
    armor: [10, 20],
    minDmg: [20, 40],
    maxDmg: [30, 60],
  },
  demon: {
    hp: [150, 300],
    armor: [8, 15],
    minDmg: [15, 30],
    maxDmg: [25, 45],
  },
} as const;

// CURRENCY CONVERSION

export const CURRENCY = {
  COPPER_PER_SILVER: 10,
  SILVER_PER_GOLD: 10,
  COPPER_PER_GOLD: 100,
} as const;

// Helper to convert everything to copper for easy calculations
export function toCopper(gold: number, silver: number, copper: number): number {
  return (
    gold * CURRENCY.COPPER_PER_GOLD +
    silver * CURRENCY.COPPER_PER_SILVER +
    copper
  );
}

// Helper to convert copper back to gold/silver/copper
export function fromCopper(totalCopper: number): {
  gold: number;
  silver: number;
  copper: number;
} {
  const gold = Math.floor(totalCopper / CURRENCY.COPPER_PER_GOLD);
  const remaining = totalCopper % CURRENCY.COPPER_PER_GOLD;
  const silver = Math.floor(remaining / CURRENCY.COPPER_PER_SILVER);
  const copper = remaining % CURRENCY.COPPER_PER_SILVER;

  return { gold, silver, copper };
}
