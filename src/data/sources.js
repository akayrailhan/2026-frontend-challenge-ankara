const env = import.meta.env

export const SOURCES = [
    {
        key: 'checkins',
        label: 'Checkins',
        formId: env.VITE_JOTFORM_FORM_ID_CHECKINS,
    },
    {
        key: 'messages',
        label: 'Messages',
        formId: env.VITE_JOTFORM_FORM_ID_MESSAGES,
    },
    {
        key: 'sightings',
        label: 'Sightings',
        formId: env.VITE_JOTFORM_FORM_ID_SIGHTINGS,
    },
    {
        key: 'personal-notes',
        label: 'Personal Notes',
        formId: env.VITE_JOTFORM_FORM_ID_PERSONAL_NOTES,
    },
    {
        key: 'anonymous-tips',
        label: 'Anonymous Tips',
        formId: env.VITE_JOTFORM_FORM_ID_ANONYMOUS_TIPS,
    },
]
