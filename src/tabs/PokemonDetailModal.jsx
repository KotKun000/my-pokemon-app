import { useEffect, useState } from 'react';
import { getDefensiveChart } from '../utils/pokemonTypeDefense';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';
import ABILITY_TH from '../data/abilities_th';
import { getTypeBorderStyle, TYPE_COLORS } from '../utils/typeColors';

const abilityCache = {};
const evoChainCache = {};

/** แปลง chain node แบบ recursive เป็น array ของ stages
 *  แต่ละ stage เป็น array ของ species (รองรับ branching เช่น Eevee) */
function flattenChain(node) {
  const stages = [];
  const walk = (n, depth) => {
    if (!stages[depth]) stages[depth] = [];
    const detail = n.evolution_details?.[0] || {};
    stages[depth].push({
      name: n.species.name,
      trigger: detail.trigger?.name || null,
      minLevel: detail.min_level || null,
      item: detail.item?.name || null,
    });
    for (const child of n.evolves_to) {
      walk(child, depth + 1);
    }
  };
  walk(node, 0);
  return stages;
}

/** ดึงข้อมูล image & types ของโปเกมอน 1 ตัว */
async function fetchPokeDetail(name) {
  try {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`);
    if (!r.ok) return { name, image: '', types: [] };
    const d = await r.json();
    return {
      name,
      id: d.id,
      image:
        d.sprites.other?.['official-artwork']?.front_default ||
        d.sprites.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d.id}.png`,
      types: d.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    };
  } catch {
    return { name, image: '', types: [] };
  }
}

/** ดึง mega / gmax varieties ของ species หนึ่ง ผ่าน pokemon-species API */
async function fetchSpecialForms(speciesName) {
  try {
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(speciesName)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const forms = (data.varieties || [])
      .filter((v) => !v.is_default)
      .map((v) => v.pokemon.name)
      .filter((n) => n.includes('-mega') || n.includes('-gmax'));
    return forms;
  } catch {
    return [];
  }
}

