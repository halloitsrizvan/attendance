"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import { 
    FileText, CheckCircle, Clock, ExternalLink, 
    Search, Filter, Loader2, Calendar, ShieldCheck, 
    RefreshCw, Layers, Stethoscope, Sparkles, Check, XCircle
} from 'lucide-react';

/**
 * Filter helper to extract medical documents only.
 * @param {Array} leaves - List of leave objects from /api/leave
 * @param {string|null} academicYearId - Optional academic year ID filter
 * @returns {Array} Filtered list of leaves with medical docs
 */
export const getMedicalDocsOnly = (leaves = [], academicYearId = null) => {
    return (leaves || []).filter(leave => {
        const isDoc = Boolean(leave.documentUrl || leave.isMedicalSubmitted);
        if (!isDoc) return false;
        if (academicYearId) {
            const lYear = leave.academicYearId 
                ? (typeof leave.academicYearId === 'object' ? leave.academicYearId._id : leave.academicYearId) 
                : null;
            if (lYear && String(lYear) !== String(academicYearId)) {
                return false;
            }
        }
        return true;
    });
};

/**
 * Filter helper to extract program (OGEA) documents only.
 * @param {Array} leaves - List of leave objects from /api/leave
 * @param {string|null} academicYearId - Optional academic year ID filter
 * @returns {Array} Filtered list of leaves with program docs
 */
export const getProgramDocsOnly = (leaves = [], academicYearId = null) => {
    return (leaves || []).filter(leave => {
        const isDoc = Boolean(leave.programDocumentUrl || leave.isProgramSubmitted);
        if (!isDoc) return false;
        if (academicYearId) {
            const lYear = leave.academicYearId 
                ? (typeof leave.academicYearId === 'object' ? leave.academicYearId._id : leave.academicYearId) 
                : null;
            if (lYear && String(lYear) !== String(academicYearId)) {
                return false;
            }
        }
        return true;
    });
};

/**
 * Filter helper to extract all submitted documentation (both medical and program).
 * @param {Array} leaves - List of leave objects from /api/leave
 * @param {string|null} academicYearId - Optional academic year ID filter
 * @returns {Array} Filtered list of leaves with any document submitted
 */
export const getAllDocs = (leaves = [], academicYearId = null) => {
    return (leaves || []).filter(leave => {
        const isMedical = Boolean(leave.documentUrl || leave.isMedicalSubmitted);
        const isProgram = Boolean(leave.programDocumentUrl || leave.isProgramSubmitted);
        if (!isMedical && !isProgram) return false;

        if (academicYearId) {
            const lYear = leave.academicYearId 
                ? (typeof leave.academicYearId === 'object' ? leave.academicYearId._id : leave.academicYearId) 
                : null;
            if (lYear && String(lYear) !== String(academicYearId)) {
                return false;
            }
        }
        return true;
    });
};

