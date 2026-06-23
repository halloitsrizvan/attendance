"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Ticket, Loader2, Send } from 'lucide-react';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

import MetricCard from '@/components/StudentPortal/MetricCard';

export default function CEPPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [cepData, setCepData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('All');

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
            case 'Active':
                return 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-500/20 animate-pulse';
            case 'Approved':
                return 'bg-sky-100 text-sky-600';
            case 'Expired':
            default:
                return 'bg-slate-100 text-slate-400';
        }
    };
    
    useEffect(() => {
        fetchCEPData();
    }, []);

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

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    const totalCEP = cepData.length;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Analytics */}
                <div className="lg:col-span-1">
                    <h2 className="text-2xl font-black text-slate-800 mb-6">My Analytics</h2>
                    <MetricCard 
                        title="Total CEP"
                        value={totalCEP}
                        color="blue"
                        icon={Ticket}
                    />
                </div>

                {/* CEP Log */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-slate-800">CEP Log</h2>
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-500 outline-none cursor-pointer border-none"
                        >
                            <option value="All">All Months</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonth(m)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-4 h-64 overflow-y-auto custom-scrollbar space-y-3 border border-slate-100">
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
                                                <span className="text-[12px] font-bold text-slate-800">
                                                    {new Date(item.date || item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                    {item.reason || 'Class Excused Pass'}
                                                </span>
                                            </div>
                                            
                                            <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                                <span className="uppercase tracking-widest text-[8px] font-black text-slate-400">Duration:</span>
                                                <span className="text-slate-600 font-extrabold">
                                                    {item.fromTime && item.toTime ? `${formatTimeTo12h(item.fromTime)} - ${formatTimeTo12h(item.toTime)}` : 'Full Day'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 shrink-0">
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Issued By</div>
                                        <div className="text-[10px] font-black text-slate-700 uppercase">USTHAD {item.teacherId?.name || item.teacher || 'Teacher'}</div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400 py-10">
                                No CEP records found
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Request CEP (Simulated Issue Form structure) */}
            {/* <div className="w-full lg:w-1/3">
                <h2 className="text-xl font-black text-slate-800 mb-6">Request CEP</h2>
                <div className="bg-white rounded-[2rem] p-6 border border-slate-800 space-y-4">
                    <input 
                        type="text"
                        placeholder="Reason..."
                        className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea 
                        placeholder="Additional details..." 
                        className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none h-32 resize-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>

                    <button 
                        onClick={() => alert("CEP request submitted.")}
                        className="w-full py-4 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Send size={18} />
                        Submit Request
                    </button>
                </div>
            </div> */}
        </div>
    );
}
