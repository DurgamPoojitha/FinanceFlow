import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { motion } from 'framer-motion';

export const BalanceTrendChart = () => {
    const { transactions, theme } = useFinance();

    const data = useMemo(() => {
        const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        let balance = 0;
        const dataPoints = [];

        const grouped = {};
        sorted.forEach(t => {
            const d = t.date;
            if (!grouped[d]) grouped[d] = { income: 0, expense: 0 };
            if (t.type === 'Income') grouped[d].income += Number(t.amount);
            if (t.type === 'Expense') grouped[d].expense += Number(t.amount);
        });

        Object.keys(grouped).forEach(date => {
            balance += grouped[date].income - grouped[date].expense;
            const d = new Date(date);
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dataPoints.push({
                date: label,
                balance: balance,
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
            className="bg-white dark:bg-[#131B2B] rounded-[1.25rem] shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/[0.04] p-6 flex flex-col h-[400px] transition-all duration-300"
        >
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-white mb-6 tracking-wide transition-colors duration-300">Cash Flow Trend</h3>
            {data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No data available</div>
            ) : (
                <div className="flex-1 w-full h-full text-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isDark ? "#818cf8" : "#6366f1"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isDark ? "#818cf8" : "#6366f1"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                                    boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
                                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                    color: isDark ? '#f8fafc' : '#0f172a'
                                }}
                                itemStyle={{ color: isDark ? '#818cf8' : '#6366f1', fontWeight: 'bold' }}
                                formatter={(value) => [`$${value}`, 'Balance']}
                            />
                            <Area type="monotone" dataKey="balance" stroke={isDark ? "#818cf8" : "#6366f1"} strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
};
