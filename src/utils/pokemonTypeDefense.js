const TYPE_CACHE = new Map();

const ALL_ATTACKING_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

async function getTypeRelations(typeName) {
  if (TYPE_CACHE.has(typeName)) {
    return TYPE_CACHE.get(typeName);
  }
  const res = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
  if (!res.ok) {
    throw new Error(`โหลดข้อมูลธาตุ ${typeName} ไม่สำเร็จ`);
  }
  const data = await res.json();
  const rel = {
    doubleFrom: new Set(
      data.damage_relations.double_damage_from.map((t) => t.name)
    ),
    halfFrom: new Set(
      data.damage_relations.half_damage_from.map((t) => t.name)
    ),
    noFrom: new Set(data.damage_relations.no_damage_from.map((t) => t.name)),
  };
  TYPE_CACHE.set(typeName, rel);
  return rel;
}

function multiplierFromRelations(rel, attackingType) {
  if (rel.noFrom.has(attackingType)) return 0;
  if (rel.doubleFrom.has(attackingType)) return 2;
  if (rel.halfFrom.has(attackingType)) return 0.5;
  return 1;
}

/**
 * คำนวณตัวคูณความเสียหายที่โปเกมอนรับจากแต่ละธาตุโจมตี (dual-type = คูณกัน)
 */
export async function getDefensiveChart(defenderTypes) {
  if (!defenderTypes.length) return [];
  const rels = await Promise.all(
    defenderTypes.map((t) => getTypeRelations(t))
  );
  const rows = ALL_ATTACKING_TYPES.map((attacking) => {
    let mult = 1;
    for (const rel of rels) {
      mult *= multiplierFromRelations(rel, attacking);
    }
    return { attackingType: attacking, multiplier: mult };
  });
  return rows.sort((a, b) => {
    if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier;
    return a.attackingType.localeCompare(b.attackingType);
  });
}
