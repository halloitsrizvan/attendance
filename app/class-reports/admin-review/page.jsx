"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2, ChevronRight, Image as ImageIcon, Calendar, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ALLOWED_EMAILS = [
    'shahinpandikkad4@gmail.com',
    'dkp17713@gmail.com',
    'unaisnellikkuth@gmail.com',
    'kthaseeb11@gmail.com',
    'saheedchunku@gmail.com'
];

export default function AdminReviewClassReports() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [submittingId, setSubmittingId] = useState(null);

    // State to keep track of marks being entered before saving
    // Structure: { [reportId]: { [programId]: number } }
    const [marks, setMarks] = useState({});
    const [vivaPoints, setVivaPoints] = useState({});
    const [rejectedPrograms, setRejectedPrograms] = useState({});

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const parsed = JSON.parse(storedTeacher);
            const email = parsed.email || parsed.EMAIL;
            const roles = Array.isArray(parsed.role) ? parsed.role : [parsed.role];
            if ((email && ALLOWED_EMAILS.includes(email.toLowerCase())) || roles.includes('best_class_admin')) {
                setAdmin(parsed);
                fetchReports();
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchReports = async () => {
        try {
            const res = await axios.get('/api/class-reports?adminView=true');
            setReports(res.data);

            // Initialize marks, viva, and rejected state for reports
            const initialMarks = {};
            const initialViva = {};
            const initialRejected = {};
            res.data.forEach(report => {
                initialMarks[report._id] = {};
                initialViva[report._id] = report.vivaPoints || 0;
                initialRejected[report._id] = {};
                report.programs.forEach(program => {
                    initialMarks[report._id][program._id] = program.mark || 0;
                    initialRejected[report._id][program._id] = program.rejected || false;
                });
            });
            setMarks(initialMarks);
            setVivaPoints(initialViva);
            setRejectedPrograms(initialRejected);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (reportId, programId, value) => {
        const numericVal = Number(value);
        setMarks(prev => ({
            ...prev,
            [reportId]: {
                ...prev[reportId],
                [programId]: numericVal < 1 ? 1 : numericVal
            }
        }));
    };

    const handleRejectedToggle = (reportId, programId) => {
        setRejectedPrograms(prev => {
            const currentVal = !prev[reportId]?.[programId];
            if (currentVal) {
                // If rejecting, force mark to 0
                setMarks(prevMarks => ({
                    ...prevMarks,
                    [reportId]: {
                        ...prevMarks[reportId],
                        [programId]: 0
                    }
                }));
            }
            return {
                ...prev,
                [reportId]: {
                    ...prev[reportId],
                    [programId]: currentVal
                }
            };
        });
    };

    const handleSaveMarks = async (report) => {
        if (!admin) return;

        setSubmittingId(report._id);

        // Prepare the programs array with updated marks and rejected status
        const updatedPrograms = report.programs.map(p => ({
            _id: p._id,
            mark: marks[report._id]?.[p._id] || 0,
            rejected: rejectedPrograms[report._id]?.[p._id] || false
        }));

        const adminId = admin._id || admin.id;

        try {
            await axios.patch('/api/class-reports/review', {
                reportId: report._id,
                programs: updatedPrograms,
                vivaPoints: vivaPoints[report._id] || 0,
                zehnuthPoints: report.zehnuthPoints || 0,
                adminId
            });

            // Re-fetch to update UI
            await fetchReports();
            setSelectedReport(null);
            alert("Report successfully reviewed and marked!");
        } catch (error) {
            console.error("Error saving marks:", error);
            alert("Failed to save marks. Please try again.");
        } finally {
            setSubmittingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <Header />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 space-y-6">
                    {/* Header Skeleton */}
                    <div className="bg-slate-200/50 rounded-[2.5rem] p-8 sm:p-10 h-48 animate-pulse shadow-sm"></div>

                    {/* Reports List Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100"></div>
                                    <div className="space-y-2">
                                        <div className="h-5 w-40 bg-slate-100 rounded-lg"></div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-16 bg-slate-100 rounded-lg"></div>
                                            <div className="h-4 w-24 bg-slate-100 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="h-6 w-24 bg-slate-100 rounded-lg"></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!admin) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium mt-2">You do not have administrative privileges for this page.</p>
                        <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Return Home</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 space-y-6">

                {/* Header Section */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                <ShieldCheck size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Administrator Hub</p>
                                <h1 className="text-3xl font-black uppercase italic tracking-tight text-white">Evaluate Class Reports</h1>
                            </div>
                        </div>
                        <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
                            Evaluate submitted monthly programs, check attachments, and assign marks to class activities.
                        </p>
                    </div>
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-slate-100">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No reports found</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report._id} className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:border-indigo-100`}>
                                {/* Card Header */}
                                <div
                                    className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    onClick={() => setSelectedReport(report)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${report.status === 'reviewed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            C{report.classNumber}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase italic">
                                                {report.month} {report.year}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                                                    {report.section}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Class: {report.classNumber}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            {report.status === 'reviewed' ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
                                                        <CheckCircle2 size={12} /> Reviewed
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                        By {report.markedBy?.name || 'Admin'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg">
                                                    Pending Review
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Popup Modal for Report Programs */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-2xl font-black text-slate-800 uppercase italic">
                                {selectedReport.month} {selectedReport.year} Programs
                            </h3>
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">Class: {selectedReport.classNumber}</span>
                                    <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">{selectedReport.section}</span>
                                </p>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="w-10 h-10 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
                            <div className="space-y-6">
                                {selectedReport.programs.map((program, idx) => {
                                    const isRejected = rejectedPrograms[selectedReport._id]?.[program._id];
                                    return (
                                        <div key={program._id} className={`border rounded-[1.5rem] p-6 shadow-sm flex flex-col lg:flex-row gap-6 transition-all duration-300 ${
                                            isRejected ? 'border-rose-200 bg-rose-50/20 shadow-rose-50/5' : 'bg-white border-slate-200'
                                        }`}>

                                            {/* Program Details */}
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase tracking-widest">
                                                            {program.category}
                                                        </span>
                                                        <span className="text-[9px] font-black bg-amber-50 text-amber-800 px-2 py-1 rounded-md uppercase tracking-widest">
                                                            {program.programType || 'Curriculum'}
                                                        </span>
                                                        {program.collaboration && (
                                                            <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-1 rounded-md uppercase tracking-widest border border-purple-100">
                                                                Collab: {program.collaboration}
                                                            </span>
                                                        )}
                                                        {program.date && (
                                                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                                <Calendar size={10} /> {program.date}
                                                            </span>
                                                        )}
                                                        {isRejected && (
                                                            <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 border border-rose-100 animate-pulse">
                                                                Rejected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-800">{program.title}</h4>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                                    {program.description}
                                                </p>

                                                {/* Media Section */}
                                                {(program.poster || (program.gallery && program.gallery.length > 0)) && (
                                                    <div className="pt-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                            <ImageIcon size={12} /> Attached Media
                                                        </p>
                                                        <div className="flex flex-wrap gap-3">
                                                            {program.poster && (
                                                                <a href={program.poster} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-100 hover:border-indigo-400 transition-colors group">
                                                                    <img src={program.poster} alt="Poster" className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">Poster</span>
                                                                    </div>
                                                                </a>
                                                            )}
                                                            {(program.gallery || []).map((url, gIdx) => (
                                                                <a key={gIdx} href={url} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors group">
                                                                    <img src={url} alt={`Gallery ${gIdx}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">Gallery</span>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mark Input */}
                                            <div className="lg:w-48 bg-slate-50 rounded-[1.5rem] p-5 flex flex-col justify-center border border-slate-100 shrink-0">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-3">
                                                    Assign Points
                                                </label>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleMarkChange(selectedReport._id, program._id, (marks[selectedReport._id]?.[program._id] || 0) - 1)}
                                                        disabled={isRejected}
                                                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-black hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={marks[selectedReport._id]?.[program._id] || 0}
                                                        disabled={isRejected}
                                                        onChange={(e) => handleMarkChange(selectedReport._id, program._id, e.target.value)}
                                                        className="w-16 text-center font-black text-xl text-slate-800 bg-transparent border-b-2 border-slate-300 focus:border-indigo-500 outline-none p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                    <button
                                                        onClick={() => handleMarkChange(selectedReport._id, program._id, (marks[selectedReport._id]?.[program._id] || 0) + 1)}
                                                        disabled={isRejected}
                                                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-black hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => handleRejectedToggle(selectedReport._id, program._id)}
                                                    className={`w-1/2 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border mt-4 active:scale-95 self-end ${
                                                        isRejected
                                                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200'
                                                    }`}
                                                >
                                                    {isRejected ? 'Undo Reject' : 'Reject'}
                                                </button>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            
                            {/* Points Summary & Viva Input */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program Points</p>
                                    <p className="text-xl font-black text-indigo-600">
                                        {selectedReport.programs.reduce((acc, p) => acc + (marks[selectedReport._id]?.[p._id] || 0), 0)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zehnuth Points</p>
                                    <p className="text-xl font-black text-amber-600">
                                        {selectedReport.zehnuthPoints || 0}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Viva Points</p>
                                    <input 
                                        type="number"
                                        value={vivaPoints[selectedReport._id] || 0}
                                        onChange={(e) => setVivaPoints(prev => ({...prev, [selectedReport._id]: Number(e.target.value)}))}
                                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xl font-black text-emerald-600 outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleSaveMarks(selectedReport)}
                                disabled={submittingId === selectedReport._id}
                                className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 disabled:opacity-50 shrink-0"
                            >
                                {submittingId === selectedReport._id ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4" /> Approve & Save Marks</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
