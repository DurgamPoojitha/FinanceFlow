import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { motion } from 'framer-motion';

export const BalanceTrendChart = () => {
    const { transactions, theme } = useFinance();
    const [activeTab, setActiveTab] = useState('Income');

    const data = useMemo(() => {
        const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        let balance = 0;
        const dataPoints = [];

        const grouped = {};
        sorted.forEach(t => {
            const d = new Date(t.date).toISOString().split('T')[0];
            if (!grouped[d]) grouped[d] = { income: 0, expense: 0 };
            if (t.type === 'Income') grouped[d].income += Number(t.amount);
            if (t.type === 'Expense') grouped[d].expense += Number(t.amount);
        });

        Object.keys(grouped)
            .sort((a, b) => new Date(a) - new Date(b))
            .forEach(date => {
                const d = new Date(date);
                const [year, month, day] = date.split('-');
                const localDate = new Date(year, month - 1, day);
                const label = localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                balance += grouped[date].income - grouped[date].expense;
                dataPoints.push({
                    date: label,
                    Income: grouped[date].income,
                    Expense: grouped[date].expense,
                    Savings: balance > 0 ? balance : 0
                });
            });

        return dataPoints;
    }, [transactions]);

    const isDark = theme === 'dark';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-[#131B2B] rounded-[1.25rem] shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/[0.04] p-6 flex flex-col h-[400px] transition-all duration-300 relative"
        >
            <div className="flex justify-between items-center z-10 w-full mb-6">
                <h3 className="text-[18px] font-bold text-slate-800 dark:text-white tracking-wide transition-colors duration-300">Cashflow</h3>
                <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex bg-slate-50 dark:bg-white/5 rounded-lg p-1 border border-slate-100 dark:border-white/5">
                        {['Income', 'Expense', 'Savings'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No data available</div>
            ) : (
                <div className="flex-1 w-full h-full text-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={activeTab === 'Expense' ? '#f43f5e' : "#60a5fa"} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={activeTab === 'Expense' ? '#f43f5e' : "#60a5fa"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} dy={10} minTickGap={30} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                            <Tooltip
                                cursor={{ stroke: activeTab === 'Expense' ? '#f43f5e' : '#60a5fa', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    borderRadius: '10px',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    color: isDark ? '#ffffff' : '#0f172a'
                                }}
                                formatter={(value) => [<span className="font-bold">${value}</span>, activeTab]}
                            />
                            <Area
                                type="natural"
                                dataKey={activeTab}
                                stroke={activeTab === 'Expense' ? '#f43f5e' : "#60a5fa"}
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorCashflow)"
                                activeDot={{ r: 6, fill: isDark ? '#1e293b' : '#ffffff', stroke: activeTab === 'Expense' ? '#f43f5e' : "#60a5fa", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
};
