import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchDropdown from '../components/SearchDropdown';
import movesData from '../data/moves_th.json';
import itemsData from '../data/items.json';
import abilitiesTh from '../data/abilities_th.json';
import { ALL_TYPES, TYPE_LABELS_TH } from '../utils/typeMatchups';
import { computeTeamCoverage, computeTeamDefence } from '../utils/teamMath';
import { getTypeBorderStyle, TYPE_COLORS } from '../utils/typeColors';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';

const TEAM_CACHE_KEY = 'team_builder_v1';
const POKEMON_INDEX_CACHE_KEY = 'pokemon_cache';
const POKEMON_DETAIL_CACHE_KEY = 'team_pokemon_detail_cache_v1';
const TEAM_SIZE = 6;

const EMPTY_SLOT = () => ({
  pokemonName: '',
  item: '',
  ability: '',
  moves: ['', '', '', ''],
});

const DEFAULT_TEAM = () => Array.from({ length: TEAM_SIZE }, EMPTY_SLOT);

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
};

/** ─── โหลด pokemon index (id, name, types, image) จาก cache ของแท็บ Pokemon ─── */
function usePokemonIndex() {
  const [index, setIndex] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const cached = readJson(POKEMON_INDEX_CACHE_KEY);
        if (cached?.data && Array.isArray(cached.data) && cached.data.length > 0) {
          if (!cancelled) setIndex(cached.data);
          return;
        }

        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
        if (!res.ok) throw new Error('โหลดรายชื่อโปเกมอนไม่สำเร็จ');
        const payload = await res.json();
        const list = (payload.results || []).map((p) => {
          const parts = p.url.split('/').filter(Boolean);
          const id = Number(parts[parts.length - 1]);
          return { id, name: p.name, types: [], image: '' };
        });
        if (!cancelled) setIndex(list);
      } catch (err) {
        if (!cancelled) setError(err.message || 'เกิดข้อผิดพลาด');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { index, loading, error };
}

/** ─── โหลดรายละเอียดโปเกมอน (types, image, abilities, moves) พร้อม cache ─── */
function usePokemonDetails(team) {
  const [detailCache, setDetailCache] = useState(() => readJson(POKEMON_DETAIL_CACHE_KEY) || {});
  const [pendingFetches, setPendingFetches] = useState(new Set());

  useEffect(() => {
    const namesToFetch = new Set();
    for (const slot of team) {
      if (slot.pokemonName && !detailCache[slot.pokemonName] && !pendingFetches.has(slot.pokemonName)) {
        namesToFetch.add(slot.pokemonName);
      }
    }
    if (namesToFetch.size === 0) return;

    setPendingFetches((prev) => new Set([...prev, ...namesToFetch]));

    namesToFetch.forEach(async (name) => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`โหลด ${name} ไม่สำเร็จ`);
        const data = await res.json();
        const detail = {
          id: data.id,
          name: data.name,
          types: data.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
          abilities: data.abilities
            .sort((a, b) => a.slot - b.slot)
            .map((a) => ({ name: a.ability.name, isHidden: a.is_hidden })),
          image:
            data.sprites.other?.['official-artwork']?.front_default ||
            data.sprites.front_default ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
          moves: data.moves.map((m) => m.move.name),
        };
        setDetailCache((prev) => {
          const next = { ...prev, [name]: detail };
          writeJson(POKEMON_DETAIL_CACHE_KEY, next);
          return next;
        });
      } catch {
        // silently ignore; user can re-select
      } finally {
        setPendingFetches((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
      }
    });
  }, [team, detailCache, pendingFetches]);

  return { detailCache, pendingNames: pendingFetches };
}

/** ─── Type Badge (ไอคอน type + คะแนน) ─── */
function TypeScoreBadge({ type, score }) {
  const color = TYPE_COLORS[type] || '#94a3b8';
  let scoreClass = 'score-neutral';
  if (score > 0) scoreClass = 'score-positive';
  if (score < 0) scoreClass = 'score-negative';

  const scoreText = score > 0 ? `+${score}` : String(score);

  return (
    <div className="type-score-badge" title={`${TYPE_LABELS_TH[type] || type}: ${scoreText}`}>
      <div
        className="type-score-icon-wrap"
        style={{ borderColor: color, backgroundColor: `${color}18` }}
      >
        <img
          src={getTypeIconUrl(type)}
          alt={type}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackTypeIconUrl(type);
          }}
        />
      </div>
      <div className="type-score-info">
        <span className="type-score-name">{TYPE_LABELS_TH[type] || type}</span>
        <span className={`type-score-value ${scoreClass}`}>{scoreText}</span>
      </div>
    </div>
  );
}

