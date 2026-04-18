function Timeline({
    activeSourceMeta,
    groupedEntries,
    formatDate,
    showLoading,
    showError,
    errorMessage,
    selectedEntryKey,
    onSelectEntry,
}) {
    const totalEntries = groupedEntries.reduce(
        (count, group) => count + group.entries.length,
        0,
    )

    return (
        <section className="timeline">
            <div className="timeline-header">
                <div>
                    <h2>{activeSourceMeta?.label || 'All sources'}</h2>
                    <p>
                        {activeSourceMeta?.formTitle
                            ? activeSourceMeta.formTitle
                            : 'Most recent activity across the full dataset.'}
                    </p>
                </div>
                <span className="pill">{totalEntries} entries</span>
            </div>

            {showLoading && <p className="muted">Loading submissions...</p>}

            {showError && <p className="error">{errorMessage}</p>}

            {!showLoading && !showError && totalEntries === 0 && (
                <p className="muted">No submissions yet.</p>
            )}

            {totalEntries > 0 && (
                <div className="entry-groups">
                    {groupedEntries.map((group) => (
                        <div key={group.dateKey} className="entry-group">
                            <div className="entry-date-divider">
                                <span>{group.dateLabel}</span>
                            </div>
                            <ul className="entry-list">
                                {group.entries.map((entry) => (
                                    <li
                                        key={entry.entryKey}
                                        className={`entry ${selectedEntryKey === entry.entryKey
                                                ? 'selected'
                                                : ''
                                            }`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onSelectEntry(entry.entryKey)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                onSelectEntry(entry.entryKey)
                                            }
                                        }}
                                    >
                                        <div className="entry-top">
                                            <span className="entry-source">
                                                {entry.source.label}
                                            </span>
                                            <span className="entry-date">
                                                {formatDate(entry.createdAt)}
                                            </span>
                                        </div>
                                        <p>{entry.summary}</p>
                                        <div className="entry-meta">
                                            <span className="pill subtle">{entry.status}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

export default Timeline
