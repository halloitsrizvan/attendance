"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header/Header';
import { API_PORT } from '@/Constants';
import { Plus, Loader2, CheckCircle, AlertCircle, Calendar, Trash2, Download, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export default function SettingsPage() {
    const [years, setYears] = useState([]);
    const [newYearName, setNewYearName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [status, setStatus] = useState(null);
    const [teacher, setTeacher] = useState(null);

    const [downloading, setDownloading] = useState(false);
    
    // Off Days State
    const [offDays, setOffDays] = useState([]);
    const [offDayLoading, setOffDayLoading] = useState(false);
    const [newOffDay, setNewOffDay] = useState({
        fromDateTime: '',
        toDateTime: '',
        type: 'global',
        classes: [],
        description: ''
    });

    const fetchAcademicYears = async () => {
        try {
            const res = await axios.get(`${API_PORT}/academic-years`);
            setYears(res.data);
        } catch (error) {
            console.error("Failed to fetch academic years:", error);
        } finally {
            setFetching(false);
        }
    };

    const fetchOffDays = async () => {
        try {
            const res = await axios.get(`${API_PORT}/off-days`);
            setOffDays(res.data);
        } catch (error) {
            console.error("Failed to fetch off days:", error);
        }
    };

    useEffect(() => {
        const storedTeacher = getSafeLocalStorage().getItem("teacher");
        if (storedTeacher) {
            try {
                const parsed = JSON.parse(storedTeacher);
                setTeacher(parsed);
                const isSuperAdmin = Array.isArray(parsed.role) 
                    ? parsed.role.includes("super_admin") 
                    : parsed.role === "super_admin";
                    
                if (!isSuperAdmin) {
                    window.location.href = "/";
                    return;
                }
            } catch (e) {
                window.location.href = "/login";
            }
        } else {
            window.location.href = "/login";
        }

        fetchAcademicYears();
        fetchOffDays();
    }, []);

    const handleCreateOffDay = async (e) => {
        e.preventDefault();
        if (!newOffDay.fromDateTime) return;
        setOffDayLoading(true);
        try {
            await axios.post(`${API_PORT}/off-days`, newOffDay);
            setNewOffDay({ fromDateTime: '', toDateTime: '', type: 'global', classes: [], description: '' });
            fetchOffDays();
            setStatus({ type: 'success', message: 'Off day added successfully' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to add off day' });
        } finally {
            setOffDayLoading(false);
        }
    };

    const handleDeleteOffDay = async (id) => {
        if (!confirm("Are you sure you want to delete this off day?")) return;
        try {
            await axios.delete(`${API_PORT}/off-days?id=${id}`);
            fetchOffDays();
            setStatus({ type: 'success', message: 'Off day removed' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to delete' });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newYearName.trim()) return;
        setLoading(true);

        try {
            await axios.post(`${API_PORT}/academic-years`, {
                name: newYearName
            });
            setNewYearName('');
            await fetchAcademicYears();
            setStatus({ type: 'success', message: 'New academic year created' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Failed to create academic year:", error);
            setStatus({ type: 'error', message: 'Failed to create academic year' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadAll = async () => {
        const activeYear = years.find(y => y.isActive);
        if (!activeYear) {
            setStatus({ type: 'error', message: 'No active academic year found' });
            return;
        }

        setDownloading(true);
        setStatus({ type: 'info', message: 'Fetching institutional data...' });

        try {
            const endpoints = [
                { key: 'Attendance', url: `${API_PORT}/set-attendance?all=true` },
                { key: 'Minus Points', url: `${API_PORT}/minus?all=true` },
                { key: 'leaves', url: `${API_PORT}/leave?all=true` },
                { key: 'Pass History', url: `${API_PORT}/class-excused-pass?all=true` },
                { key: 'Students', url: `${API_PORT}/students?all=true` },
                { key: 'Teachers', url: `${API_PORT}/teachers?all=true` }
            ];

            const results = await Promise.all(endpoints.map(e => axios.get(e.url)));
            const wb = XLSX.utils.book_new();

            endpoints.forEach((e, idx) => {
                let data = results[idx].data;

                // Filter by academic year for transactional data
                if (['Attendance', 'Minus Points', 'leaves', 'Pass History'].includes(e.key)) {
                    data = data.filter(item => 
                        item.academicYearId === activeYear._id || 
                        item.academicYear === activeYear.name
                    );
                }

                // SPECIAL HANDLING FOR ATTENDANCE (REPORT FORMAT)
                if (e.key === 'Attendance') {
                    const students = results[4].data;
                    const allAttendance = data;

                    // Get all unique dates and sort them
                    const uniqueDates = [...new Set(allAttendance.map(a => {
                        const d = a.attendanceDate ? new Date(a.attendanceDate) : null;
                        return d ? d.toISOString().split('T')[0] : null;
                    }).filter(Boolean))].sort();

                    // Get all unique time slots
                    const uniqueSlots = [...new Set(allAttendance.map(a => a.attendanceTime).filter(Boolean))];
                    const uniquePeriods = [...new Set(allAttendance.filter(a => a.period).map(a => a.period))].sort((a, b) => a - b);

                    const attendanceSheetData = students.map((student, idx) => {
                        const row = {
                            SL: idx + 1,
                            ADNO: student.ADNO,
                            Name: student.name || student['FULL NAME'],
                            Class: student.CLASS,
                            'Present Count': 0,
                            'Absent Count': 0
                        };

                        const studentAtt = allAttendance.filter(a => 
                            (a.studentId?._id || a.studentId) === student._id || 
                            (a.studentId?.ADNO === student.ADNO)
                        );

                        uniqueDates.forEach(date => {
                            uniqueSlots.forEach(slot => {
                                if (slot === 'Period') {
                                    uniquePeriods.forEach(p => {
                                        const record = studentAtt.find(a => {
                                            const adate = a.attendanceDate ? new Date(a.attendanceDate).toISOString().split('T')[0] : '';
                                            return adate === date && a.attendanceTime === 'Period' && a.period === p;
                                        });
                                        const status = record ? (record.status === 'Present' ? 'P' : 'A') : '-';
                                        row[`${date}_P${p}`] = status;
                                        if (status === 'P') row['Present Count']++;
                                        if (status === 'A') row['Absent Count']++;
                                    });
                                } else {
                                    const record = studentAtt.find(a => {
                                        const adate = a.attendanceDate ? new Date(a.attendanceDate).toISOString().split('T')[0] : '';
                                        return adate === date && a.attendanceTime === slot;
                                    });
                                    const status = record ? (record.status === 'Present' ? 'P' : 'A') : '-';
                                    row[`${date}_${slot}`] = status;
                                    if (status === 'P') row['Present Count']++;
                                    if (status === 'A') row['Absent Count']++;
                                }
                            });
                        });

                        return row;
                    });

                    const ws = XLSX.utils.json_to_sheet(attendanceSheetData);
                    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

                    // ADDITION: Also add a Raw Attendance sheet for full data visibility
                    const rawAttendance = allAttendance.map(item => ({
                        Date: item.attendanceDate ? new Date(item.attendanceDate).toLocaleDateString() : 'N/A',
                        Time: item.attendanceTime || 'N/A',
                        Period: item.period || '-',
                        Student: item.studentId?.['SHORT NAME'] || item.studentId?.name || 'N/A',
                        ADNO: item.studentId?.ADNO || 'N/A',
                        Status: item.status,
                        Teacher: item.teacherId?.name || 'N/A',
                        Custom: item.custom || '-'
                    }));
                    const wsRaw = XLSX.utils.json_to_sheet(rawAttendance);
                    XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw_Attendance');
                    return;
                }

                // Format data for sheet
                const formatted = data.map(item => {
                    if (e.key === 'Attendance') return {
                        Date: item.attendanceDate ? new Date(item.attendanceDate).toLocaleDateString() : 'N/A',
                        Time: item.attendanceTime || 'N/A',
                        Student: item.studentId?.['SHORT NAME'] || 'N/A',
                        Status: item.status,
                        Teacher: item.teacherId?.name || 'N/A'
                    };
                    if (e.key === 'Minus Points') return {
                        Date: new Date(item.createdAt).toLocaleDateString(),
                        Student: item.studentId?.['SHORT NAME'] || item.name || 'N/A',
                        Reason: item.reason,
                        Points: item.minusNum,
                        Teacher: item.teacherId?.name || item.teacher || 'N/A'
                    };
                    if (e.key === 'leaves') return {
                        Student: item.studentId?.['SHORT NAME'] || item.studentId?.name || 'N/A',
                        From: `${item.fromDate} ${item.fromTime}`,
                        To: `${item.toDate || ''} ${item.toTime || ''}`,
                        ReturnedAt: item.returnedAt ? new Date(item.returnedAt).toLocaleString() : 'Not Yet Returned',
                        Reason: item.reason,
                        Status: item.status
                    };
                    if (e.key === 'Pass History') return {
                        Date: item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
                        Student: item.studentId?.['SHORT NAME'] || item.name || 'N/A',
                        Reason: item.reason,
                        Time: `${item.fromTime} - ${item.toTime}`
                    };
                    if (e.key === 'Students') return {
                        ADNO: item.ADNO,
                        Name: item.name || item['FULL NAME'],
                        Class: item.CLASS,
                        SL: item.SL,
                        Status: item.onLeave ? 'On Leave' : 'Active'
                    };
                    if (e.key === 'Teachers') return {
                        Name: item.name,
                        Email: item.email,
                        Roles: Array.isArray(item.role) ? item.role.join(', ') : (item.role || 'teacher'),
                        ClassNum: item.classNum || 'N/A'
                    };
                    return item;
                });

                const ws = XLSX.utils.json_to_sheet(formatted);
                XLSX.utils.book_append_sheet(wb, ws, e.key);
            });

            const fileName = `Institutional_Data_${activeYear.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            setStatus({ type: 'success', message: 'All data exported successfully' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Export failed:", error);
            setStatus({ type: 'error', message: 'Data export failed' });
        } finally {
            setDownloading(false);
        }
    };

    const handleActivate = async (id) => {
        try {
            await axios.patch(`${API_PORT}/academic-years`, {
                id,
                activate: true
            });
            await fetchAcademicYears();
            setStatus({ type: 'success', message: 'Academic year activated' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Activation failed:", error);
            setStatus({ type: 'error', message: 'Activation failed' });
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Academic Year docs</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Manage institutional sessions</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center shadow-inner">
                                <Calendar className="text-sky-500" size={20} />
                            </div>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                        }`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="text-xs font-black uppercase tracking-widest">{status.message}</span>
                        </div>
                    )}

                    {/* Create New Form */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Add New Session</h3>
                        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={newYearName}
                                onChange={(e) => setNewYearName(e.target.value)}
                                placeholder="Example: 2024 - 2025"
                                className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading || !newYearName.trim()}
                                className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                                Create
                            </button>
                        </form>
                    </div>


                    {/* Academic Year List */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Session History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {years.map((year) => (
                                <div 
                                    key={year._id}
                                    className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                                        year.isActive 
                                            ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/5' 
                                            : 'bg-white border-slate-50 hover:border-sky-100'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                                            year.isActive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            <Calendar size={20} />
                                        </div>
                                        {year.isActive ? (
                                            <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full shadow-emerald-500/10">Active Session</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleActivate(year._id)}
                                                className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-full hover:bg-sky-100 hover:text-sky-600 transition-all"
                                            >
                                                Activate
                                            </button>
                                        )}
                                    </div>
                                    
                                    <h2 className={`text-xl font-black ${year.isActive ? 'text-emerald-900' : 'text-slate-800'}`}>
                                        {year.name}
                                    </h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50 ${year.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        Created: {new Date(year.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {years.length === 0 && (
                            <div className="p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No sessions found</p>
                            </div>
                        )}
                    </div>

                        
                    {/* Database Tools */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Storage</h3>
                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                                <Database size={16} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed px-1">
                                Backup your entire institutional database for the current academic year in a multi-sheet Excel format.
                            </p>
                            <button
                                onClick={handleDownloadAll}
                                disabled={downloading || years.length === 0}
                                className="w-full py-5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={18} />}
                                {downloading ? "Extracting Data..." : "Download Full Institutional Backup"}
                            </button>
                        </div>
                    </div>

                    {/* Off Days Management */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Off Days & Special Holidays</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed px-1">
                                Set days that should be excluded from recovery periods (global or class-specific).
                            </p>
                        </div>

                        <form onSubmit={handleCreateOffDay} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={newOffDay.fromDateTime}
                                        onChange={(e) => setNewOffDay({...newOffDay, fromDateTime: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">To Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={newOffDay.toDateTime}
                                        onChange={(e) => setNewOffDay({...newOffDay, toDateTime: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type</label>
                                    <select
                                        value={newOffDay.type}
                                        onChange={(e) => setNewOffDay({...newOffDay, type: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all appearance-none"
                                    >
                                        <option value="global">Global (All Classes)</option>
                                        <option value="class_specific">Special Class Only</option>
                                    </select>
                                </div>
                            </div>

                            {newOffDay.type === 'class_specific' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Classes (Comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1, 2, 8"
                                        value={newOffDay.classes.join(', ')}
                                        onChange={(e) => setNewOffDay({...newOffDay, classes: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Eid Holiday, Special Program"
                                    value={newOffDay.description}
                                    onChange={(e) => setNewOffDay({...newOffDay, description: e.target.value})}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={offDayLoading}
                                className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {offDayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                                Add Off Day
                            </button>
                        </form>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Existing Off Days</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {offDays.map(day => (
                                    <div key={day._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-700">
                                                        {new Date(day.fromDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        {day.toDateTime && ` to ${new Date(day.toDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`}
                                                    </span>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${day.type === 'global' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                        {day.type === 'global' ? 'Global' : `Classes: ${day.classes.join(', ')}`}
                                                    </span>
                                                </div>
                                                {day.description && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{day.description}</p>}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteOffDay(day._id)}
                                            className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {offDays.length === 0 && (
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-4 italic">No off days set</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
