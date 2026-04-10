"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, RefreshCw, User, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import Header from '../Header/Header';

const Recovery = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teacher, setTeacher] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => {
        const storedTeacher = localStorage.getItem("teacher");
        if (storedTeacher) {
            setTeacher(JSON.parse(storedTeacher));
        }
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_PORT}/leave`);
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRecovered = async () => {
        if (!confirmId) return;
        const id = confirmId;
        setUpdatingId(id);
        setIsConfirmOpen(false);
        try {
            await axios.patch(`${API_PORT}/leave/${id}`, { recovery: true });
            setLeaves(prev => prev.map(l => l._id === id ? { ...l, recovery: true } : l));
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingId(null);
            setConfirmId(null);
        }
    };

    const teacherLeaves = useMemo(() => {
        if (!teacher) return [];
        return leaves.filter(l => {
            const studentClass = l.studentId?.CLASS || l.classNum;
            const isReturned = l.status === 'returned' || (l.status && l.status.toLowerCase() === 'returned');
            return String(studentClass) === String(teacher.classNum) && isReturned;
        });
    }, [leaves, teacher]);

    const filteredLeaves = useMemo(() => {
        return teacherLeaves.filter(l => {
            const name = l.studentId?.['SHORT NAME'] || l.studentId?.['FULL NAME'] || l.name || "";
            const ad = String(l.studentId?.ADNO || l.ad || "");
            return name.toLowerCase().includes(searchValue.toLowerCase()) || ad.includes(searchValue);
        });
    }, [teacherLeaves, searchValue]);

    const getActiveLeaveDays = (fromDateStr, fromTimeStr, returnedAt) => {
        const start = new Date(`${fromDateStr}T${fromTimeStr}`);
        const end = new Date(returnedAt);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

        let count = 0;
        let current = new Date(start);
        current.setHours(0, 0, 0, 0);
        
        const endDay = new Date(end);
        endDay.setHours(0, 0, 0, 0);

        while (current <= endDay) {
            if (current.getDay() !== 5) { // Skip Fridays
                const dayStart = new Date(current);
                dayStart.setHours(7, 0, 0, 0);
                const dayEnd = new Date(current);
                dayEnd.setHours(16, 0, 0, 0);
                
                const overlapStart = start > dayStart ? start : dayStart;
                const overlapEnd = end < dayEnd ? end : dayEnd;
                
                if (overlapStart < overlapEnd) {
                    count++;
                }
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    };

    const calculateRecoveryStatus = (leave) => {
        if (leave.recovery) return { status: 'Recovered', color: 'text-green-600 bg-green-50', icon: ShieldCheck };
        
        const leaveDays = getActiveLeaveDays(leave.fromDate, leave.fromTime, leave.returnedAt);
        
        // If no class days were missed, no recovery is needed (or it's effectively 0 days)
        // User said "if student leave from thu eve to fri eve then it not consider in recovery"
        if (leaveDays === 0) return { status: 'Recovered', color: 'text-green-600 bg-green-50', icon: ShieldCheck };

        const graceDays = leaveDays * 2;
        const returned = new Date(leave.returnedAt);
        const deadline = new Date(returned.getTime() + (graceDays * 24 * 60 * 60 * 1000));
        
        const now = new Date();
        if (now > deadline) {
            return { status: 'Overdue', color: 'text-red-600 bg-red-50', icon: ShieldAlert, deadline };
        }
        return { status: 'Ongoing', color: 'text-amber-600 bg-amber-50', icon: Clock, deadline };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20">
                <Header />
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Header Skeleton */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-pulse">
                        <div className="space-y-3">
                            <div className="h-8 bg-slate-100 rounded-xl w-48"></div>
                            <div className="h-4 bg-slate-100 rounded-lg w-64"></div>
                        </div>
                        <div className="h-12 bg-slate-50 rounded-2xl w-full sm:w-64"></div>
                    </div>

                    {/* Cards Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6 animate-pulse">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-100 rounded-lg w-32"></div>
                                            <div className="h-3 bg-slate-50 rounded-md w-20"></div>
                                        </div>
                                    </div>
                                    <div className="h-7 bg-slate-100 rounded-xl w-20"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl">
                                    <div className="space-y-2">
                                        <div className="h-2 bg-slate-100 rounded w-12"></div>
                                        <div className="h-3 bg-slate-200 rounded w-20"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 bg-slate-100 rounded w-12"></div>
                                        <div className="h-3 bg-slate-200 rounded w-20"></div>
                                    </div>
                                </div>
                                <div className="h-14 bg-slate-100 rounded-2xl w-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <Header />
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Class Recovery</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage recovery status for Class {teacher?.classNum}</p>
                    </div>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search student..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeaves.map(leave => {
                        const statusInfo = calculateRecoveryStatus(leave);
                        const StatusIcon = statusInfo.icon;
                        return (
                            <div key={leave._id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-sm shadow-inner">
                                            {leave.studentId?.ADNO || leave.ad}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 leading-tight">
                                                {leave.studentId?.['SHORT NAME'] || leave.studentId?.['FULL NAME'] || leave.name}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{leave.reason}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusInfo.color} shadow-sm`}>
                                        <StatusIcon size={12} />
                                        {statusInfo.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Returned At</p>
                                        <p className="text-xs font-black text-slate-700">{new Date(leave.returnedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Deadline</p>
                                        <p className={`text-xs font-black ${statusInfo.status === 'Overdue' ? 'text-red-500' : 'text-slate-700'}`}>
                                            {statusInfo.deadline ? statusInfo.deadline.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'Completed'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    {!leave.recovery && statusInfo.status !== 'Recovered' && (
                                        <button 
                                            onClick={() => {
                                                setConfirmId(leave._id);
                                                setIsConfirmOpen(true);
                                            }}
                                            disabled={updatingId === leave._id}
                                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
                                        >
                                            {updatingId === leave._id ? 'Updating...' : 'Mark Recovered'}
                                        </button>
                                    )}
                                    {(leave.recovery || statusInfo.status === 'Recovered') && (
                                        <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center">
                                            Recovery Record Clear
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredLeaves.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <RefreshCw className="text-slate-200 animate-spin-slow" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Clean Slate!</h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto">No returned leaves found for your class that require recovery tracking.</p>
                    </div>
                )}
            </div>
            {/* Confirmation Modal */}
            {isConfirmOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <ShieldCheck size={40} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800">Complete Recovery?</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                Are you sure you want to mark this student's leave recovery as completed? This action will allow them to apply for new leaves.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    setIsConfirmOpen(false);
                                    setConfirmId(null);
                                }}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleMarkRecovered}
                                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Recovery;
