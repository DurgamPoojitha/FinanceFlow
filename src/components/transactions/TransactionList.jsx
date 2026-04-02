import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';

export const TransactionList = ({ transactions, onEdit }) => {
    const { role, deleteTransaction } = useFinance();

    const groupedTransactions = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            const monthYear = new Date(tx.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) acc[monthYear] = [];
            acc[monthYear].push(tx);
            return acc;
        }, {});
    }, [transactions]);

    if (transactions.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-[#131B2B] rounded-[18px] border border-slate-100 dark:border-white/[0.04] p-16 text-center shadow-sm"
            >
                <div className="w-20 h-20 bg-slate-50 dark:bg-[#0B1120] border border-slate-100 dark:border-white/[0.05] rounded-[20px] flex items-center justify-center mx-auto mb-5 rotate-3">
                    <SearchX className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">No transactions found</h3>
                <p className="text-slate-500 dark:text-slate-500 mt-2 max-w-sm mx-auto text-sm">We couldn't find any financial records matching your current filter set. Try adjusting them.</p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([month, txs], idx) => (
                <motion.div
                    key={month}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="bg-white dark:bg-[#131B2B] rounded-[18px] shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/[0.04] overflow-hidden transition-colors duration-300"
                >
                    <div className="px-6 py-4 bg-slate-50/80 dark:bg-[#0B1120]/30 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between transition-colors duration-300">
                        <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{month}</h4>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-500 bg-white dark:bg-[#1E293B] px-2 py-1 rounded-md border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-none">{txs.length} transactions</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                {txs.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 min-w-[200px]">
                                            <div className="flex items-center">
                                                <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center mr-4 shrink-0 transition-colors shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] border border-white dark:border-white/[0.05] ${tx.type === 'Income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                    {tx.type === 'Income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{tx.description || tx.category}</h4>
                                                    <p className="text-[11px] font-medium text-slate-500 hidden sm:block mt-0.5">{tx.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border border-transparent dark:border-white/[0.05]">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-[13px] font-medium">
                                            {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right font-bold tracking-tight text-[15px] ${tx.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                                            }`}>
                                            {tx.type === 'Income' ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>

                                        {role === 'Admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right w-[100px]">
                                                <div className="flex items-center justify-end space-x-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => onEdit(tx)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-[18px] w-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTransaction(tx.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-[18px] w-[18px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
