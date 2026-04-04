import React from 'react';
import { LayoutDashboard, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileNav = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/[0.04] z-50 px-6 py-3 pb-safe transition-colors duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <nav className="flex justify-around items-center">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className="relative flex flex-col items-center justify-center w-16 h-14"
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-transparent'}`}>
                                <item.icon className={`h-5 w-5 transition-colors duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            </div>
                            <span className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="mobileNavIndicator"
                                    className="absolute -top-3 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-b-md"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
