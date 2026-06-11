export default function ModuleTabs({ tabs, activeTab, onChange }) {
    return (
        <div className="module-tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    className={`module-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.label}
                    {tab.badge > 0 && (
                        <span className="module-tab-badge">{tab.badge > 9 ? '9+' : tab.badge}</span>
                    )}
                </button>
            ))}
        </div>
    );
}
