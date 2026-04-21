import { useMemo, useState } from 'react';
import movesData from '../data/moves_th.json';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';

const getDamageClassIconUrl = (damageClass) => {
  const base = import.meta.env.BASE_URL || '/';
  const iconMap = {
    physical: `${base}MoveClassIcon/move-physical.png`,
    special: `${base}MoveClassIcon/move-special.png`,
    status: `${base}MoveClassIcon/move-status.png`,
  };
  return iconMap[damageClass] || iconMap.status;
};

const MOVE_PER_PAGE = 16;
const TYPE_CARD_STYLES = {
  normal: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#64748b',
    '--move-card-accent': '#64748b',
  },
  fire: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#ea580c',
    '--move-card-accent': '#ea580c',
  },
  water: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#2563eb',
    '--move-card-accent': '#2563eb',
  },
  electric: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#ca8a04',
    '--move-card-accent': '#ca8a04',
  },
  grass: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#16a34a',
    '--move-card-accent': '#16a34a',
  },
  ice: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#0891b2',
    '--move-card-accent': '#0891b2',
  },
  fighting: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#dc2626',
    '--move-card-accent': '#dc2626',
  },
  poison: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#9333ea',
    '--move-card-accent': '#9333ea',
  },
  ground: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#b45309',
    '--move-card-accent': '#b45309',
  },
  flying: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#7c3aed',
    '--move-card-accent': '#7c3aed',
  },
  psychic: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#db2777',
    '--move-card-accent': '#db2777',
  },
  bug: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#65a30d',
    '--move-card-accent': '#65a30d',
  },
  rock: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#78716c',
    '--move-card-accent': '#78716c',
  },
  ghost: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#6d28d9',
    '--move-card-accent': '#6d28d9',
  },
  dragon: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#4338ca',
    '--move-card-accent': '#4338ca',
  },
  dark: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#334155',
    '--move-card-accent': '#334155',
  },
  steel: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#475569',
    '--move-card-accent': '#475569',
  },
  fairy: {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#c026d3',
    '--move-card-accent': '#c026d3',
  },
};

const getMoveCardStyle = (type) =>
  TYPE_CARD_STYLES[type] || {
    '--move-card-bg': '#f8fafc',
    '--move-card-border': '#475569',
    '--move-card-accent': '#475569',
  };

const getDamageClassBadgeClass = (damageClass) => {
  if (!damageClass) return 'type-badge damage-class-badge damage-class-unknown';
  return `type-badge damage-class-badge damage-class-${damageClass}`;
};

