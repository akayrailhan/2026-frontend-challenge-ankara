function LocationFilter({ value, onChange, onApply }) {
    return (
        <div className="filter-fields">
            <label htmlFor="entry-location">Location</label>
            <input
                id="entry-location"
                type="search"
                placeholder="Search location"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        onApply()
                    }
                }}
            />
        </div>
    )
}

export default LocationFilter