function BuildTeamTab() {
  const [team, setTeam] = useState(() => {
    const saved = readJson(TEAM_CACHE_KEY);
    if (saved && Array.isArray(saved) && saved.length === TEAM_SIZE) return saved;
    return DEFAULT_TEAM();
  });

  useEffect(() => {
    writeJson(TEAM_CACHE_KEY, team);
  }, [team]);

  const { index: pokemonIndex, loading: indexLoading, error: indexError } = usePokemonIndex();
  const { detailCache } = usePokemonDetails(team);

  const updateSlot = useCallback((slotIndex, updater) => {
    setTeam((prev) => {
      const next = [...prev];
      next[slotIndex] = typeof updater === 'function' ? updater(next[slotIndex]) : updater;
      return next;
    });
  }, []);

  const handlePickPokemon = useCallback((slotIndex, name) => {
    updateSlot(slotIndex, (slot) => ({
      ...slot,
      pokemonName: name,
      ability: '',
      moves: ['', '', '', ''],
    }));
  }, [updateSlot]);

  const handleResetTeam = useCallback(() => {
    if (confirm('ล้างทีมทั้งหมด?')) {
      setTeam(DEFAULT_TEAM());
    }
  }, []);

  /* ─── ตัวเลือกสำหรับ dropdown ─── */
  const moveOptions = useMemo(
    () => movesData.slice().sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const itemOptions = useMemo(
    () =>
      itemsData
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  /* ─── คำนวณ Team Defence / Coverage ─── */
  const teamStats = useMemo(() => {
    const filled = team
      .map((slot) => {
        if (!slot.pokemonName) return null;
        const det = detailCache[slot.pokemonName];
        if (!det) return null;
        const moveTypes = slot.moves
          .map((mn) => movesData.find((m) => m.name === mn))
          .filter((m) => m && (m.power ?? 0) > 0)
          .map((m) => m.type);
        return {
          types: det.types || [],
          ability: slot.ability || '',
          moveTypes,
        };
      })
      .filter(Boolean);
    return {
      defence: computeTeamDefence(filled),
      coverage: computeTeamCoverage(filled),
    };
  }, [team, detailCache]);

  const filledCount = team.filter((s) => s.pokemonName).length;

  return (
    <>
      <section className="team-builder-header">
        <h2 className="team-builder-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Team Slots ({filledCount}/{TEAM_SIZE})</span>
        </h2>
        <button type="button" className="team-reset-btn" onClick={handleResetTeam}>
          ล้างทีม
        </button>
      </section>

      {indexError && <p className="status-message">{indexError}</p>}

      <div className="team-builder-layout">
        <section className="team-slots-grid">
          {team.map((slot, idx) => (
            <TeamSlotCard
              key={idx}
              slot={slot}
              pokemonIndex={pokemonIndex}
              pokemonDetail={slot.pokemonName ? detailCache[slot.pokemonName] : null}
              moveOptions={moveOptions}
              itemOptions={itemOptions}
              onPickPokemon={(name) => handlePickPokemon(idx, name)}
              onChangeItem={(item) => updateSlot(idx, (s) => ({ ...s, item }))}
              onChangeAbility={(ab) => updateSlot(idx, (s) => ({ ...s, ability: ab }))}
              onChangeMove={(moveIdx, move) =>
                updateSlot(idx, (s) => {
                  const moves = [...s.moves];
                  moves[moveIdx] = move;
                  return { ...s, moves };
                })
              }
              indexLoading={indexLoading}
            />
          ))}
        </section>

        <aside className="team-stats-column">
          <TeamStatsPanel
            title="Team Defence"
            iconType="shield"
            scores={teamStats.defence}
            subtitle="คะแนนการรับความเสียหาย ทั้งทีมรวมกัน"
          />
          <TeamStatsPanel
            title="Team Type Coverage"
            iconType="star"
            scores={teamStats.coverage}
            subtitle="คะแนนการโจมตีครอบคลุม ทั้งทีมรวมกัน"
          />
        </aside>
      </div>
    </>
  );
}

/** ─── การ์ดแต่ละ slot ─── */
function TeamSlotCard({
  slot,
  pokemonIndex,
  pokemonDetail,
  moveOptions,
  itemOptions,
  onPickPokemon,
  onChangeItem,
  onChangeAbility,
  onChangeMove,
  indexLoading,
}) {
  const types = pokemonDetail?.types || [];
  const image = pokemonDetail?.image || '';

  const abilityOptions = useMemo(() => {
    return (pokemonDetail?.abilities || []).map((a) => ({
      ...a,
      labelTh: abilitiesTh[a.name]?.short_effect_th || '',
    }));
  }, [pokemonDetail]);

  return (
    <div className="team-slot-card">
      {/* ── Name dropdown ── */}
      <SearchDropdown
        className="team-slot-name-dropdown"
        items={pokemonIndex}
        value={slot.pokemonName}
        onChange={onPickPokemon}
        getLabel={(p) => p.name}
        getKey={(p) => p.name}
        getSearchText={(p) => p.name}
        placeholder={indexLoading ? 'กำลังโหลด...' : 'Name'}
        emptyLabel="ล้างโปเกมอน"
        disabled={indexLoading}
      />

      <div className="team-slot-body">
        {/* ── Pokemon image ── */}
        <div
          className="team-slot-image-wrap"
          style={types.length > 0 ? getTypeBorderStyle(types, '#f8fafc') : undefined}
        >
          {types.length > 0 && (
            <div className="team-slot-type-stack">
              {types.map((t) => (
                <img
                  key={t}
                  src={getTypeIconUrl(t)}
                  alt={t}
                  loading="lazy"
                  style={{ borderColor: TYPE_COLORS[t] || '#94a3b8' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackTypeIconUrl(t);
                  }}
                />
              ))}
            </div>
          )}
          {image ? (
            <img src={image} alt={pokemonDetail?.name || ''} className="team-slot-image" loading="lazy" />
          ) : (
            <span className="team-slot-image-placeholder">+</span>
          )}
        </div>

        {/* ── Moves ── */}
        <div className="team-slot-moves">
          {slot.moves.map((mv, mi) => (
            <SearchDropdown
              key={mi}
              className="team-slot-move-dropdown"
              items={moveOptions}
              value={mv}
              onChange={(name) => onChangeMove(mi, name)}
              getLabel={(m) => m.name.replace(/-/g, ' ')}
              getKey={(m) => m.name}
              getSearchText={(m) => `${m.name} ${m.description_th || ''}`}
              placeholder="Move"
              emptyLabel="ล้างท่า"
              renderTrigger={(m) => {
                if (!m) return 'Move';
                return (
                  <span className="team-move-trigger">
                    <img
                      src={getTypeIconUrl(m.type)}
                      alt={m.type}
                      className="team-move-type-icon"
                      style={{ borderColor: TYPE_COLORS[m.type] || '#94a3b8' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackTypeIconUrl(m.type);
                      }}
                    />
                    <span className="team-move-name">{m.name.replace(/-/g, ' ')}</span>
                  </span>
                );
              }}
              renderItem={(m) => (
                <span className="team-move-option">
                  <img
                    src={getTypeIconUrl(m.type)}
                    alt={m.type}
                    className="team-move-type-icon"
                    style={{ borderColor: TYPE_COLORS[m.type] || '#94a3b8' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFallbackTypeIconUrl(m.type);
                    }}
                  />
                  <span className="team-move-option-name">{m.name.replace(/-/g, ' ')}</span>
                  {m.power > 0 && (
                    <span className="team-move-option-power">P{m.power}</span>
                  )}
                </span>
              )}
            />
          ))}
        </div>
      </div>

      <div className="team-slot-footer">
        {/* ── Item ── */}
        <SearchDropdown
          className="team-slot-item-dropdown"
          items={itemOptions}
          value={slot.item}
          onChange={onChangeItem}
          getLabel={(it) => it.name.replace(/-/g, ' ')}
          getKey={(it) => it.name}
          getSearchText={(it) => `${it.name} ${it.effect_th || ''}`}
          placeholder="Item"
          emptyLabel="ล้างไอเทม"
          renderTrigger={(it) => {
            if (!it) return 'Item';
            return (
              <span className="team-item-trigger">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20M2 12h20" />
                </svg>
                <span>{it.name.replace(/-/g, ' ')}</span>
              </span>
            );
          }}
        />

        {/* ── Abilities ── */}
        <SearchDropdown
          className="team-slot-ability-dropdown"
          items={abilityOptions}
          value={slot.ability}
          onChange={onChangeAbility}
          getLabel={(a) => a.name.replace(/-/g, ' ')}
          getKey={(a) => a.name}
          getSearchText={(a) => `${a.name} ${a.labelTh || ''}`}
          placeholder={pokemonDetail ? 'Abilities' : '—'}
          emptyLabel="ล้าง Ability"
          disabled={!pokemonDetail}
          renderTrigger={(a) => {
            if (!a) return 'Abilities';
            return (
              <span className="team-ability-trigger">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{a.name.replace(/-/g, ' ')}</span>
                {a.isHidden && <small className="team-ability-hidden">HA</small>}
              </span>
            );
          }}
          renderItem={(a) => (
            <span className="team-ability-option">
              <span className="team-ability-option-name">
                {a.name.replace(/-/g, ' ')}
                {a.isHidden && <small className="team-ability-hidden"> HA</small>}
              </span>
              {a.labelTh && <span className="team-ability-option-effect">{a.labelTh}</span>}
            </span>
          )}
          showEmpty={true}
        />
      </div>
    </div>
  );
}

/** ─── Panel คะแนนทีม ─── */
function TeamStatsPanel({ title, iconType, scores, subtitle }) {
  return (
    <section className="team-stats-panel">
      <div className="team-stats-panel-header">
        {iconType === 'shield' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
        <h3>{title}</h3>
      </div>
      {subtitle && <p className="team-stats-panel-subtitle">{subtitle}</p>}
      <div className="team-stats-grid">
        {ALL_TYPES.map((t) => {
          const row = scores.find((r) => r.type === t) || { type: t, score: 0 };
          return <TypeScoreBadge key={t} type={t} score={row.score} />;
        })}
      </div>
    </section>
  );
}

export default BuildTeamTab;
