import React from 'react';
import { LayoutDashboard, Receipt, Wallet, Sparkles } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-white/[0.04] hidden md:flex flex-col z-20 relative transition-colors duration-300">
            <div className="h-[72px] flex items-center px-7 border-b border-slate-200 dark:border-white/[0.04] transition-colors duration-300">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg mr-3 shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                    <Wallet className="h-6 w-6 text-white" />
                </div>
                <span className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Finance<span className="text-indigo-600 dark:text-indigo-400">Flow</span></span>
            </div>
            <nav className="flex-1 p-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === item.id
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-indigo-100 dark:border-indigo-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                            }`}
                    >
                        <item.icon className={`h-5 w-5 mr-3.5 transition-colors ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'}`} />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-5 border-t border-slate-200 dark:border-white/[0.04] mt-auto transition-colors duration-300">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#131B2B] dark:to-[#0d1424] rounded-2xl p-5 border border-indigo-100/50 dark:border-white/[0.05] relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-30 group-hover:opacity-100 transition-opacity">
                        <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 transition-colors duration-300">Pro Plan Active</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed">All premium features unlocked via system.</p>
                </div>
            </div>
        </aside>
    );
};
