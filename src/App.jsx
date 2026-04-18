import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getForm, getSubmissions } from './api/jotform'
import { SOURCES } from './data/sources'
import Header from './components/Header'
import Filters from './components/Filters'
import Timeline from './components/Timeline'
import MapPanel from './components/MapPanel'
import Sidebar from './components/Sidebar'
import DetailView from './components/DetailView'
import SummaryPanels from './components/SummaryPanels'
import { LOCATION_COORDS } from './data/locations'

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

function extractPersonTags(answers) {
  const tags = new Set()
  const list = answers ? Object.values(answers) : []
  list.forEach((answer) => {
    if (!answer) return
    const name = answer.name || ''
    if (!personFieldNames.includes(name)) return
    const value = normalizeAnswerValue(answer.answer)
    value
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
      .forEach((part) => tags.add(part))
  })
  return Array.from(tags)
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

function getAnswerValue(answers, fieldName) {
  if (!answers) return ''
  const list = Object.values(answers)
  const match = list.find((answer) => answer?.name === fieldName)
  return match?.answer ? String(match.answer) : ''
}

function formatDate(value) {
  if (!value) return 'Unknown time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatDateLabel(value) {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString()
}

function normalizeLocationKey(value) {
  if (!value) return ''
  return String(value).trim().toLowerCase()
}

function matchLocationKey(value) {
  const normalized = normalizeLocationKey(value)
  if (!normalized) return ''
  if (LOCATION_COORDS[normalized]) return normalized
  const fallbackKey = Object.keys(LOCATION_COORDS).find((key) =>
    normalized.includes(key),
  )
  return fallbackKey || ''
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
        const personTags = extractPersonTags(submission.answers)
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
          personTags,
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

  const groupedEntries = useMemo(() => {
    const groups = new Map()
    filteredEntries.forEach((entry) => {
      const dateKey = entry.createdAt?.split(' ')[0] || 'Unknown'
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey).push(entry)
    })

    return Array.from(groups.entries()).map(([dateKey, entries]) => ({
      dateKey,
      dateLabel: formatDateLabel(dateKey),
      entries,
    }))
  }, [filteredEntries])

  const mapEntries = useMemo(() => {
    return filteredEntries
      .map((entry) => {
        const locationValue = getAnswerValue(entry.answers, 'location')
        const locationKey = matchLocationKey(locationValue)
        const coords = LOCATION_COORDS[locationKey]
        if (!coords) return null
        return {
          entryKey: entry.entryKey,
          coords,
          summary: entry.summary,
          sourceLabel: entry.source.label,
          locationLabel: locationValue,
        }
      })
      .filter(Boolean)
  }, [filteredEntries])

  const missingLocations = useMemo(() => {
    const counts = new Map()
    filteredEntries.forEach((entry) => {
      const locationValue = getAnswerValue(entry.answers, 'location')
      const locationKey = matchLocationKey(locationValue)
      if (!locationValue || !locationKey) {
        const label = locationValue ? String(locationValue) : 'Unknown'
        counts.set(label, (counts.get(label) || 0) + 1)
      }
    })
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredEntries])

  const missingMapCount = useMemo(() => {
    return filteredEntries.filter((entry) => {
      const locationValue = getAnswerValue(entry.answers, 'location')
      if (!locationValue) return true
      const locationKey = matchLocationKey(locationValue)
      return !locationKey
    }).length
  }, [filteredEntries])

  const selectedEntry = useMemo(() => {
    if (!selectedEntryKey) return null
    return timelineEntries.find((entry) => entry.entryKey === selectedEntryKey)
  }, [selectedEntryKey, timelineEntries])

  const linkedEntries = useMemo(() => {
    if (!selectedEntry || selectedEntry.personTags.length === 0) return []
    const tagSet = new Set(selectedEntry.personTags)
    return timelineEntries
      .filter((entry) => entry.entryKey !== selectedEntry.entryKey)
      .filter((entry) => entry.personTags.some((tag) => tagSet.has(tag)))
      .slice(0, 8)
  }, [selectedEntry, timelineEntries])

  const lastSeenWith = useMemo(() => {
    const sightings = timelineEntries.filter(
      (entry) => entry.source.key === 'sightings',
    )
    if (sightings.length === 0) return null
    const latest = sightings[0]
    return {
      person: getAnswerValue(latest.answers, 'seenWith') || 'Unknown',
      location: getAnswerValue(latest.answers, 'location') || 'Unknown',
      date: latest.createdAt,
    }
  }, [timelineEntries])

  const mostSuspicious = useMemo(() => {
    const counts = new Map()
    timelineEntries.forEach((entry) => {
      entry.personTags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      })
    })
    let topPerson = ''
    let topCount = 0
    counts.forEach((count, person) => {
      if (count > topCount) {
        topPerson = person
        topCount = count
      }
    })
    if (!topPerson) return null
    return {
      person: topPerson,
      count: topCount,
      reason: 'Most frequent across linked records',
    }
  }, [timelineEntries])

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

      <SummaryPanels lastSeenWith={lastSeenWith} mostSuspicious={mostSuspicious} />

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
        <div className="main-stack">
          <MapPanel
            entries={mapEntries}
            missingCount={missingMapCount}
            missingLocations={missingLocations}
            selectedEntryKey={selectedEntryKey}
            onSelectEntry={setSelectedEntryKey}
          />
          <Timeline
            activeSourceMeta={activeSourceMeta}
            groupedEntries={groupedEntries}
            formatDate={formatDate}
            showLoading={activeSourceMeta?.status === 'loading'}
            showError={activeSourceMeta?.status === 'error'}
            errorMessage={activeSourceMeta?.error}
            selectedEntryKey={selectedEntryKey}
            onSelectEntry={setSelectedEntryKey}
          />
        </div>

        <div className="side-stack">
          <DetailView
            entry={selectedEntry}
            linkedEntries={linkedEntries}
            onSelectLinked={setSelectedEntryKey}
          />
          <Sidebar sourceStatus={sourceStatus} statusLabel={statusLabel} />
        </div>
      </div>
    </div>
  )
}

export default App
