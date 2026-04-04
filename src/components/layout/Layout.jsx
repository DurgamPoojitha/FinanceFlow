// 🌟 Layout Component
// This is a UI component constructed with Tailwind and Framer Motion.
// It ensures our interface stays crisp, responsive, and neatly organized.
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useFinance } from '../../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';

// This is the core structural spine of our app. It handles bringing in 
// the Sidebar, Header, MobileNav, and injecting the active page's view seamlessly.
export const Layout = ({ children, activeTab, setActiveTab }) => {
    // We grab isLoading from context so we can paint a beautiful loader when fetching data.
    const { isLoading } = useFinance();

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300">
            {/* Desktop Side Navigation */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative border-l border-slate-200 dark:border-white/[0.04] shadow-2xl shadow-indigo-500/5 transition-colors duration-300">
                {/* Unified Top Navigation Bar */}
                <Header />

                {/* The main workspace pane where all the heavy lifting happens */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth pb-20 relative">
                    {/* A subtle glowing blur effect in the background for that premium aesthetic */}
                    <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[800px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                    {isLoading ? (
                        // If we are currently syncing data, show this spinner
                        <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-4 transition-colors duration-300">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                            <p className="font-medium animate-pulse text-sm">Synchronizing data...</p>
                        </div>
                    ) : (
                        // When data arrives, smoothly transition the view component into visibility
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

                {/* The mobile-only bottom navigation bar to keep usability tight on small screens */}
                <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
        </div>
    );
};
