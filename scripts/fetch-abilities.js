import axios from 'axios';
import fs from 'fs';

async function fetchAbilities() {
  const OUTPUT_PATH = './src/data/abilities_en.json';
  const DIR_PATH = './src/data';

  try {
    if (!fs.existsSync(DIR_PATH)) {
      fs.mkdirSync(DIR_PATH, { recursive: true });
    }

    // ดึง count จริงก่อน แล้วค่อยดึงรายการทั้งหมดตาม count
    const firstPage = await axios.get('https://pokeapi.co/api/v2/ability?limit=1');
    const totalAbilities = firstPage.data.count;
    const listResponse = await axios.get(`https://pokeapi.co/api/v2/ability?limit=${totalAbilities}`);
    const abilityList = listResponse.data.results;

    console.log(`📦 เริ่มดึงข้อมูล Ability ทั้งหมด ${abilityList.length} รายการ`);

    const allAbilitiesData = {};

    for (let i = 0; i < abilityList.length; i++) {
      const abilityItem = abilityList[i];
      console.log(`(${i + 1}/${abilityList.length}) กำลังดึง: ${abilityItem.name}`);

      const detail = await axios.get(abilityItem.url);

      // ชื่อภาษาอังกฤษ
      const enName = detail.data.names.find(n => n.language.name === 'en');

      // คำอธิบาย Effect ภาษาอังกฤษ
      const enEffect = detail.data.effect_entries.find(e => e.language.name === 'en');

      // คำอธิบายแต่ละเวอร์ชั่นเกม (ภาษาอังกฤษ)
      const gameDescriptions = {};
      detail.data.flavor_text_entries
        .filter(e => e.language.name === 'en')
        .forEach(e => {
          const versionGroup = e.version_group.name;
          gameDescriptions[versionGroup] = e.flavor_text.replace(/[\n\f\r]/g, ' ').trim();
        });

      allAbilitiesData[abilityItem.name] = {
        id: detail.data.id,
        name_en: enName ? enName.name : abilityItem.name,
        effect_en: enEffect ? enEffect.effect.replace(/[\n\f\r]/g, ' ').trim() : '',
        short_effect_en: enEffect ? enEffect.short_effect.replace(/[\n\f\r]/g, ' ').trim() : '',
        game_descriptions: gameDescriptions,
      };
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allAbilitiesData, null, 2), 'utf-8');
    console.log(`✅ เสร็จสิ้น! บันทึกข้อมูล ${Object.keys(allAbilitiesData).length} Ability ไปที่ ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

fetchAbilities();
