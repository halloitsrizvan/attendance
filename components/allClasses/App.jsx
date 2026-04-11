"use client";

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { User, Hash, MessageSquare, CheckCircle, Search, AlertCircle, Loader2 } from 'lucide-react';
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
            const payload = {
                studentId: studentId,
                reason: finalReason,
                teacherId: teacher?.id || teacher?._id,
                minusNum: minusCount,
                academicYearId: academicYearId
            };

            await axios.post(`${API_PORT}/minus`, payload);
            
            setStatus('success');
            setAd('');
            setName('');
            setClassNum('');
            setReason('Skipping Jamath');
            
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error('Error:', error.response?.data);
            setStatus('error');
        } finally {
            setLoad(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-2 min-h-[70vh] bg-slate-50/50">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Student Minus Entry</h1>
                    <p className="text-sm text-slate-500 mt-1">Record a point deduction for a student.</p>
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-700 text-sm">
                        <CheckCircle size={18} />
                        <span>Record saved successfully.</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700 text-sm">
                        <AlertCircle size={18} />
                        <span>Failed to save record. Please try again.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Search Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Search Student (AD or Name)</label>
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
                                placeholder="Example: 267 or Rizvan"
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                            />
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            
                            {suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                    {suggestions.map((s) => (
                                        <div
                                            key={s.ADNO}
                                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                            onClick={() => {
                                                setAd(s.ADNO);
                                                setName(s["SHORT NAME"]);
                                                setClassNum(s.CLASS);
                                                setStudentId(s._id);
                                                setSuggestions([]);
                                            }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-slate-700">{s.ADNO} – {s["SHORT NAME"]}</span>
                                                <span className="text-xs text-slate-400">Class {s.CLASS}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auto-filled details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Class</label>
                            <input
                                type="text"
                                value={classNum}
                                readOnly
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 outline-none"
                                placeholder="—"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Short Name</label>
                            <input
                                type="text"
                                value={name}
                                readOnly
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 outline-none truncate"
                                placeholder="—"
                            />
                        </div>
                    </div>

                    {/* Reason Selection */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Reason for Deduction</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer appearance-none transition-all"
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
                        disabled={load || !ad}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors shadow-sm mt-4"
                    >
                        {load ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <span>Submit Record</span>
                        )}
                    </button>

                    {/* Footer Teacher tag */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Authorized Session</span>
                        <span className="text-[10px] text-slate-600 font-bold uppercase">{teacher?.name || 'ADMIN'}</span>
                    </div>
                </form>
            </div>
        </div>
    );
}
