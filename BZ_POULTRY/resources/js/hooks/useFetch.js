import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export default function useFetch(url, options = {}) {
    const { immediate = true } = options;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(url);
            setData(response.data);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (immediate) {
            reload();
        }
    }, [immediate, reload]);

    return { data, loading, error, setData, reload, setError };
}
