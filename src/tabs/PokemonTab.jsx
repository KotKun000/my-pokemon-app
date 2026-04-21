import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';
import { getTypeBorderStyle, TYPE_COLORS } from '../utils/typeColors';
import {
  fetchVersionGroupPokemonIds,
  VERSION_GROUP_LABELS,
  VERSION_GROUP_ORDER,
} from '../utils/gameVersions';
import PokemonDetailModal from './PokemonDetailModal';

const POKEMON_PER_PAGE = 35;
const CACHE_KEY = 'pokemon_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

const extractPokemonId = (url) => {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

/** อ่าน cache จาก localStorage — คืน array ถ้ายังไม่หมดอายุ, null ถ้าหมดอายุหรือไม่มี */
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

/** เขียน cache ลง localStorage */
const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // localStorage เต็ม — ไม่ต้องทำอะไร
  }
};

function PokemonTab() {
  const [pokemonQuery, setPokemonQuery] = useState('');
  const [pokemonData, setPokemonData] = useState([]);
  const [pokemonLoading, setPokemonLoading] = useState(true);
  const [pokemonError, setPokemonError] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [pokemonPage, setPokemonPage] = useState(1);
  const [selectedPokemonName, setSelectedPokemonName] = useState(null);
  const [selectedVersionGroup, setSelectedVersionGroup] = useState('');
  const [versionPokemonIds, setVersionPokemonIds] = useState(null);
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);
  const [versionSearch, setVersionSearch] = useState('');
  const versionDropdownRef = useRef(null);
  const closePokemonDetail = useCallback(() => setSelectedPokemonName(null), []);

  useEffect(() => {
    const loadPokemon = async () => {
      try {
        setPokemonLoading(true);
        setPokemonError('');

        // ─── ตรวจ cache ก่อน ───
        const cached = readCache();
        if (cached && cached.length > 0) {
          console.log(`✅ ใช้ข้อมูลจาก cache (${cached.length} ตัว)`);
          setPokemonData(cached);
          return;
        }

        // ─── ไม่มี cache → ดึงจาก API ───
        console.log('📡 ไม่พบ cache — กำลังดึงข้อมูลจาก PokeAPI...');
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
        if (!response.ok) {
          throw new Error('โหลดข้อมูล Pokemon ไม่สำเร็จ');
        }

        const payload = await response.json();
        const results = payload.results;
        const chunkSize = 24;
        const detailedPokemon = [];

        for (let i = 0; i < results.length; i += chunkSize) {
          const chunk = results.slice(i, i + chunkSize);
          const chunkDetails = await Promise.all(
            chunk.map(async (pokemon) => {
              const detailResponse = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${pokemon.name}`
              );
              if (!detailResponse.ok) return null;

              const detail = await detailResponse.json();
              const id = detail.id || extractPokemonId(pokemon.url);
              const types = detail.types
                .sort((a, b) => a.slot - b.slot)
                .map((entry) => entry.type.name);

              return {
                id,
                name: pokemon.name,
                types,
                image:
                  detail.sprites.other?.['official-artwork']?.front_default ||
                  detail.sprites.front_default ||
                  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
              };
            })
          );

          detailedPokemon.push(...chunkDetails.filter(Boolean));
        }

        // ─── บันทึก cache ───
        writeCache(detailedPokemon);
        console.log(`💾 บันทึก cache แล้ว (${detailedPokemon.length} ตัว)`);

        setPokemonData(detailedPokemon);
      } catch (error) {
        setPokemonError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setPokemonLoading(false);
      }
    };

    loadPokemon();
  }, []);

  const toggleType = useCallback((type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // ─── โหลดรายชื่อ species ของเวอร์ชั่นเกมที่เลือก (lazy + cache) ───
  useEffect(() => {
    if (!selectedVersionGroup) {
      setVersionPokemonIds(null);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setVersionPokemonIds(null);
        const ids = await fetchVersionGroupPokemonIds(selectedVersionGroup);
        if (cancelled) return;
        setVersionPokemonIds(new Set(ids));
      } catch {
        if (!cancelled) setVersionPokemonIds(new Set());
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [selectedVersionGroup]);

  // ─── ปิด dropdown เวอร์ชั่นเกมเมื่อคลิกนอกพื้นที่ ───
  useEffect(() => {
    if (!versionDropdownOpen) return undefined;
    const handleClickOutside = (event) => {
      if (
        versionDropdownRef.current &&
        !versionDropdownRef.current.contains(event.target)
      ) {
        setVersionDropdownOpen(false);
        setVersionSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [versionDropdownOpen]);

  const filteredPokemon = useMemo(() => {
    const keyword = pokemonQuery.trim().toLowerCase();
    let data = pokemonData;

    if (selectedVersionGroup && versionPokemonIds) {
      data = data.filter((pokemon) => versionPokemonIds.has(pokemon.id));
    }

    if (selectedTypes.length > 0) {
      data = data.filter((pokemon) =>
        selectedTypes.every((t) => pokemon.types.includes(t))
      );
    }

    if (!keyword) return data;
    return data.filter((pokemon) => pokemon.name.toLowerCase().includes(keyword));
  }, [pokemonData, pokemonQuery, selectedTypes, selectedVersionGroup, versionPokemonIds]);

  useEffect(() => {
    setPokemonPage(1);
  }, [pokemonQuery, selectedTypes, selectedVersionGroup, pokemonData.length]);

  const totalPokemonPages = Math.max(
    1,
    Math.ceil(filteredPokemon.length / POKEMON_PER_PAGE)
  );

  const pagedPokemon = useMemo(() => {
    const start = (pokemonPage - 1) * POKEMON_PER_PAGE;
    return filteredPokemon.slice(start, start + POKEMON_PER_PAGE);
  }, [filteredPokemon, pokemonPage]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisible = 8;
    const start = Math.max(1, pokemonPage - 3);
    const end = Math.min(totalPokemonPages, start + maxVisible - 1);
    const correctedStart = Math.max(1, end - maxVisible + 1);
    const pages = [];
    for (let page = correctedStart; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [pokemonPage, totalPokemonPages]);

  const pokemonTypes = useMemo(() => {
    const typeSet = new Set();
    for (const pokemon of pokemonData) {
      for (const type of pokemon.types || []) {
        typeSet.add(type);
      }
    }
    return Array.from(typeSet).sort();
  }, [pokemonData]);

  const filteredVersionGroups = useMemo(() => {
    const q = versionSearch.trim().toLowerCase();
    if (!q) return VERSION_GROUP_ORDER;
    return VERSION_GROUP_ORDER.filter((vg) =>
      (VERSION_GROUP_LABELS[vg] || vg).toLowerCase().includes(q)
    );
  }, [versionSearch]);

  return (
    <>
      <section className="search-panel">
        <input
          type="text"
          value={pokemonQuery}
          onChange={(event) => setPokemonQuery(event.target.value)}
          placeholder="ค้นหาโปเกมอน เช่น pikachu"
          className="search-input"
        />
      </section>
      <section className="version-filter-bar">
        <div
          ref={versionDropdownRef}
          className={`ability-version-dropdown ${versionDropdownOpen ? 'open' : ''}`}
        >
          <button
            type="button"
            className="ability-version-trigger version-filter-trigger"
            onClick={() => setVersionDropdownOpen((v) => !v)}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="version-filter-icon"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            <span>
              เวอร์ชั่นเกม:{' '}
              <strong>
                {selectedVersionGroup
                  ? VERSION_GROUP_LABELS[selectedVersionGroup] || selectedVersionGroup
                  : 'ทั้งหมด'}
              </strong>
            </span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="ability-version-chevron"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {versionDropdownOpen && (
            <div className="ability-version-menu">
              <div className="ability-version-search-wrap">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="ability-version-search-icon"
                >
                  <circle cx="8" cy="8" r="5" />
                  <path d="M13 13l3.5 3.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  className="ability-version-search"
                  placeholder="ค้นหาเวอร์ชั่น..."
                  value={versionSearch}
                  onChange={(e) => setVersionSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                {versionSearch && (
                  <button
                    type="button"
                    className="ability-version-search-clear"
                    onClick={() => setVersionSearch('')}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="ability-version-list">
                <button
                  type="button"
                  className={`ability-version-item ${!selectedVersionGroup ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedVersionGroup('');
                    setVersionDropdownOpen(false);
                    setVersionSearch('');
                  }}
                >
                  ทั้งหมด (All Games)
                </button>
                {filteredVersionGroups.length > 0 ? (
                  filteredVersionGroups.map((vg) => (
                    <button
                      key={vg}
                      type="button"
                      className={`ability-version-item ${selectedVersionGroup === vg ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedVersionGroup(vg);
                        setVersionDropdownOpen(false);
                        setVersionSearch('');
                      }}
                    >
                      {VERSION_GROUP_LABELS[vg] || vg}
                    </button>
                  ))
                ) : (
                  <p className="ability-version-empty">ไม่พบเวอร์ชั่น</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="type-filter-bar">
        <button
          type="button"
          className={`type-filter-btn ${selectedTypes.length === 0 ? 'active' : ''}`}
          onClick={() => setSelectedTypes([])}
        >
          All
        </button>
        {pokemonTypes.map((type) => {
          const isActive = selectedTypes.includes(type);
          const typeColor = TYPE_COLORS[type] || '#94a3b8';
          return (
          <button
            key={type}
            type="button"
            className={`type-filter-btn ${isActive ? 'active' : ''}`}
            style={{
              borderColor: typeColor,
              ...(isActive && {
                backgroundColor: `${typeColor}22`,
                boxShadow: `0 0 0 3px ${typeColor}80, 0 6px 14px ${typeColor}4d`,
                transform: 'translateY(-1px)',
              }),
            }}
            onClick={() => toggleType(type)}
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
          );
        })}
      </section>

      {pokemonLoading && <p className="status-message">กำลังโหลดข้อมูลโปเกมอน...</p>}
      {pokemonError && <p className="status-message">{pokemonError}</p>}

      {!pokemonLoading && !pokemonError && (
        <>
          <section className="pokemon-grid">
            {pagedPokemon.map((pokemon) => (
              <button
                key={pokemon.id}
                type="button"
                className="pokemon-card"
                style={getTypeBorderStyle(pokemon.types)}
                onClick={() => setSelectedPokemonName(pokemon.name)}
              >
                <div className="pokemon-type-stack">
                  {(pokemon.types || []).slice(0, 2).map((type) => (
                    <img
                      key={`${pokemon.id}-${type}`}
                      src={getTypeIconUrl(type)}
                      alt={type}
                      className="pokemon-type-icon"
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
                  src={pokemon.image}
                  alt={pokemon.name}
                  loading="lazy"
                  className="pokemon-image"
                />
                <p className="pokemon-id">#{pokemon.id}</p>
                <h3 className="pokemon-name">{pokemon.name}</h3>
              </button>
            ))}
          </section>
          <div className="pagination-wrap">
            <button
              type="button"
              className="page-btn"
              onClick={() => setPokemonPage(1)}
              disabled={pokemonPage === 1}
            >
              {'<<'}
            </button>
            <button
              type="button"
              className="page-btn"
              onClick={() => setPokemonPage((prev) => Math.max(1, prev - 1))}
              disabled={pokemonPage === 1}
            >
              {'<'}
            </button>
            {visiblePageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`page-btn ${pokemonPage === page ? 'active' : ''}`}
                onClick={() => setPokemonPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="page-btn"
              onClick={() =>
                setPokemonPage((prev) => Math.min(totalPokemonPages, prev + 1))
              }
              disabled={pokemonPage === totalPokemonPages}
            >
              {'>'}
            </button>
            <button
              type="button"
              className="page-btn"
              onClick={() => setPokemonPage(totalPokemonPages)}
              disabled={pokemonPage === totalPokemonPages}
            >
              {'>>'}
            </button>
          </div>
        </>
      )}

      {selectedPokemonName && (
        <PokemonDetailModal
          pokemonName={selectedPokemonName}
          onClose={closePokemonDetail}
        />
      )}
    </>
  );
}

export default PokemonTab;
