// 🌟 TransactionForm Component
// This is a UI component constructed with Tailwind and Framer Motion.
// It ensures our interface stays crisp, responsive, and neatly organized.
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Save, PlusCircle } from 'lucide-react';
import { categories } from '../../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';

export const TransactionForm = ({ onClose, editingTransaction = null }) => {
    const { addTransaction, updateTransaction } = useFinance();
    const [formData, setFormData] = useState({
        date: editingTransaction ? editingTransaction.date : new Date().toISOString().split('T')[0],
        amount: editingTransaction ? editingTransaction.amount : '',
        category: editingTransaction ? editingTransaction.category : categories[0],
        type: editingTransaction ? editingTransaction.type : 'Income',
        description: editingTransaction ? editingTransaction.description : ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        if (editingTransaction) {
            await updateTransaction(editingTransaction.id, formData);
        } else {
            await addTransaction(formData);
        }
        setIsSaving(false);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 dark:bg-[#0B1120]/80 backdrop-blur-sm dark:backdrop-blur-md flex items-center justify-center z-50 p-4 transition-colors duration-300"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-[#131B2B] rounded-3xl shadow-2xl dark:shadow-indigo-500/10 w-full max-w-md overflow-hidden border border-transparent dark:border-white/[0.08] transition-colors duration-300"
                >
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.04] flex justify-between items-center bg-gray-50/50 dark:bg-[#0B1120]/30 transition-colors">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide">
                            {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-full">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Type</label>
                            <div className="flex bg-slate-50 dark:bg-[#0B1120] p-1 rounded-xl border border-slate-200 dark:border-white/[0.04]">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'Income' })} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${formData.type === 'Income' ? 'bg-white dark:bg-[#1E293B] text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>Income</button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'Expense' })} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${formData.type === 'Expense' ? 'bg-white dark:bg-[#1E293B] text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500'}`}>Expense</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Amount ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-50/50 dark:bg-[#0B1120]/50 border border-slate-200 dark:border-white/[0.05] rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#1E293B] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-slate-50/50 dark:bg-[#0B1120]/50 border border-slate-200 dark:border-white/[0.05] rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#1E293B] outline-none transition-all text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-slate-50/50 dark:bg-[#0B1120]/50 border border-slate-200 dark:border-white/[0.05] rounded-xl px-4 py-3 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#1E293B] outline-none transition-all text-slate-800 dark:text-slate-200 cursor-pointer"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-50/50 dark:bg-[#0B1120]/50 border border-slate-200 dark:border-white/[0.05] rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#1E293B] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                placeholder="What was this for?"
                            />
                        </div>

                        <div className="pt-4 flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-[2] flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                ) : editingTransaction ? (
                                    <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                                ) : (
                                    <><PlusCircle className="h-5 w-5 mr-2" /> Add Transaction</>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
