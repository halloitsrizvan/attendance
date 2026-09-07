"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Trophy, Award, Calendar, Search, Filter, 
    ArrowLeft, Download, RefreshCw, ExternalLink,
    CheckCircle2, AlertCircle, Eye, X, Star,
    Mic, Sparkles, Medal, User, FileText, ChevronDown,
    Building2, Layers
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

export default function ZehnuthAchievementsReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [points, setPoints] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Filters State
    const [selectedCategory, setSelectedCategory] = useState('ALL_TARGET'); // 'ALL_TARGET', 'PRESENTATIONS_OUT', 'ACHIEVEMENTS', 'COMPETITIONS_OUT'
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedClass, setSelectedClass] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('approved');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [exportingPdf, setExportingPdf] = useState(false);

    useEffect(() => {
        fetchProfileAndPoints();
    }, []);

    const fetchProfileAndPoints = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            setLoading(true);
            const profileRes = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const profileData = profileRes.data;
            const roles = Array.isArray(profileData.role) ? profileData.role : [profileData.role];
            const normalizedRoles = roles.map(r => String(r || '').toLowerCase());
            if (!normalizedRoles.includes('lisan')) {
                router.push('/students-portal');
                return;
            }
            setStudent(profileData);

            // Fetch all points
            const pointsRes = await axios.get(`${API_PORT}/zehnuth/points`);
            setPoints(pointsRes.data || []);

        } catch (err) {
            console.error("Error loading Zehnuth report page:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const pointsRes = await axios.get(`${API_PORT}/zehnuth/points`);
            setPoints(pointsRes.data || []);
        } catch (err) {
            console.error("Error refreshing points:", err);
        } finally {
            setRefreshing(false);
        }
    };

    // Helper to identify specific categories & outside-campus conditions
    const isOutsidePresentation = (item) => {
        if (item.category !== 'Presentation') return false;
        const act = (item.activity || '').toLowerCase();
        // Check for outside campus conditions
        if (act.includes('(in)') || act === 'speech' || act.includes('inside campus')) {
            return false;
        }
        return true;
    };

    const isAchievementsCategory = (item) => {
        if (item.category !== 'Achievements') return false;
        const act = (item.activity || '').toLowerCase();
        if (act.includes('innovation')) return false;
        return true;
    };

    const isOutsideCompetition = (item) => {
        if (item.category !== 'Competitions') return false;
        const act = (item.activity || '').toLowerCase();
        // Check for outside campus conditions
        if (act.includes('(in)') || act.includes('inside campus')) {
            return false;
        }
        return true;
    };

    const isTargetCategory = (item) => {
        return isOutsidePresentation(item) || isAchievementsCategory(item) || isOutsideCompetition(item);
    };

    const getSpecificCategoryType = (item) => {
        if (isOutsidePresentation(item)) return 'Presentation (Outside)';
        if (isAchievementsCategory(item)) return 'Achievement';
        if (isOutsideCompetition(item)) return 'Competition (Outside)';
        return item.category || 'Other';
    };

    // Helper functions for Month formatting
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

    // Extract available months from target records
    const availableMonths = useMemo(() => {
        const monthsMap = {};
        points.forEach(p => {
            if (isTargetCategory(p) && p.createdAt) {
                const key = getMonthSortKey(p.createdAt);
                const label = getMonthLabel(p.createdAt);
                monthsMap[key] = label;
            }
        });

        return Object.keys(monthsMap)
            .sort((a, b) => b.localeCompare(a))
            .map(key => ({ key, label: monthsMap[key] }));
    }, [points]);

    // Extract available classes
    const availableClasses = useMemo(() => {
        const classes = new Set();
        points.forEach(p => {
            if (isTargetCategory(p) && p.studentId?.CLASS !== undefined) {
                classes.add(Number(p.studentId.CLASS));
            }
        });
        return Array.from(classes).sort((a, b) => a - b);
    }, [points]);

    // Filter points based on category, month, class, status, and search
    const filteredPoints = useMemo(() => {
        return points.filter(item => {
            // Must belong to one of the 3 requested target categories
            if (!isTargetCategory(item)) return false;

            // Category Filter
            if (selectedCategory === 'PRESENTATIONS_OUT' && !isOutsidePresentation(item)) return false;
            if (selectedCategory === 'ACHIEVEMENTS' && !isAchievementsCategory(item)) return false;
            if (selectedCategory === 'COMPETITIONS_OUT' && !isOutsideCompetition(item)) return false;

            // Month Filter
            if (selectedMonth !== 'All') {
                if (!item.createdAt) return false;
                const key = getMonthSortKey(item.createdAt);
                if (key !== selectedMonth) return false;
            }

            // Class Filter
            if (selectedClass !== 'All') {
                if (String(item.studentId?.CLASS) !== String(selectedClass)) return false;
            }

            // Status Filter
            if (selectedStatus !== 'all') {
                if (String(item.status || 'pending').toLowerCase() !== selectedStatus.toLowerCase()) return false;
            }

            // Search Query Filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const stName = String(item.studentId?.["FULL NAME"] || item.studentId?.["SHORT NAME"] || '').toLowerCase();
                const adno = String(item.studentId?.ADNO || '');
                const act = String(item.activity || '').toLowerCase();
                const rem = String(item.remarks || '').toLowerCase();
                const mentor = String(item.mentorId?.name || '').toLowerCase();

                if (!stName.includes(q) && !adno.includes(q) && !act.includes(q) && !rem.includes(q) && !mentor.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [points, selectedCategory, selectedMonth, selectedClass, selectedStatus, searchQuery]);

    // Key Stats Summary
    const statsSummary = useMemo(() => {
        let presCount = 0;
        let achCount = 0;
        let compCount = 0;
        let totalPointsCount = 0;
        const studentSet = new Set();

        filteredPoints.forEach(p => {
            if (isOutsidePresentation(p)) presCount++;
            if (isAchievementsCategory(p)) achCount++;
            if (isOutsideCompetition(p)) compCount++;
            totalPointsCount += Number(p.points) || 0;
            if (p.studentId?._id) studentSet.add(p.studentId._id.toString());
        });

        return {
            totalRecords: filteredPoints.length,
            presCount,
            achCount,
            compCount,
            totalPointsCount,
            uniqueStudents: studentSet.size
        };
    }, [filteredPoints]);

    // Export PDF Report
    const handleExportPDF = () => {
        try {
            setExportingPdf(true);
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Brand Header Banner
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 26, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.setTextColor(255, 255, 255);
            doc.text('LISAN PORTAL | ZEHNUTH ACHIEVEMENTS REPORT', 14, 12);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(203, 213, 225);
            const monthLabel = selectedMonth === 'All' ? 'All Months' : (availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth);
            doc.text(`Filter Timeframe: ${monthLabel}   |   Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 14, 19);

            let currentY = 34;

            // Summary Metrics Box
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(14, currentY, 182, 22, 3, 3, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);

            doc.text(`• Total Submissions: ${statsSummary.totalRecords} (${statsSummary.uniqueStudents} students)`, 18, currentY + 8);
            doc.text(`• Total Points: ${statsSummary.totalPointsCount} pts`, 110, currentY + 8);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(`• Outside Presentations: ${statsSummary.presCount}   |   Achievements: ${statsSummary.achCount}   |   Outside Competitions: ${statsSummary.compCount}`, 18, currentY + 16);

            currentY += 28;

            // Achievements Table
            const tableRows = filteredPoints.map((item, idx) => {
                const st = item.studentId;
                const name = st ? (st["SHORT NAME"] || st["FULL NAME"] || 'Student') : 'Unknown';
                const adno = st?.ADNO || '-';
                const cls = st?.CLASS ? `Class ${st.CLASS}` : '-';
                const cat = getSpecificCategoryType(item);
                const act = item.activity || '-';
                const remarks = item.remarks || '-';
                const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-';
                const pts = item.points !== undefined ? `${item.points} pts` : '-';
                const status = (item.status || 'pending').toUpperCase();

                return [idx + 1, name, adno, cls, cat, act, remarks, date, pts, status];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['#', 'Student Name', 'ADNO', 'Class', 'Category', 'Activity / Title', 'Remarks', 'Date', 'Points', 'Status']],
                body: tableRows.length > 0 ? tableRows : [['-', 'No matching achievements found', '-', '-', '-', '-', '-', '-', '-', '-']],
                theme: 'grid',
                headStyles: { 
                    fillColor: [15, 23, 42], 
                    textColor: [255, 255, 255], 
                    fontStyle: 'bold',
                    fontSize: 7,
                    halign: 'center'
                },
                bodyStyles: { 
                    fontSize: 7,
                    textColor: [51, 65, 85]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 7 },
                    1: { fontStyle: 'bold', cellWidth: 28 },
                    2: { halign: 'center', cellWidth: 14 },
                    3: { halign: 'center', cellWidth: 14 },
                    4: { cellWidth: 26 },
                    5: { fontStyle: 'bold', cellWidth: 28 },
                    6: { cellWidth: 24 },
                    7: { halign: 'center', cellWidth: 16 },
                    8: { halign: 'center', cellWidth: 12 },
                    9: { halign: 'center', cellWidth: 13 }
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
                    `Lisan Zehnuth Report • Page ${i} of ${pageCount} • Generated by Lisan Admin`,
                    105,
                    290,
                    { align: 'center' }
                );
            }

            doc.save(`Zehnuth_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to export PDF report. Please try again.");
        } finally {
            setExportingPdf(false);
        }
    };

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 max-w-7xl mx-auto px-1 pb-16">
            
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/students-portal/lisan')}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Lisan Hub</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                        Zehnuth Intelligence
                    </span>
                </div>
            </div>

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md text-amber-400">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md text-indigo-200">
                            Zehnuth Achievements Report
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Presentations, Achievements & External Competitions
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm font-semibold max-w-xl">
                        Track outside-campus presentations, student achievements, and external competition submissions with month-wise filters and PDF export.
                    </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={exportingPdf || filteredPoints.length === 0}
                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 shrink-0"
                    >
                        <Download size={16} />
                        <span>{exportingPdf ? "Generating..." : "Export PDF Report"}</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all border border-white/10 active:scale-95"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                
                {/* Stat 1: Outside Presentations */}
                <div 
                    onClick={() => setSelectedCategory('PRESENTATIONS_OUT')}
                    className={`cursor-pointer bg-white p-5 rounded-[2rem] border transition-all duration-300 flex items-center gap-4 ${
                        selectedCategory === 'PRESENTATIONS_OUT' 
                            ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
                            : 'border-slate-100 hover:border-slate-200 shadow-sm'
                    }`}
                >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Mic size={24} />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outside Presentations</span>
                        <div className="text-xl font-black text-slate-800">{statsSummary.presCount}</div>
                        <div className="text-[10px] font-bold text-indigo-600">External & State/National</div>
                    </div>
                </div>

                {/* Stat 2: Achievements */}
                <div 
                    onClick={() => setSelectedCategory('ACHIEVEMENTS')}
                    className={`cursor-pointer bg-white p-5 rounded-[2rem] border transition-all duration-300 flex items-center gap-4 ${
                        selectedCategory === 'ACHIEVEMENTS' 
                            ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20' 
                            : 'border-slate-100 hover:border-slate-200 shadow-sm'
                    }`}
                >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <Sparkles size={24} />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Achievements</span>
                        <div className="text-xl font-black text-slate-800">{statsSummary.achCount}</div>
                        <div className="text-[10px] font-bold text-amber-600">Courses, Awards, Publications</div>
                    </div>
                </div>

                {/* Stat 3: Outside Competitions */}
                <div 
                    onClick={() => setSelectedCategory('COMPETITIONS_OUT')}
                    className={`cursor-pointer bg-white p-5 rounded-[2rem] border transition-all duration-300 flex items-center gap-4 ${
                        selectedCategory === 'COMPETITIONS_OUT' 
                            ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                            : 'border-slate-100 hover:border-slate-200 shadow-sm'
                    }`}
                >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                        <Medal size={24} />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outside Competitions</span>
                        <div className="text-xl font-black text-slate-800">{statsSummary.compCount}</div>
                        <div className="text-[10px] font-bold text-emerald-600">1st, 2nd, 3rd & Participations</div>
                    </div>
                </div>

                {/* Stat 4: Total Points */}
                <div 
                    onClick={() => setSelectedCategory('ALL_TARGET')}
                    className={`cursor-pointer bg-white p-5 rounded-[2rem] border transition-all duration-300 flex items-center gap-4 ${
                        selectedCategory === 'ALL_TARGET' 
                            ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' 
                            : 'border-slate-100 hover:border-slate-200 shadow-sm'
                    }`}
                >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Star size={24} />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Points</span>
                        <div className="text-xl font-black text-slate-800">{statsSummary.totalPointsCount} <span className="text-xs font-semibold text-slate-400">pts</span></div>
                        <div className="text-[10px] font-bold text-blue-600">{statsSummary.uniqueStudents} unique achievers</div>
                    </div>
                </div>

            </div>

            {/* Category Filter Switcher Tabs */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-2 items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 flex items-center gap-1.5">
                    <Layers size={14} /> Category:
                </span>

                <button
                    onClick={() => setSelectedCategory('ALL_TARGET')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                        selectedCategory === 'ALL_TARGET'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                    }`}
                >
                    All 3 Target Categories
                </button>

                <button
                    onClick={() => setSelectedCategory('PRESENTATIONS_OUT')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        selectedCategory === 'PRESENTATIONS_OUT'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                    }`}
                >
                    <Mic size={14} />
                    <span>Presentations (Outside Campus Only)</span>
                </button>

                <button
                    onClick={() => setSelectedCategory('ACHIEVEMENTS')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        selectedCategory === 'ACHIEVEMENTS'
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                    }`}
                >
                    <Sparkles size={14} />
                    <span>Achievements</span>
                </button>

                <button
                    onClick={() => setSelectedCategory('COMPETITIONS_OUT')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        selectedCategory === 'COMPETITIONS_OUT'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                    }`}
                >
                    <Medal size={14} />
                    <span>Competitions (Outside Campus Only)</span>
                </button>
            </div>

            {/* Month & Secondary Filters Bar */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                
                {/* Month Filter Section */}
                <div className="space-y-3 border-b border-slate-100 pb-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                            <Calendar size={16} className="text-indigo-600" />
                            <span>Filter by Month</span>
                        </div>
                        {selectedMonth !== 'All' && (
                            <button
                                onClick={() => setSelectedMonth('All')}
                                className="text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider transition-colors"
                            >
                                Reset Month Filter
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
                        <button
                            onClick={() => setSelectedMonth('All')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedMonth === 'All'
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            All Months
                        </button>

                        {availableMonths.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setSelectedMonth(key)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                                    selectedMonth === key
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search & Class / Status Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, ADNO, activity, remarks..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Class Selector */}
                    <div className="relative">
                        <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="All">All Classes</option>
                            {availableClasses.map(cls => (
                                <option key={cls} value={cls}>Class {cls}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Selector */}
                    <div className="relative">
                        <CheckCircle2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="approved">Approved Only</option>
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

            </div>

            {/* Achievements Records Table / View */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Achievement Submissions</h3>
                            <p className="text-xs text-slate-400 font-bold">Showing validated records for selected categories.</p>
                        </div>
                    </div>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 self-start sm:self-auto">
                        {filteredPoints.length} Records Found
                    </span>
                </div>

                {filteredPoints.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                        <div className="text-slate-500 font-bold text-sm">No achievement records match the active criteria.</div>
                        <p className="text-xs text-slate-400">Try adjusting your category, month, or search filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-100">
                                    <th className="py-3.5 px-4">Student</th>
                                    <th className="py-3.5 px-4">Class</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Activity Title</th>
                                    <th className="py-3.5 px-4">Remarks</th>
                                    <th className="py-3.5 px-4">Proof</th>
                                    <th className="py-3.5 px-4 text-center">Points</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {filteredPoints.map((item) => {
                                    const st = item.studentId;
                                    const name = st ? (st["SHORT NAME"] || st["FULL NAME"] || 'Student') : 'Unknown';
                                    const adno = st?.ADNO;
                                    const cls = st?.CLASS;
                                    const catType = getSpecificCategoryType(item);
                                    const stStatus = String(item.status || 'pending').toLowerCase();

                                    let catBadge = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                                    if (isAchievementsCategory(item)) catBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                                    else if (isOutsideCompetition(item)) catBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Student info */}
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-800">{name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold">ADNO: {adno || '-'}</div>
                                            </td>

                                            {/* Class */}
                                            <td className="py-3 px-4 font-bold text-slate-800">
                                                Class {cls || '-'}
                                            </td>

                                            {/* Category */}
                                            <td className="py-3 px-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${catBadge}`}>
                                                    {catType}
                                                </span>
                                            </td>

                                            {/* Activity Title */}
                                            <td className="py-3 px-4">
                                                <div className="font-extrabold text-slate-800">{item.activity || '-'}</div>
                                                <div className="text-[10px] text-slate-400 font-semibold">
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-'}
                                                </div>
                                            </td>

                                            {/* Remarks */}
                                            <td className="py-3 px-4 max-w-[200px]">
                                                <p className="text-slate-600 font-semibold text-xs truncate" title={item.remarks || ''}>
                                                    {item.remarks || '-'}
                                                </p>
                                                {item.mentorId?.name && (
                                                    <div className="text-[10px] text-slate-400">Mentor: {item.mentorId.name}</div>
                                                )}
                                            </td>

                                            {/* Proof Image / Link */}
                                            <td className="py-3 px-4">
                                                {item.imageUrl ? (
                                                    <button
                                                        onClick={() => setPreviewImage(item.imageUrl)}
                                                        className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-100 transition-all"
                                                    >
                                                        <Eye size={12} /> View
                                                    </button>
                                                ) : item.websiteLink ? (
                                                    <a
                                                        href={item.websiteLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-[10px] font-black uppercase text-sky-600 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-100 transition-all"
                                                    >
                                                        <ExternalLink size={12} /> Link
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 font-bold">-</span>
                                                )}
                                            </td>

                                            {/* Points */}
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-black text-sm text-slate-800">{item.points || 0}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase ml-1">pts</span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    stStatus === 'approved'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : stStatus === 'rejected'
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {stStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Proof Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
                    <div className="relative bg-white rounded-3xl p-4 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Achievement Proof Preview</span>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
                            <img src={previewImage} alt="Proof" className="max-h-[70vh] object-contain rounded-2xl" />
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 px-2">
                            <a
                                href={previewImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                            >
                                <ExternalLink size={14} /> Open Full View
                            </a>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
