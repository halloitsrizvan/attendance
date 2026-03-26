"use client";

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import axios from 'axios';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { API_PORT } from '../../Constants';
import Link from 'next/link';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

function LoginP() {
    const navigate = useRouter();
    const [loginErr, setLoginerr] = useState(null);
    const [load, setLoad] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSumbit = async (e) => {
        e.preventDefault();
        setLoad(true);
        setLoginerr(null);
        try {
            const res = await axios.post(`${API_PORT}/teachers/login`, { email, password });
            const { token, teacher } = res.data || {};

            if (token && teacher) {
                getSafeLocalStorage().setItem('token', token);
                getSafeLocalStorage().setItem('teacher', JSON.stringify(teacher));
                window.dispatchEvent(new Event('storage'));
                navigate.push('/');
            } else {
                setLoginerr('Authentication failed. No data received.');
            }
        } catch (err) {
            const message = err?.response?.data?.error || 'Invalid email or password';
            setLoginerr(message);
        } finally {
            setLoad(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
            <div className="w-full max-w-[440px]">
                {/* Branding Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center p-2 mb-4">
                        <Image src="/logo.png" alt="Logo" width={80} height={80} className="object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Portal</h1>
                    <p className="text-sm text-slate-400 mt-1">Authorized Personnel Login Only</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 transition-all">
                    <form className="space-y-6" onSubmit={handleSumbit}>
                        {loginErr && (
                            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                                <AlertCircle size={16} />
                                <span>{loginErr}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all"
                                        required
                                    />
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all"
                                        required
                                    />
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={load}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:scale-100"
                        >
                            {load ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Sign in to Dashboard</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <Link href="/students-login" className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group">
                            Are you a Student?
                            <span className="text-blue-500/50 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">Go to Portal &rarr;</span>
                        </Link>
                    </div> */}
                </div>

                {/* Footer Credits */}
                <p className="mt-8 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                    &copy; {new Date().getFullYear()} Attendance Management System
                </p>
            </div>
        </div>
    );
}

export default LoginP;
