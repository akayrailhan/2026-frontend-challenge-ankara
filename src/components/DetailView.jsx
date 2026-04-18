function DetailView({ entry, linkedEntries, onSelectLinked }) {
    if (!entry) {
        return (
            <section className="detail-card">
                <h3>Detail view</h3>
                <p className="muted">Select a record to see full details.</p>
            </section>
        )
    }

    const answers = entry.answers || {}
    const answerList = Object.values(answers)
        .filter((answer) => answer && answer.answer)
        .sort((a, b) => Number(a.order) - Number(b.order))

    return (
        <section className="detail-card">
            <div className="detail-header">
                <div>
                    <p className="detail-source">{entry.source.label}</p>
                    <h3>Record detail</h3>
                </div>
                <span className="pill subtle">{entry.status}</span>
            </div>
            <p className="detail-date">{entry.createdAt}</p>
            <p className="detail-summary">{entry.summary}</p>

            <div className="detail-answers">
                <h4>Answers</h4>
                {answerList.length === 0 ? (
                    <p className="muted">No answers available.</p>
                ) : (
                    <ul>
                        {answerList.map((answer) => (
                            <li key={answer.name || answer.text || answer.order}>
                                <span>{answer.text || answer.name || 'Field'}</span>
                                <strong>{String(answer.answer)}</strong>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="detail-links">
                <h4>Linked records</h4>
                {linkedEntries.length === 0 ? (
                    <p className="muted">No linked records found.</p>
                ) : (
                    <ul>
                        {linkedEntries.map((linked) => (
                            <li key={linked.entryKey}>
                                <button
                                    type="button"
                                    onClick={() => onSelectLinked(linked.entryKey)}
                                >
                                    <span>{linked.source.label}</span>
                                    <strong>{linked.summary}</strong>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    )
}

export default DetailView
