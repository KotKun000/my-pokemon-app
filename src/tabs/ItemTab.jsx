import { useEffect, useMemo, useState } from 'react';
import itemsData from '../data/items.json';

const ITEMS_PER_PAGE = 40;

/** กลุ่มตัวกรอง — slug ตรงกับ field `category` ใน items.json */
const ITEM_FILTER_GROUPS = [
  {
    id: 'pokeball',
    label: 'Pokeball',
    slugs: ['apricorn-balls', 'special-balls', 'standard-balls'],
  },
  {
    id: 'held-item',
    label: 'Held Item',
    slugs: [
      'bad-held-items',
      'choice',
      'held-items',
      'type-enhancement',
    ],
  },
  {
    id: 'berry',
    label: 'Berry',
    slugs: [
      'baking-only',
      'effort-drop',
      'in-a-pinch',
      'medicine',
      'other',
      'picky-healing',
      'type-protection',
    ],
  },
  {
    id: 'ev-training',
    label: 'EV Training',
    slugs: ['effort-drop', 'effort-training', 'loot', 'vitamins'],
  },
  {
    id: 'evolution',
    label: 'Evolution',
    slugs: ['evolution'],
  },
  {
    id: 'medicine',
    label: 'Medicine',
    slugs: ['flutes', 'healing', 'medicine', 'pp-recovery', 'revival', 'status-cures'],
  },
  {
    id: 'gems',
    label: 'Gems',
    slugs: ['jewels'],
  },
  {
    id: 'mega-stones',
    label: 'Mega Stones',
    slugs: ['mega-stones'],
  },
  {
    id: 'z-crystals',
    label: 'Z Crystals',
    slugs: ['z-crystals'],
  },
  {
    id: 'memories',
    label: 'Memories',
    slugs: ['memories'],
  },
  {
    id: 'plates',
    label: 'Plates',
    slugs: ['plates'],
  },
  {
    id: 'stat-boosts',
    label: 'Stat Boosts',
    slugs: ['stat-boosts'],
  },
];

const ITEM_COVERED_CATEGORIES = new Set(
  ITEM_FILTER_GROUPS.flatMap((g) => g.slugs)
);

function ItemTab() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  /** '' = ทั้งหมด | id ของ ITEM_FILTER_GROUPS | 'other' = หมวดที่ไม่อยู่ในกลุ่มใดเลย */
  const [groupFilter, setGroupFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadItems = () => {
      try {
        setLoading(true);
        setError('');

        // Transform items data to match component structure
        const transformedItems = itemsData.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category || 'unknown',
          effect: item.effect_th || item.effect || 'No effect description.',
          hasThaiTranslation: !!item.effect_th,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.name}.png`,
        }));

        setItems(transformedItems);
      } catch (loadError) {
        setError(loadError.message || 'เกิดข้อผิดพลาดในการโหลดไอเทม');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    let list = items;
    if (groupFilter === 'other') {
      list = list.filter((item) => !ITEM_COVERED_CATEGORIES.has(item.category || 'unknown'));
    } else if (groupFilter) {
      const group = ITEM_FILTER_GROUPS.find((g) => g.id === groupFilter);
      const allow = group ? new Set(group.slugs) : null;
      if (allow) {
        list = list.filter((item) => allow.has(item.category || 'unknown'));
      }
    }
    const keyword = query.trim().toLowerCase();
    if (keyword) {
      list = list.filter((item) => item.name?.toLowerCase().includes(keyword) || false);
    }
    return list;
  }, [items, query, groupFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, groupFilter, items.length]);

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
          placeholder="ค้นหาไอเทม เช่น potion, master-ball"
          className="search-input"
        />
      </section>

      {!loading && !error && (
        <nav
          className="moves-method-filter item-category-filter"
          aria-label="กรองไอเทมตามกลุ่ม"
        >
          <button
            type="button"
            className={`moves-method-btn ${groupFilter === '' ? 'active' : ''}`}
            onClick={() => setGroupFilter('')}
          >
            ทั้งหมด
          </button>
          {ITEM_FILTER_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`moves-method-btn ${groupFilter === g.id ? 'active' : ''}`}
              onClick={() => setGroupFilter(g.id)}
            >
              {g.label}
            </button>
          ))}
          <button
            type="button"
            className={`moves-method-btn ${groupFilter === 'other' ? 'active' : ''}`}
            onClick={() => setGroupFilter('other')}
            title="ทุกอย่างที่ยังไม่ได้ถูกกรอง (category ไม่อยู่ในกลุ่มด้านบน)"
          >
            Other
          </button>
        </nav>
      )}

      {loading && <p className="status-message">กำลังโหลดข้อมูลไอเทม...</p>}
      {error && <p className="status-message">{error}</p>}

      {!loading && !error && filteredItems.length === 0 && (
        <p className="status-message">
          {items.length === 0
            ? 'ไม่มีข้อมูลไอเทม'
            : 'ไม่พบไอเทมที่ตรงกับคำค้นหรือหมวดที่เลือก'}
        </p>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <>
          <section className="items-grid">
            {pagedItems.map((item) => (
              <article key={item.id} className="item-card">
                <div className="item-card-top">
                  <div className="item-sprite-wrap">
                    <img
                      src={item.sprite}
                      alt={item.name}
                      loading="lazy"
                      className="item-sprite"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="item-sprite item-sprite-fallback" style={{ display: 'none' }}>
                      ?
                    </div>
                  </div>
                  <div className="item-heading">
                    <h3 className="item-name">{item.name}</h3>
                    {item.hasThaiTranslation && (
                      <span className="th-badge">คำอธิบาย</span>
                    )}
                  </div>
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
