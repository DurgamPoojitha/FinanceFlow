/**
 * FinanceContext – Global State Provider.
 *
 * Changes from original:
 *   - All hardcoded URLs removed → uses apiClient (reads VITE_API_BASE_URL)
 *   - Hardcoded month=2024-04 removed → dynamic selectedMonth (current YYYY-MM)
 *   - availableMonths fetched from GET /api/months
 *   - KPIs and insights refetch when selectedMonth changes
 *   - addTransaction / updateTransaction / deleteTransaction now call REAL backend
 *     (POST/PUT/DELETE /api/transactions) instead of mockApi / localStorage
 *   - Role is set from the JWT login response (not a hardcoded useState default)
 *   - mockApi import removed entirely
 */

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { apiClient, clearToken, getToken } from '../api/apiClient';

export const FinanceContext = createContext();

/** Custom hook for easy context consumption. */
export const useFinance = () => useContext(FinanceContext);

/** Returns the current month in YYYY-MM format (e.g. "2026-06"). */
const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const FinanceProvider = ({ children, initialUser }) => {
    // -----------------------------------------------------------------------
    // Core data state
    // -----------------------------------------------------------------------
    const [transactions, setTransactions] = useState([]);
    const [kpis, setKpis] = useState([]);
    const [insights, setInsights] = useState([]);
    const [trends, setTrends] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // -----------------------------------------------------------------------
    // UI / UX state
    // -----------------------------------------------------------------------
    const [role, setRole] = useState(initialUser?.role || 'viewer');
    const [userEmail, setUserEmail] = useState(initialUser?.email || '');

    // Theme: persist in localStorage, apply as 'dark' class on <html>
    const [theme, setTheme] = useState(() => localStorage.getItem('finance_theme') || 'dark');

    // Month selector – KPIs and insights update when this changes
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

    // Transaction list filters (separate from selectedMonth)
    const [filters, setFilters] = useState({
        search: '',
        type: 'All',
        category: 'All',
        dateRange: 'This Month',
    });

    // -----------------------------------------------------------------------
    // Theme effect
    // -----------------------------------------------------------------------
    useEffect(() => {
        localStorage.setItem('finance_theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

    // -----------------------------------------------------------------------
    // Initial data load (transactions, trends, available months)
    // These are fetched once on mount and don't depend on selectedMonth.
    // -----------------------------------------------------------------------
    useEffect(() => {
        const fetchStaticData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [txData, trendsData, monthsData] = await Promise.all([
                    apiClient.get('/api/transactions?limit=200'),
                    apiClient.get('/api/trends'),
                    apiClient.get('/api/months'),
                ]);

                // Normalize type casing: backend sends 'income'/'expense', UI expects 'Income'/'Expense'
                const formattedTx = txData.map((t) => ({
                    ...t,
                    type: t.type === 'income' ? 'Income' : 'Expense',
                    category: t.category_name,
                }));

                setTransactions(formattedTx);
                setTrends(trendsData);
                setAvailableMonths(monthsData);

                // Default selectedMonth: current month if available, else most recent
                const current = getCurrentMonth();
                if (monthsData.includes(current)) {
                    setSelectedMonth(current);
                } else if (monthsData.length > 0) {
                    setSelectedMonth(monthsData[0]); // most recent
                }
            } catch (err) {
                console.error('Failed to load initial data:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaticData();
    }, []);

    // -----------------------------------------------------------------------
    // Month-dependent data (KPIs and insights refetch when selectedMonth changes)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!selectedMonth) return;

        const fetchMonthData = async () => {
            try {
                const [kpisData, insightsData] = await Promise.all([
                    apiClient.get(`/api/kpis?month=${selectedMonth}`).catch(() => []),
                    apiClient.get(`/api/insights?month=${selectedMonth}`).catch(() => []),
                ]);
                setKpis(Array.isArray(kpisData) ? kpisData : []);
                setInsights(Array.isArray(insightsData) ? insightsData : []);
            } catch (err) {
                console.error('Failed to load month data:', err);
            }
        };

        fetchMonthData();
    }, [selectedMonth]);

    // -----------------------------------------------------------------------
    // Real CRUD – connected to FastAPI backend (not mockApi / localStorage)
    // -----------------------------------------------------------------------

    const addTransaction = useCallback(async (formData) => {
        try {
            const payload = {
                date: formData.date,
                amount: Math.abs(parseFloat(formData.amount)),
                type: formData.type,       // 'Income' | 'Expense'
                category: formData.category,
                description: formData.description || '',
            };
            const newTx = await apiClient.post('/api/transactions', payload);

            // Normalize and prepend to local state immediately
            const normalized = {
                ...newTx,
                type: newTx.type === 'income' ? 'Income' : 'Expense',
                category: newTx.category_name,
            };
            setTransactions((prev) => [normalized, ...prev]);
            return normalized;
        } catch (err) {
            console.error('addTransaction failed:', err);
            throw err;
        }
    }, []);

    const updateTransaction = useCallback(async (id, formData) => {
        try {
            const payload = {
                date: formData.date,
                amount: Math.abs(parseFloat(formData.amount)),
                type: formData.type,
                category: formData.category,
                description: formData.description || '',
            };
            const updated = await apiClient.put(`/api/transactions/${id}`, payload);
            const normalized = {
                ...updated,
                type: updated.type === 'income' ? 'Income' : 'Expense',
                category: updated.category_name,
            };
            setTransactions((prev) =>
                prev.map((t) => (t.id === id ? normalized : t))
            );
            return normalized;
        } catch (err) {
            console.error('updateTransaction failed:', err);
            throw err;
        }
    }, []);

    const deleteTransaction = useCallback(async (id) => {
        try {
            await apiClient.delete(`/api/transactions/${id}`);
            setTransactions((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            console.error('deleteTransaction failed:', err);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        clearToken();
        // Reload to trigger the auth gate in App.jsx
        window.location.reload();
    }, []);

    // -----------------------------------------------------------------------
    // Derived / memoized values
    // -----------------------------------------------------------------------

    const dateFilteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            if (!filters.dateRange || filters.dateRange === 'All Time') return true;

            const txDate = new Date(t.date);
            const now = new Date();
            txDate.setHours(0, 0, 0, 0);

            if (filters.dateRange === 'Last 7 days') {
                const cutoff = new Date();
                cutoff.setDate(now.getDate() - 7);
                cutoff.setHours(0, 0, 0, 0);
                return txDate >= cutoff && txDate <= now;
            }
            if (filters.dateRange === 'Last 30 days') {
                const cutoff = new Date();
                cutoff.setDate(now.getDate() - 30);
                cutoff.setHours(0, 0, 0, 0);
                return txDate >= cutoff && txDate <= now;
            }
            if (filters.dateRange === 'This Month') {
                return (
                    txDate.getMonth() === now.getMonth() &&
                    txDate.getFullYear() === now.getFullYear()
                );
            }
            return true;
        });
    }, [transactions, filters.dateRange]);

    const totalIncome = useMemo(
        () =>
            dateFilteredTransactions
                .filter((t) => t.type === 'Income')
                .reduce((sum, t) => sum + Number(t.amount), 0),
        [dateFilteredTransactions]
    );

    const totalExpense = useMemo(
        () =>
            dateFilteredTransactions
                .filter((t) => t.type === 'Expense')
                .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
        [dateFilteredTransactions]
    );

    const totalBalance = totalIncome - totalExpense;

    // -----------------------------------------------------------------------
    // Context value
    // -----------------------------------------------------------------------
    const value = {
        // Data
        transactions: dateFilteredTransactions,
        allTransactions: transactions,
        kpis,
        insights,
        trends,
        availableMonths,
        isLoading,
        error,

        // Month selection
        selectedMonth,
        setSelectedMonth,

        // Auth
        role,
        setRole,
        userEmail,
        logout,

        // Theme
        theme,
        toggleTheme,

        // Filters (transaction list)
        filters,
        setFilters,

        // CRUD (real backend)
        addTransaction,
        updateTransaction,
        deleteTransaction,

        // Derived totals
        totalIncome,
        totalExpense,
        totalBalance,
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};
