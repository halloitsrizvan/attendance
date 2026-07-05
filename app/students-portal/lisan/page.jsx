"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    BookOpen, Calendar, Image as ImageIcon, Search, 
    AlertCircle, ChevronDown, Award, Trophy, Loader2, 
    RefreshCw, Filter, ShieldCheck, CheckCircle2, AlertTriangle, Clock, Download
} from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

export default function LisanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [reports, setReports] = useState([]);

    // Filters and Search State
    const [selectedClass, setSelectedClass] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProfileAndReports();
    }, []);

    const handleDownloadPoster = async (url, filename) => {
        try {
            // Transform Cloudinary URL if possible to force download headers
            let downloadUrl = url;
            if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
                downloadUrl = url.replace('/image/upload/', '/image/upload/fl_attachment/');
            }
            
            // Try fetching as blob (best user experience)
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'poster.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("CORS or network error during direct download, trying link method:", error);
            // Fallback: open transformed download link directly or open in new tab
            let fallbackUrl = url;
            if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
                fallbackUrl = url.replace('/image/upload/', '/image/upload/fl_attachment/');
            }
            window.open(fallbackUrl, '_blank');
        }
    };

    const fetchProfileAndReports = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const profileData = res.data;
            const roles = Array.isArray(profileData.role) ? profileData.role : [profileData.role];
            const normalizedRoles = roles.map(r => String(r || '').toLowerCase());
            if (!normalizedRoles.includes('lisan')) {
                router.push('/students-portal');
                return;
            }

            setStudent(profileData);

            // Fetch all reports
            const reportsRes = await axios.get(`${API_PORT}/class-reports`);
            setReports(reportsRes.data || []);

        } catch (err) {
            console.error("Error fetching data on Lisan page:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    // Extract unique classes and months for filter lists
    const filterOptions = useMemo(() => {
        const classes = new Set();
        const months = new Set();
        
        reports.forEach(report => {
            if (report.classNumber) classes.add(report.classNumber);
            if (report.month) months.add(report.month);
        });

        return {
            classes: Array.from(classes).sort((a, b) => a - b),
            months: Array.from(months)
        };
    }, [reports]);

    // Apply filtering and searching
    const filteredReports = useMemo(() => {
        let result = reports.map(report => {
            // Filter programs within the report
            const filteredPrograms = (report.programs || []).filter(prog => {
                const matchesSearch = prog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    prog.description?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSearch;
            });

            return {
                ...report,
                programs: filteredPrograms
            };
        });

        // Remove reports with no programs matching search, unless query is empty
        if (searchQuery) {
            result = result.filter(report => report.programs.length > 0);
        }

        // Filter by classNumber
        if (selectedClass !== 'All') {
            result = result.filter(report => String(report.classNumber) === String(selectedClass));
        }

        // Filter by month
        if (selectedMonth !== 'All') {
            result = result.filter(report => report.month === selectedMonth);
        }

        return result;
    }, [reports, selectedClass, selectedMonth, searchQuery]);

    // Grouping helper: Group reports by classNumber
    const groupedByClass = useMemo(() => {
        const groups = {};
        filteredReports.forEach(report => {
            if (report.programs.length === 0) return;
            const classKey = `Class ${report.classNumber}`;
            if (!groups[classKey]) {
                groups[classKey] = {
                    classNumber: report.classNumber,
                    months: {}
                };
            }

            const monthKey = `${report.month} ${report.year}`;
            if (!groups[classKey].months[monthKey]) {
                groups[classKey].months[monthKey] = [];
            }
            groups[classKey].months[monthKey].push(report);
        });

        // Convert to sorted array of classes
        return Object.values(groups).sort((a, b) => a.classNumber - b.classNumber);
    }, [filteredReports]);

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-sky-500 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl shadow-sky-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md">
                            Lisan Dashboard
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Class Programs Directory</h1>
                    <p className="text-sky-100 text-xs sm:text-sm font-semibold max-w-xl">
                        Monitor, filter, and review class program submissions and reports from students and teachers class-wise and month-wise.
                    </p>
                </div>
                {/* <button 
                    onClick={fetchProfileAndReports}
                    className="flex items-center gap-2 self-start md:self-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all rounded-2xl text-xs font-black uppercase tracking-widest"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh Data
                </button> */}
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search input */}
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text"
                        placeholder="Search programs..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-blue-400 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 text-slate-700"
                    />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                    
                    {/* Class Selector */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                        <select 
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl pl-10 pr-8 py-3 text-xs font-black uppercase tracking-widest text-slate-600 outline-none appearance-none cursor-pointer w-full focus:border-blue-400 focus:bg-white transition-all"
                        >
                            <option value="All">All Classes</option>
                            {filterOptions.classes.map(cNum => (
                                <option key={cNum} value={cNum}>Class {cNum}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>

                    {/* Month Selector */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                        <select 
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl pl-10 pr-8 py-3 text-xs font-black uppercase tracking-widest text-slate-600 outline-none appearance-none cursor-pointer w-full focus:border-blue-400 focus:bg-white transition-all"
                        >
                            <option value="All">All Months</option>
                            {filterOptions.months.map(mName => (
                                <option key={mName} value={mName}>{mName}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Reports Display Section */}
            <div className="space-y-10">
                {groupedByClass.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-slate-300" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-800">No Program Reports Found</h3>
                            <p className="text-sm text-slate-400 font-semibold max-w-sm">
                                Try resetting the search or filter settings to display results.
                            </p>
                        </div>
                        {(selectedClass !== 'All' || selectedMonth !== 'All' || searchQuery !== '') && (
                            <button 
                                onClick={() => {
                                    setSelectedClass('All');
                                    setSelectedMonth('All');
                                    setSearchQuery('');
                                }}
                                className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all rounded-2xl text-xs font-black uppercase tracking-widest"
                            >
                                Reset All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    groupedByClass.map(classGroup => (
                        <div key={classGroup.classNumber} className="space-y-6">
                            
                            {/* Class Main Heading */}
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                    Class {classGroup.classNumber}
                                </h2>
                                <div className="h-0.5 bg-slate-200/60 flex-1 rounded-full"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
                                    {Object.keys(classGroup.months).length} Months Submissions
                                </span>
                            </div>

                            {/* Month Subsections */}
                            {Object.entries(classGroup.months).map(([monthYear, reportList]) => (
                                <div key={monthYear} className="space-y-4 pl-0 sm:pl-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">
                                        🗓️ {monthYear}
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                                        {reportList.flatMap(report => 
                                            (report.programs || []).map(program => (
                                                <div 
                                                    key={program._id} 
                                                    className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 rounded-[1.8rem] overflow-hidden flex flex-col group"
                                                >
                                                    {/* Card Header Poster */}
                                                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden shrink-0">
                                                        {program.poster ? (
                                                            <a href={program.poster} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                                <img 
                                                                    src={program.poster} 
                                                                    alt={program.title} 
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" 
                                                                />
                                                            </a>
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-sky-50 to-blue-50 flex flex-col items-center justify-center p-6 text-center space-y-2">
                                                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                                                    <BookOpen className="w-5 h-5 text-sky-500" />
                                                                </div>
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                    No Poster Uploaded
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Body */}
                                                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                                        <div className="space-y-3">
                                                            {/* Program Metadata badges */}
                                                            <div className="flex flex-wrap gap-1.5">
                                                                <span className="text-[8px] font-black bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-widest">
                                                                    {program.programType || 'Curriculum'}
                                                                </span>
                                                            </div>

                                                            {/* Program Title */}
                                                            <h4 className="text-md font-black text-slate-800 tracking-tight leading-snug line-clamp-2">
                                                                {program.title}
                                                            </h4>
                                                        </div>

                                                        {/* Card Footer Details */}
                                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar size={12} className="text-slate-300" />
                                                                <span>{program.date || 'No Date'}</span>
                                                            </div>
                                                            {program.poster && (
                                                                <button
                                                                    onClick={() => handleDownloadPoster(program.poster, `${program.title || 'program'}-poster.jpg`)}
                                                                    className="flex items-center gap-1 text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors px-2.5 py-1 rounded-xl border border-sky-100 font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all"
                                                                >
                                                                    <Download size={10} className="text-sky-500" />
                                                                    Download
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
