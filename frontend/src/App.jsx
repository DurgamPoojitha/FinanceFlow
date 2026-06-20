/**
 * App.jsx – Root Component with Authentication Gate.
 *
 * Changes from original:
 *   - Auth gate: shows LoginPage if no JWT token is stored
 *   - FinanceProvider receives initialUser (role, email) from login
 *   - Role passed from login response, not from hardcoded useState default
 *   - Tab state navigation preserved (no React Router needed for 2 views)
 */

import React, { useState } from 'react';
import { isAuthenticated } from './api/apiClient';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { LoginPage } from './pages/LoginPage';

/** Dashboard view wrapper */
function Dashboard() {
    return <DashboardPage />;
}

/** Transactions view wrapper */
function Transactions() {
    return <TransactionsPage />;
}

/**
 * Main layout with tab navigation.
 * Preserved from original – simple state toggle instead of React Router
 * since the app only has two primary views.
 */
function Main() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <Transactions />}
        </Layout>
    );
}

/**
 * Root application component.
 *
 * Auth flow:
 *   1. On mount, check localStorage for a valid JWT token.
 *   2. If no token → render LoginPage.
 *   3. On successful login → store user info and render Main.
 *   4. Logout is handled by FinanceContext.logout() (clears token + reloads).
 */
function App() {
    const [authenticatedUser, setAuthenticatedUser] = useState(() => {
        // If a token already exists in storage, we're already logged in.
        // We won't have role/email until next login, but the token is valid.
        if (isAuthenticated()) {
            return { role: 'viewer', email: '' };
        }
        return null;
    });

    const handleLoginSuccess = (user) => {
        setAuthenticatedUser(user);
    };

    if (!authenticatedUser) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <FinanceProvider initialUser={authenticatedUser}>
            <Main />
        </FinanceProvider>
    );
}

export default App;
