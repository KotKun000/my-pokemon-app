import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFallbackTypeIconUrl, getTypeIconUrl } from '../utils/typeIcons';
import PokemonDetailModal from './PokemonDetailModal';

const POKEMON_PER_PAGE = 35;

const extractPokemonId = (url) => {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

function PokemonTab() {
  const [pokemonQuery, setPokemonQuery] = useState('');
  const [pokemonData, setPokemonData] = useState([]);
  const [pokemonLoading, setPokemonLoading] = useState(true);
  const [pokemonError, setPokemonError] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [pokemonPage, setPokemonPage] = useState(1);
  const [selectedPokemonName, setSelectedPokemonName] = useState(null);
  const closePokemonDetail = useCallback(() => setSelectedPokemonName(null), []);

  useEffect(() => {
    const loadPokemon = async () => {
      try {
        setPokemonLoading(true);
        setPokemonError('');

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

        setPokemonData(detailedPokemon);
      } catch (error) {
        setPokemonError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setPokemonLoading(false);
      }
    };

    loadPokemon();
  }, []);

  const filteredPokemon = useMemo(() => {
    const keyword = pokemonQuery.trim().toLowerCase();
    let data = pokemonData;

    if (selectedType) {
      data = data.filter((pokemon) => pokemon.types.includes(selectedType));
    }

    if (!keyword) return data;
    return data.filter((pokemon) => pokemon.name.toLowerCase().includes(keyword));
  }, [pokemonData, pokemonQuery, selectedType]);

  useEffect(() => {
    setPokemonPage(1);
  }, [pokemonQuery, selectedType, pokemonData.length]);

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
      <section className="type-filter-bar">
        <button
          type="button"
          className={`type-filter-btn ${selectedType === '' ? 'active' : ''}`}
          onClick={() => setSelectedType('')}
        >
          All
        </button>
        {pokemonTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`type-filter-btn ${selectedType === type ? 'active' : ''}`}
            onClick={() => setSelectedType(type)}
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
                onClick={() => setSelectedPokemonName(pokemon.name)}
              >
                <div className="pokemon-type-stack">
                  {(pokemon.types || []).slice(0, 2).map((type) => (
                    <img
                      key={`${pokemon.id}-${type}`}
                      src={getTypeIconUrl(type)}
                      alt={type}
                      className="pokemon-type-icon"
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
