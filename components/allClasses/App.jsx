"use client";

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { User, MessageSquare, CheckCircle, Search, AlertCircle, Loader2, X, Plus } from 'lucide-react';
import { API_PORT } from '../../Constants';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export default function App({ students }) {
    const [suggestions, setSuggestions] = useState([]);
    const [ad, setAd] = useState('');
    const [name, setName] = useState('');
    const [classNum, setClassNum] = useState('');
    const [minusCount, setMinusCount] = useState(1 / 3);
    const [reason, setReason] = useState('Skipping Jamath');
    const [load, setLoad] = useState(false);
    const [teacher, setTeacher] = useState(null);
    const [status, setStatus] = useState(null);
    const [academicYear, setAcademicYear] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);

    useEffect(() => {
        axios.get(`${API_PORT}/settings`)
            .then(res => {
                if (res.data.academicYear) {
                    setAcademicYear(res.data.academicYear);
                    setAcademicYearId(res.data.academicYearId);
                }
            })
            .catch(err => console.error("Error fetching academic year:", err));
    }, []);

    useEffect(() => {
        const storedTeacher = getSafeLocalStorage().getItem("teacher");
        if (storedTeacher) {
            try {
                setTeacher(JSON.parse(storedTeacher));
            } catch (e) {
                console.error("Failed to parse teacher from localStorage");
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoad(true);
        setStatus(null);

        try {
            const finalReason = reason || 'Skipping Jamath';
            let payload;

            if (bulkMode) {
                if (selectedStudents.length === 0) {
                    setStatus('error');
                    setLoad(false);
                    return;
                }
                payload = selectedStudents.map(s => ({
                    studentId: s._id,
                    reason: finalReason,
                    teacherId: teacher?.id || teacher?._id,
                    minusNum: minusCount,
                    academicYearId: academicYearId
                }));
            } else {
                payload = {
                    studentId: studentId,
                    reason: finalReason,
                    teacherId: teacher?.id || teacher?._id,
                    minusNum: minusCount,
                    academicYearId: academicYearId
                };
            }

            await axios.post(`${API_PORT}/minus`, payload);
            
            setStatus('success');
            setAd('');
            setName('');
            setClassNum('');
            setReason('Skipping Jamath');
            setSelectedStudents([]);
            
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error('Error:', error.response?.data);
            setStatus('error');
        } finally {
            setLoad(false);
        }
    };

    const addStudentToBulk = (student) => {
        if (!selectedStudents.find(s => s._id === student._id)) {
            setSelectedStudents([...selectedStudents, student]);
        }
        setAd('');
        setSuggestions([]);
    };

    const removeStudentFromBulk = (id) => {
        setSelectedStudents(selectedStudents.filter(s => s._id !== id));
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[70vh] bg-slate-50">
            <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200">
                
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Minus Entry</h1>
                        <p className="text-sm text-slate-500 mt-1">Record a point deduction.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setBulkMode(!bulkMode);
                            setSelectedStudents([]);
                            setAd('');
                            setName('');
                            setClassNum('');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            bulkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {bulkMode ? 'Bulk Mode ON' : 'Bulk Mode OFF'}
                    </button>
                </div>

                {/* Status Messages */}
                {status && (
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
                        status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                        {status === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-semibold">{status === 'success' ? 'Saved Successfully!' : 'Something went wrong.'}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Search Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Search Student</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={ad}
                                onChange={(e) => {
                                    const value = e.target.value.trim();
                                    setAd(value);
                                    if (value === "") { setSuggestions([]); return; }
                                    const isNumber = /^\d+$/.test(value);
                                    let filtered = isNumber 
                                        ? students.filter((std) => String(std.ADNO).startsWith(value))
                                        : students.filter((std) => std["SHORT NAME"].toLowerCase().includes(value.toLowerCase()));
                                    setSuggestions(filtered.slice(0, 5));
                                }}
                                placeholder={bulkMode ? "Type name/ID to add multiple..." : "Type ADNO or Name..."}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                            />
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            
                            {suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                    {suggestions.map((s) => (
                                        <div
                                            key={s.ADNO}
                                            className="px-5 py-4 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between"
                                            onClick={() => {
                                                if (bulkMode) {
                                                    addStudentToBulk(s);
                                                } else {
                                                    setAd(s.ADNO);
                                                    setName(s["SHORT NAME"]);
                                                    setClassNum(s.CLASS);
                                                    setStudentId(s._id);
                                                    setSuggestions([]);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{s["SHORT NAME"]}</span>
                                                <span className="text-xs text-slate-400">ADNO: {s.ADNO} | Class: {s.CLASS}</span>
                                            </div>
                                            <Plus size={18} className="text-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bulk List */}
                    {bulkMode && selectedStudents.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-3 ml-1">Students to deduct ({selectedStudents.length})</label>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudents.map(s => (
                                    <div key={s._id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-200 shadow-sm">
                                        <span className="text-xs font-bold text-slate-700">{s["SHORT NAME"]}</span>
                                        <button type="button" onClick={() => removeStudentFromBulk(s._id)} className="text-slate-400 hover:text-rose-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Single Selection Info */}
                    {!bulkMode && name && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Class</span>
                                <span className="text-sm font-bold text-slate-700">{classNum}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Name</span>
                                <span className="text-sm font-bold text-slate-700 truncate block">{name}</span>
                            </div>
                        </div>
                    )}

                    {/* Reason Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Reason for Deduction</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:border-blue-500 outline-none cursor-pointer appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                        >
                            <option value="Skipping Jamath">Skipping Jamath</option>
                            <option value="Skipping Class">Skipping Class</option>
                            <option value="Late coming without permission">Late coming</option>
                            <option value="Skipping program">Skipping program</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={load || (bulkMode ? selectedStudents.length === 0 : !ad)}
                        className={`w-full py-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            load || (bulkMode ? selectedStudents.length === 0 : !ad)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-black shadow-lg hover:shadow-xl active:scale-[0.98]'
                        }`}
                    >
                        {load ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <span>{bulkMode ? `Deduct from ${selectedStudents.length} Students` : 'Record Deduction'}</span>
                                <CheckCircle size={18} />
                            </>
                        )}
                    </button>

                    {/* Footer */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized Session</span>
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{teacher?.name || 'ADMIN'}</span>
                    </div>
                </form>
            </div>
        </div>
    );
}
