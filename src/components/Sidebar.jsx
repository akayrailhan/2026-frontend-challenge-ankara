function Sidebar({ sourceStatus, statusLabel }) {
    return (
        <aside className="sidebar">
            <div className="side-card">
                <h3>Source status</h3>
                <ul>
                    {sourceStatus.map((source) => (
                        <li key={source.key}>
                            <div>
                                <span>{source.label}</span>
                            </div>
                            <div className={`status-dot ${source.status}`}>
                                {statusLabel[source.status]}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="side-card">
                <h3>Quick totals</h3>
                <div className="totals">
                    {sourceStatus.map((source) => (
                        <div key={source.key} className="total-row">
                            <span>{source.label}</span>
                            <strong>{source.submissions.length}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
