const base = import.meta.env.BASE_URL || '/';

/** ไอคอน SVG ใน public/TerrainIcon/{id}.svg — id ตรงกับ battleTerrain_th.json */
export function getBattleTerrainIconUrl(terrainId) {
  const id = String(terrainId || '').toLowerCase();
  return `${base}TerrainIcon/${id}.svg`;
}
