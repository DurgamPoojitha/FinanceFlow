/**
 * Those three big cards at the top of the dashboard. 
 * They just pull the total balance, income, and expenses straight from our 
 * global `FinanceContext`. Super simple, but they look great!
 */
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export const SummaryCards = () => {
    const { totalBalance, totalIncome, totalExpense } = useFinance();

    const cards = [
        {
            label: 'Available Balance',
            value: totalBalance,
            icon: Wallet,
            bgStyle: 'bg-white dark:bg-gradient-to-br dark:from-[#1E293B] dark:to-[#0F172A]',
            iconBase: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            text: 'text-slate-900 dark:text-white',
            border: 'border-slate-200/80 dark:border-white/[0.04]',
            subtext: 'text-slate-500 hover:text-slate-200'
        },
        {
            label: 'Total Income',
            value: totalIncome,
            icon: TrendingUp,
            bgStyle: 'bg-white dark:bg-[#131B2B]',
            iconBase: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            text: 'text-slate-800 dark:text-slate-100',
            border: 'border-slate-200/80 dark:border-white/[0.04]',
            subtext: 'text-slate-500'
        },
        {
            label: 'Total Expenses',
            value: totalExpense,
            icon: TrendingDown,
            bgStyle: 'bg-white dark:bg-[#131B2B]',
            iconBase: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
            text: 'text-slate-800 dark:text-slate-100',
            border: 'border-slate-200/80 dark:border-white/[0.04]',
            subtext: 'text-slate-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card, index) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={index}
                    className={`${card.bgStyle} rounded-3xl p-7 relative overflow-hidden transition-all duration-300 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] dark:shadow-none border ${card.border} hover:border-slate-300 dark:hover:border-white/[0.08]`}
                >
                    <div className="flex justify-between items-start mb-6 relative z-10 transition-colors duration-300">
                        <div className={`h-12 w-12 rounded-[18px] flex items-center justify-center ${card.iconBase} transition-colors duration-300`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="relative z-10 transition-colors duration-300">
                        <p className="text-[14px] font-medium mb-1 text-slate-500 dark:text-slate-400">{card.label}</p>
                        <h3 className={`text-[32px] font-bold tracking-tight ${card.text} transition-colors duration-300`}>
                            ${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                    {index === 0 && (
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-5 blur-[2px] pointer-events-none">
                            <Wallet className="h-40 w-40 text-slate-900 dark:text-indigo-400" />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
