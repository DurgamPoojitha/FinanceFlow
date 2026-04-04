import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { mockApi } from '../api/mockApi';

// Create our context to serve as the global state hub for all finance data.
export const FinanceContext = createContext();

// A handy custom hook to grab finance data from anywhere without manually importing the Context!
export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    // We're setting up our primary state variables here.
    const [transactions, setTransactions] = useState([]);
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

    // On the first load, grab data asynchronously to simulate a real database fetch.
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const data = await mockApi.getTransactions();
                setTransactions(data);
            } catch (error) {
                console.error('Failed to load transactions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Whenever the theme changes, we sync it not just to local storage, but also to the HTML class 
    // so Tailwind can smoothly trigger dark/light modes.
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

    // Derived State: Automatically memoize the result of applying the active date filter.
    // This saves React a lot of unnecessary crunching if the transactions haven't changed!
    const dateFilteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!filters.dateRange || filters.dateRange === 'All Time') return true;

            const txDate = new Date(t.date);
            const now = new Date();
            txDate.setHours(0, 0, 0, 0); // Strip out time so we only compare the calendar day

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

    // Bundle everything up nicely into a payload
    const value = {
        transactions: dateFilteredTransactions,
        allTransactions: transactions,
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
