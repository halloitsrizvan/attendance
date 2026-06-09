"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { BookOpen, Send, Plus, X, Loader2, AlertTriangle, CheckCircle2, Calendar, LayoutGrid, ImagePlus, Images } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORIES = ['Curriculum', 'Co-Curriculum', 'Extra-Curriculum'];

const SuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
                <div className="p-10 text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 animate-bounce bg-emerald-100 text-emerald-600">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic mb-2">
                        Success!
                    </h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">
                        Report Submitted Successfully
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all shadow-xl bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function SubmitClassReport() {
    const router = useRouter();
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [activeProgramIndex, setActiveProgramIndex] = useState(0);
    const [programs, setPrograms] = useState([
        { category: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [] }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            setTeacher(JSON.parse(storedTeacher));
        }
        setLoading(false);
    }, []);

    const handleAddProgram = () => {
        setPrograms([...programs, { category: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [] }]);
        setActiveProgramIndex(programs.length);
    };

    const handleRemoveProgram = (index, e) => {
        e.stopPropagation();
        const newPrograms = [...programs];
        newPrograms.splice(index, 1);

        if (newPrograms.length === 0) {
            newPrograms.push({ category: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [] });
            setPrograms(newPrograms);
            setActiveProgramIndex(0);
        } else {
            setPrograms(newPrograms);
            if (activeProgramIndex >= index && activeProgramIndex > 0) {
                setActiveProgramIndex(activeProgramIndex - 1);
            } else if (activeProgramIndex >= newPrograms.length) {
                setActiveProgramIndex(newPrograms.length - 1);
            }
        }
    };

    const handleProgramChange = (field, value) => {
        const newPrograms = [...programs];
        newPrograms[activeProgramIndex][field] = value;
        setPrograms(newPrograms);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'leave_docs');

        try {
            const res = await axios.post(
                'https://api.cloudinary.com/v1_1/dfetresky/image/upload',
                formData
            );
            handleProgramChange('poster', res.data.secure_url);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image: " + (err.response?.data?.error?.message || err.message));
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
            
            const newGallery = [...(programs[activeProgramIndex].gallery || []), ...uploadedUrls];
            handleProgramChange('gallery', newGallery);
        } catch (err) {
            console.error("Gallery upload error:", err);
            alert("Failed to upload gallery images.");
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!teacher) return;

        // Basic validation
        if (!teacher.classNum && teacher.classNum !== 0) {
            alert("You are not assigned to a class. Please contact the administrator.");
            return;
        }

        const validPrograms = programs.filter(p => p.title.trim() && p.description.trim() && p.date);
        if (validPrograms.length === 0) {
            alert("Please add at least one valid program with a title, date, and description.");
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/class-reports', {
                teacherId: teacher._id || teacher.id,
                month,
                year,
                classNumber: teacher.classNum,
                programs: validPrograms
            });
            setShowSuccess(true);
            setPrograms([{ category: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [] }]);
            setActiveProgramIndex(0);
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const getSectionLabel = (cNum) => {
        const num = Number(cNum);
        if (num === 1 || num === 2) return 'Sub-Junior';
        if (num === 3 || num === 4) return 'Junior';
        if (num >= 5 && num <= 7) return 'Senior';
        if (num >= 8 && num <= 10) return 'Super-Senior';
        return 'Unknown Section';
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
            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 space-y-6">

                {/* Header Section */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <BookOpen size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Class Teacher Hub</p>
                                <h1 className="text-3xl font-black uppercase italic tracking-tight">Monthly Programs</h1>
                            </div>
                        </div>
                        <p className="text-indigo-100 font-medium max-w-xl text-sm leading-relaxed">
                            Submit your monthly class report containing all curriculum, co-curriculum, and extra-curricular programs executed.
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-100/50 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Class Info & Month */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5 mb-2">
                                    <LayoutGrid size={12} /> Your Class
                                </label>
                                {teacher.classNum ? (
                                    <div className="bg-white border-2 border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                        <div className="text-lg font-black text-slate-800">Class {teacher.classNum}</div>
                                        <div className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                            {getSectionLabel(teacher.classNum)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-2xl p-4 flex items-center gap-3 shadow-sm text-sm font-bold">
                                        <AlertTriangle size={18} /> No Class Assigned
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5 mb-2">
                                        <Calendar size={12} /> Select Month
                                    </label>
                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full bg-white border-2 border-indigo-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                                    >
                                        {MONTHS.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-1/3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5 mb-2">
                                        Year
                                    </label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                                        className="w-full bg-white border-2 border-indigo-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none transition-all shadow-sm"
                                        min="2020"
                                        max="2050"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Programs */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase italic">Programs Performed</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Add activities for this month</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddProgram}
                                    className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                    title="Add Program"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Active Program Form */}
                            <div className="relative bg-slate-50 border border-slate-100 rounded-[2rem] p-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="absolute top-4 left-6">
                                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                                        Program {activeProgramIndex + 1}
                                    </span>
                                </div>

                                <div className="space-y-5 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Category</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => handleProgramChange('category', cat)}
                                                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                            ${programs[activeProgramIndex].category === cat
                                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>


                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Program Title</label>
                                            <input
                                                type="text"
                                                value={programs[activeProgramIndex].title}
                                                onChange={(e) => handleProgramChange('title', e.target.value)}
                                                placeholder="e.g. Science Exhibition, Annual Debate..."
                                                className="w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none transition-all shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                     <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Brief Description</label>
                                        <textarea
                                            value={programs[activeProgramIndex].description}
                                            onChange={(e) => handleProgramChange('description', e.target.value)}
                                            placeholder="Describe the activity, participation, and outcome..."
                                            className="w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none transition-all shadow-sm h-28 resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Date of Program</label>
                                            <input
                                                type="date"
                                                value={programs[activeProgramIndex].date}
                                                onChange={(e) => handleProgramChange('date', e.target.value)}
                                                className="w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl p-3.5 text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none transition-all shadow-sm"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Program Poster</label>
                                            <div className="mt-2">
                                                <input
                                                    type="file"
                                                    id={`poster-upload-${activeProgramIndex}`}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleUpload}
                                                    disabled={uploading}
                                                />
                                                <label
                                                    htmlFor={`poster-upload-${activeProgramIndex}`}
                                                    className={`w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${programs[activeProgramIndex].poster
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                                            : 'border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
                                                        }`}
                                                >
                                                    {uploading ? (
                                                        <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                                                    ) : programs[activeProgramIndex].poster ? (
                                                        <><CheckCircle2 className="w-5 h-5" /> Poster Uploaded</>
                                                    ) : (
                                                        <><ImagePlus className="w-5 h-5" /> Upload Poster Image</>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Program Photo Gallery (Optional)</label>
                                        <div className="mt-2 bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                                            <div className="flex flex-wrap gap-3">
                                                {(programs[activeProgramIndex].gallery || []).map((url, idx) => (
                                                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                                                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newGallery = [...programs[activeProgramIndex].gallery];
                                                                newGallery.splice(idx, 1);
                                                                handleProgramChange('gallery', newGallery);
                                                            }}
                                                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-colors"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                                
                                                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 cursor-pointer transition-colors bg-slate-50">
                                                    <input 
                                                        type="file" 
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden" 
                                                        onChange={handleGalleryUpload}
                                                        disabled={uploadingGallery}
                                                    />
                                                    {uploadingGallery ? (
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Images size={20} className="mb-1" />
                                                            <span className="text-[8px] font-bold uppercase tracking-widest text-center px-1">Add<br/>Photos</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                            {/* <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                Select multiple photos to upload at once. You have {(programs[activeProgramIndex].gallery || []).length} photos.
                                            </p> */}
                                        </div>
                                    </div>
                                   
                                </div>
                            </div>

                            {/* Programs List (Pills) */}
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3 block">All Added Programs</label>
                                <div className="flex flex-wrap gap-3">
                                    {programs.map((p, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveProgramIndex(idx)}
                                            className={`relative px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3
                                                ${activeProgramIndex === idx
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm scale-105'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-tight">
                                                    Program {idx + 1}
                                                </span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 truncate w-24">
                                                    {p.title || 'Untitled'}
                                                </span>
                                            </div>
                                            {programs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRemoveProgram(idx, e)}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                                        ${activeProgramIndex === idx
                                                            ? 'bg-white text-indigo-400 hover:text-rose-500 hover:bg-rose-50'
                                                            : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200'
                                                        }`}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={submitting || !teacher?.classNum}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {submitting ? 'Submitting Report...' : 'Submit Monthly Report'}
                            </button>
                            {!teacher?.classNum && (
                                <p className="text-center text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-4">
                                    You cannot submit because you have no assigned class
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
