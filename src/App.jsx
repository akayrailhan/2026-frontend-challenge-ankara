import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getForm, getSubmissions } from './api/jotform'
import { SOURCES } from './data/sources'

const initialState = Object.fromEntries(
  SOURCES.map((source) => [
    source.key,
    { status: 'idle', form: null, submissions: [], error: null },
  ]),
)

const statusLabel = {
  idle: 'Idle',
  loading: 'Loading',
  ready: 'Ready',
  error: 'Error',
}

function summarizeSubmission(submission) {
  const answers = submission?.answers ? Object.values(submission.answers) : []
  const parts = []
  for (const answer of answers) {
    if (!answer) continue
    const label = answer.text || answer.name || 'Answer'
    let value = answer.answer
    if (Array.isArray(value)) value = value.join(', ')
    if (value === undefined || value === null || value === '') continue
    parts.push(`${label}: ${String(value)}`)
    if (parts.length >= 2) break
  }
  return parts.join(' | ') || 'No answers previewed.'
}

function formatDate(value) {
  if (!value) return 'Unknown time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function App() {
  const apiKey = import.meta.env.VITE_JOTFORM_API_KEY
  const [data, setData] = useState(initialState)
  const [activeSource, setActiveSource] = useState('all')

  const sourceStatus = useMemo(
    () =>
      SOURCES.map((source) => ({
        ...source,
        status: data[source.key]?.status || 'idle',
        submissions: data[source.key]?.submissions?.content || [],
        formTitle: data[source.key]?.form?.content?.title || null,
        error: data[source.key]?.error || null,
      })),
    [data],
  )

  const timelineEntries = useMemo(() => {
    const entries = []
    sourceStatus.forEach((source) => {
      source.submissions.forEach((submission) => {
        entries.push({
          id: submission.id,
          createdAt: submission.created_at,
          summary: summarizeSubmission(submission),
          source,
          status: submission.status || 'unknown',
        })
      })
    })
    return entries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [sourceStatus])

  const filteredEntries = useMemo(() => {
    if (activeSource === 'all') return timelineEntries
    return timelineEntries.filter(
      (entry) => entry.source.key === activeSource,
    )
  }, [activeSource, timelineEntries])

  const activeSourceMeta = useMemo(() => {
    if (activeSource === 'all') return null
    return sourceStatus.find((source) => source.key === activeSource) || null
  }, [activeSource, sourceStatus])

  useEffect(() => {
    const missingIds = SOURCES.filter((source) => !source.formId)
    if (!apiKey || missingIds.length > 0) {
      setData((prev) => {
        const next = { ...prev }
        SOURCES.forEach((source) => {
          const error = !apiKey
            ? 'Missing VITE_JOTFORM_API_KEY in .env'
            : !source.formId
              ? `Missing form id for ${source.label}`
              : null
          next[source.key] = {
            ...next[source.key],
            status: error ? 'error' : 'idle',
            error,
          }
        })
        return next
      })
      return
    }

    setData((prev) => {
      const next = { ...prev }
      SOURCES.forEach((source) => {
        next[source.key] = { ...next[source.key], status: 'loading', error: null }
      })
      return next
    })

    let cancelled = false

    Promise.all(
      SOURCES.map(async (source) => {
        try {
          const [form, submissions] = await Promise.all([
            getForm(source.formId, apiKey),
            getSubmissions(source.formId, apiKey, { limit: 5 }),
          ])
          return { key: source.key, status: 'ready', form, submissions }
        } catch (error) {
          return {
            key: source.key,
            status: 'error',
            error: error?.message || 'Request failed',
          }
        }
      }),
    ).then((results) => {
      if (cancelled) return
      setData((prev) => {
        const next = { ...prev }
        results.forEach((result) => {
          if (result.status === 'ready') {
            next[result.key] = {
              status: 'ready',
              form: result.form,
              submissions: result.submissions,
              error: null,
            }
          } else {
            next[result.key] = {
              ...next[result.key],
              status: 'error',
              error: result.error,
            }
          }
        })
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [apiKey])

  return (
    <div className="app">
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
            <strong>{apiKey ? 'Loaded' : 'Missing'}</strong>
          </div>
          <div className="metric">
            <span>Total entries</span>
            <strong>{timelineEntries.length}</strong>
          </div>
          <div className="metric">
            <span>Sources</span>
            <strong>{SOURCES.length}</strong>
          </div>
        </div>
      </header>

      <section className="filters" role="tablist" aria-label="Filter sources">
        <button
          type="button"
          className={`filter-button ${activeSource === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSource('all')}
          role="tab"
          aria-selected={activeSource === 'all'}
        >
          All Sources
        </button>
        {SOURCES.map((source) => (
          <button
            key={source.key}
            type="button"
            className={`filter-button ${activeSource === source.key ? 'active' : ''
              }`}
            onClick={() => setActiveSource(source.key)}
            role="tab"
            aria-selected={activeSource === source.key}
          >
            {source.label}
          </button>
        ))}
      </section>

      <div className="layout">
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
            <span className="pill">
              {filteredEntries.length} entries
            </span>
          </div>

          {activeSourceMeta?.status === 'loading' && (
            <p className="muted">Loading submissions...</p>
          )}

          {activeSourceMeta?.status === 'error' && (
            <p className="error">{activeSourceMeta.error}</p>
          )}

          {filteredEntries.length === 0 && (
            <p className="muted">No submissions yet.</p>
          )}

          {filteredEntries.length > 0 && (
            <ul className="entry-list">
              {filteredEntries.map((entry) => (
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
      </div>
    </div>
  )
}

export default App
