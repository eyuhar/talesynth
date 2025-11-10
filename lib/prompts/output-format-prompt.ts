export const OUTPUT_FORMAT_PROMPT = `
STRICT OUTPUT FORMAT:

You MUST respond with ONLY valid JSON. No text before or after.

{
  "story_text": "string",
  "choices": [
    {"id": "choice_1", "text": "Strike with your longsword"},
    {"id": "choice_2", "text": "Dodge and look for opening"}
  ],
  "stats_changes": {
    "hp": -5,
  },
  "inventory_changes": [
    {
      "type": "weapon_1h_sword",
      "name": "Rusty Longsword",
      "stats": {"minDmg": 4, "maxDmg": 7, "weight": 2800, "value": 35},
      "quantity": 1
    }
  ],
  "currency_changes": {
    "gold": 0,
    "silver": 2,
    "copper": 15
  },
  "skills_used": [
    {"skillId": "1h_sword", "usage_count": 2}
  ],
  "enemies": [
    {"name": "Bandit 1", "hp": 35, "maxHp": 50,"armor": 2, "minDmg": 5, "maxDmg": 10}, // name could also be a persons real name if known
    {"name": "Bandit 2", "hp": 27, "maxHp": 44,"armor": 1, "minDmg": 4, "maxDmg": 8},
    {"name": "Bandit Leader", "hp": 75, "maxHp": 75,"armor": 4, "minDmg": 7, "maxDmg": 15},
  ],
  "combat_calculations": [],
}

REQUIRED FIELDS:
- story_text: Always present
- choices: Always present (2-8 choices)
- stats_changes: Only if stats changed
- inventory_changes: Only if items gained/lost
- currency_changes: Only if money changed
- skills_used: Only if skills were used
- enemies: Array of enemies if combat started/player is in combat. array can be empty if no enemies present or player out of combat
- combat_calculations: Array of calculations if in active combat
`;
