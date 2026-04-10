import { useMemo, useState } from 'react';
import movesData from '../data/moves_th.json';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';

const MOVE_PER_PAGE = 12;
const TYPE_CARD_STYLES = {
  normal: {
    '--move-card-bg': 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    '--move-card-border': '#cbd5e1',
    '--move-card-accent': '#64748b',
  },
  fire: {
    '--move-card-bg': 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)',
    '--move-card-border': '#fdba74',
    '--move-card-accent': '#ea580c',
  },
  water: {
    '--move-card-bg': 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
    '--move-card-border': '#93c5fd',
    '--move-card-accent': '#2563eb',
  },
  electric: {
    '--move-card-bg': 'linear-gradient(180deg, #fefce8 0%, #fef08a 100%)',
    '--move-card-border': '#facc15',
    '--move-card-accent': '#ca8a04',
  },
  grass: {
    '--move-card-bg': 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
    '--move-card-border': '#86efac',
    '--move-card-accent': '#16a34a',
  },
  ice: {
    '--move-card-bg': 'linear-gradient(180deg, #ecfeff 0%, #cffafe 100%)',
    '--move-card-border': '#67e8f9',
    '--move-card-accent': '#0891b2',
  },
  fighting: {
    '--move-card-bg': 'linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)',
    '--move-card-border': '#fda4af',
    '--move-card-accent': '#dc2626',
  },
  poison: {
    '--move-card-bg': 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)',
    '--move-card-border': '#d8b4fe',
    '--move-card-accent': '#9333ea',
  },
  ground: {
    '--move-card-bg': 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)',
    '--move-card-border': '#fcd34d',
    '--move-card-accent': '#b45309',
  },
  flying: {
    '--move-card-bg': 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)',
    '--move-card-border': '#c4b5fd',
    '--move-card-accent': '#7c3aed',
  },
  psychic: {
    '--move-card-bg': 'linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%)',
    '--move-card-border': '#f9a8d4',
    '--move-card-accent': '#db2777',
  },
  bug: {
    '--move-card-bg': 'linear-gradient(180deg, #f7fee7 0%, #ecfccb 100%)',
    '--move-card-border': '#bef264',
    '--move-card-accent': '#65a30d',
  },
  rock: {
    '--move-card-bg': 'linear-gradient(180deg, #fafaf9 0%, #e7e5e4 100%)',
    '--move-card-border': '#d6d3d1',
    '--move-card-accent': '#78716c',
  },
  ghost: {
    '--move-card-bg': 'linear-gradient(180deg, #f5f3ff 0%, #ddd6fe 100%)',
    '--move-card-border': '#a78bfa',
    '--move-card-accent': '#6d28d9',
  },
  dragon: {
    '--move-card-bg': 'linear-gradient(180deg, #eef2ff 0%, #e0e7ff 100%)',
    '--move-card-border': '#a5b4fc',
    '--move-card-accent': '#4338ca',
  },
  dark: {
    '--move-card-bg': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    '--move-card-border': '#94a3b8',
    '--move-card-accent': '#334155',
  },
  steel: {
    '--move-card-bg': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    '--move-card-border': '#94a3b8',
    '--move-card-accent': '#475569',
  },
  fairy: {
    '--move-card-bg': 'linear-gradient(180deg, #fdf2f8 0%, #fbcfe8 100%)',
    '--move-card-border': '#f9a8d4',
    '--move-card-accent': '#c026d3',
  },
};

const getMoveCardStyle = (type) =>
  TYPE_CARD_STYLES[type] || {
    '--move-card-bg': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    '--move-card-border': '#cbd5e1',
    '--move-card-accent': '#475569',
  };

const getDamageClassBadgeClass = (damageClass) => {
  if (!damageClass) return 'type-badge damage-class-badge damage-class-unknown';
  return `type-badge damage-class-badge damage-class-${damageClass}`;
};

function MoveTab() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [movePage, setMovePage] = useState(1);

  const filteredMoves = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let data = movesData;

    if (selectedType) {
      data = data.filter((move) => move.type === selectedType);
    }

    if (!keyword) return data;

    return data.filter((move) => move.name.toLowerCase().includes(keyword));
  }, [query, selectedType]);

  const moveTypes = useMemo(() => {
    const typeSet = new Set();
    for (const move of movesData) {
      if (move.type) {
        typeSet.add(move.type);
      }
    }
    return Array.from(typeSet).sort();
  }, []);

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
                <span className="type-label"></span>
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
                  {move.damage_class}
                </span>
              </div>
            </header>

            <div className="move-stats">
              <p>
                พลัง: <span>{move.power}</span>
              </p>
              <p>
                ความแม่นยำ: <span>{move.accuracy}%</span>
              </p>
              <p>
                PP: <span>{move.pp}</span>
              </p>
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