async function fetchEvolutionChain(pokemonName) {
  if (evoChainCache[pokemonName]) return evoChainCache[pokemonName];
  try {
    const specRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(pokemonName)}`
    );
    if (!specRes.ok) return [];
    const specData = await specRes.json();
    const chainUrl = specData.evolution_chain?.url;
    if (!chainUrl) return [];

    const chainRes = await fetch(chainUrl);
    if (!chainRes.ok) return [];
    const chainData = await chainRes.json();
    const stages = flattenChain(chainData.chain);

    // fetch image & types for each species in the chain
    const allNames = stages.flat().map((s) => s.name);
    const pokeDetails = await Promise.all(allNames.map(fetchPokeDetail));
    const detailMap = {};
    for (const p of pokeDetails) detailMap[p.name] = p;

    const result = stages.map((stage) =>
      stage.map((s) => ({ ...s, ...detailMap[s.name] }))
    );

    // ─── ค้นหาร่าง Mega / G-Max ของทุก species ใน chain ───
    const formChecks = await Promise.all(
      allNames.map(async (name) => {
        const forms = await fetchSpecialForms(name);
        return { baseName: name, forms };
      })
    );

    const megaEntries = [];
    const gmaxEntries = [];

    for (const { baseName, forms } of formChecks) {
      if (forms.length === 0) continue;
      const formDetails = await Promise.all(forms.map(fetchPokeDetail));
      for (const fd of formDetails) {
        const label = fd.name.includes('-mega')
          ? `Mega ${fd.name.includes('-mega-x') ? 'X' : fd.name.includes('-mega-y') ? 'Y' : ''}`
          : 'G-Max';
        const entry = {
          ...fd,
          trigger: fd.name.includes('-mega') ? 'mega-evolution' : 'gigantamax',
          minLevel: null,
          item: null,
          formLabel: label.trim(),
          baseName,
        };
        if (fd.name.includes('-mega')) {
          megaEntries.push(entry);
        } else {
          gmaxEntries.push(entry);
        }
      }
    }

    const specialForms = [...megaEntries, ...gmaxEntries];
    if (specialForms.length > 0) {
      result.push(specialForms);
    }

    evoChainCache[pokemonName] = result;
    return result;
  } catch {
    return [];
  }
}

async function fetchAbilityDetail(name) {
  if (abilityCache[name]) return abilityCache[name];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/ability/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const en = data.effect_entries.find((e) => e.language.name === 'en');
    const flavor = data.flavor_text_entries.find((e) => e.language.name === 'en');
    const result = {
      name: data.name,
      shortEffect: en?.short_effect || flavor?.flavor_text?.replace(/[\n\f]/g, ' ') || '',
      generation: data.generation?.name?.replace('generation-', '').toUpperCase() || '',
    };
    abilityCache[name] = result;
    return result;
  } catch {
    return { name, shortEffect: '', generation: '' };
  }
}

function AbilityIcon({ hidden }) {
  if (hidden) {
    return (
      <svg className="ability-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg className="ability-card-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
    </svg>
  );
}

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
  const [abilityDetails, setAbilityDetails] = useState([]);
  const [evoChain, setEvoChain] = useState([]);
  const [showEvo, setShowEvo] = useState(false);
  const [evoLoading, setEvoLoading] = useState(false);

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

        const abilityPromises = abilities.map((a) =>
          fetchAbilityDetail(a.name).then((d) => ({ ...d, isHidden: a.isHidden }))
        );
        const abDetails = await Promise.all(abilityPromises);
        if (cancelled) return;
        setAbilityDetails(abDetails);

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
        style={detail ? getTypeBorderStyle(detail.types) : {}}
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
            <div
              className="pokemon-detail-art"
              style={getTypeBorderStyle(detail.types, '#f8fafc')}
            >
              <div className="pokemon-detail-type-stack">
                {detail.types.map((type) => (
                  <img
                    key={type}
                    src={getTypeIconUrl(type)}
                    alt={type}
                    className="pokemon-detail-type-icon"
                    style={{ borderColor: TYPE_COLORS[type] || '#94a3b8' }}
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
                <div className="ability-card-list">
                  {(abilityDetails.length ? abilityDetails : detail.abilities).map((a) => (
                    <div
                      key={a.name}
                      className={`ability-card ${a.isHidden ? 'ability-card--hidden' : ''}`}
                    >
                      <div className="ability-card-header">
                        <AbilityIcon hidden={a.isHidden} />
                        <span className="ability-card-name">{a.name}</span>
                        {a.isHidden && <span className="ability-card-badge">Hidden</span>}
                        {a.generation && (
                          <span className="ability-card-gen">Gen {a.generation}</span>
                        )}
                      </div>
                      {(ABILITY_TH[a.name]?.desc || a.shortEffect) && (
                        <p className="ability-card-desc">
                          {ABILITY_TH[a.name]?.desc || a.shortEffect}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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

            <section className="pokemon-detail-evo">
              <button
                type="button"
                className="evo-toggle-btn"
                onClick={async () => {
                  const next = !showEvo;
                  setShowEvo(next);
                  if (next && evoChain.length === 0) {
                    setEvoLoading(true);
                    const chain = await fetchEvolutionChain(detail.name);
                    setEvoChain(chain);
                    setEvoLoading(false);
                  }
                }}
              >
                <span>{showEvo ? '▼' : '▶'} ร่างวิวัฒนาการ (Evolution)</span>
              </button>
              {evoLoading && <p className="evo-loading">กำลังโหลดข้อมูลวิวัฒนาการ...</p>}
              {showEvo && !evoLoading && evoChain.length <= 1 && (
                <p className="evo-loading">โปเกมอนตัวนี้ไม่มีร่างวิวัฒนาการ</p>
              )}
              {showEvo && !evoLoading && evoChain.length > 1 && (
                <div className="evo-chain">
                  {evoChain.map((stage, si) => (
                    <div key={si} className="evo-stage-group">
                      {si > 0 && (
                        <div className="evo-arrow">
                          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </div>
                      )}
                      <div className={`evo-stage ${stage.length > 1 ? 'evo-stage--branch' : ''}`}>
                        {stage.map((evo) => (
                          <div
                            key={evo.name}
                            className={`evo-card ${evo.name === detail.name ? 'evo-card--current' : ''}`}
                            style={getTypeBorderStyle(evo.types || [])}
                          >
                            {evo.image && (
                              <img
                                src={evo.image}
                                alt={evo.name}
                                className="evo-card-image"
                                loading="lazy"
                              />
                            )}
                            {evo.formLabel && (
                              <span className={`evo-card-form-label ${evo.trigger === 'gigantamax' ? 'evo-card-form-label--gmax' : 'evo-card-form-label--mega'}`}>
                                {evo.formLabel}
                              </span>
                            )}
                            <span className="evo-card-name">
                              {evo.formLabel ? evo.baseName : evo.name}
                            </span>
                            <div className="evo-card-types">
                              {(evo.types || []).map((t) => (
                                <img
                                  key={t}
                                  src={getTypeIconUrl(t)}
                                  alt={t}
                                  className="evo-card-type-icon"
                                  style={{ borderColor: TYPE_COLORS[t] || '#94a3b8' }}
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = getFallbackTypeIconUrl(t);
                                  }}
                                />
                              ))}
                            </div>
                            {!evo.formLabel && evo.trigger && (
                              <span className="evo-card-trigger">
                                {evo.minLevel ? `Lv.${evo.minLevel}` : evo.item ? evo.item.replace(/-/g, ' ') : evo.trigger.replace(/-/g, ' ')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

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
