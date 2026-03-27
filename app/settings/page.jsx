"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header/Header';
import { API_PORT } from '@/Constants';
import { Plus, Loader2, CheckCircle, AlertCircle, Calendar, Trash2 } from 'lucide-react';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export default function SettingsPage() {
    const [years, setYears] = useState([]);
    const [newYearName, setNewYearName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [status, setStatus] = useState(null);
    const [teacher, setTeacher] = useState(null);

    const fetchAcademicYears = async () => {
        try {
            const res = await axios.get(`${API_PORT}/academic-years`);
            setYears(res.data);
        } catch (error) {
            console.error("Failed to fetch academic years:", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        const storedTeacher = getSafeLocalStorage().getItem("teacher");
        if (storedTeacher) {
            try {
                const parsed = JSON.parse(storedTeacher);
                setTeacher(parsed);
                if (parsed.role !== "super_admin") {
                    window.location.href = "/";
                }
            } catch (e) {
                window.location.href = "/login";
            }
        } else {
            window.location.href = "/login";
        }

        fetchAcademicYears();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newYearName.trim()) return;
        setLoading(true);

        try {
            await axios.post(`${API_PORT}/academic-years`, {
                name: newYearName
            });
            setNewYearName('');
            await fetchAcademicYears();
            setStatus({ type: 'success', message: 'New academic year created' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Failed to create academic year:", error);
            setStatus({ type: 'error', message: 'Failed to create academic year' });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id) => {
        try {
            await axios.patch(`${API_PORT}/academic-years`, {
                id,
                activate: true
            });
            await fetchAcademicYears();
            setStatus({ type: 'success', message: 'Academic year activated' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Activation failed:", error);
            setStatus({ type: 'error', message: 'Activation failed' });
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Academic Year docs</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Manage institutional sessions</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center shadow-inner">
                                <Calendar className="text-sky-500" size={20} />
                            </div>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                        }`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="text-xs font-black uppercase tracking-widest">{status.message}</span>
                        </div>
                    )}

                    {/* Create New Form */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Add New Session</h3>
                        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={newYearName}
                                onChange={(e) => setNewYearName(e.target.value)}
                                placeholder="Example: 2024 - 2025"
                                className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading || !newYearName.trim()}
                                className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                                Create
                            </button>
                        </form>
                    </div>

                    {/* Academic Year List */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Session History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {years.map((year) => (
                                <div 
                                    key={year._id}
                                    className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                                        year.isActive 
                                            ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/5' 
                                            : 'bg-white border-slate-50 hover:border-sky-100'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                                            year.isActive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            <Calendar size={20} />
                                        </div>
                                        {year.isActive ? (
                                            <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full shadow-emerald-500/10">Active Session</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleActivate(year._id)}
                                                className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-full hover:bg-sky-100 hover:text-sky-600 transition-all"
                                            >
                                                Activate
                                            </button>
                                        )}
                                    </div>
                                    
                                    <h2 className={`text-xl font-black ${year.isActive ? 'text-emerald-900' : 'text-slate-800'}`}>
                                        {year.name}
                                    </h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50 ${year.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        Created: {new Date(year.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {years.length === 0 && (
                            <div className="p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No sessions found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
