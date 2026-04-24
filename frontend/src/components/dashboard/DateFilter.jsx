/**
 * A handy little dropdown to filter your transactions by date.
 * Tying it directly into the FinanceContext means the moment you pick
 * a new date range, the chart and the numbers update instantly everywhere!
 */
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Calendar } from 'lucide-react';

export const DateFilter = () => {
    const { filters, setFilters } = useFinance();

    const options = ['All Time', 'This Month', 'Last 30 days', 'Last 7 days'];

    return (
        <div className="flex items-center bg-white dark:bg-[#131B2B] rounded-[14px] border border-gray-200/50 dark:border-white/[0.05] p-1 shadow-sm transition-colors duration-300">
            <div className="px-3 text-slate-400 border-r border-gray-200/50 dark:border-white/[0.05]">
                <Calendar className="w-4 h-4" />
            </div>
            <select
                value={filters.dateRange || 'This Month'}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="bg-transparent border-none text-[13px] font-semibold text-slate-700 dark:text-slate-300 outline-none px-3 py-1.5 cursor-pointer dark:bg-[#131B2B]"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt} className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-200">
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
};
