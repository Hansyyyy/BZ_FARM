export default function SearchToolbar({ search, onSearchChange, placeholder, actions }) {
    return (
        <div className="table-toolbar table-toolbar-spaced">
            <div className="search-box">
                <i className="bi bi-search"></i>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>
            <div className="table-toolbar-actions">{actions}</div>
        </div>
    );
}
