import { useEffect, useState } from 'react';
import battleStatusData from '../data/battleStatus_th.json';
import battleTerrainData from '../data/battleTerrain_th.json';
import battleWeatherData from '../data/battleWeather_th.json';
import { loadTypeCards, typeLabelEn } from '../utils/typeMatchups';
import { TYPE_COLORS } from '../utils/typeColors';
import { getBattleStatusIconUrl } from '../utils/statusIcons';
import { getBattleTerrainIconUrl } from '../utils/terrainIcons';
import { getBattleWeatherIconUrl } from '../utils/weatherIcons';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';

const TIPS_SUB_TABS = [
  { key: 'types', label: 'การแพ้ชนะของประเภทต่างๆ' },
  { key: 'statusNonVolatile', label: 'สถานะถาวร' },
  { key: 'statusVolatile', label: 'สถานะชั่วคราว)' },
  { key: 'weather', label: 'สภาพอากาศ' },
  { key: 'terrain', label: 'Terrain' },
];

function TypeIcon({ type, className = 'tips-chip-icon' }) {
  return (
    <img
      src={getTypeIconUrl(type)}
      alt=""
      className={className}
      onError={(e) => {
        e.currentTarget.src = getFallbackTypeIconUrl(type);
      }}
    />
  );
}

function TypeChipList({ types }) {
  if (!types.length) {
    return <p className="tips-empty-line">ไม่มี</p>;
  }
  return (
    <ul className="tips-type-chip-row">
      {types.map((t) => (
        <li key={t}>
          <span
            className="tips-type-chip"
            style={{ borderColor: TYPE_COLORS[t] || '#cbd5e1' }}
          >
            <TypeIcon type={t} />
            <span className="tips-type-chip-label">{typeLabelEn(t)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function TypeCard({ card }) {
  const accent = TYPE_COLORS[card.type] || '#94a3b8';

  return (
    <article
      className="tips-type-card"
      style={{ '--tips-card-accent': accent }}
      aria-labelledby={`tips-type-title-${card.type}`}
    >
      <header className="tips-type-card-head">
        <TypeIcon type={card.type} className="tips-type-card-icon" />
        <div className="tips-type-card-head-text">
          <h3 className="tips-type-card-title" id={`tips-type-title-${card.type}`}>
            {card.labelEn}
          </h3>
        </div>
      </header>

      <div className="tips-type-card-body">
        <div className="tips-card-col">
          <p className="tips-card-col-label">โจมตี</p>
          <div className="tips-match-block">
            <h4 className="tips-match-title tips-match-se">แรงขึ้น ×2</h4>
            <TypeChipList types={card.attackSE} />
          </div>
          <div className="tips-match-block">
            <h4 className="tips-match-title tips-match-nve">เบาลง ×½</h4>
            <TypeChipList types={card.attackNVE} />
          </div>
          <div className="tips-match-block">
            <h4 className="tips-match-title tips-match-imm">ไม่เข้า ×0</h4>
            <TypeChipList types={card.attackImmune} />
          </div>
        </div>

        <div className="tips-card-divider" role="separator" aria-hidden="true" />

        <div className="tips-card-col">
          <p className="tips-card-col-label">ป้องกัน</p>
          <div className="tips-match-block">
            <h4 className="tips-match-title tips-match-se">โดนแรงขึ้น ×2</h4>
            <TypeChipList types={card.defendWeak} />
          </div>
          <div className="tips-match-block">
            <h4 className="tips-match-title tips-match-nve">เบาลง ×½</h4>
            <TypeChipList types={card.defendResist} />
          </div>
          <div className="tips-match-block">
            <h4 className="tips-match-title tips-match-imm">ไม่รับผล ×0</h4>
            <TypeChipList types={card.defendImmune} />
          </div>
        </div>
      </div>

      {card.specialTraits.length > 0 && (
        <footer className="tips-type-card-foot">
          <h4 className="tips-special-title">คุณสมบัติพิเศษ</h4>
          <ul className="tips-special-list">
            {card.specialTraits.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}

function StatusCard({ item }) {
  const accent = item.accent || '#64748b';

  return (
    <article
      className="tips-status-card"
      style={{ '--tips-card-accent': accent }}
      aria-labelledby={`tips-status-${item.id}`}
    >
      <header className="tips-status-card-head">
        <h3 className="tips-status-card-title" id={`tips-status-${item.id}`}>
          <span className="tips-status-card-name">{item.nameEn}</span>
          <img
            src={getBattleStatusIconUrl(item.id)}
            alt=""
            className="tips-status-card-icon"
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </h3>
      </header>
      <ul className="tips-status-card-lines">
        {(item.lines || []).map((line, index) => (
          <li key={`${item.id}-${index}`}>{line}</li>
        ))}
      </ul>
    </article>
  );
}

function StatusSubPanel({ category }) {
  const items = battleStatusData.filter((item) => item.category === category);
  return (
    <section className="pokemon-detail-section tips-status-section">
      <h4>{category === 'nonVolatile' ? 'สถานะที่หากเปลี่ยนตัวออกไปก็ยังคงสถานะไว้ได้' : 'สถานะที่หากเปลี่ยนตัวออกไปก็จะหายไป'}</h4>
      <div className="tips-type-grid">
        {items.map((item) => (
          <StatusCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function WeatherCard({ item }) {
  const accent = item.accent || '#64748b';

  return (
    <article
      className="tips-status-card tips-weather-card"
      style={{ '--tips-card-accent': accent }}
      aria-labelledby={`tips-weather-${item.id}`}
    >
      <header className="tips-status-card-head">
        <h3 className="tips-status-card-title" id={`tips-weather-${item.id}`}>
          <span className="tips-status-card-name">{item.nameEn}</span>
          <img
            src={getBattleWeatherIconUrl(item.id)}
            alt=""
            className="tips-status-card-icon"
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </h3>
      </header>
      <ul className="tips-status-card-lines">
        {(item.lines || []).map((line, index) => (
          <li key={`${item.id}-${index}`}>{line}</li>
        ))}
      </ul>
    </article>
  );
}

function WeatherSubPanel() {
  return (
    <section className="pokemon-detail-section tips-weather-section">
      <div className="tips-weather-card-container">
        <p className="tips-weather-lead">
          หลังจากถูกเปิดใช้งานสภาพอากาศ จะมีระยะเวลา 5 เทิร์นหลังจากนั้นสภาพอากาศจะถูกลบออก
        </p>
      </div>
      <div className="tips-type-grid">
        {battleWeatherData.map((item) => (
          <WeatherCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function TerrainCard({ item }) {
  const accent = item.accent || '#64748b';

  return (
    <article
      className="tips-status-card tips-terrain-card"
      style={{ '--tips-card-accent': accent }}
      aria-labelledby={`tips-terrain-${item.id}`}
    >
      <header className="tips-status-card-head">
        <h3 className="tips-status-card-title" id={`tips-terrain-${item.id}`}>
          <span className="tips-status-card-name">{item.nameEn}</span>
          <img
            src={getBattleTerrainIconUrl(item.id)}
            alt=""
            className="tips-status-card-icon"
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </h3>
      </header>
      <ul className="tips-status-card-lines">
        {(item.lines || []).map((line, index) => (
          <li key={`${item.id}-${index}`}>{line}</li>
        ))}
      </ul>
    </article>
  );
}

function TerrainSubPanel() {
  return (
    <section className="pokemon-detail-section tips-terrain-section">
      <p className="tips-terrain-lead">
        มีระยะเวลา 5 เทิร์นหลังจากถูกเปิดใช้งาน Terrain จะถูกลบออก
        โปเกมอนที่อยู่บนสนามจะได้รับผลของ Terrain ตามประเภทของสนาม ยกเว้นโปเกมอนประเภท Flying หรือ Ability Levitate
      </p>
      <div className="tips-type-grid">
        {battleTerrainData.map((item) => (
          <TerrainCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function TypesSubPanel({ cards, loading, error }) {
  return (
    <>
      {loading && (
        <p className="status-message pokemon-detail-status">กำลังโหลดข้อมูลธาตุ...</p>
      )}
      {error && (
        <p className="status-message tips-error pokemon-detail-status">{error}</p>
      )}
      {!loading && !error && cards && (
        <section className="pokemon-detail-section tips-types-section">
          <div className="tips-type-grid">
            {cards.map((card) => (
              <TypeCard key={card.type} card={card} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function TipsTab() {
  const [activeSub, setActiveSub] = useState('types');
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadTypeCards()
      .then((data) => {
        if (!cancelled) setCards(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'โหลดข้อมูลธาตุไม่สำเร็จ');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="tips-panel" aria-label="เรื่องควรรู้">
      <div
        className="pokemon-detail-modal tips-detail-embed"
        role="region"
        aria-labelledby="tips-detail-title"
      >
        <nav
          className="tips-detail-subnav moves-method-filter"
          aria-label="หมวดในเรื่องควรรู้"
        >
          {TIPS_SUB_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`moves-method-btn ${activeSub === tab.key ? 'active' : ''}`}
              onClick={() => setActiveSub(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="tips-detail-content">
          {activeSub === 'types' && (
            <TypesSubPanel cards={cards} loading={loading} error={error} />
          )}
          {activeSub === 'statusNonVolatile' && (
            <StatusSubPanel category="nonVolatile" />
          )}
          {activeSub === 'statusVolatile' && <StatusSubPanel category="volatile" />}
          {activeSub === 'weather' && <WeatherSubPanel />}
          {activeSub === 'terrain' && <TerrainSubPanel />}
        </div>
      </div>
    </section>
  );
}

export default TipsTab;
