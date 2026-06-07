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
    const [offDays, setOffDays] = useState([]);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'recovered'

    const getActiveLeaveDays = (fromDateStr, fromTimeStr, returnedAt, studentClass) => {
        const start = new Date(`${fromDateStr}T${fromTimeStr}`);
        const end = new Date(returnedAt);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

        let count = 0;
        let current = new Date(start);
        current.setHours(0, 0, 0, 0);
        
        const endDay = new Date(end);
        endDay.setHours(0, 0, 0, 0);

        while (current <= endDay) {
            const dateStr = current.toISOString().split('T')[0];
            const isOffDay = offDays.some(d => {
                const inRange = d.toDate 
                    ? (dateStr >= d.fromDate && dateStr <= d.toDate)
                    : (dateStr === d.fromDate);
                
                if (!inRange) return false;
                const isRelevant = d.type === 'global' || d.classes.includes(String(studentClass));
                if (!isRelevant) return false;

                const schoolStart = new Date(`${dateStr}T07:30:00`);
                const schoolEnd = new Date(`${dateStr}T16:00:00`);
                const offStart = new Date(`${d.fromDate}T${d.fromTime || '00:00'}:00`);
                const offEnd = new Date(`${d.toDate || d.fromDate}T${d.toTime || '23:59'}:00`);

                return offStart <= schoolStart && offEnd >= schoolEnd;
            });

            if (current.getDay() !== 5 && !isOffDay) { // Skip Fridays and Off Days
                const dayStart = new Date(current);
                dayStart.setHours(7, 30, 0, 0); // School starts at 7:30 AM
                const dayEnd = new Date(current);
                dayEnd.setHours(16, 0, 0, 0);  // School ends at 4:00 PM
                
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

    const calculateDeadline = (startDate, workingDays, studentClass) => {
        let current = new Date(startDate);
        let addedDays = 0;
        
        while (addedDays < workingDays) {
            current.setDate(current.getDate() + 1);
            const dateStr = current.toISOString().split('T')[0];
            const isOffDay = offDays.some(d => {
                const inRange = d.toDate 
                    ? (dateStr >= d.fromDate && dateStr <= d.toDate)
                    : (dateStr === d.fromDate);
                
                if (!inRange) return false;
                const isRelevant = d.type === 'global' || d.classes.includes(String(studentClass));
                if (!isRelevant) return false;

                const schoolStart = new Date(`${dateStr}T07:30:00`);
                const schoolEnd = new Date(`${dateStr}T16:00:00`);
                const offStart = new Date(`${d.fromDate}T${d.fromTime || '00:00'}:00`);
                const offEnd = new Date(`${d.toDate || d.fromDate}T${d.toTime || '23:59'}:00`);

                return offStart <= schoolStart && offEnd >= schoolEnd;
            });
            
            if (current.getDay() !== 5 && !isOffDay) {
                addedDays++;
            }
        }
        return current;
    };

    const getDurationString = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        if (diffMs <= 0) return "0m";

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
        
        return parts.join(' ') || "0m";
    };

    const formatTimeToAMPM = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        const m = minutes.toString().padStart(2, '0');
        return `${h}:${m} ${ampm}`;
    };

    const calculateRecoveryStatus = (leave) => {
        if (leave.recovery) return { status: 'Recovered', color: 'text-green-600 bg-green-50', icon: ShieldCheck };
        
        const studentClass = leave.studentId?.CLASS || leave.classNum;
        if (leave.recoveryNeeded === false) return { status: 'No Recovery Needed', color: 'text-sky-600 bg-sky-50', icon: CheckCircle };
        
        const leaveDays = getActiveLeaveDays(leave.fromDate, leave.fromTime, leave.returnedAt, studentClass);
        
        if (leaveDays === 0) return { status: 'No Recovery Needed', color: 'text-sky-600 bg-sky-50', icon: CheckCircle };

        const graceDays = leaveDays * 2;
        const deadline = calculateDeadline(new Date(leave.returnedAt), graceDays, studentClass);
        
        const now = new Date();
        if (now > deadline) {
            return { status: 'Overdue', color: 'text-red-600 bg-red-50', icon: ShieldAlert, deadline };
        }
        return { status: 'Ongoing', color: 'text-amber-600 bg-amber-50', icon: Clock, deadline };
    };

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
            const [leavesRes, offDaysRes] = await Promise.all([
                axios.get(`${API_PORT}/leave`),
                axios.get(`${API_PORT}/off-days`)
            ]);
            setLeaves(leavesRes.data);
            setOffDays(offDaysRes.data);
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
            const studentId = l.studentId?._id || l.studentId;
            const studentClass = l.studentId?.CLASS || l.classNum;
            const isReturned = l.status === 'returned' || (l.status && l.status.toLowerCase() === 'returned');
            
            // Filter by class and return status
            if (String(studentClass) !== String(teacher.classNum) || !isReturned) return false;

            // Filter by recoveryNeeded if available, otherwise calculate leaveDays
            if (l.recoveryNeeded === false) return false;
            
            const leaveDays = getActiveLeaveDays(l.fromDate, l.fromTime, l.returnedAt, studentClass);
            if (leaveDays === 0) return false; // Hide 0-day leaves entirely (No Recovery Needed)

            // Filter by active tab
            if (activeTab === 'pending') return !l.recovery;
            if (activeTab === 'recovered') return l.recovery;
            return true;
        });
    }, [leaves, teacher, activeTab, offDays]);

    const filteredLeaves = useMemo(() => {
        return teacherLeaves.filter(l => {
            const name = l.studentId?.['SHORT NAME'] || l.studentId?.['FULL NAME'] || l.name || "";
            const ad = String(l.studentId?.ADNO || l.ad || "");
            return name.toLowerCase().includes(searchValue.toLowerCase()) || ad.includes(searchValue);
        });
    }, [teacherLeaves, searchValue]);



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

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Pending
                        </button>
                        <button 
                            onClick={() => setActiveTab('recovered')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recovered' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Recovered
                        </button>
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
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                {leave.reason}
                                                {leave.disease ? ` - ${leave.disease}` : ''}
                                                {leave.program ? ` - ${leave.program}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${leave.recovery ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : statusInfo.color} shadow-sm`}>
                                        <StatusIcon size={12} />
                                        {leave.recovery ? 'Recovered' : statusInfo.status}
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="grid grid-cols-2 gap-4 border-b border-slate-200/50 pb-3">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <Calendar size={10} /> Leave From
                                            </p>
                                            <p className="text-[11px] font-black text-slate-700">
                                                {new Date(leave.fromDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                <span className="text-slate-400 ml-1.5 font-bold">{formatTimeToAMPM(leave.fromTime)}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <Clock size={10} /> Returned At
                                            </p>
                                            <p className="text-[11px] font-black text-slate-700">
                                                {new Date(leave.returnedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                <span className="text-slate-400 ml-1.5 font-bold">
                                                    {new Date(leave.returnedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: true})}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Duration</p>
                                            <p className="text-[11px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg inline-block">
                                                {getDurationString(`${leave.fromDate}T${leave.fromTime}`, leave.returnedAt)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Deadline</p>
                                            <p className={`text-[11px] font-black ${statusInfo.status === 'Overdue' && !leave.recovery ? 'text-red-500' : 'text-slate-700'}`}>
                                                {leave.recovery ? 'Completed' : (statusInfo.deadline ? statusInfo.deadline.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : (statusInfo.status === 'No Recovery Needed' ? 'None' : 'Completed'))}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    {!leave.recovery && (
                                        <button 
                                            onClick={() => {
                                                setConfirmId(leave._id);
                                                setIsConfirmOpen(true);
                                            }}
                                            disabled={updatingId === leave._id}
                                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
                                        >
                                            {updatingId === leave._id ? 'Updating...' : (statusInfo.status === 'No Recovery Needed' ? 'Clear Record' : 'Mark Recovered')}
                                        </button>
                                    )}
                                    {leave.recovery && (
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
