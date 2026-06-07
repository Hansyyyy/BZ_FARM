import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ResourcePage from './pages/ResourcePage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const config = {
    flocks: {
        title: 'Poultry Stock',
        endpoint: '/api/flocks',
        summaryFields: [
            { key: 'totalFlocks', label: 'Total Flocks' },
            { key: 'totalPoultry', label: 'Total Poultry' },
            { key: 'layers', label: 'Layers' },
            { key: 'pullets', label: 'Pullets' },
            { key: 'roosters', label: 'Roosters' },
        ],
        columns: [
            { key: 'batch_no', label: 'Batch No.' },
            { key: 'type', label: 'Type' },
            { key: 'breed', label: 'Breed' },
            { key: 'quantity', label: 'Qty' },
            { key: 'age_weeks', label: 'Age (wks)' },
            { key: 'date_in', label: 'Date In' },
        ],
        formFields: [
            { key: 'batch_no', label: 'Batch No.', type: 'text' },
            { key: 'type', label: 'Type', type: 'select', options: ['layers', 'pullets', 'roosters'] },
            { key: 'breed', label: 'Breed', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'age_weeks', label: 'Age (Weeks)', type: 'number' },
            { key: 'date_in', label: 'Date In', type: 'date' },
        ],
    },
    feed: {
        title: 'Feed Inventory',
        endpoint: '/api/feed',
        summaryFields: [
            { key: 'totalItems', label: 'Total Items' },
            { key: 'totalStock', label: 'Total Stock (kg)' },
            { key: 'lowStock', label: 'Low Stock Items' },
            { key: 'consumed', label: 'Consumed (kg)' },
            { key: 'feedCost', label: 'Feed Cost' },
        ],
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'stock', label: 'Stock' },
            { key: 'reorder_level', label: 'Reorder Level' },
            { key: 'expiry_date', label: 'Expiry' },
            { key: 'status', label: 'Status' },
        ],
        formFields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'stock', label: 'Stock', type: 'number' },
            { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
            { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
            { key: 'cost_per_kg', label: 'Cost per kg', type: 'number' },
        ],
    },
    inventory: {
        title: 'Inventory',
        endpoint: '/api/inventory',
        summaryFields: [
            { key: 'totalItems', label: 'Total Items' },
            { key: 'totalValue', label: 'Total Value' },
            { key: 'lowStock', label: 'Low Stock' },
            { key: 'stockIn', label: 'Stock In' },
            { key: 'stockOut', label: 'Stock Out' },
        ],
        columns: [
            { key: 'item_code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'stock', label: 'Stock' },
            { key: 'unit', label: 'Unit' },
            { key: 'reorder_level', label: 'Reorder Level' },
            { key: 'location', label: 'Location' },
        ],
        formFields: [
            { key: 'item_code', label: 'Item Code', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'stock', label: 'Stock', type: 'number' },
            { key: 'unit', label: 'Unit', type: 'text' },
            { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'unit_price', label: 'Unit Price', type: 'number' },
        ],
    },
    medicine: {
        title: 'Medicine & Vaccine',
        endpoint: '/api/medicine',
        summaryFields: [
            { key: 'totalItems', label: 'Total Items' },
            { key: 'totalValue', label: 'Total Value' },
            { key: 'lowStock', label: 'Low Stock' },
            { key: 'expiringSoon', label: 'Expiring Soon' },
            { key: 'usedThisMonth', label: 'Used This Month' },
        ],
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'type', label: 'Type' },
            { key: 'stock', label: 'Stock' },
            { key: 'reorder_level', label: 'Reorder Level' },
            { key: 'expiry_date', label: 'Expiry' },
            { key: 'status', label: 'Status' },
        ],
        formFields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'type', label: 'Type', type: 'text' },
            { key: 'stock', label: 'Stock', type: 'number' },
            { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
            { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
            { key: 'unit_price', label: 'Unit Price', type: 'number' },
        ],
    },
    eggs: {
        title: 'Egg Production',
        endpoint: '/api/eggs',
        summaryFields: [
            { key: 'eggsToday', label: 'Eggs Today' },
            { key: 'goodToday', label: 'Good Eggs' },
            { key: 'crackedToday', label: 'Cracked Eggs' },
            { key: 'weekTotal', label: 'This Week' },
            { key: 'monthTotal', label: 'This Month' },
        ],
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'building_name', label: 'Building' },
            { key: 'total_eggs', label: 'Total Eggs' },
            { key: 'good_eggs', label: 'Good Eggs' },
            { key: 'cracked_eggs', label: 'Cracked Eggs' },
        ],
        formFields: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'building_id', label: 'Building', type: 'text' },
            { key: 'total_eggs', label: 'Total Eggs', type: 'number' },
            { key: 'good_eggs', label: 'Good Eggs', type: 'number' },
            { key: 'cracked_eggs', label: 'Cracked Eggs', type: 'number' },
        ],
    },
};

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/poultry-stock" element={<ResourcePage config={config.flocks} />} />
                    <Route path="/feed-inventory" element={<ResourcePage config={config.feed} />} />
                    <Route path="/medicine-vaccine" element={<ResourcePage config={config.medicine} />} />
                    <Route path="/inventory" element={<ResourcePage config={config.inventory} />} />
                    <Route path="/egg-production" element={<ResourcePage config={config.eggs} />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
