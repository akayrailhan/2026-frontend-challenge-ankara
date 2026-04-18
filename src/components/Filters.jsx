import ContentFilter from './filters/ContentFilter'
import LocationFilter from './filters/LocationFilter'
import PersonFilter from './filters/PersonFilter'

function Filters({
    sources,
    activeSource,
    onSourceChange,
    draftPersonQuery,
    draftLocationQuery,
    draftContentQuery,
    onDraftPersonChange,
    onDraftLocationChange,
    onDraftContentChange,
    onApply,
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
                <PersonFilter
                    value={draftPersonQuery}
                    onChange={onDraftPersonChange}
                    onApply={onApply}
                />
                <LocationFilter
                    value={draftLocationQuery}
                    onChange={onDraftLocationChange}
                    onApply={onApply}
                />
                <ContentFilter
                    value={draftContentQuery}
                    onChange={onDraftContentChange}
                    onApply={onApply}
                />
                <button type="button" className="search-button" onClick={onApply}>
                    Apply
                </button>
            </div>
        </section>
    )
}

export default Filters
