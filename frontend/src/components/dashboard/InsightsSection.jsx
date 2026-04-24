/**
 * This section displays real dynamic business insights from the Python backend.
 */
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { motion } from 'framer-motion';

const ExclamationIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

const TrendingUpIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
        <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
);

const CheckIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const InfoIcon = ({ className }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export const InsightsSection = () => {
    const { insights, transactions } = useFinance();

    if (!insights || insights.length === 0) return null;

    const getStyling = (type) => {
        switch (type) {
            case 'positive':
                return {
                    icon: CheckIcon,
                    iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
                    iconColor: 'text-emerald-600 dark:text-emerald-500'
                };
            case 'warning':
                return {
                    icon: ExclamationIcon,
                    iconBg: 'bg-amber-100 dark:bg-[#ffb020]/10',
                    iconColor: 'text-amber-600 dark:text-[#ffb020]'
                };
            default: // neutral
                return {
                    icon: InfoIcon,
                    iconBg: 'bg-blue-100 dark:bg-blue-500/10',
                    iconColor: 'text-blue-600 dark:text-blue-500'
                };
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((item, idx) => {
                const style = getStyling(item.type);
                const IconComp = style.icon;
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + (idx * 0.1), duration: 0.5, ease: "easeOut" }}
                        key={item.id || idx}
                        className="bg-white dark:bg-[#0f1423] rounded-[18px] p-6 flex flex-row items-center border border-slate-200/80 dark:border-white/[0.03] transition-all hover:bg-slate-50 dark:hover:bg-[#131b2d] cursor-default shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none"
                    >
                        <div className={`${style.iconBg} ${style.iconColor} h-[42px] w-[42px] rounded-2xl flex items-center justify-center shrink-0 mr-5 transition-transform duration-300 hover:scale-105`}>
                            <IconComp className="h-[22px] w-[22px]" />
                        </div>
                        <div className="flex flex-col">
                            <h4 className="text-[14px] font-medium text-slate-700 dark:text-slate-200 tracking-wide transition-colors duration-300 line-clamp-2 leading-snug">{item.insight_text}</h4>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
