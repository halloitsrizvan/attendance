"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { CalendarCheck, CalendarDays, MinusSquare, Star, Loader2, AlertTriangle } from 'lucide-react';
import { API_PORT } from '@/Constants';
import WelcomeBanner from '@/components/StudentPortal/WelcomeBanner';
import MetricCard from '@/components/StudentPortal/MetricCard';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [leaveData, setLeaveData] = useState([]);
    const [minusData, setMinusData] = useState([]);
    const [zehnuthPoints, setZehnuthPoints] = useState([]);

    // Breakdown Popup State
    const [breakdownType, setBreakdownType] = useState(null); // 'attendance', 'leave', 'minus', 'zehnuth'

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
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

            const ad = profileData.ADNO;
            const sid = profileData._id || profileData.id;

            if (ad) {
                const results = await Promise.allSettled([
                    axios.get(`${API_PORT}/set-attendance?ad=${ad}`),
                    axios.get(`${API_PORT}/leave?ad=${ad}`),
                    axios.get(`${API_PORT}/minus?ad=${ad}`),
                    axios.get(`${API_PORT}/zehnuth/points?studentId=${sid}`)
                ]);

                if (results[0].status === 'fulfilled') setAttendanceData(results[0].value.data || []);
                if (results[1].status === 'fulfilled') setLeaveData(results[1].value.data || []);
                if (results[2].status === 'fulfilled') setMinusData(results[2].value.data || []);
                if (results[3].status === 'fulfilled') setZehnuthPoints(results[3].value.data || []);
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
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

    const pendingRecoveries = useMemo(() => {
        return leaveData.filter(l => 
            (l.status === 'returned' || l.returnedAt) && 
            l.recovery !== true && 
            l.recoveryNeeded !== false
        );
    }, [leaveData]);

    const activeOrScheduledLeaves = useMemo(() => {
        return leaveData.filter(l => {
            const status = getDetailedStatus(l);
            return status === 'On Leave' || status === 'Late' || status === 'Scheduled';
        });
    }, [leaveData]);

    const stats = useMemo(() => {
        let presents = 0;
        let absents = 0;
        let totalLogs = attendanceData.length;
        attendanceData.forEach(log => {
            if (log.status === 'Present') presents++;
            else absents++;
        });
        const attendanceRate = totalLogs === 0 ? 0 : ((presents / totalLogs) * 100).toFixed(1);
        const attendanceBreakdown = { Presents: presents, Absents: absents };

        let totalLeave = 0;
        const leaveBreakdown = { Approved: 0, Pending: 0, Rejected: 0 };
        leaveData.forEach(leave => {
            if (leave.status === 'approved' || leave.approved === true) leaveBreakdown.Approved++;
            else if (leave.status === 'rejected' || leave.approved === false) leaveBreakdown.Rejected++;
            else leaveBreakdown.Pending++;

            if (leave.approved !== false && leave.status !== 'rejected') {
                totalLeave++;
            }
        });

        const minusBreakdown = {};
        const totalMinus = minusData.reduce((sum, item) => {
            const reason = item.reason || 'General';
            minusBreakdown[reason] = (minusBreakdown[reason] || 0) + (Number(item.minusNum) || 0);
            return sum + (Number(item.minusNum) || 0);
        }, 0);

        Object.keys(minusBreakdown).forEach(key => {
            minusBreakdown[key] = minusBreakdown[key].toFixed(1);
        });

        const zehnuthBreakdown = { Approved: 0, Pending: 0 };
        const totalZehnuth = zehnuthPoints.reduce((sum, point) => {
            if (point.status === 'approved') {
                zehnuthBreakdown.Approved += (Number(point.points) || 0);
                return sum + (Number(point.points) || 0);
            } else {
                zehnuthBreakdown.Pending += (Number(point.points) || 0);
            }
            return sum;
        }, 0);

        return {
            attendanceRate,
            totalLeave,
            totalMinus: totalMinus.toFixed(1),
            totalZehnuth,
            attendanceBreakdown,
            leaveBreakdown,
            minusBreakdown,
            zehnuthBreakdown
        };
    }, [attendanceData, leaveData, minusData, zehnuthPoints]);

    if (loading) {
        return <PortalSkeleton hasBanner={true} />;
    }

    const todayDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WelcomeBanner 
                studentName={(student?.['SHORT NAME'] || student?.['FULL NAME'])?.split(' ')[0] || 'Student'} 
                dateStr={todayDateStr} 
            />

            {/* Quick Info & Alerts Section */}
            {(pendingRecoveries.length > 0 || activeOrScheduledLeaves.length > 0) && (
                <div className="mb-6 space-y-2 animate-in fade-in duration-300">
                    {/* Pending Recoveries */}
                    {pendingRecoveries.map(item => (
                        <div key={item._id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200/60 rounded-2xl text-slate-700 shadow-sm text-xs font-bold">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0">
                                Recovery
                            </span>
                            <span className="truncate">
                                Required for "{item.reason}"
                            </span>
                            <span className="ml-auto text-[10px] text-slate-500 font-bold shrink-0">
                                Returned: {item.returnedAt ? new Date(item.returnedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : (item.toDate ? new Date(item.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : 'Pending')}
                            </span>
                        </div>
                    ))}

                    {/* Active or Scheduled Leaves */}
                    {activeOrScheduledLeaves.map(item => {
                        const status = getDetailedStatus(item);
                        const isScheduled = status === 'Scheduled';
                        const bgColor = isScheduled ? 'bg-sky-50 border-sky-200/60 text-slate-700' : 'bg-rose-50 border-rose-200/60 text-slate-700';
                        const badgeColor = isScheduled ? 'bg-sky-200 text-sky-800' : 'bg-rose-200 text-rose-800';
                        const iconColor = isScheduled ? 'text-sky-500' : 'text-rose-500';

                        return (
                            <div key={item._id} className={`flex items-center gap-3 p-3 ${bgColor} border rounded-2xl shadow-sm text-xs font-bold`}>
                                <CalendarDays size={14} className={`${iconColor} shrink-0`} />
                                <span className={`px-1.5 py-0.5 ${badgeColor} rounded-md text-[9px] font-black uppercase tracking-wider shrink-0`}>
                                    {status}
                                </span>
                                <span className="truncate">
                                    "{item.reason}"
                                </span>
                                <span className="ml-auto text-[10px] text-slate-500 font-bold shrink-0">
                                    {new Date(item.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                                    {item.toDate && ` → ${new Date(item.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 mb-6">My Analytics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <MetricCard 
                        title="Attendance"
                        value={`${stats.attendanceRate}%`}
                        color="blue"
                        imageSrc="/stud_portal_redesign/att.png"
                        onClick={() => setBreakdownType('attendance')}
                    />
                    <MetricCard 
                        title="Leave"
                        value={stats.totalLeave}
                        color="slate"
                        imageSrc="/stud_portal_redesign/leave.png"
                        onClick={() => setBreakdownType('leave')}
                    />
                    <MetricCard 
                        title="Minus"
                        value={stats.totalMinus}
                        color="blue"
                        imageSrc="/stud_portal_redesign/minus.png"
                        onClick={() => setBreakdownType('minus')}
                    />
                    <MetricCard 
                        title="Zehnuth"
                        value={stats.totalZehnuth}
                        color="slate"
                        imageSrc="/stud_portal_redesign/zeh.png"
                        onClick={() => setBreakdownType('zehnuth')}
                    />
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
                            {Object.entries(stats[`${breakdownType}Breakdown`]).map(([key, count]) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-black text-slate-700">{key}</span>
                                    <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-600">
                                        {count}
                                    </span>
                                </div>
                            ))}
                            {Object.keys(stats[`${breakdownType}Breakdown`]).length === 0 && (
                                <div className="text-center py-6 text-sm font-bold text-slate-400">
                                    No records found
                                </div>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                            <button 
                                onClick={() => router.push(`/students-portal/${breakdownType === 'attendance' ? 'attendance' : breakdownType === 'leave' ? 'leave' : breakdownType === 'zehnuth' ? 'zehnuth' : ''}`)}
                                className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                            >
                                View Full Page →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
