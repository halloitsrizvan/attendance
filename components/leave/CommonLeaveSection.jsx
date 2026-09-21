"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import { 
    Calendar, Users, CheckSquare, Square, Search, 
    Loader2, CheckCircle2, UserCheck, Clock, 
    RefreshCw, Check, ArrowRight, UserX, AlertCircle,
    ShieldAlert, Sparkles, Filter, CheckCircle
} from 'lucide-react';

const CommonLeaveSection = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [fromDate, setFromDate] = useState(todayStr);
    const [toDate, setToDate] = useState(todayStr);

    // Students state
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
    const [studentSearch, setStudentSearch] = useState('');

    // Absents data state
    const [absentRecords, setAbsentRecords] = useState([]);
    const [absentsLoading, setAbsentsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [selectedAttendanceIds, setSelectedAttendanceIds] = useState(new Set());
    const [recordSearch, setRecordSearch] = useState('');

    // Action state
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Fetch classes on mount
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await axios.get(`${API_PORT}/classes`);
                if (Array.isArray(res.data) && res.data.length > 0) {
                    const classNums = res.data.map(c => c.class).sort((a, b) => Number(a) - Number(b));
                    setClasses(classNums);
                    if (classNums.length > 0 && !selectedClass) {
                        setSelectedClass(String(classNums[0]));
                    }
                } else {
                    // Fallback classes if API returns empty
                    const defaultClasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                    setClasses(defaultClasses);
                    if (!selectedClass) setSelectedClass('1');
                }
            } catch (err) {
                console.error("Error fetching classes:", err);
                const defaultClasses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                setClasses(defaultClasses);
                if (!selectedClass) setSelectedClass('1');
            }
        };
        fetchClasses();
    }, []);

    // Fetch students whenever selectedClass changes
    useEffect(() => {
        if (!selectedClass) return;
        const fetchStudents = async () => {
            setStudentsLoading(true);
            try {
                const res = await axios.get(`${API_PORT}/students?class=${selectedClass}`);
                const data = res.data || [];
                setStudents(data);
                // Default: select all students from the chosen class
                const allIds = new Set(data.map(s => s._id));
                setSelectedStudentIds(allIds);
            } catch (err) {
                console.error("Error fetching students:", err);
                setStudents([]);
                setSelectedStudentIds(new Set());
            } finally {
                setStudentsLoading(false);
            }
        };
        fetchStudents();
    }, [selectedClass]);

    // Student selection helpers
    const handleSelectAllStudents = () => {
        const allIds = new Set(students.map(s => s._id));
        setSelectedStudentIds(allIds);
    };

    const handleDeselectAllStudents = () => {
        setSelectedStudentIds(new Set());
    };

    const toggleStudent = (id) => {
        const next = new Set(selectedStudentIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedStudentIds(next);
    };

    const filteredStudents = useMemo(() => {
        if (!studentSearch.trim()) return students;
        const q = studentSearch.toLowerCase();
        return students.filter(s => {
            const name = (s['FULL NAME'] || s['SHORT NAME'] || s.name || '').toLowerCase();
            const ad = String(s.ADNO || '');
            const sl = String(s.SL || '');
            return name.includes(q) || ad.includes(q) || sl.includes(q);
        });
    }, [students, studentSearch]);

    // Fetch absent attendance records
    const handleFetchAbsents = async () => {
        if (!selectedClass) {
            alert("Please select a class first.");
            return;
        }
        if (selectedStudentIds.size === 0) {
            alert("Please select at least one student.");
            return;
        }

        setAbsentsLoading(true);
        setFeedback(null);
        try {
            const idsParam = Array.from(selectedStudentIds).join(',');
            const res = await axios.get(`${API_PORT}/attendance/common-leaves`, {
                params: {
                    classNumber: selectedClass,
                    fromDate,
                    toDate,
                    studentIds: idsParam
                }
            });

            const data = res.data || [];
            setAbsentRecords(data);
            setHasFetched(true);
            // By default, select all fetched absent records for bulk operations
            setSelectedAttendanceIds(new Set(data.map(r => r._id)));
        } catch (err) {
            console.error("Error fetching absents:", err);
            alert("Failed to fetch absent attendance records. Please try again.");
        } finally {
            setAbsentsLoading(false);
        }
    };

    // Attendance record selection helpers
    const toggleAttendanceRecord = (id) => {
        const next = new Set(selectedAttendanceIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedAttendanceIds(next);
    };

    const handleSelectAllRecords = () => {
        setSelectedAttendanceIds(new Set(absentRecords.map(r => r._id)));
    };

    const handleDeselectAllRecords = () => {
        setSelectedAttendanceIds(new Set());
    };

    // Student info resolver helper
    const getStudentInfo = (record) => {
        let s = typeof record.studentId === 'object' && record.studentId !== null ? record.studentId : null;
        if (!s && record.studentId) {
            s = students.find(st => String(st._id) === String(record.studentId));
        }
        if (!s && record.ADNO) {
            s = students.find(st => String(st.ADNO) === String(record.ADNO));
        }
        const name = s?.['FULL NAME'] || s?.['SHORT NAME'] || s?.name || 'Student';
        const adNo = s?.ADNO || record.ADNO || '';
        const classNum = s?.CLASS || record.classNumber || selectedClass;
        return { name, adNo, classNum };
    };

    // Filtered attendance records for search in table
    const filteredRecords = useMemo(() => {
        if (!recordSearch.trim()) return absentRecords;
        const q = recordSearch.toLowerCase();
        return absentRecords.filter(r => {
            const { name, adNo } = getStudentInfo(r);
            const sess = String(r.attendanceTime || '').toLowerCase();
            const more = String(r.more || r.custom || '').toLowerCase();
            return name.toLowerCase().includes(q) || String(adNo).includes(q) || sess.includes(q) || more.includes(q);
        });
    }, [absentRecords, recordSearch, students]);

    // Bulk Action Handler
    const handleBulkAction = async (target) => {
        if (selectedAttendanceIds.size === 0) {
            alert("Please select at least one attendance record to update.");
            return;
        }

        const idsArray = Array.from(selectedAttendanceIds);
        const count = idsArray.length;
        const actionLabel = target === 'present' 
            ? 'Mark as Present' 
            : target === 'onleave' 
            ? 'Mark as On Leave (true)' 
            : 'Mark as Unexcused Absent';

        if (!confirm(`Are you sure you want to ${actionLabel} for ${count} selected records?`)) {
            return;
        }

        setBulkUpdating(true);
        setFeedback(null);
        try {
            const res = await axios.post(`${API_PORT}/attendance/common-leaves`, {
                attendanceIds: idsArray,
                target
            });

            if (res.data?.success) {
                // Update local records
                setAbsentRecords(prev => prev.map(rec => {
                    if (selectedAttendanceIds.has(rec._id)) {
                        if (target === 'present') {
                            return { ...rec, status: 'Present', onLeave: false };
                        } else if (target === 'onleave') {
                            return { ...rec, status: 'Absent', onLeave: true };
                        } else if (target === 'absent_unexcused') {
                            return { ...rec, status: 'Absent', onLeave: false };
                        }
                    }
                    return rec;
                }));

                setFeedback({
                    type: 'success',
                    message: `Successfully updated ${res.data.modifiedCount || count} record(s) to ${target === 'present' ? 'Present' : target === 'onleave' ? 'On Leave (Excused)' : 'Absent'}!`
                });
            }
        } catch (err) {
            console.error("Error bulk updating attendance:", err);
            setFeedback({
                type: 'error',
                message: "Failed to update attendance records. Please try again."
            });
        } finally {
            setBulkUpdating(false);
        }
    };

    const formatDateDisplay = (dateVal) => {
        if (!dateVal) return '—';
        const d = new Date(dateVal);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatSession = (att) => {
        const timeType = (att.attendanceTime || '').trim();
        if (timeType === 'Period') {
            return att.period ? `Period ${att.period}` : 'Period';
        }
        if (timeType === 'Jamath') {
            const more = att.more || att.custom;
            return more ? `Jamath (${more})` : 'Jamath';
        }
        return timeType || 'General Session';
    };

    // Quick Date setters
    const setQuickDate = (type) => {
        const today = new Date();
        if (type === 'today') {
            const s = today.toISOString().split('T')[0];
            setFromDate(s);
            setToDate(s);
        } else if (type === 'yesterday') {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            const s = y.toISOString().split('T')[0];
            setFromDate(s);
            setToDate(s);
        } else if (type === 'last7') {
            const sTo = today.toISOString().split('T')[0];
            const from = new Date(today);
            from.setDate(from.getDate() - 6);
            const sFrom = from.toISOString().split('T')[0];
            setFromDate(sFrom);
            setToDate(sTo);
        }
    };

    return (
        <div className="space-y-6">
            {/* Context Banner */}
            {/* <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-6 rounded-3xl border border-amber-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">
                            Common Leave Documentation
                        </h2>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                            Reconcile class-wide leaves and bulk convert absents to Present or On Leave (Excused).
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setQuickDate('today')}
                        className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-[10px] font-black uppercase text-amber-700 hover:bg-amber-50 transition-all shadow-sm cursor-pointer"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setQuickDate('yesterday')}
                        className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-[10px] font-black uppercase text-amber-700 hover:bg-amber-50 transition-all shadow-sm cursor-pointer"
                    >
                        Yesterday
                    </button>
                    <button
                        onClick={() => setQuickDate('last7')}
                        className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-[10px] font-black uppercase text-amber-700 hover:bg-amber-50 transition-all shadow-sm cursor-pointer"
                    >
                        Last 7 Days
                    </button>
                </div>
            </div> */}

            {/* Filter and Selection Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* From Date */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" /> From Date
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" /> To Date
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* Class Selector */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Users size={13} className="text-slate-400" /> Class
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner cursor-pointer"
                        >
                            {classes.map(c => (
                                <option key={c} value={c}>Class {c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Fetch Button */}
                    <div>
                        <button
                            onClick={handleFetchAbsents}
                            disabled={absentsLoading || studentsLoading || selectedStudentIds.size === 0}
                            className="w-full py-3.5 bg-slate-900 hover:bg-amber-600 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {absentsLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Fetching Absents...</span>
                                </>
                            ) : (
                                <>
                                    <Search size={16} />
                                    <span>Fetch Absents</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Student Selector Panel */}
                <div className="pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                Students in Class {selectedClass}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                                {selectedStudentIds.size} / {students.length} Selected
                            </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-48">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter student..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 outline-none focus:border-amber-500"
                                />
                            </div>
                            <button
                                onClick={handleSelectAllStudents}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleDeselectAllStudents}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>

                    {/* Students Grid Chips */}
                    {studentsLoading ? (
                        <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
                            <Loader2 size={18} className="animate-spin text-amber-500" />
                            <span className="text-xs font-bold">Loading students...</span>
                        </div>
                    ) : students.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto p-2 bg-slate-50/70 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {filteredStudents.map(student => {
                                const isSelected = selectedStudentIds.has(student._id);
                                return (
                                    <div
                                        key={student._id}
                                        onClick={() => toggleStudent(student._id)}
                                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer select-none flex items-center gap-2 ${
                                            isSelected
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                            {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-black truncate leading-tight">
                                                {student['SHORT NAME'] || student['FULL NAME'] || student.name}
                                            </p>
                                            <p className={`text-[9px] font-mono leading-none mt-0.5 ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                                                AD: {student.ADNO}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic p-4 text-center">No students found in Class {selectedClass}.</p>
                    )}
                </div>
            </div>

            {/* Feedback Alert */}
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

            {/* Results Section */}
            {hasFetched && (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden space-y-4">
                    {/* Header bar of Results with Bulk Actions */}
                    <div className="p-6 pb-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                                <UserX size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 uppercase italic">
                                    Absent Records ({absentRecords.length})
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {selectedAttendanceIds.size} records selected for bulk update
                                </p>
                            </div>
                        </div>

                        {/* Bulk Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                            <div className="relative flex-1 sm:w-48">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search in absents..."
                                    value={recordSearch}
                                    onChange={(e) => setRecordSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-amber-500"
                                />
                            </div>

                            <button
                                onClick={() => handleBulkAction('present')}
                                disabled={bulkUpdating || selectedAttendanceIds.size === 0}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                            >
                                <UserCheck size={14} />
                                <span>Change to Present</span>
                            </button>

                            <button
                                onClick={() => handleBulkAction('onleave')}
                                disabled={bulkUpdating || selectedAttendanceIds.size === 0}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                            >
                                <CheckCircle2 size={14} />
                                <span>Change to On Leave (true)</span>
                            </button>

                            <button
                                onClick={() => handleBulkAction('absent_unexcused')}
                                disabled={bulkUpdating || selectedAttendanceIds.size === 0}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                title="Reset to regular unexcused absent"
                            >
                                Set onLeave: false
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    {filteredRecords.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left">
                                            <button 
                                                onClick={selectedAttendanceIds.size === absentRecords.length ? handleDeselectAllRecords : handleSelectAllRecords}
                                                className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer"
                                            >
                                                {selectedAttendanceIds.size === absentRecords.length && absentRecords.length > 0 ? (
                                                    <CheckSquare size={15} className="text-amber-600" />
                                                ) : (
                                                    <Square size={15} className="text-slate-400" />
                                                )}
                                                <span>Select ({selectedAttendanceIds.size})</span>
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Session</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Taken By</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Single Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRecords.map((record) => {
                                        const isSelected = selectedAttendanceIds.has(record._id);
                                        const isPresent = String(record.status).toLowerCase() === 'present';
                                        const isOnLeave = Boolean(record.onLeave);

                                        return (
                                            <tr key={record._id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-amber-50/20' : ''}`}>
                                                {/* Checkbox */}
                                                <td className="px-6 py-4">
                                                    <div 
                                                        onClick={() => toggleAttendanceRecord(record._id)}
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
                                                    {(() => {
                                                        const { name, adNo, classNum } = getStudentInfo(record);
                                                        return (
                                                            <div>
                                                                <p className="text-xs font-black text-slate-800 uppercase italic">
                                                                    {name}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {adNo && (
                                                                        <span className="text-[10px] font-bold text-slate-400">
                                                                            AD: {adNo}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                                                        Class {classNum}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>

                                                {/* Date & Session */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5 text-xs font-bold text-slate-700">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={12} className="text-slate-400" />
                                                            <span>{formatDateDisplay(record.attendanceDate)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600">
                                                            <Clock size={11} />
                                                            <span>{formatSession(record)}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Current Status */}
                                                <td className="px-6 py-4 text-center">
                                                    {isPresent ? (
                                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                                            <CheckCircle size={10} /> Present
                                                        </span>
                                                    ) : isOnLeave ? (
                                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> On Leave (True)
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                                            <UserX size={10} /> Absent (onLeave: False)
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Teacher */}
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {record.teacherId?.name || record.teacherId?.username || '—'}
                                                    </span>
                                                </td>

                                                {/* Single Action Quick Toggle */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {!isPresent && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await axios.post(`${API_PORT}/attendance/common-leaves`, {
                                                                            attendanceIds: [record._id],
                                                                            target: 'present'
                                                                        });
                                                                        setAbsentRecords(prev => prev.map(r => r._id === record._id ? { ...r, status: 'Present', onLeave: false } : r));
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                    }
                                                                }}
                                                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-emerald-100 cursor-pointer"
                                                                title="Set single record to Present"
                                                            >
                                                                Present
                                                            </button>
                                                        )}
                                                        {!isOnLeave && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await axios.post(`${API_PORT}/attendance/common-leaves`, {
                                                                            attendanceIds: [record._id],
                                                                            target: 'onleave'
                                                                        });
                                                                        setAbsentRecords(prev => prev.map(r => r._id === record._id ? { ...r, status: 'Absent', onLeave: true } : r));
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                    }
                                                                }}
                                                                className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-purple-100 cursor-pointer"
                                                                title="Set single record to onLeave: true"
                                                            >
                                                                On Leave
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
                            <CheckCircle size={36} className="mx-auto text-emerald-400" />
                            <p className="text-sm font-black text-slate-700 uppercase italic">No absent records found</p>
                            <p className="text-xs font-medium text-slate-400">
                                All selected students are present or no attendance logs match this date range.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommonLeaveSection;
