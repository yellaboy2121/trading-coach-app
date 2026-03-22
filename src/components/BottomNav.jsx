import '../styles/BottomNav.css'

export function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analyzer', label: 'Analyzer' },
    { id: 'calculator', label: 'Calculator' },
    { id: 'journal', label: 'Journal' }
  ]

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
