import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';
import { getTypeBorderStyle, TYPE_COLORS } from '../utils/typeColors';
import PokemonDetailModal from './PokemonDetailModal';

const POKEMON_PER_PAGE = 35;
const CACHE_KEY = 'pokemon_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

const extractPokemonId = (url) => {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

/** ช่วง National Dex ของแต่ละ Generation */
const GEN_RANGES = [
  { gen: 1, label: 'Gen 1', region: 'Kanto', min: 1, max: 151 },
  { gen: 2, label: 'Gen 2', region: 'Johto', min: 152, max: 251 },
  { gen: 3, label: 'Gen 3', region: 'Hoenn', min: 252, max: 386 },
  { gen: 4, label: 'Gen 4', region: 'Sinnoh', min: 387, max: 493 },
  { gen: 5, label: 'Gen 5', region: 'Unova', min: 494, max: 649 },
  { gen: 6, label: 'Gen 6', region: 'Kalos', min: 650, max: 721 },
  { gen: 7, label: 'Gen 7', region: 'Alola', min: 722, max: 809 },
  { gen: 8, label: 'Gen 8', region: 'Galar', min: 810, max: 905 },
  { gen: 9, label: 'Gen 9', region: 'Paldea', min: 906, max: 1025 },
];

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
  const [selectedGen, setSelectedGen] = useState(0);
  const [genDropdownOpen, setGenDropdownOpen] = useState(false);
  const genDropdownRef = useRef(null);
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

  // ─── ปิด dropdown Gen เมื่อคลิกนอกพื้นที่ ───
  useEffect(() => {
    if (!genDropdownOpen) return undefined;
    const handleClickOutside = (event) => {
      if (
        genDropdownRef.current &&
        !genDropdownRef.current.contains(event.target)
      ) {
        setGenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [genDropdownOpen]);

  const filteredPokemon = useMemo(() => {
    const keyword = pokemonQuery.trim().toLowerCase();
    let data = pokemonData;

    if (selectedGen > 0) {
      const range = GEN_RANGES.find((r) => r.gen === selectedGen);
      if (range) {
        data = data.filter(
          (pokemon) => pokemon.id >= range.min && pokemon.id <= range.max
        );
      }
    }

    if (selectedTypes.length > 0) {
      data = data.filter((pokemon) =>
        selectedTypes.every((t) => pokemon.types.includes(t))
      );
    }

    if (!keyword) return data;
    return data.filter((pokemon) => pokemon.name.toLowerCase().includes(keyword));
  }, [pokemonData, pokemonQuery, selectedTypes, selectedGen]);

  useEffect(() => {
    setPokemonPage(1);
  }, [pokemonQuery, selectedTypes, selectedGen, pokemonData.length]);

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
      <section className="gen-filter-bar">
        <div
          ref={genDropdownRef}
          className={`ability-version-dropdown gen-filter-dropdown ${genDropdownOpen ? 'open' : ''}`}
        >
          <button
            type="button"
            className="ability-version-trigger gen-filter-trigger"
            onClick={() => setGenDropdownOpen((v) => !v)}
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
              className="gen-filter-icon"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
            </svg>
            <span>
              Gen:{' '}
              <strong>
                {selectedGen === 0
                  ? 'ทั้งหมด'
                  : (() => {
                      const r = GEN_RANGES.find((g) => g.gen === selectedGen);
                      return r ? `${r.label} · ${r.region}` : `Gen ${selectedGen}`;
                    })()}
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
          {genDropdownOpen && (
            <div className="ability-version-menu gen-filter-menu">
              <div className="ability-version-list">
                <button
                  type="button"
                  className={`ability-version-item ${selectedGen === 0 ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGen(0);
                    setGenDropdownOpen(false);
                  }}
                >
                  ทั้งหมด
                </button>
                {GEN_RANGES.map((range) => (
                  <button
                    key={range.gen}
                    type="button"
                    className={`ability-version-item ${selectedGen === range.gen ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedGen(range.gen);
                      setGenDropdownOpen(false);
                    }}
                  >
                    {range.label} · {range.region}
                  </button>
                ))}
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
