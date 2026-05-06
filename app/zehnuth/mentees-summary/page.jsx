"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, User, Loader2, ChevronLeft, Star, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LEAGUES = [
    { name: 'Diamond', min: 750, color: 'text-sky-400', bg: 'bg-sky-50' },
    { name: 'Platinum', min: 500, color: 'text-slate-400', bg: 'bg-slate-50' },
    { name: 'Emerald', min: 250, color: 'text-emerald-400', bg: 'bg-emerald-50' },
    { name: 'Gold', min: 100, color: 'text-amber-400', bg: 'bg-amber-50' },
    { name: 'Bronze', min: 0, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function MenteesSummary() {
    const router = useRouter();
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            const mentorId = teacherData.id || teacherData._id;
            if (mentorId) fetchMenteesData(mentorId);
        }
    }, []);

    const fetchMenteesData = async (mentorId) => {
        try {
            // Get mentor-mentee relations
            const relRes = await axios.get(`/api/zehnuth/mentor-mentee?mentorId=${mentorId}`);
            const menteeIds = relRes.data.map(rel => rel.menteeId._id);

            // Get points for all students (global leaderboard)
            const pointsRes = await axios.get('/api/zehnuth/points?leaderboard=true');
            const globalLeaderboard = pointsRes.data;
            
            // Filter only mentees but preserve their global rank
            const menteesWithGlobalRank = globalLeaderboard
                .map((item, index) => ({
                    ...item,
                    globalRank: index + 1
                }))
                .filter(item => menteeIds.includes(item.student._id));

            setMentees(menteesWithGlobalRank);
        } catch (err) {
            console.error("Error fetching mentees data:", err);
        } finally {
            setLoading(false);
        }
    };

    const getLeague = (points) => {
        return LEAGUES.find(l => points >= l.min) || LEAGUES[LEAGUES.length - 1];
    };

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 bg-slate-100 rounded-lg w-48"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-slate-50 rounded-3xl w-full"></div>
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
                <div className="mb-8 flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentee Standings</h1>
                        <p className="text-slate-500 text-sm font-medium mt-0.5">Current progress of your mentees</p>
                    </div>
                </div>

                {/* Mentee List */}
                <div className="space-y-4">
                    {mentees.map((item, index) => {
                        const league = getLeague(item.totalPoints);
                        return (
                            <div key={item.student._id} className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-transparent hover:border-slate-200 transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-bold shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            {(item.student["SHORT NAME"] || "??").slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 uppercase tracking-tight">{item.student["SHORT NAME"] || item.student["FULL NAME"]}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AD: {item.student.ADNO}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-900 flex items-center justify-end gap-2">
                                            <Star size={20} className="text-amber-400" fill="currentColor" />
                                            {item.totalPoints}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL POINTS</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${league.bg} ${league.color}`}>
                                            {league.name} League
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                                        <TrendingUp size={14} />
                                        Rank #{item.globalRank}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {mentees.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                                <User size={40} />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No mentees assigned yet.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
