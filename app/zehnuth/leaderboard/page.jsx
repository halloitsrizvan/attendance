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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />
            <main className="max-w-6xl mx-auto px-4 pt-24 pb-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full mb-4">
                            <Crown size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Hall of Fame</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase italic">ZEHNUTH Leaderboard</h1>
                        <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] mt-2">Rankings updated in real-time</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all w-full md:w-80 shadow-sm"
                        />
                    </div>
                </div>

                {/* Top 3 Podium */}
                {!search && filteredData.length >= 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end">
                        {/* 2nd Place */}
                        <div className="order-2 md:order-1 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative pt-16">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-slate-100 rounded-full border-8 border-white shadow-lg flex items-center justify-center text-slate-400">
                                <Medal size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 truncate px-4">{filteredData[1].student["SHORT NAME"] || filteredData[1].student["FULL NAME"]}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">AD: {filteredData[1].student.ADNO}</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-slate-600 font-black">
                                <Trophy size={16} /> {filteredData[1].totalPoints} PTS
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="order-1 md:order-2 bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl shadow-blue-200 text-center relative pt-20 scale-105">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-amber-400 rounded-full border-8 border-slate-900 shadow-lg flex items-center justify-center text-white">
                                <Crown size={50} />
                            </div>
                            <h3 className="text-2xl font-black text-white truncate px-4">{filteredData[0].student["SHORT NAME"] || filteredData[0].student["FULL NAME"]}</h3>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-6">AD: {filteredData[0].student.ADNO}</p>
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-2xl text-amber-400 font-black text-xl">
                                <Trophy size={20} /> {filteredData[0].totalPoints} PTS
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="order-3 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative pt-16">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-orange-50 rounded-full border-8 border-white shadow-lg flex items-center justify-center text-orange-400">
                                <Medal size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 truncate px-4">{filteredData[2].student["SHORT NAME"] || filteredData[2].student["FULL NAME"]}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">AD: {filteredData[2].student.ADNO}</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-2xl text-orange-600 font-black">
                                <Trophy size={16} /> {filteredData[2].totalPoints} PTS
                            </div>
                        </div>
                    </div>
                )}

                {/* Rank List */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Student Rankings</span>
                        <TrendingUp size={16} className="text-slate-300" />
                    </div>
                    <div className="divide-y divide-slate-50">
                        {filteredData.map((item, index) => {
                            const league = getLeague(item.totalPoints);
                            return (
                                <div key={item._id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors group">
                                    <div className="w-10 h-10 flex items-center justify-center font-black text-slate-300 text-xl italic group-hover:text-blue-500 transition-colors">
                                        #{index + 1}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight">{item.student["SHORT NAME"] || item.student["FULL NAME"]}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AD: {item.student.ADNO}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class: {item.student.CLASS}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full inline-block mb-1 ${league.bg} ${league.color}`}>
                                            {league.name} LEAGUE
                                        </div>
                                        <div className="text-lg font-black text-slate-800 flex items-center justify-end gap-2">
                                            <Trophy size={16} className="text-amber-400" /> {item.totalPoints}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
