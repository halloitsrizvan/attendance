"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Ticket, Loader2, Clock, Plus, Search, Calendar } from 'lucide-react';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';
import MetricCard from '@/components/StudentPortal/MetricCard';

export default function CEPPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [cepData, setCepData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('All');

    // CEP Application Form States
    const [allStudents, setAllStudents] = useState([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [cepDate, setCepDate] = useState(new Date().toISOString().split('T')[0]);
    const [cepMode, setCepMode] = useState('period'); // 'period' | 'dars' | 'custom'
    const [fromPeriod, setFromPeriod] = useState(1);
    const [toPeriod, setToPeriod] = useState(1);
    const [customFromTime, setCustomFromTime] = useState('');
    const [customToTime, setCustomToTime] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const formatTimeTo12h = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [hourStr, minuteStr] = timeStr.split(':');
            let hour = parseInt(hourStr, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12;
            hour = hour ? hour : 12; // 0 should be 12
            return `${String(hour).padStart(2, '0')}:${minuteStr} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    const getCEPStatus = (item) => {
        if (item.ApproveCEP === false) {
            return 'Pending';
        }
        try {
            const passDateStr = item.date;
            if (!passDateStr) return 'Expired';
            
            const now = new Date();
            const fromTimeParts = (item.fromTime || '00:00').split(':');
            const toTimeParts = (item.toTime || '23:59').split(':');
            
            const start = new Date(passDateStr);
            start.setHours(parseInt(fromTimeParts[0], 10), parseInt(fromTimeParts[1], 10), 0, 0);
            
            const end = new Date(passDateStr);
            end.setHours(parseInt(toTimeParts[0], 10), parseInt(toTimeParts[1], 10), 0, 0);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return 'Expired';
            }
            
            if (now > end) {
                return 'Expired';
            } else if (now >= start && now <= end) {
                return 'Active';
            } else {
                return 'Approved';
            }
        } catch (e) {
            return 'Expired';
        }
    };

    const getCEPStatusStyles = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-amber-100 text-amber-600 ring-1 ring-amber-500/20';
            case 'Active':
                return 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-500/20 animate-pulse';
            case 'Approved':
                return 'bg-sky-100 text-sky-600';
            case 'Expired':
            default:
                return 'bg-slate-100 text-slate-400';
        }
    };

    const getPeriodTime = (period, customTime, isFrom = true) => {
        const timeMap = {
            1: isFrom ? "07:30" : "08:10",
            2: isFrom ? "08:10" : "08:50",
            3: isFrom ? "08:50" : "10:00",
            4: isFrom ? "10:00" : "10:40",
            5: isFrom ? "10:40" : "11:20",
            6: isFrom ? "11:30" : "12:10",
            7: isFrom ? "12:10" : "12:50",
            8: isFrom ? "14:00" : "14:40",
            9: isFrom ? "14:40" : "15:20",
            10: isFrom ? "15:20" : "16:10"
        };

        return timeMap[period] || "07:30";
    };
    
    useEffect(() => {
        fetchCEPData();
    }, []);

    // Student Leader Check
    const canApplyForCEP = useMemo(() => {
        if (!student || !student.role) return false;
        const roles = Array.isArray(student.role) ? student.role : [student.role];
        return roles.some(r => r && r.toLowerCase() !== 'student');
    }, [student]);

    // Fetch dependency lists for student leader actions
    useEffect(() => {
        if (canApplyForCEP) {
            axios.get(`${API_PORT}/students?includeInactive=false`)
                .then(res => setAllStudents(res.data || []))
                .catch(err => console.error("Error fetching all students:", err));
        }
    }, [canApplyForCEP]);

    const fetchCEPData = async () => {
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

            if (profileData.ADNO) {
                const res = await axios.get(`${API_PORT}/class-excused-pass?ad=${profileData.ADNO}`);
                setCepData(res.data || []);
            }
        } catch (err) {
            console.error("Error fetching CEP data:", err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const availableMonths = useMemo(() => {
        const months = new Set();
        cepData.forEach(item => {
            const dateVal = item.date || item.createdAt;
            if (dateVal) {
                const date = new Date(dateVal);
                if (!isNaN(date.getTime())) {
                    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
                }
            }
        });
        return Array.from(months).sort().reverse();
    }, [cepData]);

    const formatMonth = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const filteredCEPData = useMemo(() => {
        return cepData.filter(item => {
            if (selectedMonth !== 'All') {
                const dateVal = item.date || item.createdAt;
                const date = new Date(dateVal);
                const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (itemMonth !== selectedMonth) return false;
            }
            return true;
        });
    }, [cepData, selectedMonth]);

    const handleSelectStudent = (std) => {
        setSelectedStudents([...selectedStudents, std]);
        setSearchQuery('');
        setSuggestions([]);
    };

    const handleCEPRequestSubmit = async (e) => {
        e.preventDefault();

        if (selectedStudents.length === 0) {
            alert("Please search and select at least one student.");
            return;
        }

        setSubmitting(true);

        const finalFromTime = cepMode === 'dars' ? '19:00' : (cepMode === 'custom' ? customFromTime : getPeriodTime(fromPeriod, '', true));
        const finalToTime = cepMode === 'dars' ? '20:30' : (cepMode === 'custom' ? customToTime : getPeriodTime(toPeriod, '', false));
        const finalReason = reason.trim() || 'Class Excused Pass';

        const groupId = 'CEP-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6).toUpperCase();

        const submitPromises = selectedStudents.map(std => {
            const payload = {
                studentId: std._id || std.id,
                fromTime: finalFromTime,
                toTime: finalToTime,
                reason: finalReason,
                date: cepDate,
                ApproveCEP: false,
                groupId: groupId
            };
            return axios.post(`${API_PORT}/class-excused-pass`, payload);
        });

        try {
            await Promise.all(submitPromises);
            alert(`CEP requested successfully for ${selectedStudents.length} student(s).`);

            // Reset request form
            setSelectedStudents([]);
            setSearchQuery('');
            setSuggestions([]);
            setFromPeriod(1);
            setToPeriod(1);
            setCustomFromTime('');
            setCustomToTime('');
            setReason('');
            setIsRequestModalOpen(false);

            // Refresh student's own CEP logs
            fetchCEPData();
        } catch (err) {
            console.error("Error submitting CEP requests:", err);
            alert(err.response?.data?.error || "Failed to submit CEP requests. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    const totalCEP = cepData.length;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Top Section: Analytics & Request Button */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">My Analytics</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Overview of Class Excused Passes</p>
                    </div>
                    {canApplyForCEP && (
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={16} /> Request CEP
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MetricCard 
                        title="Total CEP"
                        value={totalCEP}
                        color="blue"
                        icon={Ticket}
                    />
                </div>
            </div>

            {/* Bottom Section: CEP Log (Full Width) */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic">CEP Log</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">History of issued passes</p>
                    </div>
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-50 text-xs font-black text-slate-500 outline-none cursor-pointer border border-slate-100 rounded-xl px-4 py-2"
                    >
                        <option value="All">All Months</option>
                        {availableMonths.map(m => (
                            <option key={m} value={m}>{formatMonth(m)}</option>
                        ))}
                    </select>
                </div>
                
                <div className="bg-slate-50 rounded-[2rem] p-6 min-h-[16rem] max-h-[30rem] overflow-y-auto custom-scrollbar space-y-4 border border-slate-100">
                    {filteredCEPData.length > 0 ? filteredCEPData.map(item => {
                        const status = getCEPStatus(item);
                        const statusClass = getCEPStatusStyles(status);

                        return (
                            <div key={item._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 gap-4 sm:gap-2">
                                <div className="flex items-start sm:items-center gap-4">
                                    <span className={`w-24 text-center py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${statusClass}`}>
                                        {status}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-slate-800">
                                                {new Date(item.date || item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                {item.reason || 'Class Excused Pass'}
                                            </span>
                                        </div>
                                        
                                        <div className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
                                            <span className="uppercase tracking-widest text-[8px] font-black text-slate-400">Duration:</span>
                                            <span className="text-slate-600 font-extrabold">
                                                {item.fromTime && item.toTime ? `${formatTimeTo12h(item.fromTime)} - ${formatTimeTo12h(item.toTime)}` : 'Full Day'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 shrink-0">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Issued By</div>
                                    <div className="text-[10px] font-black text-slate-700 uppercase">USTHAD {item.teacherId?.name || item.teacher || 'Teacher'}</div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="h-48 flex items-center justify-center text-sm font-bold text-slate-400">
                            No CEP records found
                        </div>
                    )}
                </div>
            </div>

            {/* Request CEP Modal (For Student Leaders) */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsRequestModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-800">Apply for CEP</h3>
                            <button onClick={() => setIsRequestModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all">✕</button>
                        </div>
                        
                        <form onSubmit={handleCEPRequestSubmit} className="space-y-5">
                            {/* Students Selection */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    Select Students
                                </label>
                                <div className="space-y-3">
                                    {selectedStudents.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-32 overflow-y-auto custom-scrollbar">
                                            {selectedStudents.map(std => (
                                                <div key={std.ADNO} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-xs font-bold">
                                                    <span>{std["SHORT NAME"] || std["FULL NAME"]} (AD: {std.ADNO})</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setSelectedStudents(selectedStudents.filter(s => s.ADNO !== std.ADNO))}
                                                        className="text-blue-500 hover:text-blue-800 font-bold"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setSearchQuery(value);
                                                if (value.trim() === "") {
                                                    setSuggestions([]);
                                                    return;
                                                }
                                                const cleanVal = value.trim().toLowerCase();
                                                const isNumber = /^\d+$/.test(cleanVal);
                                                const filtered = allStudents.filter(std => {
                                                    if (selectedStudents.some(sel => sel.ADNO === std.ADNO)) return false;
                                                    return isNumber 
                                                        ? String(std.ADNO).startsWith(cleanVal) 
                                                        : (std["SHORT NAME"] || "").toLowerCase().includes(cleanVal) || 
                                                          (std["FULL NAME"] || "").toLowerCase().includes(cleanVal);
                                                });
                                                setSuggestions(filtered.slice(0, 5));
                                            }}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-blue-400 focus:bg-white outline-none transition-all"
                                            placeholder="Search student to add by name or ADNO..."
                                        />
                                        {suggestions.length > 0 && (
                                            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50">
                                                {suggestions.map((s) => (
                                                    <div
                                                        key={s.ADNO}
                                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                                                        onClick={() => handleSelectStudent(s)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-800">{s["SHORT NAME"] || s["FULL NAME"]}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">AD: {s.ADNO} • Class {s.CLASS}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-blue-500">+ Add</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                {/* Date */}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Date
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={cepDate}
                                        onChange={(e) => setCepDate(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-blue-400 focus:bg-white outline-none transition-all"
                                    />
                                </div>

                                {/* Reason Input (Textfield) */}
                                <div className="space-y-2 sm:col-span-3">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Reason
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-blue-400 focus:bg-white outline-none transition-all"
                                        placeholder="Enter reason..."
                                    />
                                </div>
                            </div>

                            {/* Time Section */}
                            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Time</span>
                                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                                        {['period', 'dars', 'custom'].map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setCepMode(mode)}
                                                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${cepMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {cepMode === 'period' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">From Period</span>
                                            <select
                                                value={fromPeriod}
                                                onChange={(e) => setFromPeriod(parseInt(e.target.value))}
                                                className="w-full bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 cursor-pointer animate-in fade-in duration-200"
                                            >
                                                {Array.from({ length: 10 }, (_, i) => {
                                                    const periodVal = i + 1;
                                                    return (
                                                        <option key={periodVal} value={periodVal}>{`Period ${periodVal}`}</option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">To Period</span>
                                            <select
                                                value={toPeriod}
                                                onChange={(e) => setToPeriod(parseInt(e.target.value))}
                                                className="w-full bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 cursor-pointer animate-in fade-in duration-200"
                                            >
                                                {Array.from({ length: 10 }, (_, i) => {
                                                    const periodVal = i + 1;
                                                    return (
                                                        <option key={periodVal} value={periodVal}>{`Period ${periodVal}`}</option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {cepMode === 'dars' && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-dashed border-blue-100 text-center space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Clock size={14} /> 7:00 PM - 8:30 PM
                                        </div>
                                        <p className="text-[8px] font-bold text-blue-400 uppercase">Time set for Dars session</p>
                                    </div>
                                )}

                                {cepMode === 'custom' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Start Time</span>
                                            <input
                                                required
                                                type="time"
                                                value={customFromTime}
                                                onChange={(e) => setCustomFromTime(e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">End Time</span>
                                            <input
                                                required
                                                type="time"
                                                value={customToTime}
                                                onChange={(e) => setCustomToTime(e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit and Cancel Buttons */}
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
