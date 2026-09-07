"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    BookOpen, Trophy, ShieldCheck, ChevronRight,
    Sparkles, ArrowUpRight, FileSpreadsheet, Layers,
    Mic, Award, CalendarDays
} from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

export default function LisanHubPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [programsCount, setProgramsCount] = useState(0);
    const [achievementsCount, setAchievementsCount] = useState(0);

    useEffect(() => {
        fetchProfileAndCounts();
    }, []);

    const fetchProfileAndCounts = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const profileData = res.data;
            const roles = Array.isArray(profileData.role) ? profileData.role : [profileData.role];
            const normalizedRoles = roles.map(r => String(r || '').toLowerCase());
            if (!normalizedRoles.includes('lisan')) {
                router.push('/students-portal');
                return;
            }

            setStudent(profileData);

            // Fetch counts for preview badges
            try {
                const [reportsRes, pointsRes] = await Promise.all([
                    axios.get(`${API_PORT}/class-reports`),
                    axios.get(`${API_PORT}/zehnuth/points?status=approved`)
                ]);
                
                const reportsData = reportsRes.data || [];
                let totalProg = 0;
                reportsData.forEach(r => {
                    totalProg += (r.programs || []).length;
                });
                setProgramsCount(totalProg);

                const pointsData = pointsRes.data || [];
                // Count target categories: Outside Presentations, Achievements, Outside Competitions
                const targetPoints = pointsData.filter(item => {
                    const cat = item.category;
                    const act = (item.activity || '').toLowerCase();
                    if (cat === 'Presentation' && !act.includes('(in)') && act !== 'speech' && !act.includes('inside campus')) return true;
                    if (cat === 'Achievements' && !act.includes('innovation')) return true;
                    if (cat === 'Competitions' && !act.includes('(in)') && !act.includes('inside campus')) return true;
                    return false;
                });
                setAchievementsCount(targetPoints.length);
            } catch (err) {
                console.error("Error fetching preview counts:", err);
            }

        } catch (err) {
            console.error("Error fetching data on Lisan hub:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto px-1 pb-16">
            
            {/* Top Hub Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-sky-600">Lisan Hub</div>
                        <div className="text-sm font-bold text-slate-700">Central Management & Achievements Portal</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100">
                        <ShieldCheck size={14} />
                        <span>Lisan Authorized</span>
                    </span>
                </div>
            </div>

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-[2.5rem] p-7 sm:p-10 text-white shadow-xl shadow-sky-500/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-sky-100">
                        <Sparkles size={12} />
                        <span>Select a Module to Proceed</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        Lisan Activity Hub
                    </h1>
                    <p className="text-sky-100 text-xs sm:text-sm font-semibold leading-relaxed">
                        Access the class programs archive or generate intelligence reports for external presentations, student achievements, and outside competitions.
                    </p>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 2 MAIN MODULE CARDS */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
                
                {/* CARD 1: Class Programs Directory */}
                <div 
                    onClick={() => router.push('/students-portal/lisan/programs')}
                    className="cursor-pointer group relative p-8 sm:p-9 bg-white hover:bg-slate-50/50 rounded-[2.5rem] border border-slate-200/80 hover:border-sky-500 shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 overflow-hidden flex flex-col justify-between space-y-6"
                >
                    {/* Background Subtle Glow */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-100/50 rounded-full blur-3xl group-hover:bg-sky-200/50 transition-colors duration-300"></div>

                    <div className="relative z-10 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform duration-300">
                                <BookOpen size={32} />
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-sky-50 group-hover:bg-sky-600 text-sky-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                                <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                                    Module 01
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2 group-hover:text-sky-600 transition-colors">
                                Class Programs Directory
                            </h2>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed">
                            Explore, search, and download class-wise program submissions, posters, and curriculum reports submitted by students & teachers.
                        </p>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                        <span className="text-sky-600 font-extrabold flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            <span>{programsCount} Programs Logged</span>
                        </span>
                        <span className="text-slate-400 group-hover:text-slate-600 flex items-center gap-1">
                            <span>Open Directory</span>
                            <ChevronRight size={14} />
                        </span>
                    </div>
                </div>

                {/* CARD 2: Zehnuth Achievements Report */}
                <div 
                    onClick={() => router.push('/students-portal/lisan/zehnuth-report')}
                    className="cursor-pointer group relative p-8 sm:p-9 bg-white hover:bg-slate-50/50 rounded-[2.5rem] border border-slate-200/80 hover:border-indigo-500 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col justify-between space-y-6"
                >
                    {/* Background Subtle Glow */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl group-hover:bg-indigo-200/50 transition-colors duration-300"></div>

                    <div className="relative z-10 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
                                <Trophy size={32} />
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                                <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                                    Module 02
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2 group-hover:text-indigo-600 transition-colors">
                                Zehnuth Achievements Report
                            </h2>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed">
                            Analyze external presentations (outside campus), student achievements, and outside competitions with monthly filters and PDF export.
                        </p>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                        <span className="text-indigo-600 font-extrabold flex items-center gap-1.5">
                            <Award size={14} />
                            <span>{achievementsCount} Approved Records</span>
                        </span>
                        <span className="text-slate-400 group-hover:text-slate-600 flex items-center gap-1">
                            <span>View Report</span>
                            <ChevronRight size={14} />
                        </span>
                    </div>
                </div>

            </div>

        </div>
    );
}
