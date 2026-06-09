"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Medal, Crown, Loader2, Search, Award } from 'lucide-react';

export default function MentorLeaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get('/api/zehnuth/mentor-leaderboard');
            setLeaderboard(res.data);
        } catch (err) {
            console.error("Error fetching mentor leaderboard:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = leaderboard.filter(item =>
        (item.name || "").toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-24 space-y-6">
                {/* Header */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black uppercase italic flex items-center gap-3 tracking-tight">
                            <span className="p-3 bg-indigo-500 text-white rounded-2xl shadow-inner"><Trophy size={24} /></span>
                            Mentor Ranks
                        </h1>
                        <p className="text-indigo-100 text-sm font-medium mt-3 max-w-sm">Leading mentors based on their activity points and contributions.</p>
                        
                        <div className="mt-6 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                            <input
                                type="text"
                                placeholder="Search mentors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-indigo-500/50 border border-indigo-400 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-white placeholder:text-indigo-200 outline-none focus:bg-indigo-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                {/* Compact Top 3 */}
                {!search && filteredData.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 mb-10 h-64 mt-4">
                        {/* 2nd Place */}
                        <div className="flex-1 flex flex-col items-center hover:scale-[1.03] transition-all">
                            <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 mb-3 relative shadow-md">
                                <Medal size={28} />
                                <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-slate-50 shadow-sm">2</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-800 text-center line-clamp-1 w-full px-1">{filteredData[1].name}</p>
                            <p className="text-[10px] font-black text-indigo-500 mt-1">{filteredData[1].points} PTS</p>
                            <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 h-24 rounded-t-3xl mt-3 shadow-inner"></div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex-1 flex flex-col items-center hover:scale-[1.03] transition-all relative z-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-200 to-amber-100 rounded-[1.8rem] flex items-center justify-center text-amber-500 mb-3 relative scale-110 shadow-xl shadow-amber-100/50">
                                <Crown size={36} />
                                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-slate-50 shadow-sm">1</span>
                            </div>
                            <p className="text-xs font-black text-slate-900 text-center line-clamp-1 w-full mt-2 px-1">{filteredData[0].name}</p>
                            <p className="text-[11px] font-black text-amber-600 mt-1">{filteredData[0].points} PTS</p>
                            <div className="w-full bg-gradient-to-t from-amber-400 to-amber-300 h-32 rounded-t-3xl mt-3 shadow-inner"></div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex-1 flex flex-col items-center hover:scale-[1.03] transition-all">
                            <div className="w-16 h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-orange-400 mb-3 relative shadow-md">
                                <Medal size={28} />
                                <span className="absolute -top-2 -right-2 bg-orange-400 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-slate-50 shadow-sm">3</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-800 text-center line-clamp-1 w-full px-1">{filteredData[2].name}</p>
                            <p className="text-[10px] font-black text-indigo-500 mt-1">{filteredData[2].points} PTS</p>
                            <div className="w-full bg-gradient-to-t from-orange-200 to-orange-100 h-16 rounded-t-3xl mt-3 shadow-inner"></div>
                        </div>
                    </div>
                )}

                {/* Ranking List */}
                <div className="space-y-3">
                    {filteredData.map((item, index) => {
                        return (
                            <div
                                key={item.id}
                                className="bg-white p-5 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 font-black text-sm italic flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                            {item.activities} Activities
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-indigo-600 flex items-center justify-end gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl">
                                        <Award size={16} /> {item.points}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {filteredData.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-sm font-black uppercase tracking-widest bg-white rounded-3xl border border-slate-100 border-dashed">
                            No mentors found
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
