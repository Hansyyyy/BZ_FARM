import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import StockHubPage from '../pages/StockHubPage';
import SalesPage from '../pages/SalesPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import HistoryPage from '../pages/HistoryPage';
import NotFoundPage from '../pages/NotFoundPage';

const user = window.Laravel?.user;
const isAdmin = user?.role === 'admin';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/dashboard" element={isAdmin ? <AdminInventoryPage /> : <DashboardPage />} />
            <Route path="/inventory-stock" element={<StockHubPage />} />
            <Route path="/chicken-stock" element={<StockHubPage />} />
            <Route path="/Inventory-stock" element={<Navigate to="/inventory-stock" replace />} />
            <Route path="/daily-reports" element={<ReportsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/history" element={<HistoryPage />} />
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
