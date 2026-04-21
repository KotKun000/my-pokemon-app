import { useEffect, useState } from 'react';
import battleStatusData from '../data/battleStatus_th.json';
import battleTerrainData from '../data/battleTerrain_th.json';
import battleWeatherData from '../data/battleWeather_th.json';
import movePriorityData from '../data/movePriority_th.json';
import movesData from '../data/moves_th.json';
import { loadTypeCards, typeLabelEn } from '../utils/typeMatchups';
import { TYPE_COLORS } from '../utils/typeColors';
import { getBattleStatusIconUrl } from '../utils/statusIcons';
import { getBattleTerrainIconUrl } from '../utils/terrainIcons';
import { getBattleWeatherIconUrl } from '../utils/weatherIcons';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';

const PRIORITY_MOVES_INDEX = Object.fromEntries(movesData.map((m) => [m.name, m]));

const MOVE_ICON_BASE = import.meta.env.BASE_URL || '/';

function getDamageClassIconUrl(damageClass) {
  const iconMap = {
    physical: `${MOVE_ICON_BASE}MoveClassIcon/move-physical.png`,
    special: `${MOVE_ICON_BASE}MoveClassIcon/move-special.png`,
    status: `${MOVE_ICON_BASE}MoveClassIcon/move-status.png`,
  };
  return iconMap[damageClass] || iconMap.status;
}

/** แปลงชื่อท่าแบบที่แสดงในตาราง (เช่น King's Shield) เป็น slug ใน moves_th.json */
function displayNameToMoveSlug(display) {
  return display
    .trim()
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function parsePriorityMoveSegment(segment) {
  const trimmed = segment.trim();
  const footnoteMatch = trimmed.match(/^(.*)\[([a-z])\]$/i);
  const baseLabel = footnoteMatch ? footnoteMatch[1].trim() : trimmed;
  const footnoteMark = footnoteMatch ? footnoteMatch[2].toLowerCase() : null;
  const slug = displayNameToMoveSlug(baseLabel);
  return { baseLabel, footnoteMark, slug };
}

const TIPS_SUB_TABS = [
  { key: 'types', label: 'การแพ้ชนะของประเภทต่างๆ' },
  { key: 'statusNonVolatile', label: 'สถานะถาวร' },
  { key: 'statusVolatile', label: 'สถานะชั่วคราว' },
  { key: 'weather', label: 'สภาพอากาศ' },
  { key: 'terrain', label: 'Terrain' },
  { key: 'priority', label: 'Priority' },
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

function formatMovePriority(p) {
  return p > 0 ? `+${p}` : `${p}`;
}

function PriorityMoveRow({ segment, muted }) {
  const { baseLabel, footnoteMark, slug } = parsePriorityMoveSegment(segment);
  const isPlainLabel = baseLabel === 'All other moves' || baseLabel === 'None';

  if (isPlainLabel) {
    return (
      <li
        className={`move-list-item tips-priority-move-item${muted ? ' tips-priority-move-item--muted' : ''}`}
      >
        <span
          className="move-list-name tips-priority-move-name-only"
          style={{ color: muted ? '#94a3b8' : '#1e293b' }}
        >
          {baseLabel}
        </span>
      </li>
    );
  }

  const info = PRIORITY_MOVES_INDEX[slug];
  const displayName = info?.name ? info.name.replace(/-/g, ' ') : baseLabel;

  return (
    <li
      className={`move-list-item tips-priority-move-item${muted ? ' tips-priority-move-item--muted' : ''}`}
    >
      {info?.type && (
        <img
          src={getTypeIconUrl(info.type)}
          alt={info.type}
          className="move-list-type-icon"
          style={{ borderColor: TYPE_COLORS[info.type] || '#94a3b8' }}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = getFallbackTypeIconUrl(info.type);
          }}
        />
      )}
      <span className="move-list-name">
        {displayName}
        {footnoteMark ? (
          <sup className="tips-priority-move-footnote-mark">{footnoteMark}</sup>
        ) : null}
      </span>
      {info?.damage_class && (
        <img
          src={getDamageClassIconUrl(info.damage_class)}
          alt={info.damage_class}
          className="move-list-damage-icon"
          loading="lazy"
          decoding="async"
        />
      )}
    </li>
  );
}

function PriorityMovesList({ movesText, muted }) {
  if (!movesText) {
    return null;
  }
  const segments = movesText.split(',').map((s) => s.trim()).filter(Boolean);
  return (
    <ul className="moves-list tips-priority-moves-list" aria-label="รายการท่า">
      {segments.map((seg, i) => (
        <PriorityMoveRow key={`${seg}-${i}`} segment={seg} muted={muted} />
      ))}
    </ul>
  );
}

function PrioritySubPanel() {
  const lead = movePriorityData.lead || [];
  const rows = movePriorityData.rows || [];
  const footnotes = movePriorityData.footnotes || [];
  const caption = movePriorityData.tableCaption || 'ตาราง Priority';

  return (
    <section className="pokemon-detail-section tips-priority-section">
      <div className="tips-priority-intro">
        {lead.map((text, index) => (
          <p key={index} className="tips-priority-lead">
            {text}
          </p>
        ))}
      </div>

      <div className="tips-priority-table-scroll">
        <table className="tips-priority-table tips-priority-table--reference">
          <caption className="tips-priority-table-caption">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Priority</th>
              <th scope="col">Moves</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const accent = row.accent || '#64748b';
              const muted = row.muted;
              return (
                <tr
                  key={row.priority}
                  className={`tips-priority-table-row${muted ? ' tips-priority-table-row--muted' : ''}`}
                  style={{ '--tips-row-accent': accent }}
                >
                  <td className="tips-priority-table-cell tips-priority-table-cell--num">
                    <span className="tips-priority-table-num">{formatMovePriority(row.priority)}</span>
                  </td>
                  <td
                    className={`tips-priority-table-cell tips-priority-table-cell--movesPlain${muted ? ' tips-priority-moves--muted' : ''}`}
                  >
                    <PriorityMovesList movesText={row.movesText || ''} muted={muted} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {footnotes.length > 0 && (
        <ul className="tips-priority-footnotes" aria-label="หมายเหตุท้ายตาราง">
          {footnotes.map((fn) => (
            <li key={fn.mark} className="tips-priority-footnote-line">
              <sup className="tips-priority-footnote-sup">{fn.mark}</sup>
              <span>{fn.textTh}</span>
            </li>
          ))}
        </ul>
      )}
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

function TipsTab({ initialSub = 'types' }) {
  const [activeSub, setActiveSub] = useState(initialSub);
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveSub(initialSub || 'types');
  }, [initialSub]);

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
          {activeSub === 'priority' && <PrioritySubPanel />}
        </div>
      </div>
    </section>
  );
}

export default TipsTab;
