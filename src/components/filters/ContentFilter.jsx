function ContentFilter({ value, onChange, onApply }) {
    return (
        <div className="filter-fields">
            <label htmlFor="entry-content">Content</label>
            <input
                id="entry-content"
                type="search"
                placeholder="Search content"
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

export default ContentFilter
