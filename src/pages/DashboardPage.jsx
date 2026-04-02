import React from 'react';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { BalanceTrendChart } from '../components/dashboard/BalanceTrendChart';
import { SpendingBreakdownChart } from '../components/dashboard/SpendingBreakdownChart';
import { InsightsSection } from '../components/dashboard/InsightsSection';
import { DateFilter } from '../components/dashboard/DateFilter';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-8"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Dashboard Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-[15px] transition-colors duration-300">Here's your financial summary at a glance.</p>
                </div>
                <div className="flex items-center">
                    <DateFilter />
                </div>
            </div>

            <SummaryCards />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <BalanceTrendChart />
                </div>
                <div className="lg:col-span-1">
                    <SpendingBreakdownChart />
                </div>
            </div>

            <div className="mt-6">
                <InsightsSection />
            </div>
        </motion.div>
    );
};
