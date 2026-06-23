"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, CheckCircle2, Clock, PlusCircle, Edit3, Trash2, X, Trophy, Image as ImageIcon, ImagePlus, Loader2, ChevronLeft, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';
import ProgramSubmitForm from '@/components/programs/ProgramSubmitForm';

export default function BestClassPage() {
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

    const getMinMaxDatesForEdit = () => {
        if (!editingReportId) return { min: '', max: '' };
        const report = reports.find(r => r._id === editingReportId);
        if (!report) return { min: '', max: '' };
        
        const MONTHS_LIST = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthIndex = MONTHS_LIST.indexOf(report.month);
        if (monthIndex === -1) return { min: '', max: '' };
        
        const mm = String(monthIndex + 1).padStart(2, '0');
        const min = `${report.year}-${mm}-01`;
        const lastDay = new Date(report.year, monthIndex + 1, 0).getDate();
        const max = `${report.year}-${mm}-${String(lastDay).padStart(2, '0')}`;
        
        return { min, max };
    };
    
    const { min: editMinDate, max: editMaxDate } = getMinMaxDatesForEdit();

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
            if (!profileData.role || profileData.role === 'student') {
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
                title: editForm.title,
                description: editForm.description,
                date: editForm.date,
                poster: editForm.poster,
                gallery: editForm.gallery
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

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    if (!student) return null;

    const getSectionLabel = (cNum) => {
        const num = Number(cNum);
        if (num >= 1 && num <= 3) return 'Junior';
        if (num >= 4 && num <= 7) return 'Senior';
        if (num >= 8 && num <= 10) return 'Super-Senior';
        return 'Unknown Section';
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            
            {/* Custom Header Bar */}
            {/* <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/students-portal')}
                        className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all text-slate-600"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-lg font-black text-slate-800 tracking-tight uppercase">REPORTS</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-black text-slate-800 uppercase">
                        {student["SHORT NAME"] || student["FULL NAME"]}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        ROLE: {student.role || 'PRESIDENT'}
                    </div>
                </div>
            </div> */}

            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-1.5">
                        CLASS PROGRAMS
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em]">
                        MANAGE MONTHLY PROGRAM REPORTS FOR CLASS {student.CLASS}
                    </p>
                </div>
                <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
                >
                    <PlusCircle size={18} />
                    SUBMIT NEW PROGRAMS
                </button>
            </div>

            {/* Reports List */}
            <div className="space-y-10">
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
                        <div key={report._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-8">
                            
                            {/* Report Header Card Block */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
                                <div className="flex items-center gap-4">
                                    {/* Class Circle Badge */}
                                    <div className="w-14 h-14 bg-[#FEF08A] text-[#854D0E] font-black text-xl rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                        C{report.classNumber}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                            {report.month} {report.year}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">
                                                {getSectionLabel(report.classNumber)}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {report.programs?.length || 0} Programs
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:items-end">
                                    {report.status === 'reviewed' ? (
                                        <div className="flex flex-col sm:items-end gap-1.5">
                                            <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1.5 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                                                <CheckCircle2 size={14} /> Total Score: {report.totalMark || 0} pts
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                    Zehnuth: {report.zehnuthPoints || 0}
                                                </span>
                                                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                                                    Viva: {report.vivaPoints || 0}
                                                </span>
                                            </div>
                                        </div>
                                    ) : report.submitterType === 'student' && !report.classTeacherApproved ? (
                                        <span className="text-[10px] font-black text-amber-600 flex items-center gap-1.5 uppercase tracking-widest bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-100 shadow-sm">
                                            <Clock size={14} /> Teacher Pending Review
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 uppercase tracking-widest bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100 shadow-sm">
                                            <Clock size={14} /> Admin Pending Review
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Programs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {report.programs.map(program => (
                                    <div key={program._id} className="bg-slate-50/40 border border-slate-200/60 rounded-[1.5rem] p-5 sm:p-6 flex flex-col relative group hover:bg-white hover:shadow-md transition-all duration-300">

                                        {/* Action Buttons (Edit / Delete) */}
                                        {report.status === 'pending' && (
                                            <div className="absolute top-4 right-4 flex items-center gap-2 ">
                                                <button
                                                    onClick={() => handleEditClick(report._id, program)}
                                                    className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm cursor-pointer"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProgram(report._id, program._id)}
                                                    className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Badges */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[9px] font-black bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded uppercase tracking-widest">
                                                {program.category}
                                            </span>
                                            {program.date && (
                                                <span className="text-[9px] font-black bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                                                    <Calendar size={10} /> {program.date}
                                                </span>
                                            )}
                                        </div>

                                        {/* Program Title */}
                                        <h4 className="text-lg font-black text-slate-800 tracking-tight mb-2.5">{program.title}</h4>
                                        
                                        {/* Description Container Block */}
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-4 rounded-2xl flex-1 mb-4 shadow-sm">
                                            {program.description}
                                        </p>

                                        {/* Media & Poster */}
                                        {(program.poster || (program.gallery && program.gallery.length > 0)) && (
                                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                                {program.poster && (
                                                    <div className="relative shrink-0 group/media rounded-xl overflow-hidden h-20 w-32 bg-slate-100 border border-slate-200 shadow-sm">
                                                        <img src={program.poster} alt="Poster" className="h-full w-full object-cover" />
                                                        <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Poster</div>
                                                        <a href={program.poster} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            <ImageIcon size={16} />
                                                        </a>
                                                    </div>
                                                )}
                                                {program.gallery && program.gallery.map((img, i) => (
                                                    <div key={i} className="relative shrink-0 group/media rounded-xl overflow-hidden border border-slate-200 h-20 w-32 bg-slate-100 shadow-sm">
                                                        <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                                                        <a href={img} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            <ImageIcon size={16} />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reviewed mark */}
                                        {report.status === 'reviewed' && program.mark !== undefined && (
                                            <div className="mt-4 flex items-center justify-end">
                                                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                    <Trophy size={14} /> {program.mark} Points
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingProgram && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingProgram(null)}></div>
                    <div className="relative bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 z-50">
                        {/* Modal Header */}
                        <div className="p-6 bg-blue-600 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2 relative z-10">
                                <Edit3 size={20} /> Edit Program
                            </h2>
                            <button onClick={() => setEditingProgram(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all relative z-10"><X size={20} /></button>
                        </div>
                        {/* Edit Form */}
                        <form onSubmit={handleUpdateProgram} className="p-6 overflow-y-auto custom-scrollbar space-y-4 bg-white">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Category</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-10 text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        required
                                    >
                                        <option value="Curriculum">Curriculum</option>
                                        <option value="Co-Curriculum">Co-Curriculum</option>
                                        <option value="Extra-Curriculum">Extra-Curriculum</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Program Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all shadow-sm"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                <textarea
                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all min-h-[100px] resize-none shadow-sm"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Date (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    min={editMinDate}
                                    max={editMaxDate}
                                />
                            </div>

                            {/* Uploader Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 mt-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Program Poster</label>
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
                                            className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all text-xs font-bold min-h-[50px] shadow-sm ${editForm.poster
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                                : 'border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-500'
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
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Photo Gallery</label>
                                    <div className="mt-2 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm min-h-[50px] flex items-center">
                                        <div className="flex flex-wrap gap-2">
                                            {(editForm.gallery || []).map((url, idx) => (
                                                <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shrink-0">
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

                                            <label className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 cursor-pointer transition-colors bg-white shrink-0">
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

                            <button type="submit" disabled={uploading || uploadingGallery} className="w-full py-4 mt-6 bg-[#0F172A] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-850 active:scale-95 transition-all shadow-xl shadow-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Submit Modal Wrapper */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsSubmitModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500 border border-slate-100 flex flex-col h-[90vh] z-50">
                        {/* Header Banner */}
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
                        {/* Form Body wrapper */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
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
    );
}

