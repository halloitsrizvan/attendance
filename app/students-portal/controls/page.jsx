"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Sliders, Star, Trophy, Calendar, Users, FileText, 
    TrendingUp, Award, Loader2, ArrowLeft, RefreshCw,
    CheckCircle2, ChevronRight, BarChart3, AlertCircle, Copy,
    Download, Search, Filter, ShieldCheck, Clock, Activity,
    Layers, PieChart, Check, CalendarDays, ExternalLink,
    FileSpreadsheet, ArrowDownRight, UserCheck
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

export default function ControlsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);

    // Active Top Module: 'zehnuth' | 'leave'
    const [activeTab, setActiveTab] = useState('zehnuth');

    // ----------------------------------------------------
    // 1. ZEHNUTH ANALYTICS STATE
    // ----------------------------------------------------
    const [points, setPoints] = useState([]);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [refreshingZehnuth, setRefreshingZehnuth] = useState(false);
    const [copied, setCopied] = useState(false);

    // ----------------------------------------------------
    // 2. LEAVE ANALYTICS STATE
    // ----------------------------------------------------
    const [leaves, setLeaves] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [refreshingLeaves, setRefreshingLeaves] = useState(false);
    const [leaveSearch, setLeaveSearch] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [exportingPdf, setExportingPdf] = useState(false);

    // Initial load: Profile & Data
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            setLoading(true);
            // 1. Fetch student profile
            const profileRes = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileData = profileRes.data;

            // Restrict page access to StudentAdmin role
            const roles = Array.isArray(profileData.role) ? profileData.role : [profileData.role];
            const normalizedRoles = roles.map(r => String(r || '').toLowerCase());
            if (!normalizedRoles.includes('studentadmin')) {
                router.push('/students-portal');
                return;
            }
            setStudent(profileData);

            // 2. Fetch Zehnuth Points
            const pointsRes = await axios.get(`${API_PORT}/zehnuth/points?status=approved`);
            setPoints(pointsRes.data || []);

            // 3. Fetch Academic Years
            const yearsRes = await axios.get(`${API_PORT}/academic-years`);
            const yearsData = Array.isArray(yearsRes.data) ? yearsRes.data : [];
            setAcademicYears(yearsData);

            // Find active academic year ID
            const activeYear = yearsData.find(y => y.isActive);
            const initialYearId = activeYear ? activeYear._id : (yearsData[0]?._id || 'all');
            setSelectedYearId(initialYearId);

            // 4. Fetch Leaves for initial year
            const leavesUrl = initialYearId === 'all' 
                ? `${API_PORT}/leave?all=true` 
                : `${API_PORT}/leave?academicYearId=${initialYearId}`;
            const leavesRes = await axios.get(leavesUrl);
            setLeaves(leavesRes.data || []);

        } catch (err) {
            console.error("Error loading Controls page data:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------
    // ZEHNUTH ACTIONS & CALCULATIONS
    // ----------------------------------------------------
    const handleRefreshZehnuth = async () => {
        setRefreshingZehnuth(true);
        try {
            const pointsRes = await axios.get(`${API_PORT}/zehnuth/points?status=approved`);
            setPoints(pointsRes.data || []);
        } catch (err) {
            console.error("Error refreshing points data:", err);
        } finally {
            setRefreshingZehnuth(false);
        }
    };

    const getMonthSortKey = (dateStr) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const getMonthLabel = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    };

    const availableMonths = useMemo(() => {
        const monthsMap = {};
        points.forEach(p => {
            if (p.createdAt) {
                const key = getMonthSortKey(p.createdAt);
                const label = getMonthLabel(p.createdAt);
                monthsMap[key] = label;
            }
        });
        return Object.keys(monthsMap)
            .sort((a, b) => b.localeCompare(a))
            .map(key => ({ key, label: monthsMap[key] }));
    }, [points]);

    const toggleMonth = (key) => {
        if (selectedMonths.includes(key)) {
            setSelectedMonths(selectedMonths.filter(m => m !== key));
        } else {
            setSelectedMonths([...selectedMonths, key]);
        }
    };

    const clearMonthFilters = () => {
        setSelectedMonths([]);
    };

    const filteredPoints = useMemo(() => {
        if (selectedMonths.length === 0) return points;
        return points.filter(p => {
            if (!p.createdAt) return false;
            const key = getMonthSortKey(p.createdAt);
            return selectedMonths.includes(key);
        });
    }, [points, selectedMonths]);

    const allUniqueClasses = useMemo(() => {
        const classes = new Set();
        points.forEach(p => {
            if (p.studentId && p.studentId.CLASS !== undefined) {
                classes.add(Number(p.studentId.CLASS));
            }
        });
        return Array.from(classes).sort((a, b) => a - b);
    }, [points]);

    const classWiseData = useMemo(() => {
        const classMap = {};
        allUniqueClasses.forEach(classNum => {
            classMap[classNum] = {
                classNum,
                totalPoints: 0,
                studentsCount: new Set(),
                submissionsCount: 0
            };
        });

        filteredPoints.forEach(p => {
            const st = p.studentId;
            if (!st) return;
            const classNum = Number(st.CLASS);
            if (isNaN(classNum)) return;

            if (!classMap[classNum]) {
                classMap[classNum] = {
                    classNum,
                    totalPoints: 0,
                    studentsCount: new Set(),
                    submissionsCount: 0
                };
            }

            classMap[classNum].totalPoints += Number(p.points) || 0;
            classMap[classNum].submissionsCount += 1;
            if (st._id) {
                classMap[classNum].studentsCount.add(st._id.toString());
            }
        });

        return Object.values(classMap)
            .map(c => ({
                ...c,
                uniqueStudentsCount: c.studentsCount.size
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints);
    }, [filteredPoints, allUniqueClasses]);

    const zehnuthStats = useMemo(() => {
        const totalApprovedPoints = filteredPoints.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
        const totalSubmissions = filteredPoints.length;
        const topClass = classWiseData.length > 0 && classWiseData[0].totalPoints > 0 
            ? `Class ${classWiseData[0].classNum}` 
            : 'N/A';
            
        return { totalApprovedPoints, totalSubmissions, topClass };
    }, [filteredPoints, classWiseData]);

    const maxPoints = useMemo(() => {
        if (classWiseData.length === 0) return 1;
        const maxVal = Math.max(...classWiseData.map(c => c.totalPoints));
        return maxVal > 0 ? maxVal : 1;
    }, [classWiseData]);

    const handleCopy = () => {
        let monthHeader = 'All Months';
        if (selectedMonths.length > 0) {
            const labels = selectedMonths.map(key => {
                const found = availableMonths.find(m => m.key === key);
                return found ? found.label : key;
            });
            monthHeader = labels.join(', ');
        }

        const rows = classWiseData.map(item => 
            `class ${item.classNum}: ${item.totalPoints} points (${item.uniqueStudentsCount} achievers, ${item.submissionsCount} submissions)`
        );

        const textToCopy = `${monthHeader}\n${rows.join('\n')}`;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error("Failed to copy to clipboard:", err);
            });
    };

    // ----------------------------------------------------
    // LEAVE ANALYTICS ACTIONS & CALCULATIONS
    // ----------------------------------------------------
    const fetchLeavesForYear = async (yearId) => {
        setLeaveLoading(true);
        try {
            const leavesUrl = yearId === 'all' 
                ? `${API_PORT}/leave?all=true` 
                : `${API_PORT}/leave?academicYearId=${yearId}`;
            const res = await axios.get(leavesUrl);
            setLeaves(res.data || []);
        } catch (err) {
            console.error("Error fetching leaves for session:", err);
        } finally {
            setLeaveLoading(false);
        }
    };

    const handleYearChange = (yearId) => {
        setSelectedYearId(yearId);
        fetchLeavesForYear(yearId);
    };

    const handleRefreshLeaves = async () => {
        setRefreshingLeaves(true);
        try {
            await fetchLeavesForYear(selectedYearId);
        } finally {
            setRefreshingLeaves(false);
        }
    };

    // Selected Year Name
    const selectedYearName = useMemo(() => {
        if (selectedYearId === 'all') return 'All Academic Sessions';
        const found = academicYears.find(y => y._id === selectedYearId);
        return found ? found.name : 'Selected Session';
    }, [selectedYearId, academicYears]);

    // Unique Classes in Leaves
    const leaveClassesList = useMemo(() => {
        const classes = new Set();
        leaves.forEach(l => {
            const classNum = l.studentId?.CLASS;
            if (classNum !== undefined && classNum !== null && !isNaN(Number(classNum))) {
                classes.add(Number(classNum));
            }
        });
        return Array.from(classes).sort((a, b) => a - b);
    }, [leaves]);

    // Class-wise Leaves Breakdown
    const classWiseLeaves = useMemo(() => {
        const classMap = {};
        leaveClassesList.forEach(cls => {
            classMap[cls] = {
                classNum: cls,
                totalLeaves: 0,
                uniqueStudents: new Set(),
                statusCounts: { returned: 0, active: 0, scheduled: 0, late: 0, pending: 0 },
                reasonsMap: {}
            };
        });

        leaves.forEach(l => {
            const st = l.studentId;
            if (!st) return;
            const cls = Number(st.CLASS);
            if (isNaN(cls)) return;

            if (!classMap[cls]) {
                classMap[cls] = {
                    classNum: cls,
                    totalLeaves: 0,
                    uniqueStudents: new Set(),
                    statusCounts: { returned: 0, active: 0, scheduled: 0, late: 0, pending: 0 },
                    reasonsMap: {}
                };
            }

            classMap[cls].totalLeaves += 1;
            if (st._id) {
                classMap[cls].uniqueStudents.add(st._id.toString());
            }

            // Status counts
            const stStatus = String(l.status || 'scheduled').toLowerCase();
            if (classMap[cls].statusCounts[stStatus] !== undefined) {
                classMap[cls].statusCounts[stStatus] += 1;
            } else {
                classMap[cls].statusCounts.scheduled += 1;
            }

            // Reason count within class
            const rsn = (l.reason || 'Other').trim();
            classMap[cls].reasonsMap[rsn] = (classMap[cls].reasonsMap[rsn] || 0) + 1;
        });

        return Object.values(classMap).map(item => {
            let topReason = 'N/A';
            let topCount = 0;
            Object.entries(item.reasonsMap).forEach(([r, count]) => {
                if (count > topCount) {
                    topCount = count;
                    topReason = r;
                }
            });

            return {
                ...item,
                uniqueStudentsCount: item.uniqueStudents.size,
                topReason: topReason !== 'N/A' ? `${topReason} (${topCount})` : 'N/A'
            };
        }).sort((a, b) => b.totalLeaves - a.totalLeaves);
    }, [leaves, leaveClassesList]);

    // Max Leaves in a Class for Progress Bar
    const maxClassLeaves = useMemo(() => {
        if (classWiseLeaves.length === 0) return 1;
        const maxVal = Math.max(...classWiseLeaves.map(c => c.totalLeaves));
        return maxVal > 0 ? maxVal : 1;
    }, [classWiseLeaves]);

    // Reasons Distribution
    const reasonAnalytics = useMemo(() => {
        const map = {};
        const studentMap = {};

        leaves.forEach(l => {
            const r = (l.reason || 'Other').trim();
            map[r] = (map[r] || 0) + 1;
            if (!studentMap[r]) studentMap[r] = new Set();
            if (l.studentId?._id) studentMap[r].add(l.studentId._id.toString());
        });

        const total = leaves.length || 1;
        return Object.keys(map)
            .map(reason => ({
                reason,
                count: map[reason],
                percentage: Math.round((map[reason] / total) * 100),
                uniqueStudents: studentMap[reason]?.size || 0
            }))
            .sort((a, b) => b.count - a.count);
    }, [leaves]);

    // Top 10 reasons for concise display and PDF
    const top10Reasons = useMemo(() => {
        return reasonAnalytics.slice(0, 10);
    }, [reasonAnalytics]);

    // Leave Overall Stats Summary
    const leaveStatsSummary = useMemo(() => {
        const totalLeaves = leaves.length;
        const uniqueStudentsSet = new Set();
        let returnedCount = 0;
        let activeCount = 0;
        let scheduledCount = 0;
        let lateCount = 0;

        leaves.forEach(l => {
            if (l.studentId?._id) uniqueStudentsSet.add(l.studentId._id.toString());
            const s = String(l.status || '').toLowerCase();
            if (s === 'returned') returnedCount++;
            else if (s === 'active') activeCount++;
            else if (s === 'late') lateCount++;
            else scheduledCount++;
        });

        const topClass = classWiseLeaves.length > 0 && classWiseLeaves[0].totalLeaves > 0
            ? `Class ${classWiseLeaves[0].classNum}`
            : 'N/A';
        const topClassLeaves = classWiseLeaves.length > 0 ? classWiseLeaves[0].totalLeaves : 0;

        const topReasonObj = reasonAnalytics.length > 0 ? reasonAnalytics[0] : null;
        const topReason = topReasonObj ? topReasonObj.reason : 'N/A';
        const topReasonCount = topReasonObj ? topReasonObj.count : 0;
        const topReasonPct = topReasonObj ? topReasonObj.percentage : 0;

        return {
            totalLeaves,
            uniqueStudentsCount: uniqueStudentsSet.size,
            returnedCount,
            activeCount: activeCount + lateCount,
            scheduledCount,
            topClass,
            topClassLeaves,
            topReason,
            topReasonCount,
            topReasonPct
        };
    }, [leaves, classWiseLeaves, reasonAnalytics]);

    // Filtered Detailed Leaves List
    const filteredLeaves = useMemo(() => {
        return leaves.filter(l => {
            // Search filter
            if (leaveSearch.trim()) {
                const query = leaveSearch.toLowerCase();
                const sName = String(l.studentId?.["FULL NAME"] || l.studentId?.["SHORT NAME"] || '').toLowerCase();
                const adno = String(l.studentId?.ADNO || '');
                const reason = String(l.reason || '').toLowerCase();
                if (!sName.includes(query) && !adno.includes(query) && !reason.includes(query)) {
                    return false;
                }
            }
            // Class filter
            if (classFilter !== 'all') {
                if (String(l.studentId?.CLASS) !== String(classFilter)) {
                    return false;
                }
            }
            // Status filter
            if (statusFilter !== 'all') {
                if (String(l.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
                    return false;
                }
            }
            return true;
        });
    }, [leaves, leaveSearch, classFilter, statusFilter]);

    // ----------------------------------------------------
    // PDF EXPORT FUNCTION (Class-wise + Top 10 Reasons Summary)
    // ----------------------------------------------------
    const handleExportPDF = () => {
        try {
            setExportingPdf(true);
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Brand Header Banner
            doc.setFillColor(10, 132, 198); // Brand Blue #0A84C6
            doc.rect(0, 0, 210, 26, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('STUDENTS PORTAL | LEAVE REPORT ANALYTICS', 14, 12);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(225, 240, 255);
            doc.text(`Academic Session: ${selectedYearName}   |   Generated On: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 14, 19);

            let currentY = 34;

            // Section 1: Executive Summary Box
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(14, currentY, 182, 28, 3, 3, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text('EXECUTIVE SUMMARY & KEY METRICS', 18, currentY + 7);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);

            // Metrics row
            doc.text(`• Total Leaves Recorded:`, 18, currentY + 14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${leaveStatsSummary.totalLeaves} leaves (${leaveStatsSummary.uniqueStudentsCount} unique students)`, 56, currentY + 14);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`• Top Leave-Taking Class:`, 18, currentY + 21);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${leaveStatsSummary.topClass} (${leaveStatsSummary.topClassLeaves} leaves)`, 56, currentY + 21);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`• Primary Reason:`, 112, currentY + 14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${leaveStatsSummary.topReason} (${leaveStatsSummary.topReasonCount} times, ${leaveStatsSummary.topReasonPct}%)`, 140, currentY + 14);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`• Returned vs Active:`, 112, currentY + 21);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${leaveStatsSummary.returnedCount} returned / ${leaveStatsSummary.activeCount} active`, 140, currentY + 21);

            currentY += 35;

            // Section 2: Class-Wise Leave Table
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text('1. Class-wise Leave Distribution', 14, currentY);

            const classTableRows = classWiseLeaves.map((c, idx) => [
                idx + 1,
                `Class ${c.classNum}`,
                c.totalLeaves,
                c.uniqueStudentsCount,
                c.statusCounts.active + c.statusCounts.late,
                c.statusCounts.returned,
                c.topReason
            ]);

            autoTable(doc, {
                startY: currentY + 3,
                head: [['#', 'Class', 'Total Leaves', 'Unique Students', 'Active/Late', 'Returned', 'Top Reason']],
                body: classTableRows.length > 0 ? classTableRows : [['-', 'No data', '0', '0', '0', '0', '-']],
                theme: 'grid',
                headStyles: { 
                    fillColor: [10, 132, 198], 
                    textColor: [255, 255, 255], 
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: { 
                    fontSize: 8,
                    textColor: [51, 65, 85]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { fontStyle: 'bold', cellWidth: 25 },
                    2: { halign: 'center', cellWidth: 24 },
                    3: { halign: 'center', cellWidth: 26 },
                    4: { halign: 'center', cellWidth: 22 },
                    5: { halign: 'center', cellWidth: 22 },
                    6: { cellWidth: 'auto' }
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 14, right: 14 }
            });

            currentY = doc.lastAutoTable.finalY + 12;

            if (currentY > 210) {
                doc.addPage();
                currentY = 20;
            }

            // Section 3: Reasons Distribution Table (Top 10 Only)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text('2. Top 10 Most Frequent Leave Reasons', 14, currentY);

            const reasonTableRows = top10Reasons.map((r, idx) => [
                idx + 1,
                r.reason,
                r.count,
                `${r.percentage}%`,
                r.uniqueStudents
            ]);

            autoTable(doc, {
                startY: currentY + 3,
                head: [['#', 'Reason Category (Top 10)', 'Total Occurrences', 'Percentage Share', 'Unique Students']],
                body: reasonTableRows.length > 0 ? reasonTableRows : [['-', 'No data', '0', '0%', '0']],
                theme: 'grid',
                headStyles: { 
                    fillColor: [71, 85, 105], 
                    textColor: [255, 255, 255], 
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: { 
                    fontSize: 8,
                    textColor: [51, 65, 85]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { fontStyle: 'bold', cellWidth: 60 },
                    2: { halign: 'center', cellWidth: 35 },
                    3: { halign: 'center', cellWidth: 35 },
                    4: { halign: 'center', cellWidth: 42 }
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 14, right: 14 }
            });

            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Leave Report Analytics • Page ${i} of ${pageCount} • Generated by StudentAdmin`,
                    105,
                    290,
                    { align: 'center' }
                );
            }

            const cleanSessionName = selectedYearName.replace(/[^a-zA-Z0-9]/g, '_');
            doc.save(`Leave_Report_${cleanSessionName}_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (err) {
            console.error("Error exporting PDF:", err);
            alert("Failed to export PDF. Please try again.");
        } finally {
            setExportingPdf(false);
        }
    };

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto px-1 pb-16">
            
            {/* Top Hub Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                        <Sliders size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-blue-600">StudentAdmin Controls</div>
                        <div className="text-sm font-bold text-slate-700">Central Analytics & Performance Reporting Hub</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100">
                        <ShieldCheck size={14} />
                        <span>StudentAdmin Verified</span>
                    </span>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 2 MAIN MODULE SELECTOR CARDS */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CARD 1: Class-wise Zehnuth Analytics */}
                <div 
                    onClick={() => setActiveTab('zehnuth')}
                    className={`cursor-pointer group relative p-7 rounded-[2.2rem] border transition-all duration-300 overflow-hidden ${
                        activeTab === 'zehnuth'
                            ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
                            : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
                    }`}
                >
                    {/* Background Glow */}
                    <div className={`absolute -right-8 -top-8 w-36 h-36 rounded-full blur-3xl transition-opacity duration-300 ${
                        activeTab === 'zehnuth' ? 'bg-blue-400/20 opacity-100' : 'bg-blue-300/10 opacity-40 group-hover:opacity-80'
                    }`} />

                    <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                    activeTab === 'zehnuth' 
                                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                                        : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                                }`}>
                                    <Trophy size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Module 01</span>
                                        {activeTab === 'zehnuth' && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                                Active View
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
                                        Class-wise Zehnuth Analytics
                                    </h2>
                                </div>
                            </div>

                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                activeTab === 'zehnuth' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                            }`}>
                                <ChevronRight size={18} className={`transition-transform duration-300 ${activeTab === 'zehnuth' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                            </div>
                        </div>

                        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                            Monitor academic achievements, monthly points distribution, leaderboard rankings, and class-wise performance.
                        </p>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5 text-blue-600 font-extrabold">
                                <Star size={14} className="fill-blue-600 text-blue-600" />
                                <span>{zehnuthStats.totalApprovedPoints} Total Points</span>
                            </span>
                            <span className="text-slate-400 font-semibold">
                                {allUniqueClasses.length} Classes Ranked
                            </span>
                        </div>
                    </div>
                </div>

                {/* CARD 2: Leave Report Analytics */}
                <div 
                    onClick={() => setActiveTab('leave')}
                    className={`cursor-pointer group relative p-7 rounded-[2.2rem] border transition-all duration-300 overflow-hidden ${
                        activeTab === 'leave'
                            ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                            : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
                    }`}
                >
                    {/* Background Glow */}
                    <div className={`absolute -right-8 -top-8 w-36 h-36 rounded-full blur-3xl transition-opacity duration-300 ${
                        activeTab === 'leave' ? 'bg-indigo-400/20 opacity-100' : 'bg-indigo-300/10 opacity-40 group-hover:opacity-80'
                    }`} />

                    <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                    activeTab === 'leave' 
                                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                                        : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                                }`}>
                                    <FileSpreadsheet size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Module 02</span>
                                        {activeTab === 'leave' && (
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                                Active View
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
                                        Leave Report Analytics
                                    </h2>
                                </div>
                            </div>

                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                activeTab === 'leave' 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                            }`}>
                                <ChevronRight size={18} className={`transition-transform duration-300 ${activeTab === 'leave' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                            </div>
                        </div>

                        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                            Filter by academic year session, examine class leave trends, analyze top reasons, explore records & export PDF reports.
                        </p>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5 text-indigo-600 font-extrabold">
                                <CalendarDays size={14} />
                                <span>{leaveStatsSummary.totalLeaves} Leaves ({selectedYearName})</span>
                            </span>
                            <span className="text-slate-400 font-semibold">
                                {academicYears.length} Sessions Available
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {/* ============================================================ */}
            {/* VIEW 1: ZEHNUTH ANALYTICS */}
            {/* ============================================================ */}
            {activeTab === 'zehnuth' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    
                    {/* View Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-60 -mr-6 -mt-6"></div>
                        <div className="relative z-10 space-y-1">
                            <div className="flex items-center gap-3 text-blue-600 font-bold text-sm tracking-widest uppercase">
                                <Trophy size={18} className="animate-pulse" />
                                <span>Class-wise Zehnuth Analytics</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Academic & Activity Points</h2>
                            <p className="text-sm font-semibold text-slate-400">Track and analyze approved student achievement points across all classes.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
                            <button 
                                onClick={handleCopy}
                                disabled={classWiseData.length === 0}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-600 font-bold text-sm rounded-2xl transition-all border border-blue-100 w-full sm:flex-1 md:w-auto shadow-sm active:scale-95"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        <span>Copy Points Data</span>
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={handleRefreshZehnuth}
                                disabled={refreshingZehnuth}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold text-sm rounded-2xl transition-all border border-slate-100 w-full sm:flex-1 md:w-auto shadow-sm active:scale-95"
                            >
                                <RefreshCw size={16} className={refreshingZehnuth ? "animate-spin text-blue-600" : ""} />
                                {refreshingZehnuth ? "Refreshing..." : "Refresh Points"}
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                <Trophy size={28} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Performing Class</span>
                                <div className="text-xl font-black text-slate-800">{zehnuthStats.topClass}</div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <Star size={28} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Approved Points</span>
                                <div className="text-xl font-black text-slate-800">{zehnuthStats.totalApprovedPoints} <span className="text-xs font-semibold text-slate-400">pts</span></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                <FileText size={28} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Submissions</span>
                                <div className="text-xl font-black text-slate-800">{zehnuthStats.totalSubmissions} <span className="text-xs font-semibold text-slate-400">records</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Select Months</h3>
                                    <p className="text-xs text-slate-400 font-bold">Filter performance data by single or multiple months.</p>
                                </div>
                            </div>
                            {selectedMonths.length > 0 && (
                                <button 
                                    onClick={clearMonthFilters}
                                    className="text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                    Reset Filter ({selectedMonths.length})
                                </button>
                            )}
                        </div>

                        {availableMonths.length === 0 ? (
                            <div className="text-center py-6 text-sm font-semibold text-slate-400">
                                No achievement records available to generate month filters.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                <button
                                    onClick={clearMonthFilters}
                                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 border ${
                                        selectedMonths.length === 0
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    All Months
                                </button>

                                {availableMonths.map(({ key, label }) => {
                                    const isSelected = selectedMonths.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => toggleMonth(key)}
                                            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all duration-200 border flex items-center gap-2 ${
                                                isSelected
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span>{label}</span>
                                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Class Leaderboard and Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Class Performance Leaderboard */}
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Class Performance Rankings</h3>
                                    <p className="text-xs text-slate-400 font-bold">List of all classes sorted by points in the selected timeframe.</p>
                                </div>
                            </div>

                            {classWiseData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                                    <AlertCircle className="w-12 h-12 text-slate-300" />
                                    <div className="text-slate-400 font-bold text-sm">No approved points found for the selected filter.</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {classWiseData.map((item, index) => {
                                        const rank = index + 1;
                                        const pointsPercent = Math.round((item.totalPoints / maxPoints) * 100);
                                        
                                        let rankBg = 'bg-slate-50 text-slate-600';
                                        let rankBorder = 'border-slate-100';
                                        if (rank === 1 && item.totalPoints > 0) {
                                            rankBg = 'bg-amber-500 text-white shadow-md shadow-amber-200';
                                            rankBorder = 'border-amber-500';
                                        } else if (rank === 2 && item.totalPoints > 0) {
                                            rankBg = 'bg-slate-300 text-slate-800';
                                            rankBorder = 'border-slate-300';
                                        } else if (rank === 3 && item.totalPoints > 0) {
                                            rankBg = 'bg-amber-700 text-white';
                                            rankBorder = 'border-amber-700';
                                        }

                                        return (
                                            <div 
                                                key={item.classNum}
                                                className="p-5 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/50 hover:shadow-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border ${rankBg} ${rankBorder}`}>
                                                        {rank}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-slate-800">Class {item.classNum}</h4>
                                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                                            {item.uniqueStudentsCount} Active Achievers • {item.submissionsCount} Submissions
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-5 md:w-64">
                                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                                rank === 1 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                                                rank === 2 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                                                rank === 3 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                                                                'bg-gradient-to-r from-blue-400 to-blue-500'
                                                            }`} 
                                                            style={{ width: `${pointsPercent}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-lg font-black text-slate-800">{item.totalPoints}</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Zehnuth Insights Card */}
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Insights</h3>
                                    <p className="text-xs text-slate-400 font-bold">Important summaries & distribution rules.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-gradient-to-br from-[#0A84C6]/5 to-[#0A84C6]/10 border border-[#0A84C6]/10 rounded-2xl space-y-3">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Filters</span>
                                    <div className="text-sm font-bold text-slate-700 leading-relaxed">
                                        Showing data for <span className="font-extrabold text-blue-600">{selectedMonths.length === 0 ? "All Months" : `${selectedMonths.length} Months selected`}</span>.
                                    </div>
                                    <div className="text-xs text-slate-500 font-bold leading-normal">
                                        Aggregate details reflect approved student achievements registered on the portal under the Zehnuth guidelines.
                                    </div>
                                </div>

                                <div className="p-5 border border-slate-100 rounded-2xl space-y-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Allocation Info</span>
                                    <div className="space-y-3">
                                        <div className="flex gap-3 text-xs font-bold text-slate-600">
                                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">✓</div>
                                            <p>Approved points automatically boost class leaderboard positions.</p>
                                        </div>
                                        <div className="flex gap-3 text-xs font-bold text-slate-600">
                                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">✓</div>
                                            <p>Points from exam rankings, presentations, articles, and activities are aggregated.</p>
                                        </div>
                                        <div className="flex gap-3 text-xs font-bold text-slate-600">
                                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">✓</div>
                                            <p>Classes with highest points obtain Champion and Star badges at the end of academic semesters.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 2: LEAVE REPORT ANALYTICS */}
            {/* ============================================================ */}
            {activeTab === 'leave' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    
                    {/* View Header with Academic Year Session Selector & PDF Export */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-60 -mr-12 -mt-12"></div>
                        
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-3 text-indigo-600 font-bold text-sm tracking-widest uppercase">
                                <FileSpreadsheet size={18} className="animate-pulse" />
                                <span>Leave Report Analytics</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                                Session Leave Intelligence & Trends
                            </h2>
                            <p className="text-sm font-semibold text-slate-400">
                                Analyze leave frequency, top 10 reasons, class-level patterns, and download complete reports.
                            </p>
                        </div>

                        {/* Controls Toolbar: Session Dropdown + Export PDF + Refresh */}
                        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            
                            {/* Academic Year Session Switcher */}
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2.5 shadow-sm">
                                <CalendarDays size={18} className="text-indigo-600 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Academic Session</span>
                                    <select
                                        value={selectedYearId}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                        className="bg-transparent font-black text-xs md:text-sm text-slate-800 focus:outline-none cursor-pointer pr-2"
                                    >
                                        <option value="all">All Academic Sessions</option>
                                        {academicYears.map(y => (
                                            <option key={y._id} value={y._id}>
                                                {y.name} {y.isActive ? '(Active Session)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Export PDF Button */}
                            <button
                                onClick={handleExportPDF}
                                disabled={exportingPdf || leaves.length === 0}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 shrink-0"
                            >
                                {exportingPdf ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Generating PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>Export PDF Report</span>
                                    </>
                                )}
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefreshLeaves}
                                disabled={refreshingLeaves || leaveLoading}
                                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold text-sm rounded-2xl transition-all border border-slate-100 shadow-sm active:scale-95"
                                title="Refresh Leave Records"
                            >
                                <RefreshCw size={16} className={refreshingLeaves || leaveLoading ? "animate-spin text-indigo-600" : ""} />
                            </button>

                        </div>
                    </div>

                    {leaveLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-[2rem] border border-slate-100">
                            <Loader2 size={36} className="animate-spin text-indigo-600" />
                            <div className="text-slate-500 font-bold text-sm">Loading session leave intelligence...</div>
                        </div>
                    ) : (
                        <>
                            {/* Leave Stats Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                
                                {/* Stat 1: Total Leaves */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                                    <div className="w-13 h-13 p-3.5 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                        <FileSpreadsheet size={26} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Leaves</span>
                                        <div className="text-2xl font-black text-slate-800">{leaveStatsSummary.totalLeaves}</div>
                                        <div className="text-[11px] font-bold text-indigo-600">{leaveStatsSummary.uniqueStudentsCount} unique students</div>
                                    </div>
                                </div>

                                {/* Stat 2: Class with Most Leaves */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                                    <div className="w-13 h-13 p-3.5 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                        <BarChart3 size={26} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Leave-Taking Class</span>
                                        <div className="text-2xl font-black text-slate-800">{leaveStatsSummary.topClass}</div>
                                        <div className="text-[11px] font-bold text-rose-500">{leaveStatsSummary.topClassLeaves} recorded leaves</div>
                                    </div>
                                </div>

                                {/* Stat 3: Primary Reason */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                                    <div className="w-13 h-13 p-3.5 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                        <PieChart size={26} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Reason</span>
                                        <div className="text-lg font-black text-slate-800 truncate max-w-[150px]" title={leaveStatsSummary.topReason}>
                                            {leaveStatsSummary.topReason}
                                        </div>
                                        <div className="text-[11px] font-bold text-amber-600">
                                            {leaveStatsSummary.topReasonCount} times ({leaveStatsSummary.topReasonPct}%)
                                        </div>
                                    </div>
                                </div>

                                {/* Stat 4: Active vs Returned */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                                    <div className="w-13 h-13 p-3.5 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                        <UserCheck size={26} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Returned Status</span>
                                        <div className="text-2xl font-black text-slate-800">{leaveStatsSummary.returnedCount}</div>
                                        <div className="text-[11px] font-bold text-emerald-600">
                                            {leaveStatsSummary.activeCount} currently on leave / late
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Class-wise Leave Distribution & Reasons Frequency Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
                                {/* 1. Class-wise Leave Distribution */}
                                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                <Layers size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">Class-wise Leave Distribution</h3>
                                                <p className="text-xs text-slate-400 font-bold">Sorted by total leave applications in {selectedYearName}.</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl self-start sm:self-auto">
                                            {classWiseLeaves.length} Classes Recorded
                                        </span>
                                    </div>

                                    {classWiseLeaves.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                                            <AlertCircle className="w-12 h-12 text-slate-300" />
                                            <div className="text-slate-400 font-bold text-sm">No leave records found for {selectedYearName}.</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {classWiseLeaves.map((c, index) => {
                                                const rank = index + 1;
                                                const pct = Math.round((c.totalLeaves / maxClassLeaves) * 100);

                                                return (
                                                    <div 
                                                        key={c.classNum}
                                                        className="p-4 md:p-5 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/60 hover:shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 border border-slate-200">
                                                                #{rank}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-base font-black text-slate-800">Class {c.classNum}</h4>
                                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                                        {c.uniqueStudentsCount} students
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                                                    Top Reason: <span className="text-slate-600 font-bold">{c.topReason}</span>
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Progress bar + Leave Count + Active badge */}
                                                        <div className="flex items-center gap-4 md:w-72 justify-between md:justify-end">
                                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                                                                <div 
                                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700" 
                                                                    style={{ width: `${pct}%` }}
                                                                ></div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2.5 shrink-0">
                                                                {c.statusCounts.active + c.statusCounts.late > 0 && (
                                                                    <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-100">
                                                                        {c.statusCounts.active + c.statusCounts.late} Active
                                                                    </span>
                                                                )}
                                                                <div className="text-right">
                                                                    <span className="text-base font-black text-slate-800">{c.totalLeaves}</span>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">leaves</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* 2. Most Frequent Leave Reasons (Top 10) */}
                                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                                                <PieChart size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">Top 10 Leave Reasons</h3>
                                                <p className="text-xs text-slate-400 font-bold">Most frequent reasons in session.</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                                            Top 10
                                        </span>
                                    </div>

                                    {top10Reasons.length === 0 ? (
                                        <div className="text-center py-10 text-sm font-semibold text-slate-400">
                                            No reason analytics recorded.
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {top10Reasons.map((item, idx) => (
                                                <div key={item.reason} className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                                                    <div className="flex items-center justify-between text-xs font-black text-slate-800">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-md bg-white text-slate-500 flex items-center justify-center text-[10px] shadow-sm font-black">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="truncate max-w-[140px]" title={item.reason}>{item.reason}</span>
                                                        </span>
                                                        <span className="text-indigo-600 font-extrabold">{item.count} ({item.percentage}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-700 ${
                                                                idx === 0 ? 'bg-indigo-500' :
                                                                idx === 1 ? 'bg-blue-500' :
                                                                idx === 2 ? 'bg-amber-500' :
                                                                'bg-slate-400'
                                                            }`}
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-semibold text-right">
                                                        {item.uniqueStudents} unique student applicants
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Info Highlight */}
                                    <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                        <p className="text-xs font-bold text-emerald-800 leading-tight">
                                            Export PDF generates an official concise dossier with class distributions and top 10 reasons.
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Detailed Leave Records Explorer & Filter Table */}
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800">Detailed Leave Records</h3>
                                            <p className="text-xs text-slate-400 font-bold">Search, filter, and inspect student leave records.</p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-black text-slate-500">
                                        Showing <span className="text-indigo-600 font-black">{filteredLeaves.length}</span> of {leaves.length} records
                                    </div>
                                </div>

                                {/* Filters Toolbar */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={leaveSearch}
                                            onChange={(e) => setLeaveSearch(e.target.value)}
                                            placeholder="Search name, ADNO, reason..."
                                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    {/* Class Filter */}
                                    <div className="relative">
                                        <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={classFilter}
                                            onChange={(e) => setClassFilter(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="all">All Classes</option>
                                            {leaveClassesList.map(cls => (
                                                <option key={cls} value={cls}>Class {cls}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="returned">Returned</option>
                                            <option value="active">Active</option>
                                            <option value="late">Late</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Detailed Table */}
                                {filteredLeaves.length === 0 ? (
                                    <div className="py-14 text-center space-y-2">
                                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                                        <div className="text-slate-500 font-bold text-sm">No leave records match the filters.</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-100">
                                                    <th className="py-3.5 px-4">Student</th>
                                                    <th className="py-3.5 px-4">Class</th>
                                                    <th className="py-3.5 px-4">Reason</th>
                                                    <th className="py-3.5 px-4">From Date & Time</th>
                                                    <th className="py-3.5 px-4">To Date & Time</th>
                                                    <th className="py-3.5 px-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                {filteredLeaves.slice(0, 50).map((l) => {
                                                    const st = l.studentId;
                                                    const name = st ? (st["SHORT NAME"] || st["FULL NAME"] || 'Student') : 'Unknown';
                                                    const adno = st?.ADNO;
                                                    const cls = st?.CLASS;
                                                    const stStatus = String(l.status || 'scheduled').toLowerCase();

                                                    let badgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
                                                    if (stStatus === 'returned') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                                    else if (stStatus === 'active') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                                    else if (stStatus === 'late') badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';

                                                    return (
                                                        <tr key={l._id} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="py-3 px-4">
                                                                <div className="font-bold text-slate-800">{name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">ADNO: {adno || '-'}</div>
                                                            </td>
                                                            <td className="py-3 px-4 font-bold text-slate-800">
                                                                Class {cls || '-'}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="font-bold text-slate-700">{l.reason || '-'}</span>
                                                                {l.disease && (
                                                                    <div className="text-[10px] text-rose-500 font-semibold">{l.disease}</div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 font-semibold text-slate-600">
                                                                {l.fromDate} <span className="text-[10px] text-slate-400">({l.fromTime})</span>
                                                            </td>
                                                            <td className="py-3 px-4 font-semibold text-slate-600">
                                                                {l.toDate || '-'} <span className="text-[10px] text-slate-400">({l.toTime || '-'})</span>
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                                                                    {stStatus}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {filteredLeaves.length > 50 && (
                                            <div className="p-3 text-center text-xs font-bold text-slate-400 bg-slate-50 border-t border-slate-100">
                                                Showing top 50 records of {filteredLeaves.length}.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                </div>
            )}

        </div>
    );
}
