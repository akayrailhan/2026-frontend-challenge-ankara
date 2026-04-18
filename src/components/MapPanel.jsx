import { useEffect, useMemo, useState } from 'react'
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    CircleMarker,
    Polyline,
    useMap,
} from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../data/locations'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
})

function MapFocus({ target }) {
    const map = useMap()

    useEffect(() => {
        if (!target) return
        map.setView(target.coords, Math.max(map.getZoom(), 11), {
            animate: true,
        })
    }, [map, target])

    return null
}

function MapPanel({
    entries = [],
    missingCount = 0,
    missingLocations = [],
    routeEntries = [],
    routeLabel = 'Podo',
    formatDate,
    selectedEntryKey,
    onSelectEntry,
}) {
    const [viewMode, setViewMode] = useState('route')
    const selectedEntry = useMemo(
        () => entries.find((entry) => entry.entryKey === selectedEntryKey),
        [entries, selectedEntryKey],
    )

    const routeLine = routeEntries.map((entry) => entry.coords)
    const showRoute = viewMode === 'route'
    const showPins = viewMode === 'all'

    return (
        <section className="map-panel">
            <div className="map-header">
                <div>
                    <h2>Field map</h2>
                    <p>
                        {showRoute
                            ? `Tracking ${routeLabel}'s known route over time.`
                            : entries.length > 0
                                ? 'Pins reflect filtered activity with known coordinates.'
                                : 'No mapped locations for the current filters.'}
                    </p>
                </div>
                <div className="map-meta">
                    {showPins && <span className="pill">{entries.length} pins</span>}
                    {showRoute && (
                        <span className="pill subtle">{routeEntries.length} stops</span>
                    )}
                    {missingCount > 0 && (
                        <span className="pill subtle">{missingCount} missing coords</span>
                    )}
                </div>
            </div>

            <div className="map-toggle">
                <button
                    type="button"
                    className={`map-toggle-button ${showRoute ? 'active' : ''}`}
                    onClick={() => setViewMode('route')}
                >
                    {routeLabel} route
                </button>
                <button
                    type="button"
                    className={`map-toggle-button ${showPins ? 'active' : ''}`}
                    onClick={() => setViewMode('all')}
                >
                    All activity
                </button>
            </div>

            <div className="map-canvas">
                <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {showPins &&
                        entries.map((entry) => (
                            <Marker
                                key={entry.entryKey}
                                position={entry.coords}
                                eventHandlers={{
                                    click: () => onSelectEntry(entry.entryKey),
                                }}
                            >
                                <Popup>
                                    <strong>
                                        {entry.locationLabel || 'Unknown location'}
                                    </strong>
                                    <div>{entry.summary}</div>
                                    <div>{entry.sourceLabel}</div>
                                </Popup>
                            </Marker>
                        ))}
                    {showRoute && routeLine.length > 1 && (
                        <Polyline
                            positions={routeLine}
                            pathOptions={{ color: '#1f4c8b', weight: 3, opacity: 0.7 }}
                        />
                    )}
                    {showRoute &&
                        routeEntries.map((entry, index) => (
                            <CircleMarker
                                key={entry.entryKey}
                                center={entry.coords}
                                radius={6}
                                pathOptions={{ color: '#1f4c8b', weight: 2, fillOpacity: 0.8 }}
                            >
                                <Popup>
                                    <strong>
                                        {routeLabel} stop {index + 1}
                                    </strong>
                                    <div>{entry.locationLabel || 'Unknown location'}</div>
                                    {formatDate && (
                                        <div>{formatDate(entry.createdAt)}</div>
                                    )}
                                </Popup>
                            </CircleMarker>
                        ))}
                    {selectedEntry && (
                        <CircleMarker
                            center={selectedEntry.coords}
                            radius={16}
                            pathOptions={{ color: '#d97706', weight: 2, fillOpacity: 0.1 }}
                        />
                    )}
                    <MapFocus target={selectedEntry} />
                </MapContainer>
            </div>

            {showRoute && routeEntries.length > 0 && (
                <div className="route-panel">
                    <div className="route-header">
                        <h3>{routeLabel} route timeline</h3>
                        <span className="pill subtle">{routeEntries.length} stops</span>
                    </div>
                    <ol className="route-list">
                        {routeEntries.map((entry, index) => (
                            <li
                                key={entry.entryKey}
                                className="route-item"
                                onClick={() => onSelectEntry(entry.entryKey)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        onSelectEntry(entry.entryKey)
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <span className="route-index">{index + 1}</span>
                                <div className="route-meta">
                                    <strong>{entry.locationLabel || 'Unknown location'}</strong>
                                    {formatDate && (
                                        <span className="muted">{formatDate(entry.createdAt)}</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {missingLocations.length > 0 && (
                <details className="map-missing">
                    <summary>Missing location labels</summary>
                    <ul>
                        {missingLocations.slice(0, 10).map((item) => (
                            <li key={item.label}>
                                <span>{item.label}</span>
                                <strong>{item.count}</strong>
                            </li>
                        ))}
                    </ul>
                    {missingLocations.length > 10 && (
                        <p className="muted">
                            {missingLocations.length - 10} more locations hidden.
                        </p>
                    )}
                    <p className="muted">
                        Add these labels to src/data/locations.js to render pins.
                    </p>
                </details>
            )}
        </section>
    )
}

export default MapPanel
