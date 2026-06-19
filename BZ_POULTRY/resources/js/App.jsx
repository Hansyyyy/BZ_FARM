import { BrowserRouter } from 'react-router-dom';
import { FarmSettingsProvider } from './context/FarmSettingsContext';
import { HeaderSearchProvider } from './context/HeaderSearchContext';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';

function ThemeSync() {
    // Ensure a consistent theme across refresh/navigation
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
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

