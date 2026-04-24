import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { mockApi } from '../api/mockApi';

/**
 * This Context is basically our global brain for the app.
 * Instead of adding something heavy like Redux, we just use React Context
 * to easily share our transactions, theme, and filters across any component that needs it.
 */
export const FinanceContext = createContext();

/**
 * A tiny custom hook so we don't have to keep importing `useContext`
 * and `FinanceContext` every single time we want to show a balance.
 * We just call `useFinance()` and boom, we have all our data!
 */
export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    // We're setting up our primary state variables here.
    const [transactions, setTransactions] = useState([]);
    const [kpis, setKpis] = useState([]);
    const [insights, setInsights] = useState([]);
    const [trends, setTrends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Controlling user authorization via this local state.
    const [role, setRole] = useState('Viewer'); // Viewer | Admin

    // Theme preference logic - we check if there's a saved theme in the browser first.
    const [theme, setTheme] = useState(() => localStorage.getItem('finance_theme') || 'dark');

    // An object tracking what filters are currently active on our transactions list.
    const [filters, setFilters] = useState({
        search: '',
        type: 'All',
        category: 'All',
        dateRange: 'This Month'
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [txRes, kpisRes, insightsRes, trendsRes] = await Promise.all([
                    fetch('http://127.0.0.1:8000/api/transactions'),
                    fetch('http://127.0.0.1:8000/api/kpis?month=2024-04'), // Example month
                    fetch('http://127.0.0.1:8000/api/insights?month=2024-04'),
                    fetch('http://127.0.0.1:8000/api/trends')
                ]);

                const txData = await txRes.json();
                const kpisData = kpisRes.ok ? await kpisRes.json() : [];
                const insightsData = insightsRes.ok ? await insightsRes.json() : [];
                const trendsData = trendsRes.ok ? await trendsRes.json() : [];

                // Keep frontend working with the expected schema temporarily
                // Backend sends `date` instead of timestamp, `type` is 'income', frontend uses 'Income'
                const formattedTx = txData.map(t => ({
                    ...t,
                    type: t.type === 'income' ? 'Income' : 'Expense',
                    category: t.category_name,
                }));

                setTransactions(formattedTx);
                setKpis(kpisData);
                setInsights(insightsData);
                setTrends(trendsData);
            } catch (error) {
                console.error('Failed to load data from backend:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    /**
     * Whenever the user toggles dark mode, we don't just save it to local storage.
     * We actually slap a 'dark' class right onto the root HTML element.
     * This makes Tailwind immediately flip all its colors across the entire app,
     * so the transition feels instant.
     */
    useEffect(() => {
        localStorage.setItem('finance_theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    // CRUD functions for our transactions. These talk to our mock API 
    // and seamlessly update our local React state immediately on success!
    const addTransaction = async (transaction) => {
        try {
            const newTx = await mockApi.addTransaction(transaction);
            setTransactions(prev => [newTx, ...prev]);
        } catch (e) {
            console.error(e);
        }
    };

    const updateTransaction = async (id, updatedData) => {
        try {
            await mockApi.updateTransaction(id, updatedData);
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
        } catch (e) {
            console.error(e);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            await mockApi.deleteTransaction(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    // Sometimes we just need to start clean—this simulates a hard sync with standard mock data.
    const handleResetData = async () => {
        setIsLoading(true);
        const data = await mockApi.resetData();
        setTransactions(data);
        setIsLoading(false);
    };

    /**
     * This is a cool optimization trick. Filtering transactions by dates (this month, last 7 days)
     * requires some heavy date math. By wrapping it in `useMemo`, we tell React:
     * "Hey, only recalculate this list IF the transactions change or the filter changes."
     * If someone just clicks a theme toggle, we don't need to rebuild this list. Saves a lot of lag!
     */
    const dateFilteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!filters.dateRange || filters.dateRange === 'All Time') return true;

            const txDate = new Date(t.date);
            const now = new Date();
            // Normalizing times to midnight (00:00) so calendar delta comparisons strictly execute on calendar days.
            txDate.setHours(0, 0, 0, 0);

            if (filters.dateRange === 'Last 7 days') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                sevenDaysAgo.setHours(0, 0, 0, 0);
                return txDate >= sevenDaysAgo && txDate <= now;
            }
            if (filters.dateRange === 'Last 30 days') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                thirtyDaysAgo.setHours(0, 0, 0, 0);
                return txDate >= thirtyDaysAgo && txDate <= now;
            }
            if (filters.dateRange === 'This Month') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [transactions, filters.dateRange]);

    // Compute our quick high-level ledger totals.
    const totalIncome = dateFilteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = dateFilteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalBalance = totalIncome - totalExpense;

    const value = {
        transactions: dateFilteredTransactions,
        allTransactions: transactions,
        kpis,
        insights,
        trends,
        isLoading,
        role,
        setRole,
        theme,
        toggleTheme,
        filters,
        setFilters,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        handleResetData,
        totalIncome,
        totalExpense,
        totalBalance,
    };

    // Wrapping our entire application tree in the Provider so any child can dip in
    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};
