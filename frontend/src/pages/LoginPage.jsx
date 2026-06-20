/**
 * LoginPage – JWT Authentication Form.
 *
 * Calls POST /api/auth/login with email + password.
 * On success: stores the JWT token and triggers onLoginSuccess().
 * On failure: displays the server error message.
 *
 * Default admin credentials (from .env seed):
 *   Email:    admin@financeflow.com
 *   Password: admin123
 */

import React, { useState } from 'react';
import { apiClient, setToken } from '../api/apiClient';
import { motion } from 'framer-motion';
import { TrendingUp, LogIn, Eye, EyeOff } from 'lucide-react';

export const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await apiClient.post('/api/auth/login', { email, password });
            setToken(data.access_token);
            onLoginSuccess({ role: data.role, email: data.email });
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#080E1A] flex items-center justify-center p-4 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo & Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-[22px] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-5">
                        <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Finance Flow
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-[15px]">
                        Sign in to your BI dashboard
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-[#131B2B] rounded-3xl shadow-xl dark:shadow-indigo-500/5 border border-slate-200/80 dark:border-white/[0.06] p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-3 text-[14px] text-rose-600 dark:text-rose-400"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="login-email"
                                className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide"
                            >
                                Email Address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@financeflow.com"
                                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="login-password"
                                className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Hint */}
                    <p className="text-center text-[12px] text-slate-400 dark:text-slate-600 mt-6">
                        Default admin: <span className="text-indigo-500">admin@financeflow.com</span> / admin123
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
