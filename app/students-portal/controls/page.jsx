"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Sliders, Star, Trophy, Calendar, Users, FileText, 
    TrendingUp, Award, Loader2, ArrowLeft, RefreshCw,
    CheckCircle2, ChevronRight, BarChart3, AlertCircle, Copy
} from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

export default function ControlsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [points, setPoints] = useState([]);
    const [selectedMonths, setSelectedMonths] = useState([]); // Array of Month-Year sort keys
    const [refreshing, setRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);

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
            // Fetch student profile
            const profileRes = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileData = profileRes.data;

            // Restrict page access to StudentAdmin role
            if (!profileData.role || profileData.role.toLowerCase() !== 'studentadmin') {
                router.push('/students-portal');
                return;
            }
            setStudent(profileData);

            // Fetch approved points
            const pointsRes = await axios.get(`${API_PORT}/zehnuth/points?status=approved`);
            setPoints(pointsRes.data || []);
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

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const pointsRes = await axios.get(`${API_PORT}/zehnuth/points?status=approved`);
            setPoints(pointsRes.data || []);
        } catch (err) {
            console.error("Error refreshing points data:", err);
        } finally {
            setRefreshing(false);
        }
    };

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
            `class ${item.classNum}: ${item.totalPoints} points (${item.uniqueStudentsCount} achivers, ${item.submissionsCount} submissions)`
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

    // Helper functions for Month-Year keys
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

    // Dynamically retrieve all unique Month-Years from point records
    const availableMonths = useMemo(() => {
        const monthsMap = {};
        points.forEach(p => {
            if (p.createdAt) {
                const key = getMonthSortKey(p.createdAt);
                const label = getMonthLabel(p.createdAt);
                monthsMap[key] = label;
            }
        });
        
        // Return sorted newest first
        return Object.keys(monthsMap)
            .sort((a, b) => b.localeCompare(a))
            .map(key => ({ key, label: monthsMap[key] }));
    }, [points]);

    // Handle selection toggling
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

    // Filter points based on selected months
    const filteredPoints = useMemo(() => {
        if (selectedMonths.length === 0) return points;
        return points.filter(p => {
            if (!p.createdAt) return false;
            const key = getMonthSortKey(p.createdAt);
            return selectedMonths.includes(key);
        });
    }, [points, selectedMonths]);

    // Extract all unique classes present in overall point history
    const allUniqueClasses = useMemo(() => {
        const classes = new Set();
        points.forEach(p => {
            if (p.studentId && p.studentId.CLASS !== undefined) {
                classes.add(Number(p.studentId.CLASS));
            }
        });
        return Array.from(classes).sort((a, b) => a - b);
    }, [points]);

    // Group and sum points class-wise
    const classWiseData = useMemo(() => {
        const classMap = {};
        
        // Initialize all unique classes with 0 points
        allUniqueClasses.forEach(classNum => {
            classMap[classNum] = {
                classNum,
                totalPoints: 0,
                studentsCount: new Set(),
                submissionsCount: 0
            };
        });

        // Accumulate points
        filteredPoints.forEach(p => {
            const student = p.studentId;
            if (!student) return;
            const classNum = Number(student.CLASS);
            if (isNaN(classNum)) return;

            // In case we have a class number that wasn't in allUniqueClasses
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
            if (student._id) {
                classMap[classNum].studentsCount.add(student._id.toString());
            }
        });

        // Convert to array and sort descending by total points
        return Object.values(classMap)
            .map(c => ({
                ...c,
                uniqueStudentsCount: c.studentsCount.size
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints);
    }, [filteredPoints, allUniqueClasses]);

    // Summary statistics
    const statsSummary = useMemo(() => {
        const totalApprovedPoints = filteredPoints.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
        const totalSubmissions = filteredPoints.length;
        const topClass = classWiseData.length > 0 && classWiseData[0].totalPoints > 0 
            ? `Class ${classWiseData[0].classNum}` 
            : 'N/A';
            
        return {
            totalApprovedPoints,
            totalSubmissions,
            topClass
        };
    }, [filteredPoints, classWiseData]);

    // Max points in the current list to calculate relative percentage bars
    const maxPoints = useMemo(() => {
        if (classWiseData.length === 0) return 1;
        const maxVal = Math.max(...classWiseData.map(c => c.totalPoints));
        return maxVal > 0 ? maxVal : 1;
    }, [classWiseData]);

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto px-1">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-60 -mr-6 -mt-6"></div>
                <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-3 text-blue-600 font-bold text-sm tracking-widest uppercase">
                        <Sliders size={18} className="animate-pulse" />
                        <span>StudentAdmin Area</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Class-wise Zehnuth Analytics</h1>
                    <p className="text-sm font-semibold text-slate-400">Monitor academic and extracurricular achievements across all classes.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleCopy}
                        disabled={classWiseData.length === 0}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-600 font-bold text-sm rounded-2xl transition-all border border-blue-100 w-full sm:flex-1 md:w-auto"
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
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold text-sm rounded-2xl transition-all border border-slate-100 w-full sm:flex-1 md:w-auto"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin text-blue-600" : ""} />
                        {refreshing ? "Refreshing Data..." : "Refresh Points"}
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Stat 1 */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <Trophy size={28} />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Performing Class</span>
                        <div className="text-xl font-black text-slate-800">{statsSummary.topClass}</div>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <Star size={28} />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Approved Points</span>
                        <div className="text-xl font-black text-slate-800">{statsSummary.totalApprovedPoints} <span className="text-xs font-semibold text-slate-400">pts</span></div>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <FileText size={28} />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Submissions</span>
                        <div className="text-xl font-black text-slate-800">{statsSummary.totalSubmissions} <span className="text-xs font-semibold text-slate-400">records</span></div>
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
                        {/* "All Months" Pill */}
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

                        {/* Custom Month Pills */}
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
                
                {/* Class Performance Leaderboard (List View) */}
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
                                
                                // Color scheme based on rank
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
                                            {/* Rank Badge */}
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

                                        {/* Progress Bar & Value */}
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

                {/* Class Performance Cards (Grid/Summary view) */}
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
                        {/* Summary info card */}
                        <div className="p-5 bg-gradient-to-br from-[#0A84C6]/5 to-[#0A84C6]/10 border border-[#0A84C6]/10 rounded-2xl space-y-3">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Filters</span>
                            <div className="text-sm font-bold text-slate-700 leading-relaxed">
                                Showing data for <span className="font-extrabold text-blue-600">{selectedMonths.length === 0 ? "All Months" : `${selectedMonths.length} Months selected`}</span>.
                            </div>
                            <div className="text-xs text-slate-500 font-bold leading-normal">
                                Aggregate details reflect approved student achievements registered on the portal under the Zehnuth guidelines.
                            </div>
                        </div>

                        {/* General guidelines */}
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
    );
}
