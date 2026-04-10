import { useEffect, useState } from 'react';
import { getDefensiveChart } from '../utils/pokemonTypeDefense';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';
import ABILITY_TH from '../data/abilities_th';
import movesData from '../data/moves_th.json';
import { getTypeBorderStyle, TYPE_COLORS } from '../utils/typeColors';

const MOVES_INDEX = Object.fromEntries(movesData.map((m) => [m.name, m]));

const abilityCache = {};
const evoChainCache = {};
const itemCache = {};
const ITEMS_CACHE_KEY = 'poke_items_cache_v1';

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
    // ใช้ pokemon endpoint ก่อน เพื่อย้อนหา species หลักให้รองรับร่างพิเศษ (mega/gmax)
    const pokeRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemonName)}`
    );
    if (!pokeRes.ok) return [];
    const pokeData = await pokeRes.json();
    const speciesName = pokeData.species?.name || pokemonName;

    // cache ทั้งชื่อร่างและชื่อ species หลัก
    if (evoChainCache[speciesName]) {
      evoChainCache[pokemonName] = evoChainCache[speciesName];
      return evoChainCache[speciesName];
    }

    const specRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(speciesName)}`
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

    evoChainCache[speciesName] = result;
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

function formatEvolutionTrigger(evo) {
  if (evo.minLevel) return `Lv.${evo.minLevel}`;
  if (evo.item) return evo.item.replace(/-/g, ' ');
  if (evo.trigger) return evo.trigger.replace(/-/g, ' ');
  return '';
}

function readItemFromLocalCache(name) {
  try {
    const raw = localStorage.getItem(ITEMS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return items.find((item) => item.name === name) || null;
  } catch {
    return null;
  }
}

async function fetchItemDetail(name) {
  if (!name) return null;
  if (itemCache[name]) return itemCache[name];

  const cachedItem = readItemFromLocalCache(name);
  if (cachedItem) {
    itemCache[name] = cachedItem;
    return cachedItem;
  }

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/item/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const detail = {
      id: data.id,
      name: data.name,
      sprite: data.sprites?.default || '',
      category: data.category?.name || 'unknown',
      cost: data.cost ?? 0,
      flingPower: data.fling_power ?? 0,
      effect:
        data.effect_entries.find((entry) => entry.language.name === 'en')?.short_effect ||
        'No effect description.',
    };
    itemCache[name] = detail;
    return detail;
  } catch {
    return null;
  }
}

/** ค้นหาเงื่อนไขการวิวัฒนาการสำหรับโปเกมอนที่กำลังดูอยู่ */
function findEvolutionTriggerForPokemon(name, evoChain) {
  if (!evoChain || evoChain.length === 0) return null;
  for (const stage of evoChain) {
    for (const evo of stage) {
      // ตรวจชื่อ species หรือชื่อร่างพิเศษ
      if (evo.name === name) {
        // ถ้ามี trigger แสดงว่ามีเงื่อนไข
        if (evo.trigger || evo.minLevel || evo.item || evo.formLabel) {
          return evo;
        }
      }
    }
  }
  return null;
}

