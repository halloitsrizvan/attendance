"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { CalendarCheck, CalendarDays, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

import MetricCard from '@/components/StudentPortal/MetricCard';

export default function AttendancePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    
    // Complaint Form State
    const [complaintLoading, setComplaintLoading] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [actualStatus, setActualStatus] = useState('Present');
    const [message, setMessage] = useState('');
    const [complaints, setComplaints] = useState([]);

    const [absentMonth, setAbsentMonth] = useState('All');
    const [logMonth, setLogMonth] = useState('All');

    // Breakdown Popup State
    const [breakdownType, setBreakdownType] = useState(null); // 'presents' or 'absents'

    const [highlightForm, setHighlightForm] = useState(false);
    const formRef = useRef(null);

    const handleComplaintClick = (id) => {
        setSelectedId(id);
        
        // Scroll to form smoothly
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Trigger brief visual highlight hook
        setHighlightForm(true);
        setTimeout(() => {
            setHighlightForm(false);
        }, 2000);
    };

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const fetchAttendanceData = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            const profileRes = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileData = profileRes.data;
            setStudent(profileData);

            const sid = profileData._id || profileData.id;

            if (profileData.ADNO) {
                const [attRes, complaintsRes] = await Promise.all([
                    axios.get(`${API_PORT}/set-attendance?ad=${profileData.ADNO}`),
                    axios.get(`${API_PORT}/complaints?studentId=${sid}`)
                ]);
                setAttendanceData(attRes.data || []);
                setComplaints(complaintsRes.data || []);
            }
        } catch (err) {
            console.error("Error fetching attendance data:", err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        let presents = 0;
        let absents = 0;
        const presentsBreakdown = {};
        const absentsBreakdown = {};

        attendanceData.forEach(log => {
            const time = log.attendanceTime || 'General';
            if (log.status === 'Present') {
                presents++;
                presentsBreakdown[time] = (presentsBreakdown[time] || 0) + 1;
            } else {
                absents++;
                absentsBreakdown[time] = (absentsBreakdown[time] || 0) + 1;
            }
        });
        return { presents, absents, presentsBreakdown, absentsBreakdown };
    }, [attendanceData]);

    const handleComplaintSubmit = async (e) => {
        e.preventDefault();
        setComplaintLoading(true);
        try {
            const currentAttendance = attendanceData.find(r => r._id === selectedId);
            if (!currentAttendance) {
                alert("Please select a record to dispute.");
                return;
            }
            await axios.post(`${API_PORT}/complaints`, {
                studentId: student._id || student.id,
                attendanceId: currentAttendance._id,
                teacherId: currentAttendance.teacherId?._id || currentAttendance.teacherId,
                actualStatus,
                message
            });
            alert("Complaint submitted successfully.");
            setSelectedId('');
            setMessage('');
            setActualStatus('Present');

            // Refetch complaints list
            const sid = student._id || student.id;
            if (sid) {
                const compRes = await axios.get(`${API_PORT}/complaints?studentId=${sid}`);
                setComplaints(compRes.data || []);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit complaint.");
        } finally {
            setComplaintLoading(false);
        }
    };

    const availableMonths = useMemo(() => {
        const months = new Set();
        attendanceData.forEach(item => {
            const dateVal = item.createdAt || item.attendanceDate;
            if (dateVal) {
                const date = new Date(dateVal);
                months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
            }
        });
        return Array.from(months).sort().reverse();
    }, [attendanceData]);

    const formatMonth = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const absentsData = useMemo(() => {
        return attendanceData.filter(log => {
            if (log.status === 'Present') return false;
            if (absentMonth !== 'All') {
                const date = new Date(log.createdAt || log.attendanceDate);
                const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (itemMonth !== absentMonth) return false;
            }
            return true;
        });
    }, [attendanceData, absentMonth]);

    const filteredLogData = useMemo(() => {
        return attendanceData.filter(log => {
            if (logMonth !== 'All') {
                const date = new Date(log.createdAt || log.attendanceDate);
                const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (itemMonth !== logMonth) return false;
            }
            return true;
        });
    }, [attendanceData, logMonth]);

    const isWithin24Hours = (dateString) => {
        if (!dateString) return false;
        const diffMs = new Date() - new Date(dateString);
        return diffMs <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    };

    const eligibleAbsentsData = useMemo(() => {
        return attendanceData.filter(log => log.status !== 'Present' && isWithin24Hours(log.createdAt || log.attendanceDate));
    }, [attendanceData]);

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                {/* Analytics */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-black text-slate-800 mb-6">My Analytics</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard 
                            title="Total Presents"
                            value={stats.presents}
                            color="blue"
                            icon={CalendarCheck}
                            onClick={() => setBreakdownType('presents')}
                        />
                        <MetricCard 
                            title="Total Absents"
                            value={stats.absents}
                            color="slate"
                            icon={CalendarDays}
                            onClick={() => setBreakdownType('absents')}
                        />
                    </div>
                </div>

                {/* All Absents */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-slate-800">All Absents</h2>
                        <select 
                            value={absentMonth}
                            onChange={(e) => setAbsentMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-500 outline-none cursor-pointer border-none"
                        >
                            <option value="All">All Months</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonth(m)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-4 h-64 overflow-y-auto custom-scrollbar space-y-3 border border-slate-100">
                        {absentsData.length > 0 ? absentsData.map(item => (
                            <div key={item._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm gap-3 sm:gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black text-white bg-blue-500 text-center">
                                            {item.attendanceTime || 'General'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black text-center border ${item.onLeave ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                            OnLeave: {item.onLeave ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500">{new Date(item.createdAt || item.attendanceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-[10px] font-black text-slate-400">{new Date(item.createdAt || item.attendanceDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                    </div>

                                </div>
                                <div className="text-left sm:text-right">
                                    <div className="text-[10px] font-bold text-slate-600 sm:max-w-[200px]">
                                        {item.teacherId ? "USTHAD  " : ""} {item.teacherId?.name || 'Teacher'}
                                    </div>
                                    {(() => {
                                        const existingComplaint = complaints.find(c => (c.attendanceId?._id || c.attendanceId) === item._id);
                                        if (existingComplaint) {
                                            const statusColors = {
                                                Pending: 'bg-amber-50 text-amber-600 border-amber-100',
                                                Resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                                Rejected: 'bg-rose-50 text-rose-600 border-rose-100'
                                            };
                                            const currentStatusColor = statusColors[existingComplaint.status] || 'bg-slate-50 text-slate-600 border-slate-100';
                                            return (
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase mt-2 inline-block border ${currentStatusColor}`}>
                                                    Complained ({existingComplaint.status || 'Pending'})
                                                </span>
                                            );
                                        }
                                        return isWithin24Hours(item.createdAt || item.attendanceDate) && (
                                            <button 
                                                onClick={() => handleComplaintClick(item._id)}
                                                className="text-[10px] font-black text-rose-600 bg-rose-100 hover:bg-rose-200 hover:text-rose-700 px-3 py-1 rounded-lg uppercase mt-2 inline-block transition-colors cursor-pointer shadow-sm active:scale-95"
                                            >
                                                Complaint
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400">
                                No absents recorded
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Log */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-slate-800">Attendance log</h2>
                        <select 
                            value={logMonth}
                            onChange={(e) => setLogMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-500 outline-none cursor-pointer border-none"
                        >
                            <option value="All">All Months</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonth(m)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-4 space-y-3 border border-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {filteredLogData.map(item => (
                            <div key={item._id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-slate-100/50 rounded-2xl border border-slate-200/50 gap-4">
                                <div className="flex items-center gap-4">
                                    <span className={`w-20 text-center px-4 py-2 rounded-xl text-[12px] font-black text-white shrink-0 ${item.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                        {item.status}
                                    </span>
                                    <span className="px-4 py-2 rounded-xl border border-slate-800 text-[12px] font-black text-slate-800 shrink-0">
                                        {item.attendanceTime || 'General'}
                                    </span>
                                    {item.status === 'Absent' && <span className={`px-4 py-2 rounded-xl border text-[10px] font-black shrink-0 ${item.onLeave ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        OnLeave: {item.onLeave ? 'Yes' : 'No'}
                                    </span>}
                                </div>
                                <div className="text-left md:text-center text-sm">
                                    <div className="font-black text-slate-800">{new Date(item.createdAt || item.attendanceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="font-bold text-slate-500">{new Date(item.createdAt || item.attendanceDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                                <div className="text-left md:text-right text-xs font-bold text-slate-600 md:max-w-[150px]">
                                    USTHAD {item.teacherId?.name || 'Teacher'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Issue Form */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-black text-slate-800 mb-2">Report Any Issue?</h2>
                    <div className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl uppercase mb-6 inline-flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        NB: You can only complain about absents within the last 24 hours
                    </div>
                    <div 
                        ref={formRef}
                        className={`bg-white rounded-[2rem] p-6 border transition-all duration-500 space-y-4 ${
                            highlightForm 
                                ? 'border-rose-500 ring-4 ring-rose-500/20 scale-[1.02] shadow-xl shadow-rose-500/10' 
                                : 'border-slate-800 shadow-none'
                        }`}
                    >
                        <select 
                            value={selectedId}
                            onChange={e => setSelectedId(e.target.value)}
                            className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Attendance...</option>
                            {eligibleAbsentsData.map(item => (
                                <option key={item._id} value={item._id}>
                                    {new Date(item.createdAt || item.attendanceDate).toLocaleDateString()} - {item.attendanceTime || 'General'}
                                </option>
                            ))}
                        </select>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">I Was Actually</label>
                            <div className="flex gap-2">
                                {['Present', 'Leave', 'CEP'].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => setActualStatus(s)}
                                        className={`flex-1 py-2 rounded-xl border border-slate-800 text-xs font-black uppercase transition-all
                                        ${actualStatus === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea 
                            placeholder="Description..." 
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none h-32 resize-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>

                        <button 
                            onClick={handleComplaintSubmit}
                            disabled={complaintLoading}
                            className="w-full py-4 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                            {complaintLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            Submit
                        </button>
                    </div>

                    {/* My Complaints Section */}
                    <div className="mt-8">
                        <h2 className="text-xl font-black text-slate-800 mb-4">My Complaints</h2>
                        <div className="bg-slate-50 rounded-[2rem] p-4 max-h-[250px] overflow-y-auto custom-scrollbar border border-slate-100 space-y-3">
                            {complaints.length > 0 ? complaints.map(item => {
                                const statusColors = {
                                    Pending: 'bg-amber-50 text-amber-600 border-amber-100',
                                    Resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                    Rejected: 'bg-rose-50 text-rose-600 border-rose-100'
                                };
                                const currentStatusColor = statusColors[item.status] || 'bg-slate-50 text-slate-600 border-slate-100';
                                
                                return (
                                    <div key={item._id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${currentStatusColor}`}>
                                                {item.status || 'Pending'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-slate-800 uppercase italic">
                                                Was Actually: <span className="text-blue-600">{item.actualStatus}</span>
                                            </div>
                                            {item.message && (
                                                <p className="text-[11px] font-medium text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                                    "{item.message}"
                                                </p>
                                            )}
                                            {item.adminRemark && (
                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block">Admin Remark</span>
                                                    <p className="text-[10px] font-bold text-slate-600 italic">
                                                        "{item.adminRemark}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="py-8 text-center text-xs font-bold text-slate-400">
                                    No complaints filed yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Popup */}
            {breakdownType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setBreakdownType(null)}>
                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-800 capitalize">{breakdownType} Breakdown</h3>
                            <button onClick={() => setBreakdownType(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all">✕</button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {Object.entries(breakdownType === 'presents' ? stats.presentsBreakdown : stats.absentsBreakdown).map(([time, count]) => (
                                <div key={time} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-black text-slate-700">{time}</span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${breakdownType === 'presents' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                                        {count}
                                    </span>
                                </div>
                            ))}
                            {Object.keys(breakdownType === 'presents' ? stats.presentsBreakdown : stats.absentsBreakdown).length === 0 && (
                                <div className="text-center py-6 text-sm font-bold text-slate-400">
                                    No records found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
