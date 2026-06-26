"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { CalendarDays, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

import MetricCard from '@/components/StudentPortal/MetricCard';

export default function LeavePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [leaveData, setLeaveData] = useState([]);
    const [offDays, setOffDays] = useState([]);
    
    // Complaint Form State
    const [complaintLoading, setComplaintLoading] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const [highlightForm, setHighlightForm] = useState(false);
    const formRef = useRef(null);

    const [recoveryMonth, setRecoveryMonth] = useState('All');
    const [logMonth, setLogMonth] = useState('All');

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
        fetchLeaveData();
    }, []);

    const fetchLeaveData = async () => {
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
                const results = await Promise.allSettled([
                    axios.get(`${API_PORT}/leave?ad=${profileData.ADNO}`),
                    axios.get(`${API_PORT}/off-days`)
                ]);

                if (results[0].status === 'fulfilled') setLeaveData(results[0].value.data || []);
                if (results[1].status === 'fulfilled') setOffDays(results[1].value.data || []);
            }
        } catch (err) {
            console.error("Error fetching leave data:", err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

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

    const getDetailedStatus = (item) => {
        if (item.status === 'rejected') return 'Rejected';
        if (item.approved === false) return 'Approval Pending';
        const now = new Date();
        const fromDateTime = new Date(`${item.fromDate}T${item.fromTime || '00:00'}`);
        const toDateTime = item.toDate && item.toTime ? new Date(`${item.toDate}T${item.toTime}`) : null;

        if (item.status === 'returned') {
            if (toDateTime && item.returnedAt && new Date(item.returnedAt) > toDateTime) {
                return 'Late Returned';
            }
            return 'Returned';
        }

        const dbStatus = (item.status || '').toLowerCase();
        if (dbStatus === 'active' || dbStatus === 'late' || dbStatus === 'on leave') {
            if (dbStatus === 'late' || (toDateTime && now > toDateTime)) return 'Late';
            return 'On Leave';
        }

        if (now < fromDateTime) return 'Scheduled';

        return 'Pending';
    };

    const getStatusStyles = (status) => {
        const config = {
            'Returned': 'bg-emerald-500 text-white',
            'Late Returned': 'bg-orange-500 text-white',
            'On Leave': 'bg-red-500 text-white',
            'Late': 'bg-rose-600 text-white',
            'Pending': 'bg-blue-500 text-white',
            'Scheduled': 'bg-sky-400 text-white',
            'Approval Pending': 'bg-amber-500 text-white',
            'Rejected': 'bg-slate-500 text-white'
        };
        return config[status] || 'bg-slate-400 text-white';
    };

    const getRecoveryStatusLabel = (item) => {
        if (item.status === 'rejected') return 'No Recovery';
        if (item.recovery === true) return 'Recovery Completed';
        if (item.recoveryNeeded === false) return 'Recovery Not Needed';
        if (item.recovery || item.recoveryNeeded) return 'Recovery Pending';
        return 'No Recovery';
    };

    const getRecoveryStatusStyles = (label) => {
        const config = {
            'Recovery Completed': 'bg-emerald-500 text-white',
            'Recovery Not Needed': 'bg-slate-400 text-white',
            'Recovery Pending': 'bg-rose-500 text-white',
            'No Recovery': 'bg-slate-200 text-slate-500'
        };
        return config[label] || 'bg-slate-300 text-slate-600';
    };

    const stats = useMemo(() => {
        let totalLeaveCount = 0;
        let totalLeaveDays = 0;

        leaveData.forEach(leave => {
            if (leave.approved !== false && leave.status !== 'rejected') {
                totalLeaveCount++;
                // Simplified leave days calculation for dashboard display
                if (leave.fromDate && leave.returnedAt) {
                    const start = new Date(`${leave.fromDate}T${leave.fromTime || '00:00'}`);
                    const end = new Date(leave.returnedAt);
                    if (!isNaN(start) && !isNaN(end) && end > start) {
                        const diffTime = Math.abs(end - start);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        totalLeaveDays += diffDays;
                    }
                }
            }
        });
        return { totalLeaveCount, totalLeaveDays };
    }, [leaveData]);

    const availableMonths = useMemo(() => {
        const months = new Set();
        leaveData.forEach(item => {
            if (item.fromDate) {
                const date = new Date(item.fromDate);
                if (!isNaN(date.getTime())) {
                    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
                }
            }
        });
        return Array.from(months).sort().reverse();
    }, [leaveData]);

    const formatMonth = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const filteredRecoveryData = useMemo(() => {
        return leaveData.filter(l => (l.status === 'returned' || l.returnedAt) && l.recoveryNeeded !== false).filter(item => {
            if (recoveryMonth !== 'All') {
                const date = new Date(item.fromDate);
                const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (itemMonth !== recoveryMonth) return false;
            }
            return true;
        });
    }, [leaveData, recoveryMonth]);

    const filteredLogData = useMemo(() => {
        return leaveData.filter(item => {
            if (logMonth !== 'All') {
                const date = new Date(item.fromDate);
                const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (itemMonth !== logMonth) return false;
            }
            return true;
        });
    }, [leaveData, logMonth]);

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        setComplaintLoading(true);
        try {
            const currentLeave = leaveData.find(r => r._id === selectedId);
            if (!currentLeave) {
                alert("Please select a leave record to dispute.");
                return;
            }
            if (!message.trim()) {
                alert("Please provide a description of the issue.");
                return;
            }
            await axios.post(`${API_PORT}/complaints`, {
                studentId: student._id || student.id,
                teacherId: currentLeave.teacherId?._id || currentLeave.teacherId || null,
                message: title.trim() ? `[Leave Issue: ${title.trim()}] ${message.trim()}` : message.trim(),
                actualStatus: 'Leave',
                leaveId: currentLeave._id
            });
            alert("Issue submitted successfully.");
            setSelectedId('');
            setTitle('');
            setMessage('');
        } catch (err) {
            console.error(err);
            alert("Failed to submit issue.");
        } finally {
            setComplaintLoading(false);
        }
    };

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Analytics */}
                <div className="lg:col-span-1">
                    <h2 className="text-2xl font-black text-slate-800 mb-6">My Analytics</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard 
                            title="Total Leave"
                            value={stats.totalLeaveCount}
                            color="blue"
                            icon={CalendarDays}
                        />
                        <MetricCard 
                            title="Total Leave Days"
                            value={stats.totalLeaveDays}
                            color="slate"
                            icon={CalendarDays}
                        />
                    </div>
                </div>

                {/* All Recoveries */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-slate-800">All Recoveries</h2>
                        <select 
                            value={recoveryMonth}
                            onChange={(e) => setRecoveryMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-500 outline-none cursor-pointer border-none"
                        >
                            <option value="All">All Months</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonth(m)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-4 h-64 overflow-y-auto custom-scrollbar space-y-3 border border-slate-100">
                        {filteredRecoveryData.map(item => {
                            const isOverdue = false; // Logic simplified for design
                            const isCompleted = item.recovery === true;
                            const isNotNeeded = item.recoveryNeeded === false;
                            const statusLabel = isNotNeeded 
                                ? 'Recovery not needed' 
                                : (isCompleted ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending'));
                            const statusColor = isNotNeeded
                                ? 'bg-slate-400'
                                : (isCompleted ? 'bg-emerald-500' : (isOverdue ? 'bg-rose-500' : 'bg-amber-500'));

                            return (
                                <div key={item._id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <span className={`px-4 py-2 rounded-xl text-[11px] font-black text-white ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500">
                                                {/* <span className="font-black text-slate-400 mr-1">FROM:</span> */}
                                                {item.fromDate ? new Date(item.fromDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}, {formatTimeTo12h(item.fromTime)}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                                                {/* <span className="font-black text-slate-400 mr-1">RETURN:</span> */}
                                                {item.returnedAt ? (
                                                    `${new Date(item.returnedAt).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}, ${new Date(item.returnedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                ) : (
                                                    item.toDate ? (
                                                        `${new Date(item.toDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}, ${formatTimeTo12h(item.toTime)}`
                                                    ) : (
                                                        <span className="text-amber-500 font-black">PENDING</span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <span className="px-3 py-1 bg-blue-500 text-white rounded-lg text-[12px] font-semibold">{item.reason?.substring(0, 15)}</span>
                                        {!isCompleted && !isNotNeeded && (
                                            <button 
                                                onClick={() => handleComplaintClick(item._id)}
                                                className="text-[9px] font-black text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 px-2 py-0.5 rounded uppercase transition-colors cursor-pointer shadow-sm active:scale-95 border border-amber-200"
                                            >
                                                Completed?
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {filteredRecoveryData.length === 0 && (
                             <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400">
                                No recoveries found
                             </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Leave Log */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-slate-800">Leave log</h2>
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
                    <div className="bg-slate-50 rounded-[2rem] p-6 space-y-6 border border-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {filteredLogData.length > 0 ? filteredLogData.slice(0, 10).map(item => (
                            <div key={item._id} className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg ${getStatusStyles(getDetailedStatus(item))}`}>
                                            {getDetailedStatus(item)}
                                        </span>
                                        <span className="px-3 py-1 bg-blue-500 text-white text-[12px] font-black rounded-lg">{item.reason}</span>
                                    </div>
                                    {(item.status === 'returned' || item.returnedAt) && (
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg ${getRecoveryStatusStyles(getRecoveryStatusLabel(item))}`}>
                                            {getRecoveryStatusLabel(item)}
                                        </span>
                                    )}
                                </div>
                                <div className="pl-4 border-l-2 border-slate-200 space-y-4 ml-2">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-2 py-1 border border-slate-800 rounded-lg text-[10px] font-black">Scheduled</span>
                                            <div>
                                                <div className="text-[12px] font-bold text-slate-800">{new Date(item.fromDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {formatTimeTo12h(item.fromTime) || '12:00 PM'}</div>
                                                <div className="text-[10px] font-semibold text-slate-500">
                                                    USTHAD {item.teacherId?.name || item.teacher || 'Teacher'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {getDetailedStatus(item) !== 'Scheduled' && (
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-1 border border-slate-800 rounded-lg text-[10px] font-black">Started</span>
                                                <div>
                                                    <div className="text-[12px] font-bold text-slate-800">{new Date(item.fromDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {formatTimeTo12h(item.fromTime) || '12:00 PM'}</div>
                                                    <div className="text-[10px] font-semibold text-slate-500">
                                                        USTHAD {item.teacherId?.name || item.teacher || 'Teacher'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {item.returnedAt && (
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-1 border border-slate-800 rounded-lg text-[10px] font-black">Returned</span>
                                                <div>
                                                    <div className="text-[12px] font-bold text-slate-800">{new Date(item.returnedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, {new Date(item.returnedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <div className="text-[10px] font-semibold text-slate-500">
                                                        USTHAD {item.teacherId?.name || item.teacher || 'Teacher'} 
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-sm font-bold text-slate-400">
                                No records found
                            </div>
                        )}
                    </div>
                </div>

                {/* Report Issue Form */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-black text-slate-800 mb-2">Report Any Issue?</h2>
                    
                    <div 
                        ref={formRef}
                        className={`bg-white rounded-[2rem] p-6 border transition-all duration-500 space-y-4 ${
                            highlightForm 
                                ? 'border-amber-500 ring-4 ring-amber-500/20 scale-[1.02] shadow-xl shadow-amber-500/10' 
                                : 'border-slate-800'
                        }`}
                    >
                        <select 
                            value={selectedId}
                            onChange={e => setSelectedId(e.target.value)}
                            className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Leave...</option>
                            {leaveData.map(item => (
                                <option key={item._id} value={item._id}>
                                    {new Date(item.fromDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} - {item.reason}
                                </option>
                            ))}
                        </select>

                        <input 
                            type="text"
                            placeholder="Title..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <textarea 
                            placeholder="Description..." 
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none h-32 resize-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>

                        <button 
                            onClick={handleIssueSubmit}
                            disabled={true}  //disabled={complaintLoading}
                            className="w-full py-4 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                            {complaintLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            Submit
                        </button>
                        <div className="flex justify-center w-full">
                            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl uppercase inline-flex items-center gap-2">                     
                                Coming soon
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
