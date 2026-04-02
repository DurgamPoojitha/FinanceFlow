import { initialTransactions } from '../data/mockData';

const STORAGE_KEY = 'finance_transactions_v2';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
    getTransactions: async () => {
        await delay(1200); // Simulate network latency for dramatic effect
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTransactions));
        return initialTransactions;
    },

    addTransaction: async (transaction) => {
        await delay(600);
        const saved = localStorage.getItem(STORAGE_KEY);
        const transactions = saved ? JSON.parse(saved) : initialTransactions;
        const newTx = { ...transaction, id: Date.now().toString() };
        const updated = [newTx, ...transactions];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newTx;
    },

    updateTransaction: async (id, updatedData) => {
        await delay(500);
        const saved = localStorage.getItem(STORAGE_KEY);
        const transactions = saved ? JSON.parse(saved) : initialTransactions;
        const updated = transactions.map(t => t.id === id ? { ...t, ...updatedData } : t);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updatedData;
    },

    deleteTransaction: async (id) => {
        await delay(500);
        const saved = localStorage.getItem(STORAGE_KEY);
        const transactions = saved ? JSON.parse(saved) : initialTransactions;
        const updated = transactions.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return id;
    },

    resetData: async () => {
        await delay(800);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTransactions));
        return initialTransactions;
    }
};
