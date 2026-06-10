import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const FarmSettingsContext = createContext(null);

function getInitialSettings() {
    return window.Laravel?.farmSettings || {
        farm_name: 'BZ Farm',
        owner_name: '',
        phone: '',
        email: '',
        address: '',
    };
}

export function FarmSettingsProvider({ children }) {
    const [settings, setSettings] = useState(getInitialSettings);

    const updateSettings = (nextSettings) => {
        setSettings(nextSettings);
        window.Laravel = window.Laravel || {};
        window.Laravel.farmSettings = nextSettings;
    };

    useEffect(() => {
        document.title = settings.farm_name || 'BZ Farm';
    }, [settings.farm_name]);

    const value = useMemo(() => ({
        settings,
        farmName: settings.farm_name || 'BZ Farm',
        updateSettings,
    }), [settings]);

    return (
        <FarmSettingsContext.Provider value={value}>
            {children}
        </FarmSettingsContext.Provider>
    );
}

export function useFarmSettings() {
    const context = useContext(FarmSettingsContext);

    if (!context) {
        throw new Error('useFarmSettings must be used within FarmSettingsProvider');
    }

    return context;
}
