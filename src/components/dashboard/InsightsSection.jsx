import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { motion } from 'framer-motion';

const ExclamationIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

const TrendingUpIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
        <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
);

const BarChartIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
);

export const InsightsSection = () => {
    const { transactions } = useFinance();

    const insights = useMemo(() => {
        if (transactions.length === 0) return [];

        const expenses = transactions.filter(t => t.type === 'Expense');
        const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

        let maxCategory = 'N/A';
        let maxAmount = 0;
        if (expenses.length > 0) {
            const grouped = expenses.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {});
            maxCategory = Object.keys(grouped).reduce((a, b) => grouped[a] > grouped[b] ? a : b);
            maxAmount = grouped[maxCategory];
        }

        const pctChange = '+53.2%';
        const avgTx = expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(0) : 0;

        return [
            {
                title: 'Top Spending',
                value: maxCategory,
                subtext: `$${maxAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
                icon: ExclamationIcon,
                iconBg: 'bg-amber-100 dark:bg-[#ffb020]/10',
                iconColor: 'text-amber-600 dark:text-[#ffb020]',
            },
            {
                title: 'Monthly Change',
                value: pctChange,
                subtext: 'Spending increased',
                icon: TrendingUpIcon,
                iconBg: 'bg-rose-100 dark:bg-rose-500/5',
                iconColor: 'text-rose-600 dark:text-rose-500',
            },
            {
                title: 'Avg Transaction',
                value: `$${avgTx}`,
                subtext: `Across ${expenses.length} transactions`,
                icon: BarChartIcon,
                iconBg: 'bg-blue-100 dark:bg-blue-500/10',
                iconColor: 'text-blue-600 dark:text-blue-500',
            }
        ];
    }, [transactions]);

    if (insights.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((item, idx) => (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + (idx * 0.1), duration: 0.5, ease: "easeOut" }}
                    key={idx}
                    className="bg-white dark:bg-[#0f1423] rounded-[18px] p-6 flex flex-row items-center border border-gray-100 dark:border-white/[0.03] transition-all hover:bg-gray-50 dark:hover:bg-[#131b2d] cursor-default shadow-sm dark:shadow-none"
                >
                    <div className={`${item.iconBg} ${item.iconColor} h-[42px] w-[42px] rounded-2xl flex items-center justify-center shrink-0 mr-5 transition-transform duration-300 hover:scale-105`}>
                        <item.icon className="h-[22px] w-[22px]" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[13px] text-slate-500 dark:text-slate-400/80 mb-0.5 font-medium tracking-wide transition-colors duration-300">{item.title}</p>
                        <h4 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-wide transition-colors duration-300">{item.value}</h4>
                        <p className="text-[13px] text-slate-400 mt-0.5 transition-colors duration-300">{item.subtext}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