const LeaveDocumentation = ({ defaultTab = 'all' }) => {
    const [allLeaves, setAllLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [codeSearch, setCodeSearch] = useState('');
    const [activeTab, setActiveTab] = useState(defaultTab); // 'all', 'medical', 'program'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved'
    const [filterClass, setFilterClass] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_PORT}/settings`);
                if (res.data.academicYear) setAcademicYear(res.data.academicYear);
                if (res.data.academicYearId) setAcademicYearId(res.data.academicYearId);
            } catch (err) {
                console.error("Error fetching settings:", err);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [academicYearId]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_PORT}/leave`);
            setAllLeaves(res.data || []);
        } catch (err) {
            console.error("Error fetching leaves:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveMedical = async (id, currentStatus) => {
        const nextStatus = !currentStatus;
        setActionLoading(prev => ({ ...prev, [id + '_med']: true }));
        try {
            await axios.patch(`${API_PORT}/leave/${id}`, {
                documented: nextStatus
            });
            // Update locally for instant responsiveness
            setAllLeaves(prev => prev.map(l => l._id === id ? { ...l, documented: nextStatus } : l));
        } catch (err) {
            console.error("Error updating medical document approval:", err);
            alert("Failed to update medical document status.");
        } finally {
            setActionLoading(prev => ({ ...prev, [id + '_med']: false }));
        }
    };

    const handleApproveProgram = async (id, currentStatus) => {
        const nextStatus = !currentStatus;
        setActionLoading(prev => ({ ...prev, [id + '_prog']: true }));
        try {
            await axios.patch(`${API_PORT}/leave/${id}`, {
                programDocumented: nextStatus
            });
            // Update locally for instant responsiveness
            setAllLeaves(prev => prev.map(l => l._id === id ? { ...l, programDocumented: nextStatus } : l));
        } catch (err) {
            console.error("Error updating program document approval:", err);
            alert("Failed to update program document status.");
        } finally {
            setActionLoading(prev => ({ ...prev, [id + '_prog']: false }));
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Calculate lists using our dedicated helper functions
    const medicalDocs = useMemo(() => getMedicalDocsOnly(allLeaves, academicYearId), [allLeaves, academicYearId]);
    const programDocs = useMemo(() => getProgramDocsOnly(allLeaves, academicYearId), [allLeaves, academicYearId]);
    const unifiedDocs = useMemo(() => getAllDocs(allLeaves, academicYearId), [allLeaves, academicYearId]);

    // Statistics
    const stats = useMemo(() => {
        const pendingMed = medicalDocs.filter(d => !d.documented).length;
        const approvedMed = medicalDocs.filter(d => d.documented).length;
        const pendingProg = programDocs.filter(d => !d.programDocumented).length;
        const approvedProg = programDocs.filter(d => d.programDocumented).length;
        return {
            totalDocs: unifiedDocs.length,
            totalMedical: medicalDocs.length,
            pendingMed,
            approvedMed,
            totalProgram: programDocs.length,
            pendingProg,
            approvedProg,
            totalVerified: approvedMed + approvedProg
        };
    }, [medicalDocs, programDocs, unifiedDocs]);

    // Unique classes for filter dropdown
    const availableClasses = useMemo(() => {
        const set = new Set();
        unifiedDocs.forEach(l => {
            const cls = l.studentId?.CLASS;
            if (cls) set.add(cls);
        });
        return Array.from(set).sort((a, b) => Number(a) - Number(b));
    }, [unifiedDocs]);

    // Base list depending on active tab
    const baseList = useMemo(() => {
        if (activeTab === 'medical') return medicalDocs;
        if (activeTab === 'program') return programDocs;
        return unifiedDocs;
    }, [activeTab, medicalDocs, programDocs, unifiedDocs]);

    // Final filtered list
    const filteredList = useMemo(() => {
        return baseList.filter(leave => {
            const studentName = (leave.studentId?.["FULL NAME"] || leave.studentId?.name || "").toLowerCase();
            const adNo = String(leave.studentId?.ADNO || "");
            const medCode = (leave.medicalCode || "").toLowerCase();
            const progCode = (leave.programCode || "").toLowerCase();

            const query = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || studentName.includes(query) || adNo.includes(query);

            const codeQuery = codeSearch.toLowerCase();
            const matchesCode = !codeSearch || medCode.includes(codeQuery) || progCode.includes(codeQuery);

            const matchesClass = !filterClass || String(leave.studentId?.CLASS) === String(filterClass);

            // Filter status based on tab type
            let isItemApproved = false;
            if (activeTab === 'medical') {
                isItemApproved = Boolean(leave.documented);
            } else if (activeTab === 'program') {
                isItemApproved = Boolean(leave.programDocumented);
            } else {
                // In 'all' tab, it's approved if all available docs are approved
                const hasMed = Boolean(leave.documentUrl || leave.isMedicalSubmitted);
                const hasProg = Boolean(leave.programDocumentUrl || leave.isProgramSubmitted);
                const medApproved = !hasMed || leave.documented;
                const progApproved = !hasProg || leave.programDocumented;
                isItemApproved = medApproved && progApproved;
            }

            const matchesFilter = filterStatus === 'all' || 
                                 (filterStatus === 'approved' && isItemApproved) || 
                                 (filterStatus === 'pending' && !isItemApproved);

            return matchesSearch && matchesCode && matchesClass && matchesFilter;
        });
    }, [baseList, activeTab, searchTerm, codeSearch, filterClass, filterStatus]);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />
            
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                                <ShieldCheck size={26} />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight uppercase italic">
                                    Leave Documentation
                                </h1>
                                <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest mt-1">
                                    Unified Verification for Medical & Program Documents
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Banner */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={fetchLeaves}
                            disabled={loading}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div 
                        onClick={() => setActiveTab('all')}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                            activeTab === 'all' 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' 
                                : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-sm'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-70">Total Submissions</span>
                            <Layers size={18} className={activeTab === 'all' ? 'text-sky-400' : 'text-slate-400'} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black mt-2">{stats.totalDocs}</div>
                        <div className="text-[10px] font-bold mt-1 opacity-70">
                            {stats.totalVerified} Verified • {stats.totalDocs - stats.totalVerified} Pending
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveTab('medical')}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                            activeTab === 'medical' 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' 
                                : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-sm'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-70">Medical Docs</span>
                            <Stethoscope size={18} className={activeTab === 'medical' ? 'text-blue-200' : 'text-blue-500'} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black mt-2">{stats.totalMedical}</div>
                        <div className="text-[10px] font-bold mt-1 opacity-80">
                            {stats.pendingMed} Pending Approval
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveTab('program')}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                            activeTab === 'program' 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xl shadow-purple-500/20' 
                                : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-sm'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-70">Program (OGEA) Docs</span>
                            <Sparkles size={18} className={activeTab === 'program' ? 'text-purple-200' : 'text-purple-500'} />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black mt-2">{stats.totalProgram}</div>
                        <div className="text-[10px] font-bold mt-1 opacity-80">
                            {stats.pendingProg} Pending Approval
                        </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Verification Rate</span>
                            <CheckCircle size={18} className="text-emerald-500" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black mt-2">
                            {stats.totalDocs > 0 ? Math.round((stats.totalVerified / stats.totalDocs) * 100) : 100}%
                        </div>
                        <div className="text-[10px] font-bold mt-1 text-emerald-700">
                            {stats.totalVerified} of {stats.totalDocs} Total Verified
                        </div>
                    </div>
                </div> */}

                {/* Tabs, Search & Filters Bar */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 space-y-4">
                    {/* Top row: Tab Switcher & Status Filter */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        {/* Scope Tabs */}
                        <div className="flex items-center p-1.5 bg-slate-100/80 rounded-2xl w-full lg:w-auto">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    activeTab === 'all'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                All Documents ({stats.totalDocs})
                            </button>
                            <button
                                onClick={() => setActiveTab('medical')}
                                className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    activeTab === 'medical'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-slate-500 hover:text-blue-600'
                                }`}
                            >
                                Medical ({stats.totalMedical})
                            </button>
                            <button
                                onClick={() => setActiveTab('program')}
                                className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    activeTab === 'program'
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                        : 'text-slate-500 hover:text-purple-600'
                                }`}
                            >
                                Program ({stats.totalProgram})
                            </button>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500 shadow-sm cursor-pointer"
                            >
                                <option value="all">All Verification Statuses</option>
                                <option value="pending">Pending Approval Only</option>
                                <option value="approved">Verified / Approved Only</option>
                            </select>

                            {availableClasses.length > 0 && (
                                <select
                                    value={filterClass}
                                    onChange={e => setFilterClass(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500 shadow-sm cursor-pointer"
                                >
                                    <option value="">All Classes</option>
                                    {availableClasses.map(cls => (
                                        <option key={cls} value={cls}>Class {cls}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Bottom row: Search Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                type="text"
                                placeholder="Search by student name or AD number..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                type="text"
                                placeholder="Search Medical Code / Program Code..."
                                value={codeSearch}
                                onChange={e => setCodeSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 uppercase placeholder:text-slate-400 placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Table / Card List */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading documents...</p>
                        </div>
                    ) : filteredList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100">
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Details</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Code</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                                        <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredList.map((leave) => {
                                        const hasMedical = Boolean(leave.documentUrl || leave.isMedicalSubmitted);
                                        const hasProgram = Boolean(leave.programDocumentUrl || leave.isProgramSubmitted);
                                        const isMedApproved = Boolean(leave.documented);
                                        const isProgApproved = Boolean(leave.programDocumented);

                                        return (
                                            <tr key={leave._id} className="hover:bg-slate-50/40 transition-colors group">
                                                {/* Student Info */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-all font-black text-sm shadow-inner shrink-0">
                                                            {leave.studentId?.["FULL NAME"]?.[0] || leave.studentId?.name?.[0] || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-black text-slate-800 uppercase italic truncate leading-tight mb-1">
                                                                {leave.studentId?.["FULL NAME"] || leave.studentId?.name || 'Unknown Student'}
                                                            </p>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                    AD: {leave.studentId?.ADNO}
                                                                </span>
                                                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-sky-50 text-sky-600 border border-sky-100">
                                                                    Class {leave.studentId?.CLASS}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Leave Details */}
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-800 italic line-clamp-1">"{leave.reason}"</p>
                                                        <div className="flex flex-col gap-0.5 text-[10px] font-black uppercase tracking-wider">
                                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                                <Calendar size={11} className="text-slate-300" />
                                                                <span className="text-slate-500 font-bold">From:</span> {leave.fromDate} {leave.fromTime}
                                                            </div>
                                                            {leave.returnedAt ? (
                                                                <div className="flex items-center gap-1 text-emerald-600">
                                                                    <Clock size={11} />
                                                                    <span>Returned: {formatDateTime(leave.returnedAt)}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-amber-500">
                                                                    <Clock size={11} />
                                                                    <span>Not Returned</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type & Code */}
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        {hasMedical && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[9px] font-black uppercase">
                                                                    Medical
                                                                </span>
                                                                {leave.medicalCode && (
                                                                    <span className="text-[10px] font-mono font-black text-blue-800">
                                                                        {leave.medicalCode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {hasProgram && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-[9px] font-black uppercase">
                                                                    Program
                                                                </span>
                                                                {leave.programCode && (
                                                                    <span className="text-[10px] font-mono font-black text-purple-800">
                                                                        {leave.programCode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Document Links */}
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-2">
                                                        {hasMedical && (
                                                            <div>
                                                                {leave.documentUrl ? (
                                                                    <a 
                                                                        href={leave.documentUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <ExternalLink size={12} /> Medical Doc
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">No Med File</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {hasProgram && (
                                                            <div>
                                                                {leave.programDocumentUrl ? (
                                                                    <a 
                                                                        href={leave.programDocumentUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-purple-100 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <ExternalLink size={12} /> Program Doc
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">No Prog File</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Verification Status */}
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        {hasMedical && (
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm inline-flex items-center gap-1 ${
                                                                isMedApproved 
                                                                    ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                                                    : 'bg-amber-500 text-white shadow-amber-200'
                                                            }`}>
                                                                {isMedApproved ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                                {hasProgram ? 'Med: ' : ''}{isMedApproved ? 'Verified' : 'Pending'}
                                                            </span>
                                                        )}
                                                        {hasProgram && (
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm inline-flex items-center gap-1 ${
                                                                isProgApproved 
                                                                    ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                                                    : 'bg-amber-500 text-white shadow-amber-200'
                                                            }`}>
                                                                {isProgApproved ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                                {hasMedical ? 'Prog: ' : ''}{isProgApproved ? 'Verified' : 'Pending'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Action Buttons */}
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex flex-col gap-2 items-end">
                                                        {hasMedical && (
                                                            <div>
                                                                {!isMedApproved ? (
                                                                    <button 
                                                                        onClick={() => handleApproveMedical(leave._id, isMedApproved)}
                                                                        disabled={actionLoading[leave._id + '_med']}
                                                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-slate-200 disabled:opacity-50 cursor-pointer"
                                                                    >
                                                                        {actionLoading[leave._id + '_med'] ? 'Saving...' : 'Approve Med'}
                                                                    </button>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => handleApproveMedical(leave._id, isMedApproved)}
                                                                        disabled={actionLoading[leave._id + '_med']}
                                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-200 hover:border-rose-200 cursor-pointer group/btn"
                                                                        title="Click to revoke verification"
                                                                    >
                                                                        <span className="group-hover/btn:hidden flex items-center gap-1">
                                                                            <Check size={11} /> Med Verified
                                                                        </span>
                                                                        <span className="hidden group-hover/btn:inline">
                                                                            Revoke
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {hasProgram && (
                                                            <div>
                                                                {!isProgApproved ? (
                                                                    <button 
                                                                        onClick={() => handleApproveProgram(leave._id, isProgApproved)}
                                                                        disabled={actionLoading[leave._id + '_prog']}
                                                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-purple-600 active:scale-95 transition-all shadow-md shadow-slate-200 disabled:opacity-50 cursor-pointer"
                                                                    >
                                                                        {actionLoading[leave._id + '_prog'] ? 'Saving...' : 'Approve Prog'}
                                                                    </button>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => handleApproveProgram(leave._id, isProgApproved)}
                                                                        disabled={actionLoading[leave._id + '_prog']}
                                                                        className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-purple-200 hover:border-rose-200 cursor-pointer group/btn"
                                                                        title="Click to revoke verification"
                                                                    >
                                                                        <span className="group-hover/btn:hidden flex items-center gap-1">
                                                                            <Check size={11} /> Prog Verified
                                                                        </span>
                                                                        <span className="hidden group-hover/btn:inline">
                                                                            Revoke
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-base font-black text-slate-700 uppercase italic">No documents found</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 max-w-sm mx-auto">
                                No submitted documents match your current filter or search criteria.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LeaveDocumentation;
