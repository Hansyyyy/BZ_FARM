import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const HeaderSearchContext = createContext(null);

export function HeaderSearchProvider({ children }) {
    const [searchConfig, setSearchConfig] = useState(null);

    const registerSearch = useCallback((config) => {
        setSearchConfig(config);
    }, []);

    const value = useMemo(() => ({ searchConfig, registerSearch }), [searchConfig, registerSearch]);

    return (
        <HeaderSearchContext.Provider value={value}>
            {children}
        </HeaderSearchContext.Provider>
    );
}

export function useHeaderSearchContext() {
    return useContext(HeaderSearchContext);
}

export function usePageSearch(placeholder, value, onChange) {
    const context = useHeaderSearchContext();

    useEffect(() => {
        if (!context || !placeholder) {
            return undefined;
        }

        context.registerSearch({
            placeholder,
            value,
            onChange,
        });

        return () => context.registerSearch(null);
    }, [context, placeholder, value, onChange]);
}
