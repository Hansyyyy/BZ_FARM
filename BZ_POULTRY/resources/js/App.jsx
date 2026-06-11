import { BrowserRouter } from 'react-router-dom';
import { FarmSettingsProvider } from './context/FarmSettingsContext';
import { HeaderSearchProvider } from './context/HeaderSearchContext';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';

function App() {
    return (
        <BrowserRouter>
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
