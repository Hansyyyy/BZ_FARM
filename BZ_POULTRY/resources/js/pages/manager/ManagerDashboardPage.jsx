import React from 'react';

// Manager dashboard is currently not implemented as a distinct page.
// This component exists so the "manager" folder structure is ready for future growth.
//
// When a dedicated manager dashboard UI is introduced, move/rename this component
// and implement manager-only routes in resources/js/routes/AppRoutes.jsx.

export default function ManagerDashboardPage() {
    return (
        <div className="centered-page">
            <div>
                <h2 style={{ marginBottom: 8 }}>Manager Dashboard</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    This is a placeholder page. Admin/Manager dashboard UI will be implemented here.
                </p>
            </div>
        </div>
    );
}

