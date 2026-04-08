import axios from 'axios';
import fs from 'fs';

async function startScraping() {
  const OUTPUT_PATH = './src/data/moves_th.json';
  const DIR_PATH = './src/data';

  try {
    if (!fs.existsSync(DIR_PATH)) {
      fs.mkdirSync(DIR_PATH, { recursive: true });
    }

    // ดึง count จริงก่อน แล้วค่อยดึงรายการทั้งหมดตาม count
    const firstPage = await axios.get('https://pokeapi.co/api/v2/move?limit=1');
    const totalMoves = firstPage.data.count;
    const response = await axios.get(`https://pokeapi.co/api/v2/move?limit=${totalMoves}`);
    const moveList = response.data.results;
    const allMovesData = [];

    console.log(`📦 เริ่มดึงข้อมูล Move ทั้งหมด ${moveList.length} ท่า`);

    for (let i = 0; i < moveList.length; i += 1) {
      const moveItem = moveList[i];
      console.log(`(${i + 1}/${moveList.length}) กำลังดึง: ${moveItem.name}`);
      const detail = await axios.get(moveItem.url);
      const enEntry = detail.data.flavor_text_entries.find(e => e.language.name === 'en');
      let descEn = enEntry ? enEntry.flavor_text.replace(/[\n\f]/g, ' ') : "No description.";
      allMovesData.push({
        id: detail.data.id,
        name: moveItem.name,
        type: detail.data.type.name,
        power: detail.data.power || 0,
        accuracy: detail.data.accuracy || 0,
        pp: detail.data.pp,
        description_en: descEn,
        description_th: ""
      });
    }

    // เขียนทับข้อมูลเดิมทั้งหมด
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allMovesData, null, 2), 'utf-8');
    console.log(`✅ ดึงข้อมูลครบถ้วนแล้ว! ทั้งหมด ${allMovesData.length} ท่า`);

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error.message);
  }
}

startScraping();
