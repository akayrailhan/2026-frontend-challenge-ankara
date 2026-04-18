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

  const sourceStatus = useMemo(
    () =>
      SOURCES.map((source) => ({
        ...source,
        status: data[source.key]?.status || 'idle',
      })),
    [data],
  )

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
      <header className="header">
        <div>
          <p className="eyebrow">Jotform Intel Board</p>
          <h1>Live data sources</h1>
          <p className="subhead">
            Fetching five investigation feeds directly from Jotform.
          </p>
        </div>
        <div className="panel">
          <div>
            <span>API key</span>
            <strong>{apiKey ? 'Loaded' : 'Missing'}</strong>
          </div>
          <div>
            <span>Sources</span>
            <strong>{SOURCES.length}</strong>
          </div>
        </div>
      </header>

      <section className="cards">
        {SOURCES.map((source) => {
          const entry = data[source.key]
          const submissions = entry?.submissions?.content || []
          return (
            <article key={source.key} className="card">
              <div className="card-top">
                <div>
                  <h2>{source.label}</h2>
                  <p>Form ID: {source.formId || 'Missing in .env'}</p>
                </div>
                <span className={`status ${entry?.status || 'idle'}`}>
                  {statusLabel[entry?.status || 'idle']}
                </span>
              </div>

              {entry?.status === 'loading' && (
                <p className="muted">Loading submissions...</p>
              )}

              {entry?.status === 'error' && (
                <p className="error">{entry.error}</p>
              )}

              {entry?.status === 'ready' && (
                <div className="card-body">
                  <p className="form-title">
                    {entry.form?.content?.title || 'Untitled Jotform'}
                  </p>
                  {submissions.length === 0 ? (
                    <p className="muted">No submissions yet.</p>
                  ) : (
                    <ul>
                      {submissions.map((submission) => (
                        <li key={submission.id}>
                          <span>{formatDate(submission.created_at)}</span>
                          <p>{summarizeSubmission(submission)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </section>

      <aside className="status-bar">
        {sourceStatus.map((source) => (
          <div key={source.key} className="status-pill">
            <span>{source.label}</span>
            <strong>{statusLabel[source.status]}</strong>
          </div>
        ))}
      </aside>
    </div>
  )
}

export default App
