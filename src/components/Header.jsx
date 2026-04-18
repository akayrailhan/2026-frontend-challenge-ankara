function Header({ apiKeyLoaded, totalEntries, sourceCount }) {
    return (
        <header className="hero">
            <div className="hero-copy">
                <p className="eyebrow">Jotform Intel Board</p>
                <h1>Unified investigation feed</h1>
                <p className="subhead">
                    One timeline, five data sources. Filter quickly, cross-check faster.
                </p>
            </div>
            <div className="hero-metrics">
                <div className="metric">
                    <span>API key</span>
                    <strong>{apiKeyLoaded ? 'Loaded' : 'Missing'}</strong>
                </div>
                <div className="metric">
                    <span>Total entries</span>
                    <strong>{totalEntries}</strong>
                </div>
                <div className="metric">
                    <span>Sources</span>
                    <strong>{sourceCount}</strong>
                </div>
            </div>
        </header>
    )
}

export default Header
