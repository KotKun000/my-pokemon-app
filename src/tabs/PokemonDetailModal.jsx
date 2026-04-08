import { useEffect, useState } from 'react';
import { getDefensiveChart } from '../utils/pokemonTypeDefense';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';

const STAT_ORDER = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special-attack', label: 'Sp. Atk' },
  { key: 'special-defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
];

function formatMult(m) {
  if (m === 0) return '0';
  if (m === 0.25) return '1/4';
  if (m === 0.5) return '1/2';
  if (m === 1) return '1';
  if (m === 2) return '2';
  if (m === 4) return '4';
  return String(m);
}

function PokemonDetailModal({ pokemonName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [defensiveRows, setDefensiveRows] = useState([]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!pokemonName) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setDetail(null);
        setDefensiveRows([]);

        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemonName)}`
        );
        if (!res.ok) throw new Error('โหลดข้อมูลโปเกมอนไม่สำเร็จ');
        const data = await res.json();
        if (cancelled) return;

        const types = data.types
          .sort((a, b) => a.slot - b.slot)
          .map((t) => t.type.name);

        const statsMap = {};
        for (const s of data.stats) {
          statsMap[s.stat.name] = s.base_stat;
        }

        const abilities = data.abilities
          .sort((a, b) => a.slot - b.slot)
          .map((a) => ({
            name: a.ability.name,
            isHidden: a.is_hidden,
          }));

        const image =
          data.sprites.other?.['official-artwork']?.front_default ||
          data.sprites.front_default ||
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`;

        setDetail({
          id: data.id,
          name: data.name,
          heightDm: data.height,
          weightHg: data.weight,
          types,
          statsMap,
          abilities,
          image,
        });

        const chart = await getDefensiveChart(types);
        if (!cancelled) {
          setDefensiveRows(chart.filter((row) => row.multiplier !== 1));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'เกิดข้อผิดพลาด');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pokemonName]);

  const totalStats =
    detail &&
    STAT_ORDER.reduce((sum, { key }) => sum + (detail.statsMap[key] ?? 0), 0);

  return (
    <div
      className="pokemon-detail-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="pokemon-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pokemon-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pokemon-detail-header">
          <h2 id="pokemon-detail-title" className="pokemon-detail-title">
            รายละเอียดโปเกมอน
          </h2>
          <button
            type="button"
            className="pokemon-detail-close"
            onClick={onClose}
            aria-label="ปิด"
          >
            ×
          </button>
        </div>

        {loading && (
          <p className="status-message pokemon-detail-status">กำลังโหลด...</p>
        )}
        {error && (
          <p className="status-message pokemon-detail-status">{error}</p>
        )}

        {!loading && !error && detail && (
          <div className="pokemon-detail-body">
            <div className="pokemon-detail-art">
              <div className="pokemon-detail-type-stack">
                {detail.types.map((type) => (
                  <img
                    key={type}
                    src={getTypeIconUrl(type)}
                    alt={type}
                    className="pokemon-detail-type-icon"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = getFallbackTypeIconUrl(type);
                    }}
                  />
                ))}
              </div>
              <img
                src={detail.image}
                alt={detail.name}
                className="pokemon-detail-image"
              />
            </div>

            <div className="pokemon-detail-main">
              <h3 className="pokemon-detail-name">{detail.name}</h3>
              <p className="pokemon-detail-meta">
                National No. #{String(detail.id).padStart(4, '0')} · สูง{' '}
                {(detail.heightDm / 10).toFixed(1)} m · น้ำหนัก{' '}
                {(detail.weightHg / 10).toFixed(1)} kg
              </p>

              <section className="pokemon-detail-section">
                <h4>ความสามารถ (Abilities)</h4>
                <ul className="pokemon-detail-abilities">
                  {detail.abilities.map((a) => (
                    <li key={a.name}>
                      {a.name}
                      {a.isHidden ? (
                        <span className="pokemon-detail-hidden"> (Hidden)</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="pokemon-detail-section">
                <h4>สเตตส์ฐาน (Base stats)</h4>
                <p className="pokemon-detail-total">
                  รวม: <strong>{totalStats}</strong>
                </p>
                <ul className="pokemon-detail-stats">
                  {STAT_ORDER.map(({ key, label }) => {
                    const value = detail.statsMap[key] ?? 0;
                    const pct = Math.min(100, Math.round((value / 255) * 100));
                    return (
                      <li key={key} className="pokemon-detail-stat-row">
                        <span className="pokemon-detail-stat-label">{label}</span>
                        <div className="pokemon-detail-stat-bar-wrap">
                          <div
                            className="pokemon-detail-stat-bar"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="pokemon-detail-stat-num">{value}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <section className="pokemon-detail-defense">
              <h4>ความต้านทานต่อธาตุ (รับความเสียหาย)</h4>
              <p className="pokemon-detail-defense-note">
                แสดงเฉพาะธาตุที่ไม่ใช่ ×1 (ธาตุอื่นรับความเสียหายตามปกติ)
              </p>
              {defensiveRows.length === 0 ? (
                <p className="pokemon-detail-defense-note">
                  ทุกธาตุโจมตีรับความเสียหาย ×1
                </p>
              ) : (
                <ul className="pokemon-detail-defense-list">
                  {defensiveRows.map((row) => (
                    <li
                      key={row.attackingType}
                      className="pokemon-detail-defense-item"
                    >
                      <img
                        src={getTypeIconUrl(row.attackingType)}
                        alt={row.attackingType}
                        className="pokemon-detail-defense-type-icon"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = getFallbackTypeIconUrl(
                            row.attackingType
                          );
                        }}
                      />
                      <span className="pokemon-detail-defense-mult">
                        ×{formatMult(row.multiplier)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default PokemonDetailModal;
