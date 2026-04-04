import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Shield, ShieldAlert, RotateCcw, Sun, Moon } from 'lucide-react';

export const Header = () => {
    const { role, setRole, handleResetData, theme, toggleTheme } = useFinance();

    return (
        <header className="h-[72px] bg-white/85 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-200/90 dark:border-white/[0.04] flex items-center justify-between px-8 z-10 sticky top-0 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0B1120]/60 transition-colors duration-300 shadow-sm shadow-slate-200/30 dark:shadow-none">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-200 hidden sm:block tracking-wide">Overview</h1>
            </div>
            <div className="flex items-center justify-end space-x-3 sm:space-x-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.03] transition-colors"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </button>

                <button
                    onClick={handleResetData}
                    className="text-[13px] text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.03] border border-transparent dark:hover:border-white/[0.05]"
                    title="Reset to initial data"
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline tracking-wide">Sync Data</span>
                </button>
                <div className="h-6 w-px bg-gray-200 dark:bg-white/[0.08] hidden sm:block"></div>
                <div className="flex items-center bg-gray-100 dark:bg-[#131B2B] p-1 rounded-[12px] border border-gray-200/50 dark:border-white/[0.05] shadow-inner transition-colors duration-300">
                    <button
                        onClick={() => setRole('Viewer')}
                        className={`flex items-center px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-300 ${role === 'Viewer'
                            ? 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-white shadow-sm ring-1 ring-gray-200/50 dark:ring-white/10'
                            : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Shield className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Viewer</span>
                    </button>
                    <button
                        onClick={() => setRole('Admin')}
                        className={`flex items-center px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-300 ${role === 'Admin'
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)] ring-1 ring-rose-200 dark:ring-rose-500/30'
                            : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <ShieldAlert className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Admin</span>
                    </button>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] ml-1 shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <div className="h-full w-full bg-white dark:bg-[#0B1120] rounded-full flex items-center justify-center transition-colors duration-300">
                        <span className="text-gray-800 dark:text-white font-bold text-[13px] tracking-wider transition-colors duration-300">JD</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
