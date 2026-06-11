"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import { BookOpen, Loader2, AlertTriangle, CheckCircle2, Clock, Calendar, Users, X, Image as ImageIcon, Edit3, Trash2, ImagePlus, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ApproveClassReport() {
    const router = useRouter();
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingReports, setPendingReports] = useState([]);
    const [approvingId, setApprovingId] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    // Edit states
    const [editingProgramId, setEditingProgramId] = useState(null);
    const [editForm, setEditForm] = useState({ category: '', title: '', description: '', date: '', poster: '', gallery: [] });
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const parsed = JSON.parse(storedTeacher);
            setTeacher(parsed);
            fetchPendingReports(parsed.classNum);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchPendingReports = async (classNum) => {
        if (!classNum) {
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get(`/api/class-reports?classNumber=${classNum}`);
            const data = res.data || [];
            // Filter reports submitted by students that are not yet approved by class teacher
            const pending = data.filter(r => r.submitterType === 'student' && !r.classTeacherApproved);
            setPendingReports(pending);
        } catch (error) {
            console.error("Error fetching pending reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reportId) => {
        setApprovingId(reportId);
        try {
            await axios.patch(`/api/class-reports/${reportId}/approve`);
            setPendingReports(pendingReports.filter(r => r._id !== reportId));
        } catch (error) {
            console.error("Error approving report:", error);
            alert("Failed to approve report.");
        } finally {
            setApprovingId(null);
        }
    };

    const handleDeleteProgram = async (reportId, programId) => {
        if (!confirm("Are you sure you want to delete this program?")) return;
        setDeletingId(programId);
        try {
            await axios.delete(`/api/class-reports/${reportId}?programId=${programId}`);
            // Update selected report and pending list
            const updatedReport = {
                ...selectedReport,
                programs: selectedReport.programs.filter(p => p._id !== programId)
            };
            setSelectedReport(updatedReport);
            setPendingReports(pendingReports.map(r => r._id === reportId ? updatedReport : r));
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete program.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditClick = (program) => {
        setEditingProgramId(program._id);
        setEditForm({
            category: program.category || 'Curriculum',
            title: program.title || '',
            description: program.description || '',
            date: program.date || '',
            poster: program.poster || '',
            gallery: program.gallery || []
        });
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'leave_docs');

        try {
            const res = await axios.post('https://api.cloudinary.com/v1_1/dfetresky/image/upload', formData);
            setEditForm({ ...editForm, poster: res.data.secure_url });
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files || files.length === 0) return;

        setUploadingGallery(true);
        try {
            const uploadPromises = files.map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'leave_docs');
                return axios.post('https://api.cloudinary.com/v1_1/dfetresky/image/upload', formData);
            });

            const results = await Promise.all(uploadPromises);
            const uploadedUrls = results.map(res => res.data.secure_url);

            setEditForm({ ...editForm, gallery: [...(editForm.gallery || []), ...uploadedUrls] });
        } catch (err) {
            console.error("Gallery upload error:", err);
            alert("Failed to upload gallery images.");
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleUpdateProgram = async (e, reportId) => {
        e.preventDefault();
        try {
            const payload = {
                category: editForm.category,
                title: editForm.title,
                description: editForm.description,
                date: editForm.date,
                poster: editForm.poster,
                gallery: editForm.gallery
            };
            const res = await axios.put(`/api/class-reports/${reportId}`, {
                programId: editingProgramId,
                updatedData: payload
            });

            // Update the local state
            const updatedPrograms = selectedReport.programs.map(p =>
                p._id === editingProgramId ? { ...p, ...payload } : p
            );
            const updatedReport = { ...selectedReport, programs: updatedPrograms };
            setSelectedReport(updatedReport);
            setPendingReports(pendingReports.map(r => r._id === reportId ? updatedReport : r));

            setEditingProgramId(null);
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update program.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium mt-2">Please login as a teacher to access this page.</p>
                        <button onClick={() => router.push('/login')} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 space-y-6">

                {/* Header Section */}
                <div className="bg-amber-500 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Clock size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 mb-1">Class Teacher Hub</p>
                                <h1 className="text-3xl font-black uppercase italic tracking-tight">Approve Reports</h1>
                            </div>
                        </div>
                        <p className="text-amber-100 font-medium max-w-xl text-sm leading-relaxed">
                            Review and approve the monthly class reports submitted by your students before they are sent to the admins.
                        </p>
                    </div>
                </div>

                {/* Pending Student Submissions Section */}
                {pendingReports.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm mt-8">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase italic">All Caught Up</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2">There are no pending student reports awaiting your approval.</p>
                    </div>
                ) : (
                    <div className="space-y-6 mt-8">
                        {pendingReports.map(report => (
                            <div key={report._id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                                {/* Header / Summary */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    onClick={() => setSelectedReport(report)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                <Calendar size={12} /> {report.month} {report.year}
                                            </span>
                                            {/* <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                <Users size={12} /> By {report.studentId?.['SHORT NAME'] || report.studentId?.name || 'Student'}
                                            </span> */}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                            {report.programs?.length || 0} Programs Submitted
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                            className="px-6 py-3 bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleApprove(report._id); }}
                                            disabled={approvingId === report._id}
                                            className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {approvingId === report._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            {approvingId === report._id ? 'Approving...' : 'Approve'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Popup Modal for Programs */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setSelectedReport(null); setEditingProgramId(null); }}></div>
                    <div className="relative bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <BookOpen size={20} className="text-amber-500" />
                                    Programs Report
                                </h2>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                                    {selectedReport.month} {selectedReport.year} &bull; {selectedReport.programs?.length || 0} Programs
                                </p>
                            </div>
                            <button onClick={() => { setSelectedReport(null); setEditingProgramId(null); }} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                            <div className="space-y-6">
                                {selectedReport.programs && selectedReport.programs.map((program, idx) => (
                                    <div key={program._id || idx} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm relative group">

                                        {/* Action buttons (only show if not editing this specific program) */}
                                        {editingProgramId !== program._id && (
                                            <div className="absolute top-4 right-4 flex items-center gap-1 ">
                                                <button onClick={() => handleEditClick(program)} className="p-2 bg-slate-50 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteProgram(selectedReport._id, program._id)} disabled={deletingId === program._id} className="p-2 bg-slate-50 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                                                    {deletingId === program._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        )}

                                        {editingProgramId === program._id ? (
                                            /* EDIT FORM */
                                            <form onSubmit={(e) => handleUpdateProgram(e, selectedReport._id)} className="space-y-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest">Edit Program</h4>
                                                    <button type="button" onClick={() => setEditingProgramId(null)} className="text-slate-400 hover:text-slate-700 p-1"><X size={16} /></button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
                                                        <select
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                                                            value={editForm.category}
                                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                        >
                                                            <option value="Curriculum">Curriculum</option>
                                                            <option value="Co-Curriculum">Co-Curriculum</option>
                                                            <option value="Extra-Curriculum">Extra-Curriculum</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                                                        <input
                                                            type="date"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                                                            value={editForm.date}
                                                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500"
                                                        value={editForm.title}
                                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</label>
                                                    <textarea
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 min-h-[80px]"
                                                        value={editForm.description}
                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Poster</label>
                                                        <input type="file" id={`edit-poster-${program._id}`} className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                                                        <label htmlFor={`edit-poster-${program._id}`} className={`w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-xl cursor-pointer text-xs font-bold ${editForm.poster ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : editForm.poster ? <CheckCircle2 className="w-4 h-4" /> : <ImagePlus className="w-4 h-4" />}
                                                            {editForm.poster ? 'Uploaded' : 'Upload'}
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gallery</label>
                                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex gap-2 overflow-x-auto items-center">
                                                            {(editForm.gallery || []).map((url, i) => (
                                                                <div key={i} className="relative w-8 h-8 rounded shrink-0">
                                                                    <img src={url} className="w-full h-full object-cover rounded" />
                                                                    <button type="button" onClick={() => {
                                                                        const newG = [...editForm.gallery]; newG.splice(i, 1); setEditForm({ ...editForm, gallery: newG });
                                                                    }} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center"><X size={10} /></button>
                                                                </div>
                                                            ))}
                                                            <label className="w-8 h-8 border-2 border-dashed rounded flex items-center justify-center text-slate-400 cursor-pointer shrink-0">
                                                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
                                                                {uploadingGallery ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-3">
                                                    <button type="submit" disabled={uploading || uploadingGallery} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50">
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            /* VIEW MODE */
                                            <>
                                                <div className="flex flex-wrap items-center gap-2 mb-3 pr-16">
                                                    <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md uppercase tracking-widest">
                                                        {program.category}
                                                    </span>
                                                    {program.date && (
                                                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                            <Calendar size={10} /> {program.date}
                                                        </span>
                                                    )}
                                                </div>
                                                <h5 className="text-base font-black text-slate-800 mb-2">{program.title}</h5>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    {program.description}
                                                </p>

                                                {(program.poster || (program.gallery && program.gallery.length > 0)) && (
                                                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                                        {program.poster && (
                                                            <div className="relative shrink-0 group/media">
                                                                <img src={program.poster} alt="Poster" className="h-20 w-auto max-w-[120px] rounded-xl object-cover border border-slate-200" />
                                                                <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Poster</div>
                                                                <a href={program.poster} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white">
                                                                    <ImageIcon size={16} />
                                                                </a>
                                                            </div>
                                                        )}
                                                        {program.gallery && program.gallery.map((img, i) => (
                                                            <div key={i} className="relative shrink-0 group/media">
                                                                <img src={img} alt={`Gallery ${i + 1}`} className="h-20 w-auto max-w-[120px] rounded-xl object-cover border border-slate-200" />
                                                                <a href={img} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white">
                                                                    <ImageIcon size={16} />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                            <button
                                onClick={() => { handleApprove(selectedReport._id); setSelectedReport(null); setEditingProgramId(null); }}
                                disabled={approvingId === selectedReport._id}
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {approvingId === selectedReport._id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                {approvingId === selectedReport._id ? 'Approving...' : 'Approve This Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
