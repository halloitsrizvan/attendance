"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Send, Plus, X, Loader2, AlertTriangle, CheckCircle2, Calendar, LayoutGrid, ImagePlus, Images, ChevronDown } from 'lucide-react';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORIES = ['Internal', 'External'];

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

    const createEmptyProgram = () => ({
        category: 'Internal',
        title: '',
        tier: 'Tier 1',
        targetAudience: '',
        objectives: '',
        participantsCount: '',
        venue: '',
        guestName: '',
        description: '',
        poster: '',
        date: '',
        gallery: [],
        collaboration: ''
    });

    const [programs, setPrograms] = useState([createEmptyProgram()]);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [existingTier1Count, setExistingTier1Count] = useState(0);

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

    useEffect(() => {
        const fetchExistingTier1 = async () => {
            if (!classNumber && classNumber !== 0) return;
            try {
                const res = await axios.get(`/api/class-reports?classNumber=${classNumber}`);
                const thisMonthReports = (res.data || []).filter(r => r.month === month && r.year === Number(year));
                const count = thisMonthReports.reduce((sum, r) => {
                    return sum + (r.programs || []).filter(p => p.tier === 'Tier 1' && !p.rejected).length;
                }, 0);
                setExistingTier1Count(count);
            } catch (err) {
                console.error("Error fetching existing Tier 1 count:", err);
            }
        };
        fetchExistingTier1();
    }, [month, year, classNumber]);

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
        const currentTier1InForm = programs.filter(p => p.tier === 'Tier 1').length;
        const isLimitReached = (existingTier1Count + currentTier1InForm) >= 10;

        const newProg = createEmptyProgram();
        if (isLimitReached) {
            newProg.tier = 'Tier 2';
            alert(`Limit Reached: You already have ${existingTier1Count} Tier 1 program(s) submitted this month and ${currentTier1InForm} in this form. The new program is automatically set to Tier 2 (Max 10 Tier 1 per month).`);
        }

        setPrograms([...programs, newProg]);
        setActiveProgramIndex(programs.length);
    };

    const handleRemoveProgram = (index, e) => {
        e.stopPropagation();
        const newPrograms = [...programs];
        newPrograms.splice(index, 1);

        if (newPrograms.length === 0) {
            newPrograms.push(createEmptyProgram());
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

        for (let i = 0; i < programs.length; i++) {
            const p = programs[i];
            if (!p.title?.trim() || !p.date || !p.objectives?.trim() || 
                !p.targetAudience?.trim() || p.participantsCount === '' || p.participantsCount === undefined || p.participantsCount === null || 
                !p.venue?.trim() || !p.guestName?.trim() || !p.collaboration) {
                alert(`Please fill out all text fields and selections for Program ${i + 1}.`);
                setActiveProgramIndex(i);
                return;
            }
            if (!p.poster) {
                alert(`Program Poster is mandatory: Please upload a poster image for Program ${i + 1}.`);
                setActiveProgramIndex(i);
                return;
            }
            if (!p.gallery || p.gallery.length === 0) {
                alert(`Photo Gallery is mandatory: Please upload at least one photo for Program ${i + 1}.`);
                setActiveProgramIndex(i);
                return;
            }
        }
        const validPrograms = programs;

        // Validate Tier 1 limit (max 10 per month) - only check if we are submitting new Tier 1 programs
        const tier1CountInForm = validPrograms.filter(p => p.tier === 'Tier 1').length;
        if (tier1CountInForm > 0) {
            try {
                const existingRes = await axios.get(`/api/class-reports?classNumber=${classNumber}`);
                const thisMonthReports = (existingRes.data || []).filter(r => r.month === month && r.year === Number(year));
                const existingTier1Count = thisMonthReports.reduce((sum, r) => {
                    const count = (r.programs || []).filter(p => p.tier === 'Tier 1' && !p.rejected).length;
                    return sum + count;
                }, 0);

                if (existingTier1Count + tier1CountInForm > 10) {
                    alert(`Limit Exceeded: You have already submitted ${existingTier1Count} Tier 1 program(s) this month. You can only submit up to ${Math.max(0, 10 - existingTier1Count)} more Tier 1 program(s) in total. (Max 10 per month)`);
                    return;
                }
            } catch (err) {
                console.error("Error validating Tier 1 limit:", err);
                if (existingTier1Count + tier1CountInForm > 10) {
                    alert("Limit Exceeded: You can submit a maximum of 10 Tier 1 programs in a month.");
                    return;
                }
            }
        }

        setSubmitting(true);
        try {
            // Process programs: compile fields into description for backward-compatibility
            const processedPrograms = validPrograms.map(p => {
                const compiledDescription = `Target Audience: ${p.targetAudience || 'N/A'}\nObjectives: ${p.objectives || 'N/A'}\nParticipants: ${p.participantsCount || '0'}\nVenue: ${p.venue || 'N/A'}\nGuest/Key Person: ${p.guestName || 'N/A'}`;
                return {
                    ...p,
                    description: compiledDescription
                };
            });

            const payload = {
                month,
                year,
                classNumber,
                programs: processedPrograms,
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
            setPrograms([createEmptyProgram()]);
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
        <div className="bg-white rounded-[1rem] p-2 sm:p-2">
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
                                disabled={true}
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
                            disabled={true}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                                {/* Program Tier Selection */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Program Tier</label>
                                    <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-300/10 w-full mt-2">
                                        {['Tier 1', 'Tier 2'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => {
                                                    if (t === 'Tier 1' && programs[activeProgramIndex].tier !== 'Tier 1') {
                                                        const currentTier1InForm = programs.filter((p, idx) => p.tier === 'Tier 1' && idx !== activeProgramIndex).length;
                                                        if (existingTier1Count + currentTier1InForm >= 10) {
                                                            alert(`Limit Reached: You already have ${existingTier1Count} Tier 1 program(s) submitted this month and ${currentTier1InForm} other Tier 1 program(s) in this form. You cannot select Tier 1 (Max 10 per month).`);
                                                            return;
                                                        }
                                                    }
                                                    handleProgramChange('tier', t);
                                                }}
                                                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200
                                                     ${(programs[activeProgramIndex].tier || 'Tier 1') === t
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50'
                                                        : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {t}
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
                                            <option value="" disabled>Select Collaboration...</option>
                                            <option value="None">None / Solo</option>
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

                            {/* Granular Fields instead of Brief Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Target Audience</label>
                                    <input
                                        type="text"
                                        value={programs[activeProgramIndex].targetAudience || ''}
                                        onChange={(e) => handleProgramChange('targetAudience', e.target.value)}
                                        placeholder="e.g. Class Students, Parents..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Participants Count</label>
                                    <input
                                        type="number"
                                        value={programs[activeProgramIndex].participantsCount || ''}
                                        onChange={(e) => handleProgramChange('participantsCount', e.target.value)}
                                        placeholder="e.g. 50, 120..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Venue</label>
                                    <input
                                        type="text"
                                        value={programs[activeProgramIndex].venue || ''}
                                        onChange={(e) => handleProgramChange('venue', e.target.value)}
                                        placeholder="e.g. College Auditorium, Class Room 5..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Guest or Key Role Person Name</label>
                                    <input
                                        type="text"
                                        value={programs[activeProgramIndex].guestName || ''}
                                        onChange={(e) => handleProgramChange('guestName', e.target.value)}
                                        placeholder="e.g. Dr. Salman (Guest Speaker)..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Objectives</label>
                                <textarea
                                    value={programs[activeProgramIndex].objectives || ''}
                                    onChange={(e) => handleProgramChange('objectives', e.target.value)}
                                    placeholder="Describe the main objectives and outcomes of the program..."
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
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Program Photo Gallery </label>
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
