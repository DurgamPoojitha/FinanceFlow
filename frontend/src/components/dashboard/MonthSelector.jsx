/**
 * MonthSelector – Dynamic Month Picker for KPI Dashboard.
 *
 * Fetches available months from GET /api/months and renders a dropdown.
 * Updates `selectedMonth` in FinanceContext when the user changes the selection.
 * Defaults to the current calendar month on first load.
 */

import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CalendarRange } from 'lucide-react';

export const MonthSelector = () => {
    const { selectedMonth, setSelectedMonth, availableMonths } = useFinance();

    /** Format "2026-01" → "Jan 2026" for display */
    const formatMonth = (yyyyMm) => {
        if (!yyyyMm) return '';
        const [year, month] = yyyyMm.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    if (!availableMonths || availableMonths.length === 0) return null;

    return (
        <div className="flex items-center bg-white dark:bg-[#131B2B] rounded-[14px] border border-gray-200/50 dark:border-white/[0.05] p-1 shadow-sm transition-colors duration-300">
            <div className="px-3 text-slate-400 border-r border-gray-200/50 dark:border-white/[0.05]">
                <CalendarRange className="w-4 h-4" />
            </div>
            <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-[13px] font-semibold text-slate-700 dark:text-slate-300 outline-none px-3 py-1.5 cursor-pointer dark:bg-[#131B2B]"
                aria-label="Select KPI month"
            >
                {availableMonths.map((m) => (
                    <option
                        key={m}
                        value={m}
                        className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-200"
                    >
                        {formatMonth(m)}
                    </option>
                ))}
            </select>
        </div>
    );
};
