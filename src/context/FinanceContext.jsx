import React, { createContext, useState, useEffect, useContext } from 'react';
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
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalBalance = totalIncome - totalExpense;

    const value = {
        transactions,
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
