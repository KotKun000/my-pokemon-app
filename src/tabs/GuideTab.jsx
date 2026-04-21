function GuideTab({ onNavigate }) {
  const goToTipsType = () => onNavigate?.('tips', { tipsSub: 'types' });
  const goToPokemon = () => onNavigate?.('pokemon');
  const goToMove = () => onNavigate?.('move');

  return (
    <section className="guide-panel" aria-label="คู่มือการเล่นเกม">
      <div
        className="pokemon-detail-modal guide-detail-embed"
        role="region"
        aria-labelledby="guide-title"
      >
        <header className="pokemon-detail-header guide-header">
          <h2 className="pokemon-detail-title" id="guide-title">
            Guide การเล่นเกมโปเกมอน (มือใหม่)
          </h2>
        </header>

        <div className="guide-content">
          <p className="guide-lead">
            คู่มือนี้สรุปพื้นฐานที่ควรรู้ก่อนเริ่มเล่น และอธิบายคำศัพท์หลักๆ ให้เข้าใจเร็ว
            (จับ → สู้ → เลเวล → จัดทีม) พร้อมปุ่มลัดไปหน้าข้อมูลในแอป
          </p>

          <div className="guide-grid">
            <details className="guide-card">
              <summary className="guide-card-summary">
                1) Pokémon คืออะไร + เล่นยังไง (จับ → สู้ → เลเวล → สร้างทีม)
              </summary>
              <div className="guide-card-body">
                <ul className="guide-list">
                  <li>
                    <strong>Pokémon</strong> คือมอนสเตอร์ที่เราจับมาเป็นทีม แล้วพาไปสู้/ผจญภัย/แข่งขัน
                  </li>
                  <li>
                    <strong>จับ</strong>: ใช้ Poké Ball จับโปเกมอนเพื่อเพิ่มตัวเลือกในทีม
                  </li>
                  <li>
                    <strong>สู้</strong>: เลือกท่าที่เหมาะกับสถานการณ์ โดยดูธาตุและประเภทดาเมจ
                  </li>
                  <li>
                    <strong>เลเวล</strong>: ยิ่งเลเวลสูง สเตตัสยิ่งสูง ทำให้สู้ได้ง่ายขึ้น
                  </li>
                  <li>
                    <strong>สร้างทีม</strong>: ทำทีมให้ครอบคลุมธาตุ/บทบาท เพื่อมี “คำตอบ” กับหลายสถานการณ์
                  </li>
                </ul>
                <div className="guide-actions">
                  <button type="button" className="guide-link-btn" onClick={goToPokemon}>
                    ไปหน้า Pokémon
                  </button>
                  <button type="button" className="guide-link-btn" onClick={goToMove}>
                    ไปหน้า Move
                  </button>
                </div>
              </div>
            </details>

            <details className="guide-card">
              <summary className="guide-card-summary">2) การต่อสู้</summary>
              <div className="guide-card-body">
                <ul className="guide-list">
                  <li>
                    <strong>Type</strong>: ตัวคูณธาตุโดยทั่วไปคือ ชนะทาง <strong>×2</strong>, ต้านทาน <strong>×0.5</strong>, ไม่รับผล <strong>×0</strong>
                  </li>
                  <li>
                    <strong>STAB</strong>: ถ้าใช้ท่าธาตุเดียวกับตัวเองดาเมจจะคูณเพิ่ม <strong>×1.5</strong>
                  </li>
                  <li>
                    <strong>Physical vs Special</strong>: ท่า Physical ใช้ Atk vs Def, ท่า Special ใช้ Sp.Atk vs Sp.Def (เลือกท่าให้เข้ากับค่าสเตตัสเด่นของตัวเอง)
                  </li>
                  <li>
                    <strong>Power / Accuracy / Effect</strong>: Power คือพลัง, Accuracy คือแม่นยำ, Effect คือผลพิเศษ เช่น ทำให้ติดสถานะ
                  </li>
                  <li>
                    <strong>Speed</strong>: เร็วกว่าทำให้สามารถออกท่าก่อน, หากมี Priority จะทำให้ออกท่าก่อนได้
                  </li>
                  <li>
                    <strong>ถ้าโจมตีหลายเป้าหมาย</strong>: จะทำดาเมจลดลง <strong>×0.75</strong> หากหลายเป้าหมาย
                  </li>
                  <li>
                    <strong>สรุปจำง่าย</strong>: ดาเมจคร่าวๆ มักคิดเป็น <code>Damage ≈ Base × STAB × Type</code>
                  </li>
                </ul>
                <div className="guide-actions">
                  <button type="button" className="guide-link-btn" onClick={goToTipsType}>
                    ไปหน้า Type
                  </button>
                  <button type="button" className="guide-link-btn" onClick={goToMove}>
                    ไปหน้า Move
                  </button>
                </div>
              </div>
            </details>

            <details className="guide-card">
              <summary className="guide-card-summary">3) ประเภทโปเกมอน</summary>
              <div className="guide-card-body">
                <ul className="guide-list">
                  <li>
                    <strong>Base Stats</strong>: ค่าพื้นฐานของโปเกมอน <strong>(HP/Atk/Def/Sp.Atk/Sp.Def/Speed)</strong> ช่วยบอกแนวเล่นว่าเด่นด้านไหน
                  </li>
                  <li>
                    <strong>Attacker</strong>: เน้นทำดาเมจ <strong>(เด่นด้าน Atk หรือ Sp.Atk)</strong> เช่น Garchomp, Hydreigon
                  </li>
                  <li>
                    <strong>Tank</strong>: เน้นรับดาเมจ <strong>(เด่นด้าน HP/Def/Sp.Def)</strong> เช่น Hisui-Goodra, Coviknight
                  </li>
                  <li>
                    <strong>Sweeper </strong>: เน้นเร็ว <strong>(เด่นด้าน Speed หรือมีท่า Priority)</strong> เช่น Dragapult, Flutter Mane
                  </li>
                  <li>
                    <strong>Support</strong>: เน้นสนับสนุนทีมหรือก่กวนศัตรู เช่น Whimsicott, Sinistcha
                  </li>
                  <li>
                    <strong>Pivot</strong>: เน้นเข้าๆออกๆเพื่อคุมเกม เช่น Incineroar, Rotom-Wash
                  </li>
                  <li>
                    <strong>Setup Sweeper</strong>: บอสของทีมอาจจะหาจังหวะบัฟตัวเองเพื่อความได้เปรียบ เช่น Volcarona, Dragonite
                  </li>
                  <li>
                    <strong>Ability</strong>: ความสามารถติดตัวที่เปลี่ยนรูปแบบการเล่น เช่น กันสถานะ, เพิ่มดาเมจบางเงื่อนไข, เปลี่ยนผลของสภาพอากาศ ฯลฯ
                  </li>
                </ul>
                <div className="guide-actions">
                  <button type="button" className="guide-link-btn" onClick={goToPokemon}>
                    ไปหน้า Pokémon
                  </button>
                </div>
              </div>
            </details>

            <details className="guide-card">
              <summary className="guide-card-summary">4) การจัดทีม</summary>
              <div className="guide-card-body">
                <div className="guide-team-stack">
                  <section className="guide-mode" aria-label="Universal team building">
                    <p className="guide-mode-title">
                      <strong>🟢 Universal</strong>
                    </p>
                    <ul className="guide-list">
                      <li>
                        <strong>แกน</strong>: มีตัวแบก <strong>1–2</strong> ตัว แล้วสร้างทีมเพื่อปิดจุดอ่อน
                      </li>
                      <li>
                        <strong>บทบาท</strong>: ทีมควรมีทั้ง <strong>Attacker</strong> + <strong>Tank</strong> + <strong>Support</strong> เพื่อรับมือหลายสถานการณ์
                      </li>
                      <li>
                        <strong>จุดอ่อน</strong>: อย่าให้ทีมแพ้ธาตุซ้ำกันเยอะ เพราะจะลำบากหากเจอประเภทที่แพ้ทาง
                      </li>
                    </ul>
                  </section>

                  <section className="guide-mode" aria-label="Single battle team building">
                    <p className="guide-mode-title">
                      <strong>🔵 Single (1v1)</strong>
                    </p>
                    <ul className="guide-list">
                      <li>
                        <strong>แนวคิด</strong>: เน้นตัวเดียวทำงานได้ ต้องมีทั้งดาเมจ/รับ/สร้างจังหวะในทีมรวมกัน
                      </li>
                      <li>
                        <strong>Hazard</strong>: ใช้ hazard เช่น <strong>Stealth Rock</strong> เพื่อกดดันระยะยาว
                      </li>
                      <li>
                        <strong>Pivot</strong>: ใช้ pivot เพื่อสลับตัวและคุมจังหวะเกม
                      </li>
                      <li>
                        <strong>Setup</strong>: มี <strong>Setup Sweeper</strong> เพื่อหาจังหวะบัฟแล้วปิดเกม
                      </li>
                    </ul>
                  </section>

                  <section className="guide-mode" aria-label="Double battle team building">
                    <p className="guide-mode-title">
                      <strong>🟣 Double (2v2)</strong>
                    </p>
                    <ul className="guide-list">
                      <li>
                        <strong>Synergy</strong>: เน้นการเล่นเป็นคู่เพื่อหา combo ระหว่างโปเกมอน เช่น บัฟ + โจมตี
                      </li>
                      <li>
                        <strong>Speed</strong>: มี Speed Control เพื่อกำหนดลำดับการโจมตี เช่น Tailwind / Trick Room ตามสไตล์ทีม
                      </li>
                      <li>
                        <strong>Spread</strong>: ใช้ท่าหมู่เพื่อกดดันทั้งสองตัวในสนาม
                      </li>
                    </ul>
                  </section>
                </div>
                <p className="guide-paragraph guide-muted">
                  หมวด “จัดทีม (Build Team)” ในแอปยังอยู่ระหว่างเตรียมข้อมูล แต่แนวคิดด้านบนใช้วางทีมได้ทันที
                </p>
              </div>
            </details>

            <details className="guide-card">
              <summary className="guide-card-summary">5) สิ่งที่ไม่ควรทำ</summary>
              <div className="guide-card-body">
                <ul className="guide-list">
                  <li><strong>1)</strong> ไม่ดูธาตุแล้วฝืนตีท่าที่โดนต้านทานซ้ำๆ</li>
                  <li><strong>2)</strong> ไม่สนใจ Physical/Special แล้วเลือกท่าผิดฝั่งกับสเตตัสหลักของตัวเอง</li>
                  <li><strong>3)</strong> ใส่ท่าซ้ำ เช่น 4 ท่าดาเมจประเภทเดียว จนไม่มีทางแก้สถานการณ์</li>
                  <li><strong>4)</strong> ทำทีมที่แพ้ประเภทเดียวกันเยอะเกินไป โดยไม่รู้ว่าจุดอ่อนคืออะไร</li>
                  <li><strong>5)</strong> มองข้ามความแม่นยำอาจทำให้พลาดในจังหวะสำคัญได้</li>
                </ul>
                <div className="guide-actions">
                  <button type="button" className="guide-link-btn" onClick={goToTipsType}>
                    ไปหน้า Type
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GuideTab;
