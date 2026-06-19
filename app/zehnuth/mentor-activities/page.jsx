"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Star, Send, Loader2, User, Activity, Plus, CheckCircle2, X, AlertTriangle, Image as ImageIcon, Upload, FileText } from 'lucide-react';

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
                        Activity Submitted Successfully
                    </p>

                    <div className="rounded-3xl p-6 mb-8 border bg-slate-50 border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">
                            Request Sent
                        </p>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-600 uppercase italic">Awaiting Admin Approval</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all shadow-xl bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                    >
                        Great, Thanks!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function MentorActivities() {
    const [teacher, setTeacher] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form states
    const [activityTitle, setActivityTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            setTeacher(teacherData);
            fetchActivities(teacherData);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchActivities = async (teacherData) => {
        try {
            const mentorId = teacherData.id || teacherData._id;
            const res = await axios.get(`/api/zehnuth/mentor-activities?mentorId=${mentorId}`);
            setActivities(res.data);
        } catch (err) {
            console.error("Error fetching activities:", err);
        } finally {
            setLoading(false);
        }
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
            setFileUrl(res.data.secure_url);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image: " + (err.response?.data?.error?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!activityTitle || !description) {
            alert("Please provide both an activity title and description");
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/zehnuth/mentor-activities', {
                mentorId: teacher.id || teacher._id,
                activityTitle,
                description,
                imageUrl: fileUrl || null
            });
            setShowSuccess(true);
            setActivityTitle('');
            setDescription('');
            setFileUrl('');
            fetchActivities(teacher);
        } catch (err) {
            console.error("Error submitting activity:", err);
            alert("Failed to submit activity");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
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
                        <p className="text-slate-500 font-medium mt-2">Please login as a teacher to view this page.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />
            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 space-y-6">

                {/* Header */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Activity size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Zehnuth Tracking</p>
                                <h1 className="text-3xl font-black uppercase italic tracking-tight">Mentor Activities</h1>
                            </div>
                        </div>
                        <p className="text-indigo-100 font-medium max-w-xl text-sm leading-relaxed">
                            Log your mentoring activities, academic guidance, and special efforts to earn points and climb the mentor leaderboard.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Submission Form */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase italic">Log Activity</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Activity Title</label>
                                <input
                                    type="text"
                                    value={activityTitle}
                                    onChange={(e) => setActivityTitle(e.target.value)}
                                    placeholder="e.g. Special Academic Guidance Session"
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 focus:bg-white outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the activity and its impact..."
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 focus:bg-white outline-none transition-all h-32 resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Proof / Evidence (Optional)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={uploading}
                                    />
                                    {fileUrl ? (
                                        <div className="absolute inset-0">
                                            <img src={fileUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-xs font-bold uppercase tracking-wider">Change Image</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-center z-0">
                                            {uploading ? (
                                                <Loader2 className="mx-auto h-8 w-8 text-indigo-500 animate-spin" />
                                            ) : (
                                                <Upload className="mx-auto h-8 w-8 text-slate-400" />
                                            )}
                                            <div className="flex text-sm text-slate-600">
                                                <span className="relative rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                    {uploading ? 'Uploading...' : 'Upload a file'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNG, JPG up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || uploading}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {submitting ? 'Submitting...' : 'Submit Activity'}
                            </button>
                        </form>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border border-slate-100 flex flex-col h-[600px]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 uppercase italic">Your History</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Points</p>
                                <p className="text-xl font-black text-indigo-600">
                                    {activities.reduce((acc, curr) => acc + (curr.points || 0), 0)}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                            {activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Activity className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">No activities yet</p>
                                </div>
                            ) : (
                                activities.map(act => (
                                    <div key={act._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-4">
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{act.activityTitle}</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{formatDate(act.createdAt)}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className={`inline-block px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest
                                                    ${act.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                                        act.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                                            'bg-amber-100 text-amber-600'}`}
                                                >
                                                    {act.status}
                                                </span>
                                                {act.status === 'approved' && (
                                                    <p className="text-xs font-black text-indigo-600 mt-1">+{act.points} pts</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium line-clamp-2">{act.description}</p>
                                        {act.imageUrl && (
                                            <div className="mt-3 text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1">
                                                <ImageIcon size={10} /> Proof Attached
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
