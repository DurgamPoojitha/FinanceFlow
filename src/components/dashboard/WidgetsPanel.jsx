import React, { useState } from 'react';
import { Plus, ChevronRight, Monitor, Laptop, CreditCard, X, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WidgetsPanel = () => {
    const [cards, setCards] = useState([
        { id: 1, number: '5095 7474 1103 7513', expiry: '11/28', bank: 'Default Bank' }
    ]);

    const [goals, setGoals] = useState([
        { id: 1, title: 'New iMac', currentAmount: 1000, targetAmount: 2000, icon: 'Monitor' },
        { id: 2, title: "New Macbook '14", currentAmount: 1200, targetAmount: 2000, icon: 'Laptop' }
    ]);

    const [showCardModal, setShowCardModal] = useState(false);
    const [cardForm, setCardForm] = useState({ number: '', expiry: '', bank: '' });

    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalForm, setGoalForm] = useState({ title: '', targetAmount: '', currentAmount: '' });

    const handleAddCard = (e) => {
        e.preventDefault();
        setCards([...cards, { ...cardForm, id: Date.now() }]);
        setShowCardModal(false);
        setCardForm({ number: '', expiry: '', bank: '' });
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        setGoals([...goals, { ...goalForm, id: Date.now(), icon: 'Target' }]);
        setShowGoalModal(false);
        setGoalForm({ title: '', targetAmount: '', currentAmount: '' });
    };

    const renderIcon = (iconName) => {
        if (iconName === 'Monitor') return <Monitor className="w-5 h-5" />;
        if (iconName === 'Laptop') return <Laptop className="w-5 h-5" />;
        return <Target className="w-5 h-5" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col space-y-8 pb-10"
        >
            {/* My Card Section */}
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[17px] font-bold text-slate-800 dark:text-white tracking-wide">My Card</h3>
                    <button
                        onClick={() => setShowCardModal(true)}
                        className="bg-slate-900 dark:bg-white/10 text-white dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        Add Card
                    </button>
                </div>

                <div className="space-y-4">
                    {cards.map((card, index) => (
                        <div key={card.id} className={`relative h-48 w-full rounded-2xl text-white p-5 shadow-lg overflow-hidden ${index % 2 === 0 ? 'bg-[#8c9f9a]' : 'bg-[#6b7c87]'}`}>
                            {/* Abstract Shapes */}
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                            <div className="absolute right-0 top-[20%] w-8 h-16 bg-[#b9d5f7] rounded-l-full opacity-60 mix-blend-overlay"></div>

                            <div className="flex justify-between items-start relative z-10 w-full pr-10">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white/70 rounded-full -ml-2"></div>
                                </div>
                                <div className="font-semibold text-sm tracking-wide bg-white/10 px-3 py-1 rounded-full">
                                    {card.bank || 'Bank'}
                                </div>
                            </div>

                            <div className="mt-8 relative z-10">
                                <p className="text-white/90 font-mono tracking-[0.2em] text-lg sm:text-base">{card.number.match(/.{1,4}/g)?.join(' ') || card.number}</p>
                            </div>

                            <div className="mt-5 flex justify-between items-center relative z-10 w-full">
                                <div className="flex space-x-2">
                                    <div className="h-1.5 w-6 bg-white/30 rounded-full"></div>
                                    <div className="h-1.5 w-6 bg-white/30 rounded-full"></div>
                                </div>
                                <p className="text-sm font-semibold tracking-wider">{card.expiry}</p>
                            </div>

                            {/* Faux button on right edge */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer z-10">
                                <ChevronRight className="w-4 h-4 text-slate-800" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Goals Section */}
            <div className="flex flex-col bg-white dark:bg-[#131B2B] rounded-[1.25rem] shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/[0.04] p-5">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[16px] font-bold text-slate-800 dark:text-white tracking-wide">My Goals</h3>
                    <button
                        onClick={() => setShowGoalModal(true)}
                        className="bg-slate-900 dark:bg-white/10 text-white dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center"
                    >
                        <Plus className="w-3 h-3 mr-1" /> Add
                    </button>
                </div>

                <div className="space-y-4">
                    {goals.map((goal, index) => {
                        const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                        const colors = ['bg-indigo-400', 'bg-[#8c9f9a]', 'bg-emerald-400', 'bg-rose-400', 'bg-amber-400'];
                        const textColors = ['text-indigo-500', 'text-slate-500', 'text-emerald-500', 'text-rose-500', 'text-amber-500'];
                        const activeColor = colors[index % colors.length];
                        const activeText = textColors[index % textColors.length];

                        return (
                            <div key={goal.id} className="bg-slate-50 dark:bg-[#0B1120] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white dark:bg-white/5 shadow-sm text-slate-600 dark:text-slate-300 rounded-lg">
                                            {renderIcon(goal.icon)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{goal.title}</span>
                                            <span className="text-[10px] text-slate-500">${goal.currentAmount} / ${goal.targetAmount}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold ${activeText}`}>{percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className={`${activeColor} h-1.5 rounded-full`}
                                    ></motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Modals --- */}
            <AnimatePresence>
                {showCardModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#131B2B] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add New Card</h3>
                                <button onClick={() => setShowCardModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleAddCard} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
                                    <input required type="text" value={cardForm.bank} onChange={e => setCardForm({ ...cardForm, bank: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. Chase Bank" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Card Number (16 Digits)</label>
                                    <input required type="text" maxLength={16} minLength={16} value={cardForm.number} onChange={e => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '') })} className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 tracking-widest" placeholder="1234567812345678" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry Date</label>
                                    <input required type="text" maxLength={5} value={cardForm.expiry} onChange={e => setCardForm({ ...cardForm, expiry: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="MM/YY" />
                                </div>
                                <button type="submit" className="w-full mt-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Save Card</button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showGoalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#131B2B] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add New Goal</h3>
                                <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleAddGoal} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Goal Title</label>
                                    <input required type="text" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. Vacation Fund" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Target Amount ($)</label>
                                    <input required type="number" min="1" value={goalForm.targetAmount} onChange={e => setGoalForm({ ...goalForm, targetAmount: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="5000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Already Saved ($)</label>
                                    <input required type="number" min="0" value={goalForm.currentAmount} onChange={e => setGoalForm({ ...goalForm, currentAmount: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="1000" />
                                </div>
                                <button type="submit" className="w-full mt-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors">Save Goal</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
