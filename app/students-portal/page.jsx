"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, CheckCircle, Clock, Calendar, TrendingUp, LogOut, Info, AlertTriangle, FileText, User, ChevronRight, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import StudentAuthGuard from '@/components/auth/StudentAuthGuard';
import VerifyingAccess from '@/components/auth/VerifyingAccess';
import StudentPortalSkeleton from '@/components/auth/StudentPortalSkeleton';

const formatTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString, monthOnly = false) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (monthOnly) return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return d.toLocaleDateString('en-GB');
};

/**
 * Attendance Breakdown Modal
 */
const AttendanceModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    const breakdown = useMemo(() => {
        const categories = {
            'NIGHT': { present: 0, total: 0 },
            'PERIOD': { present: 0, total: 0 },
            'NOON': { present: 0, total: 0 },
            'MORNING': { present: 0, total: 0 },
            'JAMATH': { present: 0, total: 0 },
            'OTHERS': { present: 0, total: 0 }
        };

        data.forEach(log => {
            const timeStr = (log.time || '').toUpperCase();
            let cat = 'OTHERS';
            if (timeStr.includes('NIGHT')) cat = 'NIGHT';
            else if (timeStr.includes('PERIOD')) cat = 'PERIOD';
            else if (timeStr.includes('NOON')) cat = 'NOON';
            else if (timeStr.includes('MORNING')) cat = 'MORNING';
            else if (timeStr.includes('JAMATH')) cat = 'JAMATH';

            categories[cat].total++;
            if (log.status === 'Present') categories[cat].present++;
        });

        return categories;
    }, [data]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-blue-600 text-white">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase italic italic">Attendance Health</h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Category-wise breakdown</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-4">
                    {Object.entries(breakdown).filter(([_, val]) => val.total > 0).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <LayoutGrid size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-700 text-sm uppercase tracking-tight">{key}</h4>
                                    <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(val.present / val.total) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-slate-800">{val.present}<span className="text-slate-300 mx-1">/</span>{val.total}</div>
                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Present Rate</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                   <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all">Close Analytics</button>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subText, color, icon: Icon, onClick }) => (
    <div
        className={`flex flex-col items-center justify-center p-6 rounded-[2rem] shadow-sm transition-all duration-300 hover:shadow-xl cursor-pointer border border-transparent
      ${color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' :
                color === 'red' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' :
                    color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white' :
                        'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-600 hover:text-white'}`}
        onClick={onClick}
    >
        <div className={`p-3 rounded-2xl mb-4 ${color === 'green' ? 'bg-emerald-100/50' : color === 'red' ? 'bg-rose-100/50' : color === 'amber' ? 'bg-amber-100/50' : 'bg-sky-100/50'} group-hover:bg-white/20`}>
            <Icon className="w-6 h-6" />
        </div>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">{title}</div>
        {subText && <div className="text-[9px] font-bold mt-1 opacity-60 uppercase">{subText}</div>}
    </div>
);

const StudentsPortal = () => {
    const navigate = useRouter();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const [attendanceData, setAttendanceData] = useState([]);
    const [leaveData, setLeaveData] = useState([]);
    const [minusData, setMinusData] = useState([]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            navigate.push('/students-login');
            return;
        }

        try {
            const res = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileData = res.data;
            setStudent(profileData);
            await fetchStudentAnalytics(profileData.ADNO);
        } catch (err) {
            console.error("Error fetching profile:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                navigate.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentAnalytics = async (ad) => {
        if (!ad) return;
        try {
            const [attRes, leaveRes, minusRes] = await Promise.all([
                axios.get(`${API_PORT}/set-attendance?ad=${ad}`),
                axios.get(`${API_PORT}/leave?ad=${ad}`),
                axios.get(`${API_PORT}/minus?ad=${ad}`)
            ]);
            setAttendanceData(attRes.data);
            setLeaveData(leaveRes.data);
            setMinusData(minusRes.data);
        } catch (err) {
            console.error("Error fetching analytics:", err);
        }
    };

    const filteredAttendance = useMemo(() => {
        if (!selectedMonth) return attendanceData;
        return attendanceData.filter(log => {
            if (!log.createdAt) return false;
            return log.createdAt.startsWith(selectedMonth);
        });
    }, [attendanceData, selectedMonth]);

    const stats = useMemo(() => {
        const present = attendanceData.filter(a => a.status === 'Present').length;
        const total = attendanceData.length;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
        const totalMinus = minusData.reduce((acc, curr) => acc + (parseFloat(curr.minusNum) || 0), 0);

        return {
            present,
            absent: total - present,
            total,
            rate,
            leaves: leaveData.length,
            minusPoints: totalMinus.toFixed(1)
        };
    }, [attendanceData, leaveData, minusData]);

    const handleLogout = () => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentData');
        window.dispatchEvent(new Event('storage'));
        navigate.push('/students-login');
    };

    if (loading) return (
        <StudentAuthGuard>
            <VerifyingAccess />
        </StudentAuthGuard>
    );

    if (!student) return null;

    return (
        <StudentAuthGuard>
            <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
                <AttendanceModal isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} data={attendanceData} />

                {/* Header */}
                <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsMenuOpen(true)} className="p-2 lg:hidden text-slate-500 rounded-xl"><Menu className="w-6 h-6" /></button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><TrendingUp size={20} /></div>
                                    <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block italic uppercase">PORTAL</h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex flex-col items-end mr-2">
                                    <span className="text-sm font-black text-slate-800 tracking-tight uppercase">{student["FULL NAME"] || student.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">AD: {student.ADNO || student.ad}</span>
                                </div>
                                <button onClick={handleLogout} className="w-11 h-11 bg-rose-50 border-2 border-white shadow-sm rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><LogOut size={20} /></button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto mt-24">
                    
                    {/* Header Section */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">My Analytics</h1>
                            <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-500" /> Live Data Sync Active
                            </p>
                        </div>
                        <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 px-6">
                            <div>
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Class Group</span>
                                <span className="text-sm font-black text-blue-600">{student.CLASS}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100"></div>
                            <div>
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                                <span className="text-sm font-black text-emerald-600">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
                        <MetricCard title="Attendance" value={`${stats.rate}%`} subText={`${stats.present}/${stats.total} SESSIONS`} color="blue" icon={TrendingUp} onClick={() => setShowBreakdown(true)} />
                        <MetricCard title="Leave Records" value={stats.leaves} subText="TOTAL ENTERED" color="amber" icon={FileText} onClick={() => { }} />
                        <MetricCard title="Minus Points" value={stats.minusPoints} subText="ACCUMULATED" color="red" icon={AlertTriangle} onClick={() => { }} />
                        <MetricCard title="Sessions" value={stats.total} subText="RECORDED SESSIONS" color="green" icon={CheckCircle} onClick={() => { }} />
                    </section>

                    {/* Detailed Lists Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Left Column: Recent Items */}
                        <div className="space-y-8">
                            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                                        <Clock size={20} className="text-blue-500" /> Attendance Log
                                    </h2>
                                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 px-3 rounded-2xl border border-slate-100">
                                        <Calendar size={14} className="text-slate-400" />
                                        <input 
                                            type="month" 
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="bg-transparent text-[10px] font-black uppercase text-slate-600 focus:outline-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6 h-[500px] overflow-y-auto">
                                    {filteredAttendance.length > 0 ? (
                                        <div className="space-y-3">
                                            {filteredAttendance.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all group-hover:scale-110 ${item.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                            {item.status[0]}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="text-sm font-black text-slate-800 uppercase italic leading-none">{item.attendanceTime || 'General Session'}</h4>
                                                                <span className="text-[10px] font-bold text-slate-300 mx-1">•</span>
                                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{formatTime(item.createdAt)}</span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(item.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${item.status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                            {item.status}
                                                        </div>
                                                        {item.teacher && (
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase group-hover:text-slate-600 transition-colors">By: {item.teacher}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                                                <Calendar size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest max-w-[200px] leading-relaxed">No sessions found for {formatDate(selectedMonth + "-01", true)}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Other Records */}
                        <div className="space-y-8">
                            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                                        <AlertTriangle size={20} className="text-rose-500" /> Minus report
                                    </h2>
                                    <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">TOTAL: -{stats.minusPoints}</span>
                                </div>
                                <div className="p-4 sm:p-6 h-[500px] overflow-y-auto">
                                    {minusData.length > 0 ? (
                                        <div className="space-y-4">
                                            {minusData.map((item, idx) => (
                                                <div key={idx} className="p-5 bg-rose-50/30 rounded-[2rem] border border-rose-100/50 hover:bg-rose-50 hover:border-rose-200 transition-all group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-rose-600 transition-colors">{item.reason || 'Deduction'}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(item.createdAt)}</p>
                                                                <span className="text-slate-300 text-[10px]">•</span>
                                                                <span className="text-[10px] font-black text-rose-400">{formatTime(item.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xl font-black text-rose-600">-{parseFloat(item.minusNum).toFixed(1)}</span>
                                                            {/* <div className="flex items-center gap-1.5 mt-2 bg-white/40 px-2 py-0.5 rounded-full border border-rose-100/50">
                                                                <User size={10} className="text-rose-400" />
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">BY: {item.teacher || 'ADMIN'}</span>
                                                            </div> */}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                                                <CheckCircle size={40} className="text-emerald-500" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">Perfect record! No point deductions found.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                                        <Calendar size={20} className="text-amber-500" /> Leave History
                                    </h2>
                                </div>
                                <div className="p-4 sm:p-6 h-[500px] overflow-y-auto">
                                    {leaveData.length > 0 ? (
                                        <div className="space-y-4">
                                            {leaveData.map((item, idx) => (
                                                <div key={idx} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:border-amber-100 transition-all group">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${item.status === 'returned' || item.returnedAt ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                            {item.status === 'returned' || item.returnedAt ? 'Completed' : 'Current Leave'}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{formatDate(item.createdAt)}</span>
                                                    </div>
                                                    <h4 className="text-base font-black text-slate-800 uppercase italic mb-4 leading-tight">“{item.reason}”</h4>
                                                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-200/50">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-slate-300 group-hover:text-amber-500">From</span>
                                                            <span className="text-slate-800">{formatTime(item.fromDate)}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-slate-300 group-hover:text-amber-500">Return</span>
                                                            <span className="text-slate-800">{item.returnedAt ? formatTime(item.returnedAt) : (item.toDate ? formatTime(item.toDate) : 'PENDING')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                                                <Info size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">No leave history found</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </StudentAuthGuard>
    );
};

export default StudentsPortal;
