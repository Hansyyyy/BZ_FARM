import { BrowserRouter } from 'react-router-dom';
import { FarmSettingsProvider } from './context/FarmSettingsContext';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';

function App() {
    return (
        <BrowserRouter>
            <FarmSettingsProvider>
                <Layout>
                    <AppRoutes />
                </Layout>
            </FarmSettingsProvider>
        </BrowserRouter>
    );
}

export default App;
