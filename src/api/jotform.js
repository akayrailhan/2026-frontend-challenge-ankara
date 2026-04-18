const API_BASE = 'https://api.jotform.com'

function buildUrl(path, apiKey, params = {}) {
    const url = new URL(`${API_BASE}${path}`)
    url.searchParams.set('apiKey', apiKey)
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value)
        }
    })
    return url.toString()
}

async function fetchJson(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`)
    }
    const data = await response.json()
    if (data.responseCode && data.responseCode !== 200) {
        throw new Error(data.message || 'Jotform request failed')
    }
    return data
}

export function getForm(formId, apiKey) {
    return fetchJson(buildUrl(`/form/${formId}`, apiKey))
}

export function getSubmissions(formId, apiKey, options = {}) {
    const { limit = 5, orderby = 'created_at', direction = 'DESC' } = options
    return fetchJson(
        buildUrl(`/form/${formId}/submissions`, apiKey, {
            limit: String(limit),
            orderby,
            direction,
        }),
    )
}
