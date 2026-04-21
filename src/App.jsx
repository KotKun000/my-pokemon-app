import './App.css';
import { useState } from 'react';
import BuildTeamTab from './tabs/BuildTeamTab';
import ItemTab from './tabs/ItemTab';
import MoveTab from './tabs/MoveTab';
import PlaceholderTab from './tabs/PlaceholderTab';
import PokemonTab from './tabs/PokemonTab';
import GuideTab from './tabs/GuideTab';
import TipsTab from './tabs/TipsTab';

const NAV_ITEMS = [
  { key: 'pokemon', label: 'โปเกมอน (Pokemon)' },
  { key: 'item', label: 'ไอเทม (Item)' },
  { key: 'move', label: 'ท่า (Move)' },
  { key: 'build-team', label: 'จัดทีม (Build Team)' },
  { key: 'tips', label: 'เรื่องควรรู้ (Tips)' },
  { key: 'guide', label: 'แนะนำ (Guide)' },
];

function App() {
  const [activePage, setActivePage] = useState('pokemon');
  const [tipsInitialSub, setTipsInitialSub] = useState('types');

  const handleNavigate = (page, options = {}) => {
    setActivePage(page);
    if (page === 'tips' && options.tipsSub) {
      setTipsInitialSub(options.tipsSub);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-section">
        <h1 className="hero-title">Pokemon Companion Hub</h1>
        <p className="hero-subtitle">
          ศูนย์รวมข้อมูลโปเกมอนสำหรับเทรนเนอร์มือใหม่
        </p>
      </section>
      <nav className="nav-tabs">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleNavigate(item.key)}
            className={`nav-tab ${activePage === item.key ? 'active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activePage === 'pokemon' && <PokemonTab />}
      {activePage === 'item' && <ItemTab />}
      {activePage === 'move' && <MoveTab />}
      {activePage === 'build-team' && <BuildTeamTab />}
      {activePage === 'tips' && <TipsTab initialSub={tipsInitialSub} />}
      {activePage === 'guide' && <GuideTab onNavigate={handleNavigate} />}
      {!['pokemon', 'item', 'move', 'build-team', 'tips', 'guide'].includes(activePage) && (
        <PlaceholderTab />
      )}
    </main>
  );
}

export default App;
