function SummaryPanels({ lastSeenWith, mostSuspicious }) {
    return (
        <section className="summary-panels">
            <div className="summary-card">
                <p className="summary-label">Last seen with</p>
                <h3>{lastSeenWith?.person || 'Unknown'}</h3>
                <p className="summary-meta">
                    {lastSeenWith?.location || 'No location'}
                </p>
                <p className="summary-meta">
                    {lastSeenWith?.date || 'No recent sightings'}
                </p>
            </div>
            <div className="summary-card">
                <p className="summary-label">Most suspicious</p>
                <h3>{mostSuspicious?.person || 'Unknown'}</h3>
                <p className="summary-meta">
                    {mostSuspicious?.count
                        ? `${mostSuspicious.count} related records`
                        : 'No activity yet'}
                </p>
                <p className="summary-meta">
                    {mostSuspicious?.reason || 'Based on linked activity volume'}
                </p>
            </div>
        </section>
    )
}

export default SummaryPanels
