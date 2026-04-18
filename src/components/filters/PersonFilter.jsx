function PersonFilter({ value, onChange, onApply }) {
    return (
        <div className="filter-fields">
            <label htmlFor="entry-person">Person</label>
            <input
                id="entry-person"
                type="search"
                placeholder="Search person"
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

export default PersonFilter
