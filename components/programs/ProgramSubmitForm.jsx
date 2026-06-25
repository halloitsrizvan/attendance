"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Send, Plus, X, Loader2, AlertTriangle, CheckCircle2, Calendar, LayoutGrid, ImagePlus, Images, ChevronDown } from 'lucide-react';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORIES = ['Internal', 'External'];
const PROGRAM_TYPES = ['Curriculum', 'Co-Curriculum', 'Extra-Curriculum'];

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

export default function ProgramSubmitForm({ submitterId, classNumber, submitterType, onSuccessCallback }) {
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [activeProgramIndex, setActiveProgramIndex] = useState(0);
    const [programs, setPrograms] = useState([
        { category: 'Internal', programType: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [], collaboration: '' }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchDefaultPeriod = async () => {
            try {
                const res = await axios.get('/api/settings');
                if (res.data.defaultReportMonth) {
                    setMonth(res.data.defaultReportMonth);
                }
                if (res.data.defaultReportYear) {
                    setYear(res.data.defaultReportYear);
                }
            } catch (error) {
                console.error("Error fetching default period settings:", error);
            }
        };
        fetchDefaultPeriod();
    }, []);

    const getMinMaxDates = () => {
        const monthIndex = MONTHS.indexOf(month);
        if (monthIndex === -1) return { min: '', max: '' };
        const mm = String(monthIndex + 1).padStart(2, '0');
        const min = `${year}-${mm}-01`;
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        const max = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
        return { min, max };
    };

    const { min: minDate, max: maxDate } = getMinMaxDates();

    const handleAddProgram = () => {
        setPrograms([...programs, { category: 'Internal', programType: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [], collaboration: '' }]);
        setActiveProgramIndex(programs.length);
    };

    const handleRemoveProgram = (index, e) => {
        e.stopPropagation();
        const newPrograms = [...programs];
        newPrograms.splice(index, 1);

        if (newPrograms.length === 0) {
            newPrograms.push({ category: 'Internal', programType: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [], collaboration: '' });
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
        formData.append('upload_preset', 'college_db');

        try {
            const res = await axios.post(
                'https://api.cloudinary.com/v1_1/dqgspgrul/image/upload',
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
                formData.append('upload_preset', 'college_db');
                return axios.post('https://api.cloudinary.com/v1_1/dqgspgrul/image/upload', formData);
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

        if (!submitterId) return;

        if (!classNumber && classNumber !== 0) {
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
            const payload = {
                month,
                year,
                classNumber,
                programs: validPrograms,
                submitterType
            };

            if (submitterType === 'teacher') {
                payload.teacherId = submitterId;
            } else if (submitterType === 'student') {
                payload.studentId = submitterId;
            } else {
                payload.teacherId = submitterId;
            }

            await axios.post('/api/class-reports', payload);
            setShowSuccess(true);
            setPrograms([{ category: 'Internal', programType: 'Curriculum', title: '', description: '', poster: '', date: '', gallery: [], collaboration: '' }]);
            setActiveProgramIndex(0);

            if (onSuccessCallback) {
                setTimeout(() => {
                    onSuccessCallback();
                }, 1500);
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const getSectionLabel = (cNum) => {
        const num = Number(cNum);
        if (num >= 1 && num <= 3) return 'Junior';
        if (num >= 4 && num <= 7) return 'Senior';
        if (num >= 8 && num <= 10) return 'Super-Senior';
        return 'Unknown Section';
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-2 sm:p-4">
            <SuccessModal isOpen={showSuccess} onClose={() => {
                setShowSuccess(false);
                if (onSuccessCallback) onSuccessCallback();
            }} />
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Class Info & Month & Year Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Class Box */}
                    <div className="md:col-span-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">
                            Your Class
                        </label>
                        {classNumber || classNumber === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm min-h-[56px]">
                                <span className="text-sm font-black text-slate-800">Class {classNumber}</span>
                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg uppercase tracking-widest">
                                    {getSectionLabel(classNumber)}
                                </span>
                            </div>
                        ) : (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4 flex items-center gap-3 shadow-sm text-sm font-bold min-h-[56px]">
                                <AlertTriangle size={18} /> No Class Assigned
                            </div>
                        )}
                    </div>

                    {/* Month Box */}
                    <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">
                            Select Month
                        </label>
                        <div className="relative">
                            <select
                                value={month}
                                disabled={submitterType === 'student'}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-10 text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all shadow-sm cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {MONTHS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Year Box */}
                    <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1">
                            Year
                        </label>
                        <input
                            type="number"
                            value={year}
                            disabled={submitterType === 'student'}
                            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-black text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            min="2020"
                            max="2050"
                        />
                    </div>
                </div>

                {/* Programs Section */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase italic">Programs Performed</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Add activities for this month</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddProgram}
                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                            title="Add Program"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Active Program Card Container */}
                    <div className="relative bg-slate-50/50 border border-slate-200/50 rounded-[2.5rem] p-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="absolute top-4 left-6">
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg uppercase tracking-widest">
                                Program {activeProgramIndex + 1}
                            </span>
                        </div>

                        <div className="space-y-6 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Category Selection */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5 pl-1">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => handleProgramChange('category', cat)}
                                                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border
                                                    ${programs[activeProgramIndex].category === cat
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                             

                                {/* Collaboration (Optional) */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Collaboration</label>
                                    <div className="relative">
                                        <select
                                            value={programs[activeProgramIndex].collaboration || ''}
                                            onChange={(e) => handleProgramChange('collaboration', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm cursor-pointer appearance-none"
                                        >
                                            <option value="">None / Solo</option>
                                            <option value="LISAN">LISAN</option>
                                            <option value="Dept.">Dept.</option>
                                            <option value="Other Class Union">Other Class Union</option>
                                            <option value="OGEA">OGEA</option>
                                            <option value="Welfare">Welfare</option>
                                            <option value="Staff Council">Staff Council</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                               {/* Program Type */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Program Type</label>
                                    <div className="relative">
                                        <select
                                            value={programs[activeProgramIndex].programType || 'Curriculum'}
                                            onChange={(e) => handleProgramChange('programType', e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm cursor-pointer appearance-none"
                                        >
                                            {PROGRAM_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                             {/* Program Title */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Program Title</label>
                                    <input
                                        type="text"
                                        value={programs[activeProgramIndex].title}
                                        onChange={(e) => handleProgramChange('title', e.target.value)}
                                        placeholder="e.g. Science Exhibition, Annual Debate..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>

                            {/* Description */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Brief Description</label>
                                <textarea
                                    value={programs[activeProgramIndex].description}
                                    onChange={(e) => handleProgramChange('description', e.target.value)}
                                    placeholder="Describe the activity, participation, and outcome..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all shadow-sm h-28 resize-none"
                                    required
                                />
                            </div>

                            {/* Date & Poster Upload */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Date of Program</label>
                                    <input
                                        type="date"
                                        value={programs[activeProgramIndex].date}
                                        onChange={(e) => handleProgramChange('date', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer"
                                        min={minDate}
                                        max={maxDate}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Program Poster</label>
                                    <div>
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
                                            className={`w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all min-h-[56px] text-xs font-bold ${programs[activeProgramIndex].poster
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-500 shadow-sm'
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

                            {/* Photo Gallery Upload */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Program Photo Gallery (Optional)</label>
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex flex-wrap gap-3">
                                        {(programs[activeProgramIndex].gallery || []).map((url, idx) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
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

                                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 cursor-pointer transition-colors bg-slate-50 shrink-0">
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
                                                    <Images size={20} className="mb-1 text-slate-400" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-center px-1">Add<br />Photos</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Programs List (Pills) */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block pl-1">All Added Programs</label>
                        <div className="flex flex-wrap gap-3">
                            {programs.map((p, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveProgramIndex(idx)}
                                    className={`relative px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3
                                        ${activeProgramIndex === idx
                                            ? 'bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm scale-105'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-slate-50'
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
                                            className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={submitting || !classNumber}
                        className="w-full py-5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {submitting ? 'Submitting Report...' : 'Submit Monthly Report'}
                    </button>
                    {!classNumber && (
                        <p className="text-center text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-4">
                            You cannot submit because you have no assigned class
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
