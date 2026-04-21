import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Reusable searchable dropdown component
 *
 * Props:
 *  items        — Array ของข้อมูล
 *  value        — key ปัจจุบันที่เลือก (string/number)
 *  onChange     — (key) => void
 *  getLabel     — (item) => string | ReactNode (ตัว label สำหรับแสดงที่ trigger)
 *  getKey       — (item) => string/number (key เฉพาะของ item)
 *  getSearchText — (item) => string (ข้อความใช้ค้นหา; default = getLabel)
 *  renderItem   — (item) => ReactNode (ตัวที่แสดงใน dropdown; default = getLabel)
 *  renderTrigger — (item|null) => ReactNode (ตัวแสดงที่ trigger; default = getLabel)
 *  placeholder  — ข้อความเมื่อยังไม่เลือก
 *  emptyLabel   — ข้อความของตัวเลือกล้างค่า
 *  showEmpty    — แสดงตัวเลือก "ล้างค่า" หรือไม่
 *  disabled     — ปิดการใช้งาน
 *  className    — คลาสเสริม
 *  maxVisible   — จำนวนรายการสูงสุดที่แสดง (default 200)
 */
export default function SearchDropdown({
  items,
  value,
  onChange,
  getLabel = (i) => String(i),
  getKey = (i) => i,
  getSearchText,
  renderItem,
  renderTrigger,
  placeholder = 'เลือก...',
  emptyLabel = 'ล้างค่า',
  showEmpty = true,
  disabled = false,
  className = '',
  maxVisible = 200,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const searchFn = getSearchText || ((i) => {
    const l = getLabel(i);
    return typeof l === 'string' ? l : '';
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? items.filter((i) => searchFn(i).toLowerCase().includes(q))
      : items;
    return list.slice(0, maxVisible);
  }, [items, query, searchFn, maxVisible]);

  const currentItem = useMemo(() => {
    if (value == null || value === '') return null;
    return items.find((i) => getKey(i) === value) || null;
  }, [items, value, getKey]);

  const triggerContent = renderTrigger
    ? renderTrigger(currentItem)
    : currentItem
      ? getLabel(currentItem)
      : placeholder;

  return (
    <div
      ref={wrapperRef}
      className={`search-dropdown ${open ? 'open' : ''} ${disabled ? 'disabled' : ''} ${className}`}
    >
      <button
        type="button"
        className={`search-dropdown-trigger ${currentItem ? 'has-value' : 'empty'}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <span className="search-dropdown-value">{triggerContent}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="search-dropdown-chevron">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="search-dropdown-menu">
          <div className="search-dropdown-search-wrap">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="search-dropdown-search-icon"
            >
              <circle cx="8" cy="8" r="5" />
              <path d="M13 13l3.5 3.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="search-dropdown-search-input"
              placeholder="ค้นหา..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-dropdown-search-clear"
                onClick={() => setQuery('')}
              >
                ✕
              </button>
            )}
          </div>
          <div className="search-dropdown-list">
            {showEmpty && (
              <button
                type="button"
                className={`search-dropdown-item search-dropdown-item--empty ${!currentItem ? 'active' : ''}`}
                onClick={() => {
                  onChange('');
                  setOpen(false);
                  setQuery('');
                }}
              >
                {emptyLabel}
              </button>
            )}
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const k = getKey(item);
                const active = currentItem && getKey(currentItem) === k;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`search-dropdown-item ${active ? 'active' : ''}`}
                    onClick={() => {
                      onChange(k);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    {renderItem ? renderItem(item) : getLabel(item)}
                  </button>
                );
              })
            ) : (
              <p className="search-dropdown-empty">ไม่พบข้อมูล</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
