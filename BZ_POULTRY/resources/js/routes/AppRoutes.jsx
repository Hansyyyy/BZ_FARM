import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import StockHubPage from '../pages/StockHubPage';
import SalesPage from '../pages/SalesPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chicken-stock" element={<StockHubPage />} />
            <Route path="/daily-reports" element={<ReportsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/poultry-stock" element={<Navigate to="/chicken-stock" replace />} />
            <Route path="/feed-inventory" element={<Navigate to="/chicken-stock?tab=feeds" replace />} />
            <Route path="/medicine-vaccine" element={<Navigate to="/chicken-stock?tab=medicine" replace />} />
            <Route path="/egg-production" element={<Navigate to="/chicken-stock?tab=eggs" replace />} />
            <Route path="/inventory" element={<Navigate to="/chicken-stock?tab=medications" replace />} />
            <Route path="/reports" element={<Navigate to="/daily-reports" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
