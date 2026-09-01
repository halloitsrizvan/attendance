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

    const [minusReportData, setMinusReportData] = useState(null);
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [academicYear, setAcademicYear] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [breakdownType, setBreakdownType] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const evaluateMultiplier = (val) => {
        if (typeof val === 'number') return val;
        if (!val || typeof val !== 'string') return 0;
        const trimmed = val.trim();
        if (!trimmed) return 0;
        if (trimmed.includes('/')) {
            const parts = trimmed.split('/');
            if (parts.length === 2) {
                const num = parseFloat(parts[0]);
                const den = parseFloat(parts[1]);
                if (!isNaN(num) && den) return num / den;
            }
        }
        return parseFloat(trimmed) || 0;
    };

    const formatNum = (num) => {
        if (!num && num !== 0) return '0';
        if (Number.isInteger(num)) return num.toString();

        const integerPart = Math.floor(num);
        const decimalPart = num - integerPart;

        let bestDen = 1;
        let bestNum = 0;
        let minDiff = 1;

        for (let d = 2; d <= 12; d++) {
            const n = Math.round(decimalPart * d);
            const diff = Math.abs(decimalPart - n / d);
            if (diff < minDiff) {
                minDiff = diff;
                bestDen = d;
                bestNum = n;
            }
        }

        if (minDiff < 0.01) {
            if (bestNum === 0) return integerPart.toString();
            if (bestNum === bestDen) return (integerPart + 1).toString();

            const gcd = (a, b) => b ? gcd(b, a % b) : a;
            const divisor = gcd(bestNum, bestDen);
            const finalNum = bestNum / divisor;
            const finalDen = bestDen / divisor;

            if (integerPart === 0) return `${finalNum}/${finalDen}`;
            return `${integerPart} ${finalNum}/${finalDen}`;
        }

        const rounded = Math.round(num * 10) / 10;
        return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    };

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            const [profileRes, settingsRes] = await Promise.all([
                axios.get(`${API_PORT}/students/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_PORT}/settings`)
            ]);

            const profileData = profileRes.data;
            setStudent(profileData);

            if (settingsRes.data) {
                if (settingsRes.data.deduction_templates) {
                    setSavedTemplates(settingsRes.data.deduction_templates);
                }
                if (settingsRes.data.academicYear) {
                    setAcademicYear(settingsRes.data.academicYear);
                }
                if (settingsRes.data.academicYearId) {
                    setAcademicYearId(settingsRes.data.academicYearId);
                }
            }

            const ad = profileData.ADNO;
            const sid = profileData._id || profileData.id;

            if (ad) {
                const results = await Promise.allSettled([
                    axios.get(`${API_PORT}/set-attendance?ad=${ad}`),
                    axios.get(`${API_PORT}/leave?ad=${ad}`),
                    axios.get(`${API_PORT}/minus?ad=${ad}`),
                    axios.get(`${API_PORT}/zehnuth/points?studentId=${sid}`),
                    axios.get(`${API_PORT}/report/minus-advanced?ad=${ad}`)
                ]);

                if (results[0].status === 'fulfilled') setAttendanceData(results[0].value.data || []);
                if (results[1].status === 'fulfilled') setLeaveData(results[1].value.data || []);
                if (results[2].status === 'fulfilled') setMinusData(results[2].value.data || []);
                if (results[3].status === 'fulfilled') setZehnuthPoints(results[3].value.data || []);
                if (results[4].status === 'fulfilled') {
                    const resResults = results[4].value.data?.results;
                    if (resResults && resResults.length > 0) {
                        setMinusReportData(resResults[0]);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('studentToken');
                localStorage.removeItem('vivaToken');
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

        // Resolve "Normal" Template Multipliers from Settings or Defaults (matching /report)
        const normalTemplate = savedTemplates.find(t => t.name?.trim().toLowerCase() === 'normal');
        const multipliers = normalTemplate?.multipliers || {
            Morning: { true: '1', false: '1', active: true },
            Afternoon: { true: '1', false: '1', active: true },
            Night: { true: '1', false: '1', active: true },
            Period: { true: '1', false: '1', active: true },
            Jamath: { true: '1', false: '1', active: true },
            Quiraath: { true: '1', false: '1', active: true },
            Minus: { active: true },
            Weekend: { true: '1/6', false: '1/6', active: true }
        };

        let calculatedDeduction = null;
        if (minusReportData && minusReportData.groupedAttendance) {
            let leave_MAN = 0;
            let absence_PJ = 0;
            let punishment_MAN = 0;
            let punishment_PJQ = 0;
            let documentedMedicalLeaveMinus = 0;
            let documentedOgeaLeaveMinus = 0;
            let documentedLeaveMinus = 0;

            ['Morning', 'Afternoon', 'Night'].forEach(t => {
                if (multipliers[t]?.active) {
                    const d = minusReportData.groupedAttendance[t];
                    if (d) {
                        const mTrue = evaluateMultiplier(multipliers[t].true);
                        const mFalse = evaluateMultiplier(multipliers[t].false);
                        const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : mTrue;
                        const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : mFalse;

                        leave_MAN += (d.absentOnLeaveTrue || 0) * mTrue;
                        leave_MAN += (d.absentOnLeaveFalse || 0) * mTrue;
                        punishment_MAN += (d.absentOnLeaveFalse || 0) * mFalse;

                        leave_MAN += (d.weekendAbsentOnLeaveTrue || 0) * wkTrue;
                        leave_MAN += (d.weekendAbsentOnLeaveFalse || 0) * wkTrue;
                        punishment_MAN += (d.weekendAbsentOnLeaveFalse || 0) * wkFalse;

                        documentedMedicalLeaveMinus += (d.documentedMedicalAbsentOnLeaveTrue || 0) * mTrue;
                        documentedMedicalLeaveMinus += (d.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

                        documentedOgeaLeaveMinus += (d.documentedOgeaAbsentOnLeaveTrue || 0) * mTrue;
                        documentedOgeaLeaveMinus += (d.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

                        documentedLeaveMinus += (d.documentedAbsentOnLeaveTrue || 0) * mTrue;
                        documentedLeaveMinus += (d.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
                    }
                }
            });

            if (multipliers['Period']?.active) {
                const periodData = minusReportData.groupedAttendance['Period'];
                if (periodData && periodData.periods) {
                    const pTrue = evaluateMultiplier(multipliers['Period'].true);
                    const pFalse = evaluateMultiplier(multipliers['Period'].false);
                    const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : pTrue;
                    const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : pFalse;

                    Object.values(periodData.periods).forEach(p => {
                        absence_PJ += (p.absentOnLeaveTrue || 0) * pTrue;
                        absence_PJ += (p.absentOnLeaveFalse || 0) * pTrue;
                        punishment_PJQ += (p.absentOnLeaveFalse || 0) * pFalse;

                        absence_PJ += (p.weekendAbsentOnLeaveTrue || 0) * wkTrue;
                        absence_PJ += (p.weekendAbsentOnLeaveFalse || 0) * wkTrue;
                        punishment_PJQ += (p.weekendAbsentOnLeaveFalse || 0) * wkFalse;

                        documentedMedicalLeaveMinus += (p.documentedMedicalAbsentOnLeaveTrue || 0) * pTrue;
                        documentedMedicalLeaveMinus += (p.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

                        documentedOgeaLeaveMinus += (p.documentedOgeaAbsentOnLeaveTrue || 0) * pTrue;
                        documentedOgeaLeaveMinus += (p.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

                        documentedLeaveMinus += (p.documentedAbsentOnLeaveTrue || 0) * pTrue;
                        documentedLeaveMinus += (p.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
                    });
                }
            }

            if (multipliers['Jamath']?.active) {
                const jamathData = minusReportData.groupedAttendance['Jamath'];
                if (jamathData) {
                    const jTrue = evaluateMultiplier(multipliers['Jamath'].true);
                    const jFalse = evaluateMultiplier(multipliers['Jamath'].false);
                    const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : jTrue;
                    const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : jFalse;

                    absence_PJ += (jamathData.absentOnLeaveTrue || 0) * jTrue;
                    absence_PJ += (jamathData.absentOnLeaveFalse || 0) * jTrue;
                    punishment_PJQ += (jamathData.absentOnLeaveFalse || 0) * jFalse;

                    absence_PJ += (jamathData.weekendAbsentOnLeaveTrue || 0) * wkTrue;
                    absence_PJ += (jamathData.weekendAbsentOnLeaveFalse || 0) * wkTrue;
                    punishment_PJQ += (jamathData.weekendAbsentOnLeaveFalse || 0) * wkFalse;

                    documentedMedicalLeaveMinus += (jamathData.documentedMedicalAbsentOnLeaveTrue || 0) * jTrue;
                    documentedMedicalLeaveMinus += (jamathData.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

                    documentedOgeaLeaveMinus += (jamathData.documentedOgeaAbsentOnLeaveTrue || 0) * jTrue;
                    documentedOgeaLeaveMinus += (jamathData.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

                    documentedLeaveMinus += (jamathData.documentedAbsentOnLeaveTrue || 0) * jTrue;
                    documentedLeaveMinus += (jamathData.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
                }
            }

            if (multipliers['Quiraath']?.active) {
                const quiraathData = minusReportData.groupedAttendance['Quiraath'];
                if (quiraathData) {
                    const qTrue = evaluateMultiplier(multipliers['Quiraath'].true);
                    const qFalse = evaluateMultiplier(multipliers['Quiraath'].false);
                    const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : qTrue;
                    const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : qFalse;

                    absence_PJ += (quiraathData.absentOnLeaveTrue || 0) * qTrue;
                    absence_PJ += (quiraathData.absentOnLeaveFalse || 0) * qTrue;
                    punishment_PJQ += (quiraathData.absentOnLeaveFalse || 0) * qFalse;

                    absence_PJ += (quiraathData.weekendAbsentOnLeaveTrue || 0) * wkTrue;
                    absence_PJ += (quiraathData.weekendAbsentOnLeaveFalse || 0) * wkTrue;
                    punishment_PJQ += (quiraathData.weekendAbsentOnLeaveFalse || 0) * wkFalse;

                    documentedMedicalLeaveMinus += (quiraathData.documentedMedicalAbsentOnLeaveTrue || 0) * qTrue;
                    documentedMedicalLeaveMinus += (quiraathData.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

                    documentedOgeaLeaveMinus += (quiraathData.documentedOgeaAbsentOnLeaveTrue || 0) * qTrue;
                    documentedOgeaLeaveMinus += (quiraathData.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

                    documentedLeaveMinus += (quiraathData.documentedAbsentOnLeaveTrue || 0) * qTrue;
                    documentedLeaveMinus += (quiraathData.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
                }
            }

            const c = parseInt(minusReportData.class, 10);
            let permitted = 0;
            if (!isNaN(c)) {
                if (c >= 1 && c <= 5) permitted = 6;
                else if (c === 6 || c === 7) permitted = 7;
                else if (c >= 8 && c <= 10) permitted = 8;
            }

            const minus = multipliers['Minus']?.active ? (minusReportData.totalManualMinus || 0) : 0;
            const totalAbsence = leave_MAN + punishment_MAN + punishment_PJQ + minus;
            const netAbsence = totalAbsence - documentedLeaveMinus;
            const overBy = Math.max(0, netAbsence - permitted);

            calculatedDeduction = {
                leave_MAN,
                absence_PJ,
                punishment_MAN,
                punishment_PJQ,
                minus,
                documentedLeaveMinus,
                permitted,
                totalAbsence,
                netAbsence,
                overBy
            };
        }

        const minusBreakdown = {};
        if (calculatedDeduction) {
            minusBreakdown["Absence (M+A+N)"] = formatNum(calculatedDeduction.leave_MAN);
            if (calculatedDeduction.absence_PJ > 0) {
                minusBreakdown["Absence (P+J+Q)"] = formatNum(calculatedDeduction.absence_PJ);
            }
            if (calculatedDeduction.punishment_MAN > 0) {
                minusBreakdown["Punishment (M+A+N)"] = formatNum(calculatedDeduction.punishment_MAN);
            }
            if (calculatedDeduction.punishment_PJQ > 0) {
                minusBreakdown["Punishment (P+J+Q)"] = formatNum(calculatedDeduction.punishment_PJQ);
            }
            if (calculatedDeduction.minus > 0) {
                minusBreakdown["Manual Minus"] = formatNum(calculatedDeduction.minus);
            }
            if (calculatedDeduction.documentedLeaveMinus > 0) {
                minusBreakdown["Documented Exemption"] = `-${formatNum(calculatedDeduction.documentedLeaveMinus)}`;
            }
            minusBreakdown["Permitted Allowance"] = `${calculatedDeduction.permitted}`;
            minusBreakdown["Net Minus"] = formatNum(calculatedDeduction.netAbsence);
            minusBreakdown["Over Allowance"] = formatNum(calculatedDeduction.overBy);
        } else {
            const manualTotal = minusData.reduce((sum, item) => sum + (Number(item.minusNum) || 0), 0);
            minusBreakdown["Manual Minus"] = formatNum(manualTotal);
        }

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

        const totalMinusFormatted = calculatedDeduction 
            ? formatNum(calculatedDeduction.netAbsence)
            : formatNum(minusData.reduce((sum, item) => sum + (Number(item.minusNum) || 0), 0));

        return {
            attendanceRate,
            totalLeave,
            totalMinus: totalMinusFormatted,
            totalZehnuth,
            attendanceBreakdown,
            leaveBreakdown,
            minusBreakdown,
            zehnuthBreakdown
        };
    }, [attendanceData, leaveData, minusData, zehnuthPoints, minusReportData, savedTemplates]);

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
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-black text-slate-800">My Analytics</h2>
                    {academicYear && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-black uppercase tracking-wider rounded-full shadow-sm">
                            {academicYear}
                        </span>
                    )}
                </div>
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
