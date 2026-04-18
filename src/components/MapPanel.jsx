import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
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
    selectedEntryKey,
    onSelectEntry,
}) {
    const selectedEntry = useMemo(
        () => entries.find((entry) => entry.entryKey === selectedEntryKey),
        [entries, selectedEntryKey],
    )

    return (
        <section className="map-panel">
            <div className="map-header">
                <div>
                    <h2>Field map</h2>
                    <p>
                        {entries.length > 0
                            ? 'Pins reflect filtered activity with known coordinates.'
                            : 'No mapped locations for the current filters.'}
                    </p>
                </div>
                <div className="map-meta">
                    <span className="pill">{entries.length} pins</span>
                    {missingCount > 0 && (
                        <span className="pill subtle">{missingCount} missing coords</span>
                    )}
                </div>
            </div>

            <div className="map-canvas">
                <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {entries.map((entry) => (
                        <Marker
                            key={entry.entryKey}
                            position={entry.coords}
                            eventHandlers={{
                                click: () => onSelectEntry(entry.entryKey),
                            }}
                        >
                            <Popup>
                                <strong>{entry.locationLabel || 'Unknown location'}</strong>
                                <div>{entry.summary}</div>
                                <div>{entry.sourceLabel}</div>
                            </Popup>
                        </Marker>
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
