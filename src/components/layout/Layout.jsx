import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useFinance } from '../../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = ({ children, activeTab, setActiveTab }) => {
    const { isLoading } = useFinance();

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative border-l border-slate-200 dark:border-white/[0.04] shadow-2xl shadow-indigo-500/5 transition-colors duration-300">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth pb-20 relative">
                    <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[800px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-4 transition-colors duration-300">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                            <p className="font-medium animate-pulse text-sm">Synchronizing data...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="max-w-7xl mx-auto w-full relative z-10"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </main>
                <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
        </div>
    );
};
