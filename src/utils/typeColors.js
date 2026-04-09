/** สีหลักของแต่ละธาตุ */
export const TYPE_COLORS = {
  normal:   '#A8A77A',
  fire:     '#EE8130',
  water:    '#6390F0',
  electric: '#F7D02C',
  grass:    '#7AC74C',
  ice:      '#96D9D6',
  fighting: '#C22E28',
  poison:   '#A33EA1',
  ground:   '#E2BF65',
  flying:   '#A98FF3',
  psychic:  '#F95587',
  bug:      '#A6B91A',
  rock:     '#B6A136',
  ghost:    '#735797',
  dragon:   '#6F35FC',
  dark:     '#705746',
  steel:    '#B7B7CE',
  fairy:    '#D685AD',
  stellar:  '#40B5A0',
};

/** สีอ่อน (light) ของแต่ละธาตุ สำหรับ gradient เมื่อมีแค่ 1 type */
export const TYPE_COLORS_LIGHT = {
  normal:   '#D4D4A8',
  fire:     '#F7C097',
  water:    '#A8C4F5',
  electric: '#FAEB8E',
  grass:    '#B0E09A',
  ice:      '#C7EFEC',
  fighting: '#E07A75',
  poison:   '#D089CF',
  ground:   '#F0DFA2',
  flying:   '#CFC0F8',
  psychic:  '#FCA0B8',
  bug:      '#CDDB74',
  rock:     '#D5CA80',
  ghost:    '#A998C2',
  dragon:   '#AC87FD',
  dark:     '#A89080',
  steel:    '#D6D6E3',
  fairy:    '#EBB8D1',
  stellar:  '#89D8C8',
};

/**
 * คืน inline style object สำหรับ gradient border ตาม types
 * ใช้เทคนิค background-image + background-clip เพื่อให้ gradient ทำงานกับ border-radius
 *
 * @param {string[]} types — อาเรย์ของธาตุ เช่น ['water'] หรือ ['grass','poison']
 * @param {string}   [innerColor='#fff'] — สีพื้นหลังด้านใน
 * @returns {object} React inline style
 */
export function getTypeBorderStyle(types = [], innerColor = '#fff') {
  if (!types.length) return {};

  let gradient;
  if (types.length === 1) {
    const light = TYPE_COLORS_LIGHT[types[0]] || '#e2e8f0';
    const dark  = TYPE_COLORS[types[0]]       || '#94a3b8';
    gradient = `linear-gradient(135deg, ${light}, ${dark})`;
  } else {
    const c1 = TYPE_COLORS[types[0]] || '#94a3b8';
    const c2 = TYPE_COLORS[types[1]] || '#94a3b8';
    gradient = `linear-gradient(135deg, ${c1}, ${c2})`;
  }

  return {
    border: '3px solid transparent',
    backgroundImage: `linear-gradient(${innerColor}, ${innerColor}), ${gradient}`,
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
  };
}
