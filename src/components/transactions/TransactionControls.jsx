/**
 * This holds all the search bars, filters, and export buttons above the transactions list.
 * We lift the actual filter values up to the global `FinanceContext` so that when you search
 * for a transaction here, it properly cascades down and filters the data everywhere!
 */
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Search, ArrowUpDown, Download } from 'lucide-react';
import { categories } from '../../data/mockData';

export const TransactionControls = ({ sortConfig, setSortConfig }) => {
    const { transactions, filters, setFilters } = useFinance();

    const handleSortChange = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const exportData = (format) => {
        let dataStr = '';
        if (format === 'json') {
            dataStr = JSON.stringify(transactions, null, 2);
        } else {
            const headers = ['ID', 'Date', 'Amount', 'Category', 'Type', 'Description'];
            const rows = transactions.map(t => [
                t.id, t.date, t.amount, `"${t.category}"`, t.type, `"${t.description || ''}"`
            ].join(','));
            dataStr = [headers.join(','), ...rows].join('\n');
        }
        const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-[#131B2B] p-5 rounded-[18px] shadow-sm border border-slate-100 dark:border-white/[0.04] flex flex-col lg:flex-row gap-4 mb-6 transition-colors duration-300">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-[18px] w-[18px]" />
                <input
                    type="text"
                    placeholder="Search descriptions..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-[42px] pr-4 py-2.5 bg-slate-50/50 dark:bg-[#0B1120]/50 border border-slate-200 dark:border-white/[0.05] rounded-xl focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#1E293B] focus:border-indigo-500 transition-all outline-none text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-sm"
                />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="bg-slate-50/50 dark:bg-[#0B1120]/50 border border-slate-200 dark:border-white/[0.05] text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[130px] cursor-pointer text-sm font-medium transition-colors"
                >
                    <option value="All">All Types</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                </select>

                <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="bg-slate-50/50 dark:bg-[#0B1120]/50 border border-slate-200 dark:border-white/[0.05] text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px] cursor-pointer text-sm font-medium transition-colors"
                >
                    <option value="All">All Categories</option>
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <div className="flex border border-slate-200 dark:border-white/[0.05] bg-slate-50/50 dark:bg-[#0B1120]/50 rounded-xl overflow-hidden shrink-0 transition-colors">
                    <button
                        onClick={() => handleSortChange('date')}
                        className={`px-4 py-2.5 flex items-center gap-1.5 text-sm font-medium transition-colors ${sortConfig.key === 'date' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                            }`}
                    >
                        Date
                        <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px bg-slate-200 dark:bg-white/[0.05]"></div>
                    <button
                        onClick={() => handleSortChange('amount')}
                        className={`px-4 py-2.5 flex items-center gap-1.5 text-sm font-medium transition-colors ${sortConfig.key === 'amount' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                            }`}
                    >
                        Amount
                        <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => exportData('csv')}
                        className="px-3 py-2.5 flex items-center gap-1.5 text-sm font-medium border border-slate-200 dark:border-white/[0.05] bg-white dark:bg-[#0B1120]/50 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200 transition-colors shadow-sm dark:shadow-none"
                    >
                        <Download className="h-3.5 w-3.5" />
                        CSV
                    </button>
                    <button
                        onClick={() => exportData('json')}
                        className="px-3 py-2.5 flex items-center gap-1.5 text-sm font-medium border border-slate-200 dark:border-white/[0.05] bg-white dark:bg-[#0B1120]/50 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200 transition-colors shadow-sm dark:shadow-none"
                    >
                        <Download className="h-3.5 w-3.5" />
                        JSON
                    </button>
                </div>
            </div>
        </div>
    );
};
