"use client";

import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useRouter } from "next/navigation";
import ClassWiseLoad from '../load-UI/ClassWiseLoad';
import { API_PORT } from '@/Constants';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

function ClassWIse({ initialClasses = null, initialAbseties = null, initialAllStudents = null }) {
    const navigate = useRouter()
    const [classes, setClass] = useState(initialClasses || [])
    const [load, setLoad] = useState(!initialClasses)
    const [classesLoad, setClassesLoad] = useState(!initialClasses)
    const [absenteesLoad, setAbsenteesLoad] = useState(!initialAbseties)
    const [AllStudents, setAllStudents] = useState(initialAllStudents || 0)
    const [abseties, setAbseties] = useState(initialAbseties || [])

    useEffect(() => {
        if (initialClasses && initialAbseties) return;
        
        setLoad(true)
        setClassesLoad(true)
        setAbsenteesLoad(true)
        
        axios.get(`${API_PORT}/classes`)
        .then((res) => {
          const filter = res.data.sort((a, b) => a.class - b.class);
          setClass(filter)
          setAllStudents(res.data.reduce((sum, item) => sum + item.presentStudents, 0))
          setClassesLoad(false)
        })
        .catch((err) => {
            console.error(err);
            setClassesLoad(false)
        })

        axios.get(`${API_PORT}/set-attendance`)
        .then((res) => {
          const latestByStudent = {};
          res.data.forEach((s) => {
            const existing = latestByStudent[s.ad];
            if (!existing || new Date(s.attentenceDate) > new Date(existing.attentenceDate)) {
              latestByStudent[s.ad] = s;
            }
          });
          
          const latestAbsentStudents = Object.values(latestByStudent)
            .filter(s => s.status === "Absent")
            .sort((a, b) => a.SL - b.SL);
            
          latestAbsentStudents.sort((a, b) => b.class - a.class);
          setAbseties(latestAbsentStudents);
          setAbsenteesLoad(false);
        })
        .catch((err) => {
          console.error(err);
          setAbsenteesLoad(false)
        })
    }, [initialClasses, initialAbseties])

    useEffect(() => {
        if (!classesLoad && !absenteesLoad) {
            setLoad(false)
        }
    }, [classesLoad, absenteesLoad])

    if (load) return <div className="mt-20"><ClassWiseLoad /></div>;

    return (
        <div className="container mx-auto px-4 py-8 mt-12 max-w-7xl">
            {/* Page Header */}
            <div className="mb-8 text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Status Overview</h2>
                <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <div className="w-8 h-px bg-slate-200"></div>
                    Real-time Attendance
                    <div className="w-8 h-px bg-slate-200"></div>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50 text-center group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Present Today</p>
                    <p className="text-4xl font-black text-emerald-500 tracking-tighter group-hover:scale-110 transition-transform">{AllStudents}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-50 text-center group hover:shadow-xl hover:shadow-rose-500/5 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absent Today</p>
                    <p className="text-4xl font-black text-rose-500 tracking-tighter group-hover:scale-110 transition-transform">{abseties.length}</p>
                </div>
            </div>

            {/* Absentees Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        Latest Absentees
                    </h3>
                    <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                        {abseties.length} Students
                    </span>
                </div>

                {abseties.length > 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Class</th>
                                        <th className="hidden sm:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Ad No</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                                        <th className="hidden sm:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {abseties.map((std, index) => (
                                        <tr key={index} className="hover:bg-sky-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl text-xs font-black">
                                                    {std.class || std.className || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-sm font-mono text-slate-400">
                                                {std.ad || std.ADNO || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                                                        {std.nameOfStd || 'Unknown Student'}
                                                    </span>
                                                    <span className="text-[10px] sm:hidden font-mono text-slate-400 mt-0.5">
                                                        AD: {std.ad || std.ADNO} • {std.attentenceDate ? new Date(std.attentenceDate).toLocaleDateString() : 'Today'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {std.attentenceDate ? new Date(std.attentenceDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : 'Today'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-3xl p-8 text-center">
                        <span className="text-3xl mb-3 block">🎉</span>
                        <h4 className="text-emerald-800 font-bold mb-1">Perfect Attendance!</h4>
                        <p className="text-emerald-600 text-xs">All students are present today.</p>
                    </div>
                )}
            </div>

            {/* Individual Classes Section */}
            <div>
                <div className="mb-6 px-2">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Class-wise Analysis</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {classes.map((cls, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 group hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/5 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center rounded-xl text-lg font-black italic">
                                    {cls.class}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Percent</p>
                                    <p className={`text-sm font-black ${cls.percentage >= 75 ? "text-emerald-500" : "text-amber-500"}`}>
                                        {cls.percentage}%
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <span>Strength</span>
                                    <span className="text-slate-900">{cls.totalStudents}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(cls.presentStudents / cls.totalStudents) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-300 uppercase">Present</span>
                                        <span className="text-xs font-black text-emerald-500">{cls.presentStudents}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-slate-300 uppercase">Absent</span>
                                        <span className="text-xs font-black text-rose-500">{cls.absentStudents}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 text-center">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                    {cls.updatedAt ? new Date(cls.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ClassWIse
