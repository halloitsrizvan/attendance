"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import { 
    FileText, CheckCircle, Clock, ExternalLink, 
    Search, Filter, Loader2, Calendar, ShieldCheck, 
    RefreshCw, Layers, Stethoscope, Sparkles, Check, XCircle, Users,
    CheckSquare, Square, AlertCircle, UserCheck, ArrowRight
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
    const todayStr = new Date().toISOString().split('T')[0];

    // Standard Leave Docs state (for all, medical, program tabs)
    const [allLeaves, setAllLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [codeSearch, setCodeSearch] = useState('');
    const [activeTab, setActiveTab] = useState(defaultTab); // 'all', 'medical', 'program', 'common'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved'
    const [filterClass, setFilterClass] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [actionLoading, setActionLoading] = useState({});

    // Common Leave Documentation state (new feature in common tab)
    const [commonFromDate, setCommonFromDate] = useState(todayStr);
    const [commonToDate, setCommonToDate] = useState(todayStr);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState(new Set());
    const [commonLeaves, setCommonLeaves] = useState([]);
    const [commonLoading, setCommonLoading] = useState(false);
    const [commonHasFetched, setCommonHasFetched] = useState(false);
    const [commonSearchTerm, setCommonSearchTerm] = useState('');
    const [selectedLeaveIds, setSelectedLeaveIds] = useState(new Set());
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Fetch classes and settings on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [settingsRes, classesRes] = await Promise.allSettled([
                    axios.get(`${API_PORT}/settings`),
                    axios.get(`${API_PORT}/classes`)
                ]);

                if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
                    if (settingsRes.value.data.academicYear) setAcademicYear(settingsRes.value.data.academicYear);
                    if (settingsRes.value.data.academicYearId) setAcademicYearId(settingsRes.value.data.academicYearId);
                }

                let classList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                if (classesRes.status === 'fulfilled' && Array.isArray(classesRes.value.data) && classesRes.value.data.length > 0) {
                    classList = classesRes.value.data.map(c => c.class).sort((a, b) => Number(a) - Number(b));
                }
                setAvailableClasses(classList);
                // Default in common tab: select all classes
                setSelectedClasses(new Set(classList.map(String)));
            } catch (err) {
                console.error("Error loading initial data:", err);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch standard leaves when academicYearId changes
    useEffect(() => {
        fetchStandardLeaves();
    }, [academicYearId]);

    const fetchStandardLeaves = async () => {
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

    // Single approval handlers (used by both standard and common tabs)
    const handleApproveMedical = async (id, currentStatus) => {
        const nextStatus = !currentStatus;
        setActionLoading(prev => ({ ...prev, [id + '_med']: true }));
        try {
            await axios.patch(`${API_PORT}/leave/${id}`, {
                documented: nextStatus
            });
            // Update in standard leaves
            setAllLeaves(prev => prev.map(l => l._id === id ? { ...l, documented: nextStatus } : l));
            // Update in common leaves if present
            setCommonLeaves(prev => prev.map(l => l._id === id ? { ...l, documented: nextStatus } : l));
            setFeedback({
                type: 'success',
                message: `Medical document ${nextStatus ? 'approved' : 'revoked'} successfully.`
            });
        } catch (err) {
            console.error("Error updating medical document approval:", err);
            setFeedback({
                type: 'error',
                message: "Failed to update medical document status."
            });
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
            // Update in standard leaves
            setAllLeaves(prev => prev.map(l => l._id === id ? { ...l, programDocumented: nextStatus } : l));
            // Update in common leaves if present
            setCommonLeaves(prev => prev.map(l => l._id === id ? { ...l, programDocumented: nextStatus } : l));
            setFeedback({
                type: 'success',
                message: `Program document ${nextStatus ? 'approved' : 'revoked'} successfully.`
            });
        } catch (err) {
            console.error("Error updating program document approval:", err);
            setFeedback({
                type: 'error',
                message: "Failed to update program document status."
            });
        } finally {
            setActionLoading(prev => ({ ...prev, [id + '_prog']: false }));
        }
    };

    // Common Leave Documentation: Multi-Class Selector Helpers
    const toggleClassSelection = (cls) => {
        const str = String(cls);
        const next = new Set(selectedClasses);
        if (next.has(str)) {
            next.delete(str);
        } else {
            next.add(str);
        }
        setSelectedClasses(next);
    };

    const handleSelectAllClasses = () => {
        setSelectedClasses(new Set(availableClasses.map(String)));
    };

    const handleDeselectAllClasses = () => {
        setSelectedClasses(new Set());
    };

    const setQuickDate = (type) => {
        const today = new Date();
        const todayS = today.toISOString().split('T')[0];
        if (type === 'today') {
            setCommonFromDate(todayS);
            setCommonToDate(todayS);
        } else if (type === 'yesterday') {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            const yS = y.toISOString().split('T')[0];
            setCommonFromDate(yS);
            setCommonToDate(yS);
        } else if (type === 'last7') {
            const from = new Date(today);
            from.setDate(from.getDate() - 6);
            setCommonFromDate(from.toISOString().split('T')[0]);
            setCommonToDate(todayS);
        } else if (type === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            setCommonFromDate(startOfMonth);
            setCommonToDate(todayS);
        }
    };

    // Common Leave Documentation: Fetch Handler (Fetches ALL leaves for chosen date range & classes)
    const handleFetchCommonLeaves = async () => {
        if (selectedClasses.size === 0) {
            alert("Please select at least one class.");
            return;
        }

        setCommonLoading(true);
        setFeedback(null);
        try {
            const params = {
                fromDate: commonFromDate,
                toDate: commonToDate
            };

            if (selectedClasses.size > 0 && selectedClasses.size < availableClasses.length) {
                params.classes = Array.from(selectedClasses).join(',');
            }

            if (academicYearId) {
                params.academicYearId = academicYearId;
            }

            const res = await axios.get(`${API_PORT}/leave`, { params });
            const data = res.data || [];
            setCommonLeaves(data);
            setCommonHasFetched(true);
            // Default: select all fetched leaves for easy bulk update
            setSelectedLeaveIds(new Set(data.map(l => l._id)));
        } catch (err) {
            console.error("Error fetching common leave documents:", err);
            setFeedback({
                type: 'error',
                message: "Failed to fetch common leave documents. Please try again."
            });
        } finally {
            setCommonLoading(false);
        }
    };

    // Common Leave Documentation: Bulk Action Handler
    const handleBulkMarkDocumented = async (scope = 'all_docs') => {
        if (selectedLeaveIds.size === 0) {
            alert("Please select at least one leave record.");
            return;
        }

        const selectedList = commonLeaves.filter(l => selectedLeaveIds.has(l._id));
        const count = selectedList.length;

        let confirmMsg = `Mark ${count} selected leave record(s) as Documented?`;
        if (scope === 'medical') confirmMsg = `Mark medical docs as Documented for ${count} selected record(s)?`;
        if (scope === 'program') confirmMsg = `Mark program docs as Documented for ${count} selected record(s)?`;
        if (scope === 'revoke') confirmMsg = `Revoke documented status for ${count} selected record(s)?`;

        if (!confirm(confirmMsg)) return;

        setBulkUpdating(true);
        setFeedback(null);
        try {
            const updates = selectedList.map(leave => {
                const updateData = {};
                if (scope === 'all_docs') {
                    updateData.documented = true;
                    if (leave.programDocumentUrl || leave.isProgramSubmitted) {
                        updateData.programDocumented = true;
                    }
                } else if (scope === 'medical') {
                    updateData.documented = true;
                } else if (scope === 'program') {
                    updateData.programDocumented = true;
                } else if (scope === 'revoke') {
                    updateData.documented = false;
                    updateData.programDocumented = false;
                }
                return {
                    _id: leave._id,
                    updateData
                };
            });

            await axios.patch(`${API_PORT}/leave/bulk-update`, { updates });

            // Update local state instantly in both arrays
            setCommonLeaves(prev => prev.map(l => {
                if (selectedLeaveIds.has(l._id)) {
                    const u = updates.find(item => item._id === l._id);
                    if (u) return { ...l, ...u.updateData };
                }
                return l;
            }));

            setAllLeaves(prev => prev.map(l => {
                if (selectedLeaveIds.has(l._id)) {
                    const u = updates.find(item => item._id === l._id);
                    if (u) return { ...l, ...u.updateData };
                }
                return l;
            }));

            setFeedback({
                type: 'success',
                message: `Successfully marked ${count} leave record(s) as ${scope === 'revoke' ? 'Revoked' : 'Documented'}!`
            });
        } catch (err) {
            console.error("Error during bulk leave update:", err);
            setFeedback({
                type: 'error',
                message: "Failed to update leave documents. Please try again."
            });
        } finally {
            setBulkUpdating(false);
        }
    };

    // Selection helpers for common leaves table
    const toggleSelectLeave = (id) => {
        const next = new Set(selectedLeaveIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedLeaveIds(next);
    };

    const handleSelectAllLeaves = () => {
        setSelectedLeaveIds(new Set(filteredCommonLeaves.map(l => l._id)));
    };

    const handleDeselectAllLeaves = () => {
        setSelectedLeaveIds(new Set());
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Standard list calculations
    const medicalDocs = useMemo(() => getMedicalDocsOnly(allLeaves, academicYearId), [allLeaves, academicYearId]);
    const programDocs = useMemo(() => getProgramDocsOnly(allLeaves, academicYearId), [allLeaves, academicYearId]);
    const unifiedDocs = useMemo(() => getAllDocs(allLeaves, academicYearId), [allLeaves, academicYearId]);

    // Standard statistics
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

    // Unique classes for standard dropdown
    const standardAvailableClasses = useMemo(() => {
        const set = new Set();
        unifiedDocs.forEach(l => {
            const cls = l.studentId?.CLASS;
            if (cls) set.add(cls);
        });
        return Array.from(set).sort((a, b) => Number(a) - Number(b));
    }, [unifiedDocs]);

    // Base list for standard tabs
    const standardBaseList = useMemo(() => {
        if (activeTab === 'medical') return medicalDocs;
        if (activeTab === 'program') return programDocs;
        return unifiedDocs;
    }, [activeTab, medicalDocs, programDocs, unifiedDocs]);

    // Standard filtered list
    const standardFilteredList = useMemo(() => {
        return standardBaseList.filter(leave => {
            const studentName = (leave.studentId?.["FULL NAME"] || leave.studentId?.name || "").toLowerCase();
            const adNo = String(leave.studentId?.ADNO || "");
            const medCode = (leave.medicalCode || "").toLowerCase();
            const progCode = (leave.programCode || "").toLowerCase();
            const reason = (leave.reason || "").toLowerCase();

            const query = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || studentName.includes(query) || adNo.includes(query) || reason.includes(query);

            const codeQuery = codeSearch.toLowerCase();
            const matchesCode = !codeSearch || medCode.includes(codeQuery) || progCode.includes(codeQuery);

            const matchesClass = !filterClass || String(leave.studentId?.CLASS) === String(filterClass);

            let isItemApproved = false;
            if (activeTab === 'medical') {
                isItemApproved = Boolean(leave.documented);
            } else if (activeTab === 'program') {
                isItemApproved = Boolean(leave.programDocumented);
            } else {
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
    }, [standardBaseList, activeTab, searchTerm, codeSearch, filterClass, filterStatus]);

    // Common leaves filtered list
    const filteredCommonLeaves = useMemo(() => {
        if (!commonSearchTerm.trim()) return commonLeaves;
        const q = commonSearchTerm.toLowerCase();
        return commonLeaves.filter(leave => {
            const studentName = (leave.studentId?.["FULL NAME"] || leave.studentId?.name || "").toLowerCase();
            const adNo = String(leave.studentId?.ADNO || "");
            const medCode = (leave.medicalCode || "").toLowerCase();
            const progCode = (leave.programCode || "").toLowerCase();
            const reason = (leave.reason || "").toLowerCase();
            const cls = String(leave.studentId?.CLASS || "");
            return studentName.includes(q) || adNo.includes(q) || medCode.includes(q) || progCode.includes(q) || reason.includes(q) || cls.includes(q);
        });
    }, [commonLeaves, commonSearchTerm]);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />
            
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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

                    {/* Refresh / Status indicator */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={activeTab === 'common' ? handleFetchCommonLeaves : fetchStandardLeaves}
                            disabled={loading || commonLoading}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            <RefreshCw size={15} className={(loading || commonLoading) ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Feedback Toast */}
                {feedback && (
                    <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 border animate-in fade-in duration-200 ${
                        feedback.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {feedback.type === 'success' ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
                            <span className="text-xs font-bold">{feedback.message}</span>
                        </div>
                        <button onClick={() => setFeedback(null)} className="text-xs font-black uppercase tracking-wider opacity-60 hover:opacity-100">
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Top Scope Tabs */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        {/* Scope Tabs */}
                        <div className="flex items-center p-1.5 bg-slate-100/80 rounded-2xl w-full lg:w-auto flex-wrap gap-1">
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
                                Program / Official ({stats.totalProgram})
                            </button>
                            <button
                                onClick={() => setActiveTab('common')}
                                className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    activeTab === 'common'
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'text-slate-500 hover:text-amber-600'
                                }`}
                            >
                                <Users size={14} />
                                <span>Common Leave Documentation</span>
                            </button>
                        </div>

                        {/* Status & Single Class Filters (Only in standard tabs) */}
                        {activeTab !== 'common' && (
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

                                {standardAvailableClasses.length > 0 && (
                                    <select
                                        value={filterClass}
                                        onChange={e => setFilterClass(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500 shadow-sm cursor-pointer"
                                    >
                                        <option value="">All Classes</option>
                                        {standardAvailableClasses.map(cls => (
                                            <option key={cls} value={cls}>Class {cls}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Standard Search Bar (Only shown in standard tabs) */}
                    {activeTab !== 'common' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type="text"
                                    placeholder="Search by student name, AD number, or reason..."
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
                    )}
                </div>

                {/* Main Content Area */}
                {activeTab === 'common' ? (
                    /* ---------------- NEW COMMON LEAVE DOCUMENTATION FEATURE ---------------- */
                    <div className="space-y-6">
                        {/* Filter Card: Date Range & Multi-Class Selection */}
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                                            Common Leave Documentation
                                        </h3>
                                        <p className="text-[11px] font-bold text-slate-400">
                                            Select date range and target classes to fetch leave documents and mark them documented
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Date Presets */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setQuickDate('yesterday')}
                                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:text-amber-800 transition-all cursor-pointer"
                                    >
                                        Yesterday
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDate('today')}
                                        className="px-2.5 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDate('last7')}
                                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:text-amber-800 transition-all cursor-pointer"
                                    >
                                        Last 7 Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDate('month')}
                                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:text-amber-800 transition-all cursor-pointer"
                                    >
                                        This Month
                                    </button>
                                </div>
                            </div>

                            {/* Date Inputs & Fetch Button */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-4 space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                                        <Calendar size={13} className="text-amber-600" /> From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={commonFromDate}
                                        onChange={(e) => setCommonFromDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>

                                <div className="md:col-span-4 space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                                        <Calendar size={13} className="text-amber-600" /> To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={commonToDate}
                                        onChange={(e) => setCommonToDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>

                                <div className="md:col-span-4">
                                    <button
                                        onClick={handleFetchCommonLeaves}
                                        disabled={commonLoading || selectedClasses.size === 0}
                                        className="w-full py-2.5 px-5 bg-slate-900 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {commonLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Fetching Leave Docs...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search size={16} />
                                                <span>Fetch Leave Documents</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Multi-Class Selector Section */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                            <Users size={14} className="text-amber-600" /> Select Classes (Multiple Select)
                                        </label>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                                            {selectedClasses.size === availableClasses.length ? 'All Classes Selected' : `${selectedClasses.size} / ${availableClasses.length} Selected`}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllClasses}
                                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAllClasses}
                                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* Multi-Class Chips Grid */}
                                <div className="flex flex-wrap gap-2">
                                    {availableClasses.map(cls => {
                                        const clsStr = String(cls);
                                        const isSelected = selectedClasses.has(clsStr);
                                        return (
                                            <button
                                                key={cls}
                                                type="button"
                                                onClick={() => toggleClassSelection(cls)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border select-none ${
                                                    isSelected
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                                                }`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                    {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                                                </div>
                                                <span>Class {cls}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Fetched Results & Bulk Action Table */}
                        {commonHasFetched && (
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden space-y-4">
                                {/* Bulk Action Toolbar */}
                                <div className="p-6 pb-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={selectedLeaveIds.size === filteredCommonLeaves.length ? handleDeselectAllLeaves : handleSelectAllLeaves}
                                            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer transition-all"
                                        >
                                            {selectedLeaveIds.size === filteredCommonLeaves.length && filteredCommonLeaves.length > 0 ? (
                                                <CheckSquare size={16} className="text-amber-600" />
                                            ) : (
                                                <Square size={16} className="text-slate-400" />
                                            )}
                                            <span>Select All ({selectedLeaveIds.size})</span>
                                        </button>
                                        <span className="text-xs font-bold text-slate-400">
                                            {filteredCommonLeaves.length} document(s) fetched
                                        </span>
                                    </div>

                                    {/* Search in results & Bulk Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                                        <div className="relative flex-1 sm:w-48">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search results..."
                                                value={commonSearchTerm}
                                                onChange={(e) => setCommonSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-amber-500"
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleBulkMarkDocumented('all_docs')}
                                            disabled={bulkUpdating || selectedLeaveIds.size === 0}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                                        >
                                            <UserCheck size={14} />
                                            <span>Mark as Documented</span>
                                        </button>

                                        {/* <button
                                            onClick={() => handleBulkMarkDocumented('medical')}
                                            disabled={bulkUpdating || selectedLeaveIds.size === 0}
                                            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                                        >
                                            <Stethoscope size={13} />
                                            <span>Med Only</span>
                                        </button>

                                        <button
                                            onClick={() => handleBulkMarkDocumented('program')}
                                            disabled={bulkUpdating || selectedLeaveIds.size === 0}
                                            className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                                        >
                                            <Sparkles size={13} />
                                            <span>Prog Only</span>
                                        </button> */}

                                        <button
                                            onClick={() => handleBulkMarkDocumented('revoke')}
                                            disabled={bulkUpdating || selectedLeaveIds.size === 0}
                                            className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                            title="Revoke documentation status"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                </div>

                                {/* Table */}
                                {commonLoading ? (
                                    <div className="h-72 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                                        <p className="text-xs font-bold text-slate-400">Loading leave documents...</p>
                                    </div>
                                ) : filteredCommonLeaves.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                                    <th className="px-6 py-4 text-left w-12">
                                                        <span className="sr-only">Select</span>
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Details</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Code</th>
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Single Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredCommonLeaves.map((leave) => {
                                                    const isSelected = selectedLeaveIds.has(leave._id);
                                                    const hasMedical = Boolean(leave.documentUrl || leave.isMedicalSubmitted);
                                                    const hasProgram = Boolean(leave.programDocumentUrl || leave.isProgramSubmitted);
                                                    const isMedApproved = Boolean(leave.documented);
                                                    const isProgApproved = Boolean(leave.programDocumented);

                                                    const reasonLower = (leave.reason || '').toLowerCase();
                                                    const progTypeLabel = reasonLower.includes('external edu')
                                                        ? 'External Edu'
                                                        : reasonLower.includes('official')
                                                        ? 'Official'
                                                        : 'Program';

                                                    return (
                                                        <tr key={leave._id} className={`hover:bg-slate-50/60 transition-colors ${isSelected ? 'bg-amber-50/20' : ''}`}>
                                                            {/* Checkbox */}
                                                            <td className="px-6 py-4">
                                                                <div 
                                                                    onClick={() => toggleSelectLeave(leave._id)}
                                                                    className="cursor-pointer text-slate-400 hover:text-amber-600 inline-flex items-center"
                                                                >
                                                                    {isSelected ? (
                                                                        <CheckSquare size={17} className="text-amber-600" />
                                                                    ) : (
                                                                        <Square size={17} />
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Student Info */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black text-xs shrink-0">
                                                                        {leave.studentId?.["FULL NAME"]?.[0] || leave.studentId?.name?.[0] || '?'}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black text-slate-800 uppercase italic truncate leading-tight">
                                                                            {leave.studentId?.["FULL NAME"] || leave.studentId?.name || 'Unknown Student'}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                                AD: {leave.studentId?.ADNO}
                                                                            </span>
                                                                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-100">
                                                                                Class {leave.studentId?.CLASS}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Leave Details */}
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-xs font-bold text-slate-800 italic line-clamp-1">"{leave.reason}"</p>
                                                                    <div className="flex flex-col gap-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Calendar size={11} className="text-slate-300" />
                                                                            <span>From: {leave.fromDate} {leave.fromTime}</span>
                                                                        </div>
                                                                        {leave.toDate && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Calendar size={11} className="text-slate-300" />
                                                                                <span>To: {leave.toDate} {leave.toTime}</span>
                                                                            </div>
                                                                        )}
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
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1">
                                                                    {hasMedical && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-black uppercase">
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
                                                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[9px] font-black uppercase">
                                                                                {progTypeLabel}
                                                                            </span>
                                                                            {leave.programCode && (
                                                                                <span className="text-[10px] font-mono font-black text-purple-800">
                                                                                    {leave.programCode}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {!hasMedical && !hasProgram && (
                                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-black uppercase w-fit">
                                                                            Leave
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Document Link */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1.5">
                                                                    {leave.documentUrl ? (
                                                                        <a 
                                                                            href={leave.documentUrl} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100 hover:bg-blue-600 hover:text-white transition-all w-fit"
                                                                        >
                                                                            <ExternalLink size={11} /> Medical File
                                                                        </a>
                                                                    ) : null}
                                                                    {leave.programDocumentUrl ? (
                                                                        <a 
                                                                            href={leave.programDocumentUrl} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-purple-100 hover:bg-purple-600 hover:text-white transition-all w-fit"
                                                                        >
                                                                            <ExternalLink size={11} /> {progTypeLabel} File
                                                                        </a>
                                                                    ) : null}
                                                                    {!leave.documentUrl && !leave.programDocumentUrl && (
                                                                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">No File</span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Status */}
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex flex-col gap-1 items-center">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-sm ${
                                                                        isMedApproved 
                                                                            ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                                                            : 'bg-amber-500 text-white shadow-amber-200'
                                                                    }`}>
                                                                        {isMedApproved ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                                        {isMedApproved ? 'Documented' : 'Not Documented'}
                                                                    </span>
                                                                    {hasProgram && (
                                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-0.5 ${
                                                                            isProgApproved ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                                                                        }`}>
                                                                            {progTypeLabel}: {isProgApproved ? 'Verified' : 'Pending'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Action Buttons */}
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex flex-col gap-1.5 items-end">
                                                                    {!isMedApproved ? (
                                                                        <button 
                                                                            onClick={() => handleApproveMedical(leave._id, isMedApproved)}
                                                                            disabled={actionLoading[leave._id + '_med']}
                                                                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-slate-200 disabled:opacity-50 cursor-pointer"
                                                                        >
                                                                            {actionLoading[leave._id + '_med'] ? 'Saving...' : 'Mark Documented'}
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => handleApproveMedical(leave._id, isMedApproved)}
                                                                            disabled={actionLoading[leave._id + '_med']}
                                                                            className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-200 hover:border-rose-200 cursor-pointer group/btn"
                                                                            title="Click to revoke documented status"
                                                                        >
                                                                            <span className="group-hover/btn:hidden flex items-center gap-1">
                                                                                <Check size={11} /> Documented
                                                                            </span>
                                                                            <span className="hidden group-hover/btn:inline">
                                                                                Revoke
                                                                            </span>
                                                                        </button>
                                                                    )}

                                                                    {hasProgram && !isProgApproved && (
                                                                        <button 
                                                                            onClick={() => handleApproveProgram(leave._id, isProgApproved)}
                                                                            disabled={actionLoading[leave._id + '_prog']}
                                                                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                                                        >
                                                                            {actionLoading[leave._id + '_prog'] ? '...' : `Approve ${progTypeLabel}`}
                                                                        </button>
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
                                    <div className="p-12 text-center text-slate-400 space-y-2">
                                        <FileText size={36} className="mx-auto text-slate-300" />
                                        <p className="text-sm font-black text-slate-700 uppercase italic">No leave documents found</p>
                                        <p className="text-xs font-medium text-slate-400">
                                            No leave documents match the selected date range and classes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ---------------- STANDARD ALL / MEDICAL / PROGRAM TABS (AS BEFORE) ---------------- */
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading documents...</p>
                            </div>
                        ) : standardFilteredList.length > 0 ? (
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
                                        {standardFilteredList.map((leave) => {
                                            const hasMedical = Boolean(leave.documentUrl || leave.isMedicalSubmitted);
                                            const hasProgram = Boolean(leave.programDocumentUrl || leave.isProgramSubmitted);
                                            const isMedApproved = Boolean(leave.documented);
                                            const isProgApproved = Boolean(leave.programDocumented);

                                            const reasonLower = (leave.reason || '').toLowerCase();
                                            const progTypeLabel = reasonLower.includes('external edu')
                                                ? 'External Edu'
                                                : reasonLower.includes('official')
                                                ? 'Official'
                                                : 'Program';

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
                                                                {leave.toDate && (
                                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                                        <Calendar size={11} className="text-slate-300" />
                                                                        <span className="text-slate-500 font-bold">To:</span> {leave.toDate} {leave.toTime}
                                                                    </div>
                                                                )}
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
                                                                        {progTypeLabel}
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
                                                                            <ExternalLink size={12} /> {progTypeLabel} Doc
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">No {progTypeLabel} File</span>
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
                                                                    {hasMedical ? `${progTypeLabel}: ` : ''}{isProgApproved ? 'Verified' : 'Pending'}
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
                                                                            {actionLoading[leave._id + '_prog'] ? 'Saving...' : `Approve ${progTypeLabel === 'Program' ? 'Prog' : progTypeLabel}`}
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => handleApproveProgram(leave._id, isProgApproved)}
                                                                            disabled={actionLoading[leave._id + '_prog']}
                                                                            className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-purple-200 hover:border-rose-200 cursor-pointer group/btn"
                                                                            title="Click to revoke verification"
                                                                        >
                                                                            <span className="group-hover/btn:hidden flex items-center gap-1">
                                                                                <Check size={11} /> {progTypeLabel} Verified
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
                )}
            </main>
        </div>
    );
};

export default LeaveDocumentation;
