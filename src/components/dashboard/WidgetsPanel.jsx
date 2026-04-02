import React from 'react';
import { Plus, ChevronRight, Monitor, Laptop, CreditCard, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export const WidgetsPanel = () => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col space-y-8"
        >
            {/* My Card Section */}
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[17px] font-bold text-slate-800 dark:text-white tracking-wide">My Card</h3>
                    <button className="bg-slate-900 dark:bg-white/10 text-white dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                        Add Card
                    </button>
                </div>
                <div className="relative h-48 w-full rounded-2xl bg-[#8c9f9a] text-white p-5 shadow-lg overflow-hidden">
                    {/* Abstract Shapes */}
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                    <div className="absolute right-0 top-[20%] w-8 h-16 bg-[#b9d5f7] rounded-l-full opacity-60 mix-blend-overlay"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white/70 rounded-full -ml-2"></div>
                        </div>
                        <CreditCard className="w-6 h-6 text-white/80" />
                    </div>

                    <div className="mt-10 relative z-10">
                        <p className="text-white/80 font-mono tracking-[0.2em] text-sm">5095 7474 1103 7513 0014</p>
                    </div>

                    <div className="mt-6 flex justify-between items-center relative z-10 w-full">
                        <div className="flex space-x-2">
                            <div className="h-1.5 w-6 bg-white/30 rounded-full"></div>
                            <div className="h-1.5 w-6 bg-white/30 rounded-full"></div>
                        </div>
                        <p className="text-sm font-semibold tracking-wider">11/24</p>
                    </div>

                    {/* Faux button on right edge */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer z-10">
                        <ChevronRight className="w-4 h-4 text-slate-800" />
                    </div>
                </div>
            </div>

            {/* Quick Transaction Section */}
            <div className="flex flex-col bg-white dark:bg-[#131B2B] rounded-[1.25rem] shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/[0.04] p-5">
                <h3 className="text-[16px] font-bold text-slate-800 dark:text-white mb-5 tracking-wide">Quick Transaction</h3>
                <div className="flex items-center justify-between mb-6">
                    {/* Avatars */}
                    {[
                        { initials: 'MJ', name: 'Michael Jordan', color: 'bg-slate-200 text-slate-600' },
                        { initials: 'ES', name: 'Edelyn Sandra', color: 'bg-emerald-100 text-emerald-600' },
                        { initials: 'AA', name: 'Ahmed Azhar', color: 'bg-indigo-100 text-indigo-600' },
                        { initials: 'CG', name: 'Celyn Gustav', color: 'bg-purple-100 text-purple-600' }
                    ].map((person, idx) => (
                        <div key={idx} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${person.color} mb-2 shadow-sm font-bold text-sm border-2 border-white dark:border-[#131B2B]`}>
                                {person.initials}
                            </div>
                            <span className="text-[10px] sm:text-xs text-slate-500 font-medium text-center leading-tight max-w-[50px]">{person.name}</span>
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <input type="number" placeholder="Amount" className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-[#0B1120] rounded-xl outline-none text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 focus:border-indigo-500 transition-colors" />
                    </div>
                </div>
                <button className="w-full mt-3 bg-slate-900 dark:bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors flex items-center justify-center">
                    Send <Send className="w-4 h-4 ml-2" />
                </button>
            </div>

            {/* My Goals Section */}
            <div className="flex flex-col bg-white dark:bg-[#131B2B] rounded-[1.25rem] shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/[0.04] p-5">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[16px] font-bold text-slate-800 dark:text-white tracking-wide">My Goals</h3>
                    <button className="bg-slate-900 dark:bg-white/10 text-white dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center">
                        <Plus className="w-3 h-3 mr-1" /> Add
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Goal 1 */}
                    <div className="bg-slate-50 dark:bg-[#0B1120] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">New iMac</span>
                            </div>
                            <span className="text-xs font-bold text-indigo-500">50%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                            <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                    </div>

                    {/* Goal 2 */}
                    <div className="bg-slate-50 dark:bg-[#0B1120] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <Laptop className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">New Macbook '14</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-500">60%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                            <div className="bg-[#8c9f9a] h-1.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};
