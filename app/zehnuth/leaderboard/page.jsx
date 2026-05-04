"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Medal, Crown, TrendingUp, Loader2, Search } from 'lucide-react';

const LEAGUES = [
    { name: 'Diamond', min: 750, color: 'text-sky-400', bg: 'bg-sky-50' },
    { name: 'Platinum', min: 500, color: 'text-slate-400', bg: 'bg-slate-50' },
    { name: 'Emerald', min: 250, color: 'text-emerald-400', bg: 'bg-emerald-50' },
    { name: 'Gold', min: 100, color: 'text-amber-400', bg: 'bg-amber-50' },
    { name: 'Bronze', min: 0, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get('/api/zehnuth/points?leaderboard=true');
            setLeaderboard(res.data);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = leaderboard.filter(item => 
        (item.student["SHORT NAME"] || item.student["FULL NAME"] || "").toLowerCase().includes(search.toLowerCase()) ||
        item.student.ADNO.toString().includes(search)
    );

    const getLeague = (points) => {
        return LEAGUES.find(l => points >= l.min) || LEAGUES[LEAGUES.length - 1];
    };

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <div className="animate-pulse">
                    <div className="mb-8 px-2 flex justify-between items-end">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                                <div className="h-8 bg-slate-100 rounded-lg w-32"></div>
                            </div>
                            <div className="h-4 bg-slate-50 rounded-md w-40"></div>
                        </div>
                        <div className="h-10 bg-slate-50 rounded-xl w-32"></div>
                    </div>
                    
                    <div className="flex items-end justify-center gap-2 mb-10 px-2 h-48">
                        <div className="flex-1 bg-slate-50 h-16 rounded-t-xl"></div>
                        <div className="flex-1 bg-slate-100 h-24 rounded-t-xl scale-110"></div>
                        <div className="flex-1 bg-slate-50 h-12 rounded-t-xl"></div>
                    </div>

                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-slate-50/50 rounded-2xl w-full border border-slate-100"></div>
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
                <div className="mb-8 px-2">
                    <div className="flex items-center justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <span className="p-2 bg-amber-500 text-white rounded-xl"><Trophy size={20} /></span>
                                Rankings
                            </h1>
                            <p className="text-slate-500 text-sm font-medium mt-1">Top performers this season</p>
                        </div>
                        <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                             <input
                                 type="text"
                                 placeholder="Search..."
                                 value={search}
                                 onChange={(e) => setSearch(e.target.value)}
                                 className="bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-slate-100 transition-all w-32"
                             />
                        </div>
                    </div>
                </div>

                {/* Compact Top 3 */}
                {!search && filteredData.length >= 3 && (
                    <div className="flex items-end justify-center gap-2 mb-10 px-2 h-48">
                        {/* 2nd Place */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-2 relative">
                                <Medal size={24} />
                                <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">2</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-800 text-center line-clamp-1 w-full">{filteredData[1].student["SHORT NAME"] || filteredData[1].student["FULL NAME"]}</p>
                            <p className="text-[9px] font-bold text-amber-500">{filteredData[1].totalPoints} PTS</p>
                            <div className="w-full bg-slate-100 h-16 rounded-t-xl mt-2"></div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-18 h-18 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-500 mb-2 relative scale-110">
                                <Crown size={32} />
                                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">1</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-900 text-center line-clamp-1 w-full">{filteredData[0].student["SHORT NAME"] || filteredData[0].student["FULL NAME"]}</p>
                            <p className="text-[10px] font-black text-amber-600">{filteredData[0].totalPoints} PTS</p>
                            <div className="w-full bg-amber-400 h-24 rounded-t-xl mt-2 shadow-lg shadow-amber-100"></div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400 mb-2 relative">
                                <Medal size={24} />
                                <span className="absolute -top-2 -right-2 bg-orange-400 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">3</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-800 text-center line-clamp-1 w-full">{filteredData[2].student["SHORT NAME"] || filteredData[2].student["FULL NAME"]}</p>
                            <p className="text-[9px] font-bold text-amber-500">{filteredData[2].totalPoints} PTS</p>
                            <div className="w-full bg-orange-100 h-12 rounded-t-xl mt-2"></div>
                        </div>
                    </div>
                )}

                {/* Ranking List */}
                <div className="space-y-3">
                    {filteredData.map((item, index) => {
                        const league = getLeague(item.totalPoints);
                        return (
                            <div key={item._id} className="bg-slate-50/50 p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                <div className="w-8 font-black text-slate-300 text-sm italic">
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.student["SHORT NAME"] || item.student["FULL NAME"]}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AD: {item.student.ADNO}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${league.bg} ${league.color}`}>
                                            {league.name}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-800 flex items-center justify-end gap-1.5">
                                        <Trophy size={14} className="text-amber-400" /> {item.totalPoints}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
