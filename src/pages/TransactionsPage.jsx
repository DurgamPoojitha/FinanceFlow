import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionControls } from '../components/transactions/TransactionControls';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TransactionsPage = () => {
    const { transactions, filters, role } = useFinance();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const processedTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                if (filters.search && !t.description?.toLowerCase().includes(filters.search.toLowerCase()) && !t.category.toLowerCase().includes(filters.search.toLowerCase())) {
                    return false;
                }
                if (filters.type !== 'All' && t.type !== filters.type) {
                    return false;
                }
                if (filters.category !== 'All' && t.category !== filters.category) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'date') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                } else if (sortConfig.key === 'amount') {
                    aValue = Number(aValue);
                    bValue = Number(bValue);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
    }, [transactions, filters, sortConfig]);

    const handleEdit = (tx) => {
        setEditingTransaction(tx);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingTransaction(null);
        setIsFormOpen(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-8"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Transactions</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-[15px] transition-colors duration-300">Manage and view your financial activity history.</p>
                </div>

                <AnimatePresence>
                    {role === 'Admin' && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={handleAddNew}
                            className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500/10 text-white dark:text-indigo-400 font-semibold rounded-[14px] border border-transparent dark:border-indigo-500/20 hover:bg-indigo-700 dark:hover:bg-indigo-500/20 shadow-sm transition-all hover:scale-105"
                        >
                            <Plus className="h-5 w-5 mr-2 -ml-1 text-white/80 dark:text-indigo-400/80" />
                            Add Transaction
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <TransactionControls sortConfig={sortConfig} setSortConfig={setSortConfig} />

            <TransactionList
                transactions={processedTransactions}
                onEdit={handleEdit}
            />

            {isFormOpen && (
                <TransactionForm
                    onClose={() => setIsFormOpen(false)}
                    editingTransaction={editingTransaction}
                />
            )}
        </motion.div>
    );
};
