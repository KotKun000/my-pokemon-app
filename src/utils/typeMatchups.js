import typeSpecialTraitsTh from '../data/typeSpecialTraits_th.json';

/** ลำดับธาตุสำหรับหัวตารางแพ้ชนะ (สอดคล้อง PokeAPI / Gen 6+) */
export const ALL_TYPES = [
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

/** ชื่อแสดงผลภาษาไทย (คู่กับชื่อ PokeAPI) */
export const TYPE_LABELS_TH = {
  normal: 'ธรรมชาติ',
  fire: 'ไฟ',
  water: 'น้ำ',
  electric: 'ไฟฟ้า',
  grass: 'หญ้า',
  ice: 'น้ำแข็ง',
  fighting: 'ต่อสู้',
  poison: 'พิษ',
  ground: 'ดิน',
  flying: 'บิน',
  psychic: 'พลังจิต',
  bug: 'แมลง',
  rock: 'หิน',
  ghost: 'ผี',
  dragon: 'มังกร',
  dark: 'มืด',
  steel: 'เหล็ก',
  fairy: 'นางฟ้า',
};

/** ชื่อธาตุแสดงเป็นภาษาอังกฤษ (Title Case) จากรหัส PokeAPI */
export function typeLabelEn(typeKey) {
  if (!typeKey) return '';
  return typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
}

const REL_CACHE = new Map();

function specialTraitsForType(type) {
  const list = typeSpecialTraitsTh[type];
  return Array.isArray(list) ? list : [];
}

function sortTypeKeys(set) {
  return [...set]
    .filter((t) => ALL_TYPES.includes(t))
    .sort((a, b) => a.localeCompare(b));
}

async function fetchTypeRelations(name) {
  if (REL_CACHE.has(name)) return REL_CACHE.get(name);
  const res = await fetch(`https://pokeapi.co/api/v2/type/${name}`);
  if (!res.ok) {
    throw new Error(`โหลดข้อมูลธาตุ ${name} ไม่สำเร็จ`);
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
    doubleTo: new Set(data.damage_relations.double_damage_to.map((t) => t.name)),
    halfTo: new Set(data.damage_relations.half_damage_to.map((t) => t.name)),
    noTo: new Set(data.damage_relations.no_damage_to.map((t) => t.name)),
  };
  REL_CACHE.set(name, rel);
  return rel;
}

/** ข้อมูลแต่ละการ์ดธาตุสำหรับหน้า Tips */
export async function loadTypeCards() {
  const rels = await Promise.all(ALL_TYPES.map((t) => fetchTypeRelations(t)));
  return ALL_TYPES.map((type, i) => {
    const r = rels[i];
    return {
      type,
      labelEn: typeLabelEn(type),
      attackSE: sortTypeKeys(r.doubleTo),
      attackNVE: sortTypeKeys(r.halfTo),
      attackImmune: sortTypeKeys(r.noTo),
      defendWeak: sortTypeKeys(r.doubleFrom),
      defendResist: sortTypeKeys(r.halfFrom),
      defendImmune: sortTypeKeys(r.noFrom),
      specialTraits: specialTraitsForType(type),
    };
  });
}
