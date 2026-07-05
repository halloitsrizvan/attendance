"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, ChevronLeft, AlertTriangle, CheckCircle2, Clock, PlusCircle, Edit3, Trash2, X, Trophy, Image as ImageIcon, ImagePlus, Images, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import StudentAuthGuard from '@/components/auth/StudentAuthGuard';
import ProgramSubmitForm from '@/components/programs/ProgramSubmitForm';

const ProgramReportsSkeleton = () => (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-4 animate-pulse">
                        <div className="w-10 h-10 bg-slate-100 rounded-2xl"></div>
                        <div className="flex items-center gap-3 hidden sm:flex">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                            <div className="w-24 h-6 bg-slate-100 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 animate-pulse">
                        <div className="flex flex-col items-end gap-1">
                            <div className="w-20 h-4 bg-slate-100 rounded-full"></div>
                            <div className="w-12 h-2 bg-slate-50 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-32 space-y-8 animate-pulse">
            {/* Header Section Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="w-64 h-10 bg-slate-200/50 rounded-xl"></div>
                    <div className="w-40 h-4 bg-slate-100 rounded-full"></div>
                </div>
                <div className="w-48 h-14 bg-slate-200/50 rounded-[1.5rem]"></div>
            </div>

            {/* Reports List Skeleton */}
            <div className="space-y-8">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                                <div className="space-y-2">
                                    <div className="w-32 h-6 bg-slate-100 rounded-xl"></div>
                                    <div className="w-20 h-4 bg-slate-50 rounded-md"></div>
                                </div>
                            </div>
                            <div className="w-24 h-6 bg-slate-100 rounded-xl"></div>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map((j) => (
                                    <div key={j} className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 space-y-4">
                                        <div className="flex gap-2 mb-2">
                                            <div className="w-16 h-5 bg-slate-200 rounded-md"></div>
                                            <div className="w-20 h-5 bg-slate-100 rounded-md"></div>
                                        </div>
                                        <div className="w-3/4 h-6 bg-slate-200/50 rounded-xl"></div>
                                        <div className="w-full h-20 bg-white rounded-xl"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function ProgramReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [reports, setReports] = useState([]);

    // UI State
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    // Edit state
    const [editingProgram, setEditingProgram] = useState(null);
    const [editingReportId, setEditingReportId] = useState(null);
    const [editForm, setEditForm] = useState({ category: '', title: '', description: '', date: '', poster: '', gallery: [] });
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    useEffect(() => {
        fetchProfileAndReports();
    }, []);

    const fetchProfileAndReports = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            const res = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const profileData = res.data;
            const roles = Array.isArray(profileData.role) ? profileData.role : [profileData.role];
            const normalizedRoles = roles.map(r => String(r || '').toLowerCase());
            if (!normalizedRoles.includes('class')) {
                router.push('/students-portal');
                return;
            }

            setStudent(profileData);

            // Fetch reports for this class
            const reportsRes = await axios.get(`${API_PORT}/class-reports?classNumber=${profileData.CLASS}`);
            setReports(reportsRes.data || []);

        } catch (err) {
            console.error("Error fetching data:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (reportId, program) => {
        setEditingReportId(reportId);
        setEditingProgram(program._id);
        setEditForm({
            category: program.category || 'Internal',
            programType: program.programType || 'Curriculum',
            title: program.title || '',
            description: program.description || '',
            date: program.date || '',
            poster: program.poster || '',
            gallery: program.gallery || [],
            collaboration: program.collaboration || ''
        });
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'college_db');

        try {
            const res = await axios.post('https://api.cloudinary.com/v1_1/dqgspgrul/image/upload', formData);
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
                formData.append('upload_preset', 'college_db');
                return axios.post('https://api.cloudinary.com/v1_1/dqgspgrul/image/upload', formData);
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

    const handleUpdateProgram = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                category: editForm.category,
                programType: editForm.programType,
                title: editForm.title,
                description: editForm.description,
                date: editForm.date,
                poster: editForm.poster,
                gallery: editForm.gallery,
                collaboration: editForm.collaboration
            };
            await axios.put(`${API_PORT}/class-reports/${editingReportId}`, {
                programId: editingProgram,
                updatedData: payload
            });

            setEditingProgram(null);
            setEditingReportId(null);
            fetchProfileAndReports(); // Refresh data
        } catch (error) {
            console.error("Error updating program:", error);
            alert("Failed to update program.");
        }
    };

    const handleDeleteProgram = async (reportId, programId) => {
        if (!window.confirm("Are you sure you want to delete this program?")) return;

        try {
            await axios.delete(`${API_PORT}/class-reports/${reportId}?programId=${programId}`);
            fetchProfileAndReports(); // Refresh data
        } catch (error) {
            console.error("Error deleting program:", error);
            alert("Failed to delete program.");
        }
    };

    if (loading) return (
        <StudentAuthGuard>
            <ProgramReportsSkeleton />
        </StudentAuthGuard>
    );

    if (!student) return null;

    return (
        <StudentAuthGuard>
            <div className="min-h-screen bg-slate-50 pb-20">
                {/* Header */}
                <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-40">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <div className="flex items-center gap-4">
                                <button onClick={() => router.push('/students-portal')} className="w-10 h-10 bg-slate-50 border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all">
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><BookOpen size={20} /></div>
                                    <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block italic uppercase">REPORTS</h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end mr-2">
                                    <span className="text-sm font-black text-slate-800 tracking-tight uppercase truncate max-w-[120px] sm:max-w-none">
                                        {student["SHORT NAME"] || student.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">ROLE: {student.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">Class Programs</h1>
                            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                                Manage monthly program reports for Class {student.CLASS}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsSubmitModalOpen(true)}
                            className="bg-blue-600 text-white p-4 pr-6 rounded-[1.5rem] flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap group"
                        >
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
                                <PlusCircle size={18} />
                            </div>
                            Submit New Programs
                        </button>
                    </div>

                    {/* Reports List */}
                    <div className="space-y-8">
                        {reports.length === 0 ? (
                            <div className="bg-white rounded-[2rem] p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <BookOpen size={48} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase italic mb-2">No Reports Yet</h3>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Your class hasn't submitted any programs.</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <div key={report._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                    {/* Report Header */}
                                    <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${report.status === 'reviewed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                C{report.classNumber}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-2">
                                                    {report.month} {report.year}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[9px] font-black bg-slate-200/50 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-widest">
                                                        {report.section}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {report.programs?.length || 0} Programs
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            {report.status === 'reviewed' ? (
                                                <>
                                                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                                        <CheckCircle2 size={14} /> Total: {report.totalMark || 0} pts
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                                            Zehnuth: {report.zehnuthPoints || 0}
                                                        </span>
                                                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                                                            Viva: {report.vivaPoints || 0}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                        By {report.markedBy?.name || 'Admin'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] font-black text-amber-600 flex items-center gap-1 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                                                    <Clock size={14} /> Pending Review
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Programs Grid */}
                                    <div className="p-6 sm:p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {report.programs.map(program => (
                                                <div key={program._id} className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 flex flex-col relative group">

                                                    {report.status === 'pending' && (
                                                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditClick(report._id, program)}
                                                                className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProgram(report._id, program._id)}
                                                                className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                         <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md uppercase tracking-widest">
                                                             {program.category}
                                                         </span>
                                                         <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-1 rounded-md uppercase tracking-widest">
                                                             {program.programType || 'Curriculum'}
                                                         </span>
                                                         {program.collaboration && (
                                                             <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-md uppercase tracking-widest">
                                                                 Collab: {program.collaboration}
                                                             </span>
                                                         )}
                                                         {program.date && (
                                                             <span className="text-[9px] font-black bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                                 <Calendar size={10} /> {program.date}
                                                             </span>
                                                         )}
                                                     </div>
                                                    <h4 className="text-lg font-black text-slate-800 mb-2">{program.title}</h4>
                                                    <p className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-4 rounded-2xl flex-1">
                                                        {program.description}
                                                    </p>

                                                    {/* Media & Poster */}
                                                    {(program.poster || (program.gallery && program.gallery.length > 0)) && (
                                                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
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

                                                    {report.status === 'reviewed' && (
                                                        <div className="mt-4 flex items-center justify-end">
                                                            {program.rejected ? (
                                                                <span className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                                                                    <X size={14} /> Rejected
                                                                </span>
                                                            ) : program.mark !== undefined && (
                                                                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                                                    <Trophy size={14} /> {program.mark} Points
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Edit Modal */}
                {editingProgram && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingProgram(null)}></div>
                        <div className="relative bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
                            <div className="p-5 bg-blue-600 text-white flex items-center justify-between shrink-0">
                                <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                                    <Edit3 size={20} /> Edit Program
                                </h2>
                                <button onClick={() => setEditingProgram(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateProgram} className="p-5 overflow-y-auto custom-scrollbar space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                        <select
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            required
                                        >
                                            <option value="Internal">Internal</option>
                                            <option value="External">External</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Program Type</label>
                                        <select
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                            value={editForm.programType || 'Curriculum'}
                                            onChange={(e) => setEditForm({ ...editForm, programType: e.target.value })}
                                            required
                                        >
                                            <option value="Curriculum">Curriculum</option>
                                            <option value="Co-Curriculum">Co-Curriculum</option>
                                            <option value="Extra-Curriculum">Extra-Curriculum</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Collaboration (Optional)</label>
                                        <select
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                            value={editForm.collaboration || ''}
                                            onChange={(e) => setEditForm({ ...editForm, collaboration: e.target.value })}
                                        >
                                            <option value="">None / Solo</option>
                                            <option value="LISAN">LISAN</option>
                                            <option value="Dept.">Dept.</option>
                                            <option value="Other Class Union">Other Class Union</option>
                                            <option value="OGEA">OGEA</option>
                                            <option value="Welfare">Welfare</option>
                                            <option value="Staff Council">Staff Council</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Program Title</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[100px] resize-none"
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 mt-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Program Poster</label>
                                        <div className="mt-2">
                                            <input
                                                type="file"
                                                id="edit-poster-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleUpload}
                                                disabled={uploading}
                                            />
                                            <label
                                                htmlFor="edit-poster-upload"
                                                className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all text-xs font-bold ${editForm.poster
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-blue-300 hover:text-blue-500'
                                                    }`}
                                            >
                                                {uploading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                                ) : editForm.poster ? (
                                                    <><CheckCircle2 className="w-4 h-4" /> Poster Uploaded</>
                                                ) : (
                                                    <><ImagePlus className="w-4 h-4" /> Upload Poster</>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Photo Gallery</label>
                                        <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 shadow-sm min-h-[50px] flex items-center">
                                            <div className="flex flex-wrap gap-2">
                                                {(editForm.gallery || []).map((url, idx) => (
                                                    <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                                                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newGallery = [...editForm.gallery];
                                                                newGallery.splice(idx, 1);
                                                                setEditForm({ ...editForm, gallery: newGallery });
                                                            }}
                                                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-colors"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}

                                                <label className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 cursor-pointer transition-colors bg-white">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleGalleryUpload}
                                                        disabled={uploadingGallery}
                                                    />
                                                    {uploadingGallery ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <PlusCircle size={16} />
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={uploading || uploadingGallery} className="w-full py-4 mt-6 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Submit Modal Wrapper */}
                {isSubmitModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsSubmitModalOpen(false)}></div>
                        <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 flex flex-col h-[90vh]">
                            <div className="p-6 bg-blue-600 text-white flex items-center justify-between relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="relative z-10">
                                    <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                                        <BookOpen size={24} /> Submit New Programs
                                    </h2>
                                    <p className="text-[9px] font-bold opacity-90 uppercase tracking-widest mt-1">Add to your monthly class report</p>
                                </div>
                                <button onClick={() => setIsSubmitModalOpen(false)} className="p-2 hover:bg-white/20 rounded-2xl transition-all relative z-10"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                                <ProgramSubmitForm
                                    submitterId={student?._id || student?.id}
                                    classNumber={student?.CLASS}
                                    submitterType="student"
                                    onSuccessCallback={() => {
                                        setIsSubmitModalOpen(false);
                                        fetchProfileAndReports();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentAuthGuard>
    );
}