function PokemonDetailModal({ pokemonName, onClose }) {
  const [currentPokemonName, setCurrentPokemonName] = useState(pokemonName);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [defensiveRows, setDefensiveRows] = useState([]);
  const [abilityDetails, setAbilityDetails] = useState([]);
  const [evoChain, setEvoChain] = useState([]);
  const [showEvo, setShowEvo] = useState(false);
  const [evoLoading, setEvoLoading] = useState(false);
  const [selectedEvoItem, setSelectedEvoItem] = useState(null);
  const [selectedEvoItemDetail, setSelectedEvoItemDetail] = useState(null);
  const [evoTriggerForCurrent, setEvoTriggerForCurrent] = useState(null);
  const [evoTriggerItemDetail, setEvoTriggerItemDetail] = useState(null);
  const [showMoves, setShowMoves] = useState(false);
  const [selectedMove, setSelectedMove] = useState(null);

  useEffect(() => {
    setCurrentPokemonName(pokemonName);
    setSelectedEvoItem(null);
    setShowEvo(false);
    setShowMoves(false);
    setSelectedMove(null);
    setEvoTriggerForCurrent(null);
    setEvoTriggerItemDetail(null);
  }, [pokemonName]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!currentPokemonName) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setDetail(null);
        setDefensiveRows([]);

        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(currentPokemonName)}`
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

        const moves = data.moves.map((m) => ({
          name: m.move.name,
          learnMethods: [...new Set(m.version_group_details.map((v) => v.move_learn_method.name))],
        }));

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
          moves,
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

    // ดึงเงื่อนไขวิวัฒนาการสำหรับโปเกมอนตัวที่กำลังดู
    const loadEvoTrigger = async () => {
      try {
        const chain = await fetchEvolutionChain(currentPokemonName);
        if (!cancelled) {
          setEvoChain(chain);
          const trigger = findEvolutionTriggerForPokemon(currentPokemonName, chain);
          setEvoTriggerForCurrent(trigger);
          // ถ้ามี item ให้ดึงรายละเอียด
          if (trigger?.item) {
            const itemDetail = await fetchItemDetail(trigger.item);
            if (!cancelled) setEvoTriggerItemDetail(itemDetail);
          } else {
            setEvoTriggerItemDetail(null);
          }
        }
      } catch {
        if (!cancelled) {
          setEvoTriggerForCurrent(null);
          setEvoTriggerItemDetail(null);
        }
      }
    };
    loadEvoTrigger();

    return () => {
      cancelled = true;
    };
  }, [currentPokemonName]);

  useEffect(() => {
    if (!selectedEvoItem) {
      setSelectedEvoItemDetail(null);
      return;
    }

    let cancelled = false;

    const loadItem = async () => {
      const itemDetail = await fetchItemDetail(selectedEvoItem);
      if (!cancelled) {
        setSelectedEvoItemDetail(itemDetail);
      }
    };

    loadItem();
    return () => {
      cancelled = true;
    };
  }, [selectedEvoItem]);

  const [statLevel, setStatLevel] = useState(50);

  const totalStats =
    detail &&
    STAT_ORDER.reduce((sum, { key }) => sum + (detail.statsMap[key] ?? 0), 0);

  const calcHP = (base, level, iv, ev) =>
    Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;

  const calcStat = (base, level, iv, ev, nature) =>
    Math.floor(
      (Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature
    );

  const getStatRange = (key, base, level) => {
    if (key === 'hp') {
      return {
        min: calcHP(base, level, 0, 0),
        max: calcHP(base, level, 31, 252),
      };
    }
    return {
      min: calcStat(base, level, 0, 0, 0.9),
      max: calcStat(base, level, 31, 252, 1.1),
    };
  };

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

              {/* ── เงื่อนไขการวิวัฒนาการ (แสดงเหนือ Abilities) ── */}
              {evoTriggerForCurrent && (
                <section className="pokemon-detail-section pokemon-detail-evo-condition">
                  <h4>วิธีวิวัฒนาการ (How to Evolve)</h4>
                  <div className="evo-condition-card">
                    {evoTriggerForCurrent.formLabel ? (
                      /* Mega / G-Max */
                      <div className="evo-condition-content">
                        <span className={`evo-condition-form-badge ${evoTriggerForCurrent.trigger === 'gigantamax' ? 'evo-condition-form-badge--gmax' : 'evo-condition-form-badge--mega'}`}>
                          {evoTriggerForCurrent.formLabel}
                        </span>
                        <span className="evo-condition-text">
                          {evoTriggerForCurrent.trigger === 'gigantamax' ? 'Gigantamax Factor' : 'Mega Evolution'}
                        </span>
                      </div>
                    ) : evoTriggerForCurrent.item ? (
                      /* Stone / Item */
                      <div className="evo-condition-content">
                        <div className="evo-condition-item-icon">
                          <img
                            src={evoTriggerItemDetail?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${evoTriggerForCurrent.item}.png`}
                            alt={evoTriggerForCurrent.item}
                            loading="lazy"
                          />
                        </div>
                        <span className="evo-condition-text">
                          {evoTriggerForCurrent.item.replace(/-/g, ' ')}
                        </span>
                      </div>
                    ) : evoTriggerForCurrent.minLevel ? (
                      /* Level up */
                      <div className="evo-condition-content">
                        <span className="evo-condition-level-badge">Lv.{evoTriggerForCurrent.minLevel}</span>
                        <span className="evo-condition-text">Level Up</span>
                      </div>
                    ) : evoTriggerForCurrent.trigger ? (
                      /* Other trigger (trade, friendship, etc.) */
                      <div className="evo-condition-content">
                        <span className="evo-condition-trigger-badge">
                          {evoTriggerForCurrent.trigger.replace(/-/g, ' ')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </section>
              )}

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
                <div className="stat-col-headers">
                  <span />
                  <span>Base</span>
                  <span />
                  <span>Min</span>
                  <span>Max</span>
                </div>
                <ul className="pokemon-detail-stats">
                  {STAT_ORDER.map(({ key, label }) => {
                    const value = detail.statsMap[key] ?? 0;
                    const { min, max } = getStatRange(key, value, statLevel);
                    const ceiling = key === 'hp'
                      ? calcHP(255, 100, 31, 252)
                      : calcStat(255, 100, 31, 252, 1.1);
                    const pct = Math.min(100, Math.round((max / ceiling) * 100));
                    return (
                      <li key={key} className="pokemon-detail-stat-row">
                        <span className="pokemon-detail-stat-label">{label}</span>
                        <span className="pokemon-detail-stat-num">{value}</span>
                        <div className="pokemon-detail-stat-bar-wrap">
                          <div
                            className="pokemon-detail-stat-bar"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="pokemon-detail-stat-minmax">{min}</span>
                        <span className="pokemon-detail-stat-minmax">{max}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="stat-total-row">
                  <span className="pokemon-detail-stat-label">Total</span>
                  <span className="pokemon-detail-stat-num">{totalStats}</span>
                </div>
                <div className="stat-level-control">
                  <label className="stat-level-label" htmlFor="stat-level-slider">
                    Lv.<strong>{statLevel}</strong>
                  </label>
                  <input
                    id="stat-level-slider"
                    type="range"
                    min="1"
                    max="100"
                    value={statLevel}
                    className="stat-level-slider"
                    onChange={(e) => setStatLevel(Number(e.target.value))}
                  />
                </div>
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
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedEvoItem(null);
                              setCurrentPokemonName(evo.name);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedEvoItem(null);
                                setCurrentPokemonName(evo.name);
                              }
                            }}
                          >
                            {!evo.formLabel && formatEvolutionTrigger(evo) && (
                              <button
                                type="button"
                                className="evo-card-trigger-badge"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (evo.item) {
                                    setSelectedEvoItem(evo.item);
                                  }
                                }}
                                disabled={!evo.item}
                                title={evo.item ? 'ดูรายละเอียดไอเทมวิวัฒนาการ' : undefined}
                              >
                                {evo.item && (
                                  <span className="evo-card-trigger-item-icon">
                                    <img
                                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${evo.item}.png`}
                                      alt={evo.item}
                                      loading="lazy"
                                    />
                                  </span>
                                )}
                                <span>{formatEvolutionTrigger(evo)}</span>
                              </button>
                            )}
                            {evo.formLabel && (
                              <span className={`evo-card-form-label evo-card-form-label--topleft ${evo.trigger === 'gigantamax' ? 'evo-card-form-label--gmax' : 'evo-card-form-label--mega'}`}>
                                {evo.formLabel}
                              </span>
                            )}
                            {evo.image && (
                              <img
                                src={evo.image}
                                alt={evo.name}
                                className="evo-card-image"
                                loading="lazy"
                              />
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showEvo && selectedEvoItem && (
                <div className="evo-item-detail">
                  <div className="evo-item-detail-header">
                    <h5>รายละเอียดไอเทมวิวัฒนาการ</h5>
                    <button
                      type="button"
                      className="evo-item-detail-close"
                      onClick={() => setSelectedEvoItem(null)}
                    >
                      ปิด
                    </button>
                  </div>
                  {selectedEvoItemDetail ? (
                    <div className="evo-item-detail-body">
                      <div className="item-sprite-wrap evo-item-sprite-wrap">
                        {selectedEvoItemDetail.sprite ? (
                          <img
                            src={selectedEvoItemDetail.sprite}
                            alt={selectedEvoItemDetail.name}
                            className="item-sprite"
                            loading="lazy"
                          />
                        ) : (
                          <div className="item-sprite item-sprite-fallback">?</div>
                        )}
                      </div>
                      <div className="evo-item-detail-content">
                        <p className="item-id">#{selectedEvoItemDetail.id}</p>
                        <h6 className="item-name evo-item-name">{selectedEvoItemDetail.name}</h6>
                        <p className="item-category">{selectedEvoItemDetail.category}</p>
                        <div className="item-stats evo-item-stats">
                          <p>
                            ราคา: <span>{selectedEvoItemDetail.cost}</span>
                          </p>
                          <p>
                            Fling: <span>{selectedEvoItemDetail.flingPower}</span>
                          </p>
                        </div>
                        <div className="item-effect">
                          <p>{selectedEvoItemDetail.effect}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="evo-loading">กำลังโหลดรายละเอียดไอเทม...</p>
                  )}
                </div>
              )}
            </section>

            <section className="pokemon-detail-moves">
              <button
                type="button"
                className="evo-toggle-btn"
                onClick={() => setShowMoves((prev) => !prev)}
              >
                <span>{showMoves ? '▼' : '▶'} ท่าที่เรียนรู้ได้ (Moves)</span>
                {detail.moves && (
                  <span className="moves-count-badge">{detail.moves.length}</span>
                )}
              </button>

              {showMoves && !selectedMove && (
                <ul className="moves-list">
                  {(detail.moves || []).map((m) => {
                    const info = MOVES_INDEX[m.name];
                    return (
                      <li
                        key={m.name}
                        className={`move-list-item ${selectedMove?.name === m.name ? 'move-list-item--active' : ''}`}
                        onClick={() => setSelectedMove(selectedMove?.name === m.name ? null : (info ? { ...info, learnMethods: m.learnMethods } : { name: m.name, learnMethods: m.learnMethods }))}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click(); }}
                      >
                        {info?.type && (
                          <img
                            src={getTypeIconUrl(info.type)}
                            alt={info.type}
                            className="move-list-type-icon"
                            style={{ borderColor: TYPE_COLORS[info.type] || '#94a3b8' }}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = getFallbackTypeIconUrl(info.type);
                            }}
                          />
                        )}
                        <span className="move-list-name">{m.name.replace(/-/g, ' ')}</span>
                        {info?.damage_class && (
                          <span className={`move-list-class move-list-class--${info.damage_class}`}>
                            {info.damage_class}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {showMoves && selectedMove && (
                <div className="move-detail-popup">
                  <div className="move-detail-popup-header">
                    <h5 className="move-detail-popup-name">{selectedMove.name.replace(/-/g, ' ')}</h5>
                    <button
                      type="button"
                      className="evo-item-detail-close"
                      onClick={() => setSelectedMove(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="move-detail-popup-body">
                    {selectedMove.type && (
                      <div className="move-detail-type-row">
                        <img
                          src={getTypeIconUrl(selectedMove.type)}
                          alt={selectedMove.type}
                          className="move-detail-type-icon"
                          style={{ borderColor: TYPE_COLORS[selectedMove.type] || '#94a3b8' }}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = getFallbackTypeIconUrl(selectedMove.type);
                          }}
                        />
                        <span className="move-detail-type-name">{selectedMove.type}</span>
                        {selectedMove.damage_class && (
                          <span className={`move-list-class move-list-class--${selectedMove.damage_class}`}>
                            {selectedMove.damage_class}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="move-detail-stats">
                      <span>พลัง: <strong>{selectedMove.power ?? '—'}</strong></span>
                      <span>แม่นยำ: <strong>{selectedMove.accuracy != null ? `${selectedMove.accuracy}%` : '—'}</strong></span>
                      <span>PP: <strong>{selectedMove.pp ?? '—'}</strong></span>
                    </div>
                    {selectedMove.description_th && (
                      <p className="move-detail-desc">{selectedMove.description_th}</p>
                    )}
                    {selectedMove.learnMethods?.length > 0 && (
                      <div className="move-detail-learn">
                        {selectedMove.learnMethods.map((lm) => (
                          <span key={lm} className="move-learn-badge">{lm.replace(/-/g, ' ')}</span>
                        ))}
                      </div>
                    )}
                  </div>
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
