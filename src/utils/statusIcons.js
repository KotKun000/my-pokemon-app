const base = import.meta.env.BASE_URL || '/';

/** ไอคอน SVG ใน public/StatusIcon/{id}.svg — id ตรงกับ battleStatus_th.json */
export function getBattleStatusIconUrl(statusId) {
  const id = String(statusId || '').toLowerCase();
  return `${base}StatusIcon/${id}.svg`;
}
