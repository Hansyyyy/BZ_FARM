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
                </button>
            ))}
        </div>
    );
}
