import './App.css';
import { useMemo, useState } from 'react';
import movesData from './data/moves_th.json';

const getTypeIconUrl = (type) =>
  `https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/${type.toLowerCase()}.png`;

const getFallbackTypeIconUrl = (type) =>
  `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type.toLowerCase()}.svg`;

function App() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredMoves = useMemo(() => {
    const keyword = searched.trim().toLowerCase();
    if (!keyword) return [];

    return movesData.filter(
      (move) =>
        move.name.toLowerCase().includes(keyword) ||
        move.type.toLowerCase().includes(keyword)
    );
  }, [searched]);

  const suggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];

    const matchedMoves = [];
    const seen = new Set();

    for (const move of movesData) {
      const moveName = move.name.toLowerCase();
      if (seen.has(moveName)) continue;

      if (moveName.startsWith(keyword) || moveName.includes(keyword)) {
        seen.add(moveName);
        matchedMoves.push({ name: move.name, type: move.type });
      }
    }

    return matchedMoves.slice(0, 8);
  }, [query]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearched(query);
    setActiveSuggestion(-1);
    setShowSuggestions(false);
  };

  const handlePickSuggestion = (value) => {
    setQuery(value);
    setSearched(value);
    setActiveSuggestion(-1);
    setShowSuggestions(false);
  };

  const handleInputKeyDown = (event) => {
    if (!suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      handlePickSuggestion(suggestions[activeSuggestion].name);
    } else if (event.key === 'Escape') {
      setActiveSuggestion(-1);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-section">
        <h1 className="hero-title">สมุดบันทึกท่าต่อสู้โปเกมอน</h1>
        <p className="hero-subtitle">
          ค้นหาชื่อท่าหรือธาตุ แล้วดูข้อมูลแบบอ่านง่ายในหน้าเดียว
        </p>
      </section>

      <form onSubmit={handleSearch} className="search-panel">
        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveSuggestion(-1);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleInputKeyDown}
            placeholder="พิมพ์ชื่อท่า เช่น thunderbolt หรือ fire"
            className="search-input"
          />
          {showSuggestions && suggestions.length > 0 && query.trim() && (
            <ul className="suggestion-list">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.name}-${suggestion.type}`}>
                  <button
                    type="button"
                    className={`suggestion-item ${index === activeSuggestion ? 'active' : ''}`}
                    onClick={() => handlePickSuggestion(suggestion.name)}
                  >
                    <img
                      src={getTypeIconUrl(suggestion.type)}
                      alt={`${suggestion.type} icon`}
                      className="suggestion-type-icon"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getFallbackTypeIconUrl(
                          suggestion.type
                        );
                      }}
                    />
                    {suggestion.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="search-button">
          ค้นหา
        </button>
      </form>

      {!searched.trim() && (
        <p className="status-message">
          พิมพ์คำค้นแล้วกดปุ่มค้นหาเพื่อดูข้อมูล Move
        </p>
      )}

      {searched.trim() && filteredMoves.length === 0 && (
        <p className="status-message">
          ไม่พบท่าที่ตรงกับคำค้น `{searched}`
        </p>
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
              </div>
            </header>

            <div className="move-stats">
              <p>
                พลัง: <span>{move.power}</span>
              </p>
              <p>
                แม่นยำ: <span>{move.accuracy}%</span>
              </p>
              <p>
                PP: <span>{move.pp}</span>
              </p>
            </div>

            <div className="move-description">
              <p>{move.description_th}</p>
            </div>
            <p className="move-origin">Original: {move.description_en}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
