"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { History, Star, User, Calendar, Loader2, Trophy, Filter } from 'lucide-react';

const CATEGORY_COLORS = {
    Exam: 'bg-blue-50 text-blue-600 border-blue-100',
    Writings: 'bg-purple-50 text-purple-600 border-purple-100',
    Presentation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Achievements: 'bg-amber-50 text-amber-600 border-amber-100',
    Competitions: 'bg-rose-50 text-rose-600 border-rose-100',
    MentorBonus: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

export default function MentorPoints() {
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
            const res = await axios.get(`/api/zehnuth/points?mentorId=${mentorId}`);
            setPoints(res.data);
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const stats = {
        totalPoints: points.reduce((acc, p) => acc + p.points, 0),
        totalAwards: points.length,
        topStudent: points.length > 0 ? 
            Object.entries(points.reduce((acc, p) => {
                const sName = p.studentId["SHORT NAME"] || p.studentId["FULL NAME"];
                acc[sName] = (acc[sName] || 0) + p.points;
                return acc;
            }, {})).sort((a, b) => b[1] - a[1])[0][0] : 'N/A'
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />
            <main className="max-w-6xl mx-auto px-4 pt-24 pb-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase italic mb-2">Achievement History</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em]">Manage and track points you've awarded</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                            <Star size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Points Awarded</p>
                        <p className="text-4xl font-black text-slate-800 italic">{stats.totalPoints}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                            <History size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Submissions</p>
                        <p className="text-4xl font-black text-slate-800 italic">{stats.totalAwards}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                            <Trophy size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Performer</p>
                        <p className="text-2xl font-black text-slate-800 truncate italic">{stats.topStudent}</p>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                            <History size={20} className="text-blue-500" /> Recent Awards
                        </h2>
                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 px-4 rounded-2xl border border-slate-100">
                            <Filter size={14} className="text-slate-400" />
                            <select 
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="bg-transparent text-[10px] font-black uppercase text-slate-600 focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                <option value="Exam">Exam</option>
                                <option value="Writings">Writings</option>
                                <option value="Presentation">Presentation</option>
                                <option value="Achievements">Achievements</option>
                                <option value="Competitions">Competitions</option>
                                <option value="MentorBonus">Mentor Bonus</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {points
                                    .filter(p => filter === 'all' || p.category === filter)
                                    .map((p) => (
                                    <tr key={p._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {(p.studentId["SHORT NAME"] || p.studentId["FULL NAME"] || "??").slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{p.studentId["SHORT NAME"] || p.studentId["FULL NAME"]}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AD: {p.studentId.ADNO}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${CATEGORY_COLORS[p.category] || 'bg-slate-50 text-slate-600'}`}>
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-600 line-clamp-1 max-w-xs">{p.activity}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{formatDate(p.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex items-center gap-1 text-amber-500 font-black text-lg">
                                                <Star size={18} fill="currentColor" /> +{p.points}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {points.length === 0 && (
                            <div className="p-20 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                                    <History size={40} />
                                </div>
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No points awarded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