function MoveTab() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDamageClass, setSelectedDamageClass] = useState('');
  const [movePage, setMovePage] = useState(1);

  const filteredMoves = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let data = movesData;

    if (selectedType) {
      data = data.filter((move) => move.type === selectedType);
    }

    if (selectedDamageClass) {
      data = data.filter((move) => move.damage_class === selectedDamageClass);
    }

    if (!keyword) return data;

    return data.filter((move) => move.name.toLowerCase().includes(keyword));
  }, [query, selectedType, selectedDamageClass]);

  const moveTypes = useMemo(() => {
    const typeSet = new Set();
    for (const move of movesData) {
      if (move.type) {
        typeSet.add(move.type);
      }
    }
    return Array.from(typeSet).sort();
  }, []);

  const damageClasses = ['physical', 'special', 'status'];

  const totalMovePages = Math.max(1, Math.ceil(filteredMoves.length / MOVE_PER_PAGE));

  const pagedMoves = useMemo(() => {
    const start = (movePage - 1) * MOVE_PER_PAGE;
    return filteredMoves.slice(start, start + MOVE_PER_PAGE);
  }, [filteredMoves, movePage]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisible = 8;
    const start = Math.max(1, movePage - 3);
    const end = Math.min(totalMovePages, start + maxVisible - 1);
    const correctedStart = Math.max(1, end - maxVisible + 1);
    const pages = [];
    for (let page = correctedStart; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [movePage, totalMovePages]);

  return (
    <>
      <div className="search-panel">
        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setMovePage(1);
            }}
            placeholder="พิมพ์ชื่อท่า เช่น thunderbolt"
            className="search-input"
          />
        </div>
      </div>

      <section className="type-filter-bar">
        <button
          type="button"
          className={`type-filter-btn ${selectedType === '' ? 'active' : ''}`}
          onClick={() => {
            setSelectedType('');
            setMovePage(1);
          }}
        >
          All
        </button>
        {moveTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`type-filter-btn ${selectedType === type ? 'active' : ''}`}
            onClick={() => {
              setSelectedType(type);
              setMovePage(1);
            }}
            title={type}
          >
            <img
              src={getTypeIconUrl(type)}
              alt={type}
              className="filter-type-icon"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = getFallbackTypeIconUrl(type);
              }}
            />
          </button>
        ))}
      </section>

      <section className="damage-class-filter-bar">
        <button
          type="button"
          className={`damage-class-filter-btn ${selectedDamageClass === '' ? 'active' : ''}`}
          onClick={() => {
            setSelectedDamageClass('');
            setMovePage(1);
          }}
        >
          All
        </button>
        {damageClasses.map((dc) => (
          <button
            key={dc}
            type="button"
            className={`damage-class-filter-btn ${selectedDamageClass === dc ? 'active' : ''}`}
            onClick={() => {
              setSelectedDamageClass(dc);
              setMovePage(1);
            }}
            title={dc}
          >
            <img
              src={getDamageClassIconUrl(dc)}
              alt={dc}
              className="filter-damage-class-icon"
              loading="lazy"
            />
          </button>
        ))}
      </section>

      {filteredMoves.length === 0 && (
        <p className="status-message">ไม่พบท่าที่ตรงกับคำค้น `{query}`</p>
      )}

      <section className="moves-grid">
        {pagedMoves.map((move) => (
          <article
            key={move.id}
            className="move-card"
            style={getMoveCardStyle(move.type)}
          >
            <header className="move-head">
              <h2 className="move-name">{move.name}</h2>
              <div className="move-type-wrap">
                <span className="type-badge">
                  <img
                    src={getTypeIconUrl(move.type)}
                    alt={`${move.type} icon`}
                    className="type-icon"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = getFallbackTypeIconUrl(move.type);
                    }}
                  />
                  {move.type}
                </span>
                <span className={getDamageClassBadgeClass(move.damage_class)}>
                  <img
                    src={getDamageClassIconUrl(move.damage_class)}
                    alt={move.damage_class}
                    className="damage-class-icon"
                    loading="lazy"
                  />
                </span>
              </div>
            </header>

            <div className="move-stats">
              <div className="move-stat">
                <span className="move-stat-label">ความแรง</span>
                <span className="move-stat-value">{move.power ?? '—'}</span>
              </div>
              <div className="move-stat">
                <span className="move-stat-label">แม่นยำ</span>
                <span className="move-stat-value">
                  {move.accuracy != null ? `${move.accuracy}` : '—'}
                </span>
              </div>
              <div className="move-stat">
                <span className="move-stat-label">Priority</span>
                <span className="move-stat-value">{move.priority ?? '—'}</span>
              </div>
              <div className="move-stat">
                <span className="move-stat-label">PP</span>
                <span className="move-stat-value">{move.pp ?? '—'}</span>
              </div>
            </div>

            <div className="move-description">
              <p>{move.description_th}</p>
            </div>
          </article>
        ))}
      </section>
      <div className="pagination-wrap">
        <button
          type="button"
          className="page-btn"
          onClick={() => setMovePage(1)}
          disabled={movePage === 1}
        >
          {'<<'}
        </button>
        <button
          type="button"
          className="page-btn"
          onClick={() => setMovePage((prev) => Math.max(1, prev - 1))}
          disabled={movePage === 1}
        >
          {'<'}
        </button>
        {visiblePageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            className={`page-btn ${movePage === page ? 'active' : ''}`}
            onClick={() => setMovePage(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          onClick={() => setMovePage((prev) => Math.min(totalMovePages, prev + 1))}
          disabled={movePage === totalMovePages}
        >
          {'>'}
        </button>
        <button
          type="button"
          className="page-btn"
          onClick={() => setMovePage(totalMovePages)}
          disabled={movePage === totalMovePages}
        >
          {'>>'}
        </button>
      </div>
    </>
  );
}

export default MoveTab;
