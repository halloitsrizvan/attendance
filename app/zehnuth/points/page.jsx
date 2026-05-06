"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { History, Star, User, Calendar, Loader2, Trophy, Filter, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORY_COLORS = {
    Exam: 'bg-blue-50 text-blue-600 border-blue-100',
    Writings: 'bg-purple-50 text-purple-600 border-purple-100',
    Presentation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Achievements: 'bg-amber-50 text-amber-600 border-amber-100',
    Competitions: 'bg-rose-50 text-rose-600 border-rose-100',
    MentorBonus: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

export default function MentorPoints() {
    const router = useRouter();
    const [teacher, setTeacher] = useState(null);
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            setTeacher(teacherData);
            const mentorId = teacherData.id || teacherData._id;
            if (mentorId) fetchPoints(mentorId);
        }
    }, []);

    const fetchPoints = async (mentorId) => {
        try {
            // Get mentee IDs first
            const relRes = await axios.get(`/api/zehnuth/mentor-mentee?mentorId=${mentorId}`);
            const menteeIds = relRes.data.map(rel => rel.menteeId._id);

            const res = await axios.get(`/api/zehnuth/points?mentorId=${mentorId}`);
            
            // Filter points to only show those awarded to mentees
            const menteePoints = res.data.filter(p => menteeIds.includes(p.studentId._id));
            
            setPoints(menteePoints);
        } catch (err) {
            console.error("Error fetching points:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const stats = {
        totalPoints: points.reduce((acc, p) => acc + p.points, 0),
        totalAwards: points.length,
    };

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <div className="animate-pulse">
                    <div className="mb-8 px-2 flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                                <div className="h-8 bg-slate-100 rounded-lg w-40"></div>
                            </div>
                            <div className="h-4 bg-slate-50 rounded-md w-32"></div>
                        </div>
                        <div className="h-10 bg-slate-50 rounded-xl w-24"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-10 px-2">
                        <div className="h-20 bg-slate-50/50 rounded-2xl border border-slate-100"></div>
                        <div className="h-20 bg-slate-50/50 rounded-2xl border border-slate-100"></div>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                                        <div className="space-y-1.5">
                                            <div className="h-4 bg-slate-100 rounded-md w-24"></div>
                                            <div className="h-3 bg-slate-50 rounded-md w-16"></div>
                                        </div>
                                    </div>
                                    <div className="h-6 bg-slate-50 rounded-lg w-16"></div>
                                </div>
                                <div className="h-16 bg-slate-50 rounded-2xl w-full"></div>
                                <div className="flex justify-between pt-2">
                                    <div className="h-3 bg-slate-50 rounded-md w-20"></div>
                                    <div className="h-6 bg-slate-100 rounded-md w-12"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                {/* Header */}
                <div className="mb-8 px-2 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-indigo-600 text-white rounded-xl"><History size={20} /></span>
                            Award History
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Track points you awarded</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="Exam">Exam</option>
                            <option value="Writings">Writings</option>
                            <option value="Presentation">Presentation</option>
                            <option value="Achievements">Achievements</option>
                            <option value="Competitions">Competitions</option>
                            <option value="MentorBonus">Bonus</option>
                        </select>
                    </div>
                </div>

                {/* Compact Stats */}
                <div className="grid grid-cols-2 gap-3 mb-10 px-2">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Points</p>
                        <p className="text-2xl font-black text-blue-700">{stats.totalPoints}</p>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Submissions</p>
                        <p className="text-2xl font-black text-amber-700">{stats.totalAwards}</p>
                    </div>
                </div>

                <div className="px-2 mb-10">
                    <button 
                        onClick={() => router.push('/zehnuth/mentees-summary')}
                        className="w-full bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-800 transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <Trophy size={16} className="text-amber-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">View Rankings</p>
                                <p className="text-sm font-black italic uppercase">My Mentees' Standings</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Card List */}
                <div className="space-y-4">
                    {points
                        .filter(p => filter === 'all' || p.category === filter)
                        .map((p) => (
                        <div key={p._id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        {(p.studentId["SHORT NAME"] || p.studentId["FULL NAME"] || "??").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{p.studentId["SHORT NAME"] || p.studentId["FULL NAME"]}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AD: {p.studentId.ADNO}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1.5">
                                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${CATEGORY_COLORS[p.category] || 'bg-slate-50 text-slate-600'}`}>
                                        {p.category}
                                    </span>
                                    {p.status === 'pending' && (
                                        <span className="bg-amber-50 text-amber-500 border border-amber-100 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest animate-pulse">
                                            Pending Approval
                                        </span>
                                    )}
                                    {p.status === 'rejected' && (
                                        <span className="bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest">
                                            Rejected
                                        </span>
                                    )}
                                    {p.status === 'approved' && (
                                        <span className="bg-emerald-50 text-emerald-500 border border-emerald-100 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest">
                                            Approved
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-slate-50/50 rounded-2xl p-4 mb-4">
                                <p className="text-sm font-bold text-slate-600 leading-relaxed">{p.activity}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Calendar size={12} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{formatDate(p.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-amber-500 font-black">
                                    <Star size={16} fill="currentColor" />
                                    <span className="text-lg">+{p.points}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {points.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                <History size={32} />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No records found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
