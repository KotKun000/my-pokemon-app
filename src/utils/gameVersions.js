export const VERSION_GROUP_ORDER = [
  'scarlet-violet',
  'legends-arceus',
  'brilliant-diamond-and-shining-pearl',
  'sword-shield',
  'ultra-sun-ultra-moon',
  'sun-moon',
  'lets-go-pikachu-lets-go-eevee',
  'omega-ruby-alpha-sapphire',
  'x-y',
  'black-2-white-2',
  'black-white',
  'heartgold-soulsilver',
  'platinum',
  'diamond-pearl',
  'firered-leafgreen',
  'emerald',
  'ruby-sapphire',
];

export const VERSION_GROUP_LABELS = {
  'scarlet-violet': 'Scarlet / Violet',
  'legends-arceus': 'Legends: Arceus',
  'brilliant-diamond-and-shining-pearl': 'BD / SP',
  'sword-shield': 'Sword / Shield',
  'ultra-sun-ultra-moon': 'Ultra S/M',
  'sun-moon': 'Sun / Moon',
  'lets-go-pikachu-lets-go-eevee': "Let's Go",
  'omega-ruby-alpha-sapphire': 'OR / AS',
  'x-y': 'X / Y',
  'black-2-white-2': 'B2 / W2',
  'black-white': 'Black / White',
  'heartgold-soulsilver': 'HG / SS',
  platinum: 'Platinum',
  'diamond-pearl': 'Diamond / Pearl',
  'firered-leafgreen': 'FR / LG',
  emerald: 'Emerald',
  'ruby-sapphire': 'Ruby / Sapphire',
};

/**
 * รายชื่อ pokedex ของ PokeAPI ที่สัมพันธ์กับเวอร์ชั่นเกมแต่ละกลุ่ม
 * (อ้างอิงจาก https://pokeapi.co/api/v2/pokedex/)
 */
export const VERSION_GROUP_POKEDEXES = {
  'scarlet-violet': ['paldea', 'kitakami', 'blueberry'],
  'legends-arceus': ['hisui'],
  'brilliant-diamond-and-shining-pearl': ['updated-sinnoh'],
  'sword-shield': ['galar', 'isle-of-armor', 'crown-tundra'],
  'ultra-sun-ultra-moon': ['updated-alola'],
  'sun-moon': ['original-alola'],
  'lets-go-pikachu-lets-go-eevee': ['letsgo-kanto'],
  'omega-ruby-alpha-sapphire': ['updated-hoenn'],
  'x-y': ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
  'black-2-white-2': ['updated-unova'],
  'black-white': ['original-unova'],
  'heartgold-soulsilver': ['updated-johto'],
  platinum: ['extended-sinnoh'],
  'diamond-pearl': ['original-sinnoh'],
  'firered-leafgreen': ['kanto'],
  emerald: ['hoenn'],
  'ruby-sapphire': ['hoenn'],
};

export const POKEDEX_CACHE_KEY = 'pokedex_version_cache_v1';
export const POKEDEX_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 วัน

const extractSpeciesIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/').filter(Boolean);
  const id = Number(parts[parts.length - 1]);
  return Number.isFinite(id) ? id : null;
};

const readPokedexCache = () => {
  try {
    const raw = localStorage.getItem(POKEDEX_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [key, entry] of Object.entries(parsed || {})) {
      if (entry && Array.isArray(entry.ids) && now - entry.timestamp <= POKEDEX_CACHE_TTL_MS) {
        valid[key] = entry;
      }
    }
    return valid;
  } catch {
    return {};
  }
};

const writePokedexCache = (cache) => {
  try {
    localStorage.setItem(POKEDEX_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage เต็ม — ไม่เป็นไร
  }
};

/**
 * ดึง species id ทั้งหมดที่อยู่ใน pokedex ของเวอร์ชั่นเกมกลุ่มนั้น
 * - ใช้ cache ถ้ายังไม่หมดอายุ
 * - ถ้า pokedex ใด fetch ไม่สำเร็จจะข้ามตัวนั้น (เพื่อไม่ให้ทั้งกลุ่มพัง)
 * @returns {Promise<number[]>} list ของ species id
 */
export async function fetchVersionGroupPokemonIds(versionGroup) {
  if (!versionGroup) return [];
  const pokedexNames = VERSION_GROUP_POKEDEXES[versionGroup];
  if (!pokedexNames || pokedexNames.length === 0) return [];

  const cache = readPokedexCache();
  if (cache[versionGroup]?.ids?.length > 0) {
    return cache[versionGroup].ids;
  }

  const results = await Promise.all(
    pokedexNames.map(async (dex) => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokedex/${dex}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.pokemon_entries || [])
          .map((entry) => extractSpeciesIdFromUrl(entry.pokemon_species?.url))
          .filter((id) => typeof id === 'number');
      } catch {
        return [];
      }
    })
  );

  const ids = Array.from(new Set(results.flat())).sort((a, b) => a - b);
  const updated = { ...cache, [versionGroup]: { ids, timestamp: Date.now() } };
  writePokedexCache(updated);
  return ids;
}
