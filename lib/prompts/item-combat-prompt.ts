import {
  ITEM_TYPES,
  ENEMY_HEURISTICS,
  BASE_SKILLS,
  MAX_SKILL_LEVEL,
} from "@/lib/game-definitions";

export const ITEM_TYPES_PROMPT = `
ITEM GENERATION RULES:

You can generate items dynamically based on these type definitions:

${JSON.stringify(ITEM_TYPES, null, 2)}

When you generate an item:
1. Choose appropriate type based on context
2. Generate stats within the specified ranges
3. Give it a fitting name and description
4. Weight is in grams, value is in copper coins

Example:
{
  "type": "weapon_1h_sword",
  "name": "Rusty Longsword",
  "description": "A worn blade, its edge dulled by time",
  "stats": {
    "minDmg": 4,
    "maxDmg": 7,
    "weight": 2800,
    "value": 35
  }
}
`;

export const SKILLS_PROMPT = `
AVAILABLE SKILLS:

The player can have these base skills:

${JSON.stringify(BASE_SKILLS, null, 2)}

When player uses a skill in combat or actions, report it in your response.
You can also create unique/rare skills if the story warrants it.
The new skill should fit the format above and include how the player learned it.

GENERAL RULES FOR SKILL USAGE:
- Skills have levels from 1 to ${MAX_SKILL_LEVEL}
- Higher level increases the chance of success; lower level increases chance of failure. You can decide what success/failure means contextually.
`;

export const COMBAT_PROMPT = `
COMBAT SYSTEM:

ENEMY GENERATION:
When combat starts, generate enemy stats based on these heuristics:

${JSON.stringify(ENEMY_HEURISTICS, null, 2)}

You can also create unique enemies with special traits or abilities if the story calls for it.
Just ensure their stats are balanced against the player's power level and the above heuristics.

Scale enemies based on:
- Story context (bandit ambush vs dragon lair)
- Player power level (check player HP, equipped weapon etc)
- Difficulty (use lower end if player is wounded, higher if they're strong)

COMBAT CALCULATIONS:
When player attacks:
1. Roll damage between weapon's minDmg and maxDmg
2. Subtract enemy armor from damage (minimum 0)
3. Subtract result from enemy HP
4. Report exact calculation

When enemy attacks:
1. Roll damage between enemy's minDmg and maxDmg
2. Subtract player armor from damage (minimum 0)
3. Subtract result from player HP
4. Report exact calculation

Example calculation:
Player attacks Bandit with Iron Longsword (5-8 dmg)
- Rolled: 7 damage
- Bandit armor: 3
- Final damage: 7 - 3 = 4
- Bandit HP: 40 - 4 = 36

CURRENCY:
- 1 Gold = 10 Silver = 100 Copper
- All item values are in Copper
- When looting, give appropriate amounts based on enemy/location
`;
