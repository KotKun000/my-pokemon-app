import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 40;
const ITEMS_CACHE_KEY = 'poke_items_cache_v1';
const ITEMS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function ItemTab() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        setError('');

        setLoadedFromCache(false);
        const cachedRaw = localStorage.getItem(ITEMS_CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            const isFresh =
              cached?.savedAt &&
              Array.isArray(cached?.items) &&
              Date.now() - cached.savedAt < ITEMS_CACHE_TTL_MS;

            if (isFresh) {
              setItems(cached.items);
              setLoadedFromCache(true);
              return;
            }
          } catch {
            // ignore invalid cache
          }
        }

        const listResponse = await fetch('https://pokeapi.co/api/v2/item?limit=2500');
        if (!listResponse.ok) {
          throw new Error('โหลดรายการไอเทมไม่สำเร็จ');
        }

        const listPayload = await listResponse.json();
        const results = listPayload.results ?? [];
        const chunkSize = 30;
        const detailedItems = [];

        for (let i = 0; i < results.length; i += chunkSize) {
          const chunk = results.slice(i, i + chunkSize);
          const chunkDetails = await Promise.all(
            chunk.map(async (item) => {
              const detailResponse = await fetch(item.url);
              if (!detailResponse.ok) return null;

              const detail = await detailResponse.json();
              const englishEffect =
                detail.effect_entries.find((entry) => entry.language.name === 'en')
                  ?.short_effect || 'No effect description.';

              return {
                id: detail.id,
                name: detail.name,
                sprite: detail.sprites?.default || '',
                category: detail.category?.name || 'unknown',
                cost: detail.cost ?? 0,
                flingPower: detail.fling_power ?? 0,
                effect: englishEffect,
              };
            })
          );

          detailedItems.push(...chunkDetails.filter(Boolean));
        }

        setItems(detailedItems);
        localStorage.setItem(
          ITEMS_CACHE_KEY,
          JSON.stringify({ savedAt: Date.now(), items: detailedItems })
        );
      } catch (loadError) {
        setError(loadError.message || 'เกิดข้อผิดพลาดในการโหลดไอเทม');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword)
    );
  }, [items, query]);

  useEffect(() => {
    setPage(1);
  }, [query, items.length]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisible = 8;
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const correctedStart = Math.max(1, end - maxVisible + 1);
    const pages = [];
    for (let pageNumber = correctedStart; pageNumber <= end; pageNumber += 1) {
      pages.push(pageNumber);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <>
      <section className="search-panel">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาไอเทม เช่น potion หรือ held-items"
          className="search-input"
        />
      </section>

      {loading && <p className="status-message">กำลังโหลดข้อมูลไอเทม...</p>}
      {!loading && !error && loadedFromCache && (
        <p className="status-message"></p>
      )}
      {error && <p className="status-message">{error}</p>}

      {!loading && !error && filteredItems.length === 0 && (
        <p className="status-message">ไม่พบไอเทมที่ตรงกับคำค้น `{query}`</p>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <>
          <section className="items-grid">
            {pagedItems.map((item) => (
              <article key={item.id} className="item-card">
                <div className="item-card-top">
                  <div className="item-sprite-wrap">
                    {item.sprite ? (
                      <img
                        src={item.sprite}
                        alt={item.name}
                        loading="lazy"
                        className="item-sprite"
                      />
                    ) : (
                      <div className="item-sprite item-sprite-fallback">?</div>
                    )}
                  </div>
                  <div className="item-heading">
                    <p className="item-id">#{item.id}</p>
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-category">{item.category}</p>
                  </div>
                </div>

                <div className="item-stats">
                  <p>
                    ราคา: <span>{item.cost}</span>
                  </p>
                  <p>
                    Fling: <span>{item.flingPower}</span>
                  </p>
                </div>

                <div className="item-effect">
                  <p>{item.effect}</p>
                </div>
              </article>
            ))}
          </section>

          <div className="pagination-wrap">
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              {'<<'}
            </button>
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              {'<'}
            </button>
            {visiblePageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`page-btn ${page === pageNumber ? 'active' : ''}`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              {'>'}
            </button>
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              {'>>'}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default ItemTab;
