import React, { useState } from 'react';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { BalanceTrendChart } from '../components/dashboard/BalanceTrendChart';
import { SpendingBreakdownChart } from '../components/dashboard/SpendingBreakdownChart';
import { InsightsSection } from '../components/dashboard/InsightsSection';
import { DateFilter } from '../components/dashboard/DateFilter';
import { WidgetsPanel } from '../components/dashboard/WidgetsPanel';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useFinance } from '../context/FinanceContext';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardPage = () => {
    const { role } = useFinance();
    const [isFormOpen, setIsFormOpen] = useState(false);

    // We wrap the entire page in Framer Motion so it smoothly fades in and out between tab switches
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-8"
        >
            {/* Header section containing our title and interactive admin controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Dashboard Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-[15px] transition-colors duration-300">Here's your financial summary at a glance.</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <DateFilter />
                    <AnimatePresence>
                        {role === 'Admin' && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => setIsFormOpen(true)}
                                className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500/10 text-white dark:text-indigo-400 font-semibold rounded-[14px] border border-transparent dark:border-indigo-500/20 hover:bg-indigo-700 dark:hover:bg-indigo-500/20 shadow-sm transition-all hover:scale-105"
                            >
                                <Plus className="h-5 w-5 mr-2 -ml-1 text-white/80 dark:text-indigo-400/80" />
                                Add Transaction
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* This is the primary grid layout. It breaks into a 3-1 split on large monitors */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* The main content area: Metrics, Charts, and Insights */}
                <div className="xl:col-span-3 space-y-6">
                    <SummaryCards />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <BalanceTrendChart />
                        </div>
                        <div className="lg:col-span-1">
                            <SpendingBreakdownChart />
                        </div>
                    </div>

                    <InsightsSection />
                </div>

                {/* The right-hand sidebar panel for managing Goals and specific Cards */}
                <div className="xl:col-span-1">
                    <WidgetsPanel />
                </div>
            </div>

            {isFormOpen && (
                <TransactionForm onClose={() => setIsFormOpen(false)} />
            )}
        </motion.div>
    );
};
