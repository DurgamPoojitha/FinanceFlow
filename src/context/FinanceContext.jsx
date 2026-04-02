import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { mockApi } from '../api/mockApi';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState('Viewer'); // Viewer | Admin
    const [theme, setTheme] = useState(() => localStorage.getItem('finance_theme') || 'dark');
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

    useEffect(() => {
        localStorage.setItem('finance_theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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

    const handleResetData = async () => {
        setIsLoading(true);
        const data = await mockApi.resetData();
        setTransactions(data);
        setIsLoading(false);
    };

    // derived state
    const dateFilteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!filters.dateRange || filters.dateRange === 'All Time') return true;

            const txDate = new Date(t.date);
            const now = new Date();
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

    const totalIncome = dateFilteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = dateFilteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalBalance = totalIncome - totalExpense;

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

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};
