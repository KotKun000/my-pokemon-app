import { ALL_TYPES } from './typeMatchups';
import { ABILITY_DEFENSE_MODS, TYPE_CHART } from './typeChart';

/**
 * คำนวณ multiplier ความเสียหายจาก attacker type ต่อ defender types
 * (dual-type จะคูณกัน)
 */
export function damageMultiplier(attacker, defenderTypes) {
  let m = 1;
  for (const d of defenderTypes) {
    const row = TYPE_CHART[attacker];
    if (row && row[d] !== undefined) {
      m *= row[d];
    }
  }
  return m;
}

/**
 * คำนวณ multiplier รับความเสียหาย โดยรวมผลของ ability
 */
export function effectiveDefenceMultiplier(attacker, defenderTypes, ability) {
  const base = damageMultiplier(attacker, defenderTypes);
  const mod = ability ? ABILITY_DEFENSE_MODS[ability] : null;
  if (mod && mod[attacker] !== undefined) {
    return base * mod[attacker];
  }
  return base;
}

/** แปลง multiplier ป้องกัน → คะแนน */
function defenceScore(m) {
  if (m === 0) return 3;
  if (m <= 0.25) return 2;
  if (m < 1) return 1;
  if (m === 1) return 0;
  if (m < 4) return -1;
  return -2;
}

/** แปลง multiplier โจมตี (ค่าสูงสุดของทีม) → คะแนน coverage */
function coverageScore(m) {
  if (m === 0) return -3;
  if (m <= 0.25) return -2;
  if (m < 1) return -1;
  if (m === 1) return 0;
  if (m < 4) return 1;
  return 2;
}

/**
 * คำนวณ Team Defence
 * @param {Array<{types: string[], ability?: string}>} teamPokemon — เฉพาะตัวที่ไม่ null
 * @returns {Array<{type: string, score: number}>}
 */
export function computeTeamDefence(teamPokemon) {
  return ALL_TYPES.map((attacker) => {
    let total = 0;
    for (const p of teamPokemon) {
      if (!p?.types || p.types.length === 0) continue;
      const m = effectiveDefenceMultiplier(attacker, p.types, p.ability);
      total += defenceScore(m);
    }
    return { type: attacker, score: total };
  });
}

/**
 * คำนวณ Team Type Coverage
 * @param {Array<{moveTypes: string[]}>} teamPokemon — moveTypes ของเฉพาะท่าโจมตี
 * @returns {Array<{type: string, score: number}>}
 */
export function computeTeamCoverage(teamPokemon) {
  return ALL_TYPES.map((defender) => {
    let total = 0;
    for (const p of teamPokemon) {
      if (!p?.moveTypes || p.moveTypes.length === 0) continue;
      let best = 0;
      for (const moveType of p.moveTypes) {
        const m = damageMultiplier(moveType, [defender]);
        if (m > best) best = m;
      }
      total += coverageScore(best);
    }
    return { type: defender, score: total };
  });
}
