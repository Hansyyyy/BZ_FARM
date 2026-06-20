import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { FarmSettingsProvider } from './context/FarmSettingsContext';
import { HeaderSearchProvider } from './context/HeaderSearchContext';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';

function readStoredTheme() {
    try {
        return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
}

function ThemeSync() {
    useEffect(() => {
        document.documentElement.classList.toggle('dark-theme', readStoredTheme() === 'dark');
    }, []);

    return null;
}


function App() {
    return (
        <BrowserRouter>
            <ThemeSync />
            <FarmSettingsProvider>
                <HeaderSearchProvider>
                    <Layout>
                        <AppRoutes />
                    </Layout>
                </HeaderSearchProvider>
            </FarmSettingsProvider>
        </BrowserRouter>
    );
}

export default App;

