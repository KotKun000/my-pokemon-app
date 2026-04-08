import './App.css';
import { useState } from 'react';
import MoveTab from './tabs/MoveTab';
import PlaceholderTab from './tabs/PlaceholderTab';
import PokemonTab from './tabs/PokemonTab';

const NAV_ITEMS = [
  { key: 'pokemon', label: 'โปเกมอน (Pokemon)' },
  { key: 'item', label: 'ไอเทม (Item)' },
  { key: 'move', label: 'ท่า (Move)' },
  { key: 'build-team', label: 'จัดทีม (Build Team)' },
  { key: 'type', label: 'ตารางธาตุ (Type)' },
  { key: 'guide', label: 'แนะนำ' },
];

function App() {
  const [activePage, setActivePage] = useState('pokemon');

  return (
    <main className="app-shell">
      <section className="hero-section">
        <h1 className="hero-title">Pokemon Companion Hub</h1>
        <p className="hero-subtitle">
          ศูนย์รวมข้อมูลโปเกมอนสำหรับค้นหาและเตรียมฟีเจอร์ใหม่ในอนาคต
        </p>
      </section>
      <nav className="nav-tabs">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActivePage(item.key)}
            className={`nav-tab ${activePage === item.key ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activePage === 'pokemon' && <PokemonTab />}
      {activePage === 'move' && <MoveTab />}
      {!['pokemon', 'move'].includes(activePage) && <PlaceholderTab />}
    </main>
  );
}

export default App;
