export function formatApiError(err, fallback = 'Something went wrong.') {
    const data = err?.response?.data;

    if (!data) {
        return err?.message || fallback;
    }

    if (data.message) {
        return data.message;
    }

    if (data.errors) {
        return Object.values(data.errors).flat().join(' ');
    }

    return fallback;
}
