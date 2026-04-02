import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { motion } from 'framer-motion';

const COLORS_DARK = ['#818cf8', '#a78bfa', '#ec4899', '#f43f5e', '#fb923c', '#eab308', '#34d399', '#22d3ee'];
const COLORS_LIGHT = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4'];

export const SpendingBreakdownChart = () => {
    const { transactions, theme } = useFinance();

    const data = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'Expense');
        const grouped = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
        }, {});

        return Object.keys(grouped).map(key => ({
            name: key,
            value: grouped[key]
        })).sort((a, b) => b.value - a.value);
    }, [transactions]);

    const isDark = theme === 'dark';
    const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-[#131B2B] rounded-[1.25rem] shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/[0.04] p-6 flex flex-col h-[400px] transition-all duration-300"
        >
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-white mb-2 tracking-wide transition-colors duration-300">Category Breakdown</h3>
            {data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No data available</div>
            ) : (
                <div className="flex-1 w-full h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="45%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                stroke={isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,1)"}
                                strokeWidth={2}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [`$${value}`, 'Amount']}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                                    boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
                                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                    color: isDark ? '#f8fafc' : '#0f172a'
                                }}
                                itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
    );
};
