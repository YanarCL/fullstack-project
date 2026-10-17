function TabsBar({ tabs, activeTab, onChange, icons = {} }) {
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          className={`tab ${activeTab === tab ? "tab-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {icons[tab] && <span className="tab-icon">{icons[tab]}</span>}
          <span>{tab}</span>
        </button>
      ))}
    </nav>
  );
}

export default TabsBar;
