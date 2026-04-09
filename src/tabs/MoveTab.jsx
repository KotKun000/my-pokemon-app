import { useMemo, useState } from 'react';
import movesData from '../data/moves_th.json';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';

function MoveTab() {
  const [query, setQuery] = useState('');

  const filteredMoves = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return movesData;

    return movesData.filter(
      (move) => move.name.toLowerCase().includes(keyword)
    );
  }, [query]);

  return (
    <>
      <div className="search-panel">
        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="พิมพ์ชื่อท่า เช่น thunderbolt"
            className="search-input"
          />
        </div>
      </div>

      {filteredMoves.length === 0 && (
        <p className="status-message">ไม่พบท่าที่ตรงกับคำค้น `{query}`</p>
      )}

      <section className="moves-grid">
        {filteredMoves.map((move) => (
          <article key={move.id} className="move-card">
            <header className="move-head">
              <h2 className="move-name">{move.name}</h2>
              <div className="move-type-wrap">
                <span className="type-label">ธาตุ</span>
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
                <span className="type-badge">{move.damage_class}</span>
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
    </>
  );
}

export default MoveTab;
