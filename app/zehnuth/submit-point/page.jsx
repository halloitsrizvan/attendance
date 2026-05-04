"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Star, Send, Loader2, User, Activity, Plus, CheckCircle2, X, ChevronDown } from 'lucide-react';

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
    { id: 'Writings', label: 'Writings/Articles', icon: '✍️', points: [20, 10, 5] },
    { id: 'Exam', label: 'Academic/Exam', icon: '🎓', points: [50, 35, 25, 20, 10] },
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
    const [points, setPoints] = useState(CATEGORIES[0].points[0]);
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
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <div className="animate-pulse">
                    <div className="mb-8 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                            <div className="h-8 bg-slate-100 rounded-lg w-48"></div>
                        </div>
                        <div className="h-4 bg-slate-50 rounded-md w-32 mt-2"></div>
                    </div>
                    
                    <div className="space-y-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-3">
                                <div className="h-3 bg-slate-100 rounded-full w-24 px-1"></div>
                                <div className="h-14 bg-slate-50 rounded-2xl w-full"></div>
                            </div>
                        ))}
                        <div className="h-14 bg-slate-100 rounded-2xl w-full mt-4"></div>
                    </div>
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-8 px-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-blue-600 text-white rounded-xl"><Trophy size={20} /></span>
                       Submit <span className="bg-gradient-to-r from-amber-400 via-amber-600 to-amber-500 bg-clip-text text-transparent">Zehnuth</span>
                    </h1>  
                    <p className="text-slate-500 text-sm font-medium mt-1">Award points to your mentees</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Student Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Mentee</label>
                        <div className="relative group">
                            <select
                                value={selectedMentee}
                                onChange={(e) => setSelectedMentee(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none pr-12"
                                required
                            >
                                <option value="">Choose a student...</option>
                                {mentees.map((rel) => (
                                    <option key={rel.menteeId._id} value={rel.menteeId._id}>
                                        {rel.menteeId["SHORT NAME"] || rel.menteeId["FULL NAME"]} ({rel.menteeId.ADNO})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setPoints(cat.points[0]);
                                    }}
                                    className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5
                                        ${selectedCategory === cat.id 
                                            ? 'bg-blue-600 border-blue-600 text-white' 
                                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <span className="text-xl">{cat.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center">{cat.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Points Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Award Points</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.find(c => c.id === selectedCategory).points.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPoints(p)}
                                    className={`flex-1 min-w-[60px] h-12 rounded-xl border-2 transition-all flex items-center justify-center text-sm font-black
                                        ${points === p 
                                            ? 'bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-100' 
                                            : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                                >
                                    +{p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Description */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Activity Description</label>
                        <textarea
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            placeholder="What did they achieve?"
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all h-28 resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 mt-4"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send size={16} /> Submit Achievement
                            </>
                        )}
                    </button>
                </form>
            </main>

            <SuccessModal 
                isOpen={showSuccess} 
                onClose={() => setShowSuccess(false)} 
                points={lastAwardedPoints} 
            />
        </div>
    );
}
