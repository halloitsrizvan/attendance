"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Star, Send, Loader2, User, Activity, Plus, CheckCircle2, X } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, points }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
                <div className="p-10 text-center">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 animate-bounce">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic mb-2">Success!</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Points Submitted Successfully</p>
                    
                    <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Awarded</p>
                        <p className="text-4xl font-black text-amber-500">+{points} PTS</p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 active:scale-95 transition-all shadow-xl"
                    >
                        Great, Thanks!
                    </button>
                </div>
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

const CATEGORIES = [
    { id: 'Exam', label: 'Academic/Exam', icon: '🎓', points: [50, 35, 25, 20, 10] },
    { id: 'Writings', label: 'Writings/Articles', icon: '✍️', points: [20, 10, 5] },
    { id: 'Presentation', label: 'Presentations', icon: '🎤', points: [40, 30, 20, 10, 5] },
    { id: 'Achievements', label: 'Achievements/Awards', icon: '🏆', points: [20, 10] },
    { id: 'Competitions', label: 'Competitions', icon: '🏅', points: [25, 20, 15, 10, 5, 3] },
    { id: 'MentorBonus', label: 'Mentor Bonus', icon: '🤝', points: [5, 4, 3, 2, 1] },
];

export default function SubmitPoint() {
    const [teacher, setTeacher] = useState(null);
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedMentee, setSelectedMentee] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
    const [activity, setActivity] = useState('');
    const [points, setPoints] = useState(5);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAwardedPoints, setLastAwardedPoints] = useState(0);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            setTeacher(teacherData);
            const mentorId = teacherData.id || teacherData._id;
            if (mentorId) fetchMentees(mentorId);
        }
    }, []);

    const fetchMentees = async (mentorId) => {
        try {
            const res = await axios.get(`/api/zehnuth/mentor-mentee?mentorId=${mentorId}`);
            setMentees(res.data);
        } catch (err) {
            console.error("Error fetching mentees:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMentee || !activity || !points) {
            alert("Please fill all fields");
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/zehnuth/points', {
                studentId: selectedMentee,
                mentorId: teacher.id || teacher._id,
                activity,
                category: selectedCategory,
                points: Number(points),
            });
            setLastAwardedPoints(points);
            setShowSuccess(true);
            setActivity('');
            setSelectedMentee('');
        } catch (err) {
            console.error("Error submitting points:", err);
            alert("Failed to submit points");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />
            <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-3xl shadow-xl shadow-blue-200 text-white mb-6 animate-bounce">
                        <Trophy size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase italic mb-2">ZEHNUTH Achievement</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em]">Mentor Portal • Submit Achievement Points</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden overflow-visible">
                    <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
                        {/* Student Selection */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <User size={14} className="text-blue-500" /> Select Mentee
                            </label>
                            <select
                                value={selectedMentee}
                                onChange={(e) => setSelectedMentee(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-sm font-bold text-slate-700 focus:border-blue-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Choose a student...</option>
                                {mentees.map((rel) => (
                                    <option key={rel.menteeId._id} value={rel.menteeId._id}>
                                        {rel.menteeId["SHORT NAME"] || rel.menteeId["FULL NAME"]} ({rel.menteeId.ADNO}) - {rel.menteeId.CLASS}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category Selection */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <Activity size={14} className="text-blue-500" /> Category
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(cat.id);
                                            setPoints(cat.points[0]);
                                        }}
                                        className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 text-center
                                            ${selectedCategory === cat.id 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                                                : 'bg-slate-50 border-slate-50 text-slate-600 hover:border-blue-200'}`}
                                    >
                                        <span className="text-2xl">{cat.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-tight">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Points Selection */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <Star size={14} className="text-blue-500" /> Points to Award
                            </label>
                            <div className="flex gap-4">
                                {CATEGORIES.find(c => c.id === selectedCategory).points.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPoints(p)}
                                        className={`w-16 h-16 rounded-2xl border-2 transition-all flex items-center justify-center text-lg font-black
                                            ${points === p 
                                                ? 'bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-100' 
                                                : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-amber-200'}`}
                                    >
                                        +{p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activity Description */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <Plus size={14} className="text-blue-500" /> Activity Description
                            </label>
                            <textarea
                                value={activity}
                                onChange={(e) => setActivity(e.target.value)}
                                placeholder="e.g., Secured first place in Quran Recitation competition..."
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 text-sm font-bold text-slate-700 focus:border-blue-400 focus:bg-white outline-none transition-all h-32 resize-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} /> Submit Achievement
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>

            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => setShowSuccess(false)} 
                points={lastAwardedPoints} 
            />
        </div>
    );
}
