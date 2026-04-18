import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getForm, getSubmissions } from './api/jotform'
import { SOURCES } from './data/sources'
import Header from './components/Header'
import Filters from './components/Filters'
import Timeline from './components/Timeline'
import Sidebar from './components/Sidebar'
import DetailView from './components/DetailView'

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

const locationFieldNames = ['location']
const personFieldNames = ['personName', 'seenWith', 'senderName', 'recipientName']
const contentFieldNames = ['note']

function normalizeAnswerValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (value === undefined || value === null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function buildSearchText(submission) {
  const answers = submission?.answers ? Object.values(submission.answers) : []
  const contentParts = []
  const locationParts = []
  const personParts = []

  answers.forEach((answer) => {
    if (!answer) return
    const label = answer.text || answer.name || ''
    const name = answer.name || ''
    const value = normalizeAnswerValue(answer.answer)
    if (!value) return
    const combined = label ? `${label}: ${value}` : value

    if (locationFieldNames.includes(name)) {
      locationParts.push(combined)
      return
    }

    if (personFieldNames.includes(name)) {
      personParts.push(combined)
      return
    }

    if (contentFieldNames.includes(name)) {
      contentParts.push(combined)
      return
    }

    contentParts.push(combined)
  })

  return {
    contentText: contentParts.join(' '),
    locationText: locationParts.join(' '),
    personText: personParts.join(' '),
  }
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
  const [personQuery, setPersonQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [contentQuery, setContentQuery] = useState('')
  const [draftPersonQuery, setDraftPersonQuery] = useState('')
  const [draftLocationQuery, setDraftLocationQuery] = useState('')
  const [draftContentQuery, setDraftContentQuery] = useState('')
  const [selectedEntryKey, setSelectedEntryKey] = useState(null)

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
        const searchText = buildSearchText(submission)
        const entryKey = `${source.key}-${submission.id}`
        entries.push({
          id: submission.id,
          entryKey,
          createdAt: submission.created_at,
          summary: summarizeSubmission(submission),
          source,
          status: submission.status || 'unknown',
          contentText: searchText.contentText,
          locationText: searchText.locationText,
          personText: searchText.personText,
          answers: submission.answers,
        })
      })
    })
    return entries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [sourceStatus])

  const filteredEntries = useMemo(() => {
    const baseEntries =
      activeSource === 'all'
        ? timelineEntries
        : timelineEntries.filter((entry) => entry.source.key === activeSource)

    const personTrimmed = personQuery.trim().toLowerCase()
    const locationTrimmed = locationQuery.trim().toLowerCase()
    const contentTrimmed = contentQuery.trim().toLowerCase()

    if (!personTrimmed && !locationTrimmed && !contentTrimmed) {
      return baseEntries
    }

    return baseEntries.filter((entry) => {
      if (personTrimmed) {
        const personHaystack = entry.personText.toLowerCase()
        if (!personHaystack.includes(personTrimmed)) return false
      }

      if (locationTrimmed) {
        const locationHaystack = entry.locationText.toLowerCase()
        if (!locationHaystack.includes(locationTrimmed)) return false
      }

      if (contentTrimmed) {
        const contentHaystack = entry.contentText.toLowerCase()
        if (!contentHaystack.includes(contentTrimmed)) return false
      }

      return true
    })
  }, [
    activeSource,
    contentQuery,
    locationQuery,
    personQuery,
    timelineEntries,
  ])

  const activeSourceMeta = useMemo(() => {
    if (activeSource === 'all') return null
    return sourceStatus.find((source) => source.key === activeSource) || null
  }, [activeSource, sourceStatus])

  const selectedEntry = useMemo(() => {
    if (!selectedEntryKey) return null
    return timelineEntries.find((entry) => entry.entryKey === selectedEntryKey)
  }, [selectedEntryKey, timelineEntries])

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
      <Header
        apiKeyLoaded={Boolean(apiKey)}
        totalEntries={timelineEntries.length}
        sourceCount={SOURCES.length}
      />

      <Filters
        sources={SOURCES}
        activeSource={activeSource}
        onSourceChange={setActiveSource}
        draftPersonQuery={draftPersonQuery}
        draftLocationQuery={draftLocationQuery}
        draftContentQuery={draftContentQuery}
        onDraftPersonChange={setDraftPersonQuery}
        onDraftLocationChange={setDraftLocationQuery}
        onDraftContentChange={setDraftContentQuery}
        onApply={() => {
          setPersonQuery(draftPersonQuery)
          setLocationQuery(draftLocationQuery)
          setContentQuery(draftContentQuery)
        }}
      />

      <div className="layout">
        <Timeline
          activeSourceMeta={activeSourceMeta}
          entries={filteredEntries}
          formatDate={formatDate}
          showLoading={activeSourceMeta?.status === 'loading'}
          showError={activeSourceMeta?.status === 'error'}
          errorMessage={activeSourceMeta?.error}
          selectedEntryKey={selectedEntryKey}
          onSelectEntry={setSelectedEntryKey}
        />

        <div className="side-stack">
          <DetailView entry={selectedEntry} />
          <Sidebar sourceStatus={sourceStatus} statusLabel={statusLabel} />
        </div>
      </div>
    </div>
  )
}

export default App
