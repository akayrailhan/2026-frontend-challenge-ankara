function Filters({
    sources,
    activeSource,
    onSourceChange,
    draftQuery,
    onDraftChange,
    onSearch,
}) {
    return (
        <section className="filters" role="tablist" aria-label="Filter sources">
            <div className="filter-tabs">
                <button
                    type="button"
                    className={`filter-button ${activeSource === 'all' ? 'active' : ''}`}
                    onClick={() => onSourceChange('all')}
                    role="tab"
                    aria-selected={activeSource === 'all'}
                >
                    All Sources
                </button>
                {sources.map((source) => (
                    <button
                        key={source.key}
                        type="button"
                        className={`filter-button ${activeSource === source.key ? 'active' : ''
                            }`}
                        onClick={() => onSourceChange(source.key)}
                        role="tab"
                        aria-selected={activeSource === source.key}
                    >
                        {source.label}
                    </button>
                ))}
            </div>
            <div className="filter-search">
                <label htmlFor="entry-search">Search</label>
                <div className="search-field">
                    <input
                        id="entry-search"
                        type="search"
                        placeholder="Search by person, place, content..."
                        value={draftQuery}
                        onChange={(event) => onDraftChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                onSearch()
                            }
                        }}
                    />
                    <button type="button" className="search-button" onClick={onSearch}>
                        Search
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Filters
