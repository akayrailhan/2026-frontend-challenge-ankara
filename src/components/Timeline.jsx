function Timeline({
    activeSourceMeta,
    entries,
    formatDate,
    showLoading,
    showError,
    errorMessage,
}) {
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
                <span className="pill">{entries.length} entries</span>
            </div>

            {showLoading && <p className="muted">Loading submissions...</p>}

            {showError && <p className="error">{errorMessage}</p>}

            {!showLoading && !showError && entries.length === 0 && (
                <p className="muted">No submissions yet.</p>
            )}

            {entries.length > 0 && (
                <ul className="entry-list">
                    {entries.map((entry) => (
                        <li key={`${entry.source.key}-${entry.id}`} className="entry">
                            <div className="entry-top">
                                <span className="entry-source">{entry.source.label}</span>
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
            )}
        </section>
    )
}

export default Timeline
