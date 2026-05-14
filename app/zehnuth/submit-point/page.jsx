"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Star, Send, Loader2, User, Activity, Plus, CheckCircle2, X, ChevronDown, AlertTriangle, Search, CheckCircle } from 'lucide-react';

const ADMIN_EMAIL = 'krehmankoolivayal13889@gmail.com';

const SuccessModal = ({ isOpen, onClose, points, isAdmin, teacherMail }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
                <div className="p-10 text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 animate-bounce ${isAdmin ? 'bg-amber-100 text-amber-600 shadow-lg shadow-amber-100' : 'bg-emerald-100 text-emerald-600'}`}>
                        {isAdmin ? <Trophy size={48} /> : <CheckCircle2 size={48} />}
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic mb-2">
                        {isAdmin ? 'Congrats!' : 'Success!'}
                    </h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">
                        {isAdmin ? 'Points Awarded Instantly' : 'Points Submitted Successfully'}
                    </p>
                    
                    <div className={`rounded-3xl p-6 mb-8 border ${isAdmin ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isAdmin ? 'text-amber-500' : 'text-slate-400'}`}>
                            {isAdmin ? 'Achievement Unlocked' : 'Request Sent'}
                        </p>
                        {isAdmin && (
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-slate-900">+{points} PTS</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live on Leaderboard</p>
                            </div>
                        )}
                        {!isAdmin && (
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-600 uppercase italic">Awaiting Final Approval</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={onClose}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all shadow-xl ${isAdmin ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
                    >
                        {isAdmin ? 'Awesome!' : 'Great, Thanks!'}
                    </button>
                </div>
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

const CATEGORY_DATA = [
    { id: 'Exam', label: 'Exam', icon: '🎓', points: [50, 35, 25, 20, 10] },
    { id: 'Writings', label: 'Writings', icon: '✍️', points: [20, 10, 5] },
    { id: 'Presentation', label: 'Presentations', icon: '🎤', points: [40, 30, 20, 10, 5] },
    { id: 'Achievements', label: 'Achievements', icon: '🏆', points: [20, 10] },
    { id: 'Competitions', label: 'Competitions', icon: '🏅', points: [25, 20, 15, 10, 5, 3] },
    { id: 'Mentor', label: 'Mentor', icon: '🤝', points: [5, 4, 3, 2, 1] },
];

export default function SubmitPoint() {
    const [teacher, setTeacher] = useState(null);
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedMentee, setSelectedMentee] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Exam');
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [points, setPoints] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAwardedPoints, setLastAwardedPoints] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredMentees = (mentees || []).filter(rel => {
        const student = rel.menteeId;
        if (!student) return false;
        const name = (student["SHORT NAME"] || student["FULL NAME"] || "").toLowerCase();
        const adno = (student.ADNO || "").toString();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || adno.includes(term);
    }).slice(0, 10);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            setTeacher(teacherData);
            fetchMentees(teacherData);
        }
    }, []);

    const fetchMentees = async (teacherData) => {
        const mentorId = teacherData.id || teacherData._id;
        const isSpecialTeacher = (teacherData.email || teacherData.EMAIL) === ADMIN_EMAIL;
        
        try { 
            if (isSpecialTeacher) {
                const res = await axios.get('/api/students');
                setMentees(res.data.map(s => ({ menteeId: s })));
            } else {
                const res = await axios.get(`/api/zehnuth/mentor-mentee?mentorId=${mentorId}`);
                setMentees(res.data);
            }
        } catch (err) {
            console.error("Error fetching mentees:", err);
        } finally {
            setLoading(false);
        }
    };

    const currentEmail = (teacher?.email || teacher?.EMAIL || teacher?.mail || teacher?.MAIL || '').toString().trim();
    const isAdmin = currentEmail.toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
    const teacherMail = currentEmail || 'Teacher';

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedMentee || !selectedAchievement || (isAdmin && !points)) {
            alert("Please fill all fields and select an achievement");
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/zehnuth/points', {
                studentId: selectedMentee,
                mentorId: teacher.id || teacher._id,
                activity: selectedAchievement,
                category: selectedCategory,
                points: isAdmin ? Number(points) : 0,
                approved: isAdmin,
                mentorApproved: true,
                status: isAdmin ? 'approved' : 'pending'
            });
            setLastAwardedPoints(points);
            setShowSuccess(true);
            setSelectedAchievement(null);
            setSelectedMentee('');
            setSearchTerm('');
            setPoints(0);
        } catch (err) {
            console.error("Error submitting points:", err);
            alert("Failed to submit points");
        } finally {
            setSubmitting(false);
        }
    };

    const Badge = ({ children, color }) => {
        const colors = {
            teal: 'bg-emerald-50 text-emerald-700',
            blue: 'bg-blue-50 text-blue-700',
            amber: 'bg-amber-50 text-amber-700',
            purple: 'bg-purple-50 text-purple-700',
            coral: 'bg-orange-50 text-orange-700'
        };
        return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[color] || colors.blue}`}>{children}</span>;
    };

    const Card = ({ label }) => (
        <button
            type="button"
            onClick={() => setSelectedAchievement(prev => prev === label ? null : label)}
            className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group w-full
                ${selectedAchievement === label 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-white border-slate-100 text-slate-800 hover:border-blue-200'}`}
        >
            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedAchievement === label ? 'text-blue-200' : 'text-slate-400'}`}>{label}</p>
            {selectedAchievement === label && (
                <div className="absolute top-2 right-2 text-white">
                    <CheckCircle size={14} />
                </div>
            )}
        </button>
    );

    const Row = ({ label, condition, badgeColor }) => (
        <tr 
            onClick={() => setSelectedAchievement(prev => prev === label ? null : label)}
            className={`group cursor-pointer transition-all ${selectedAchievement === label ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
        >
            <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all
                        ${selectedAchievement === label ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white'}`}>
                        {selectedAchievement === label && <CheckCircle size={12} />}
                    </div>
                    <span className="font-bold text-slate-700 text-xs">{label}</span>
                </div>
            </td>
            <td className="py-3 px-2"><Badge color={badgeColor}>{condition}</Badge></td>
        </tr>
    );

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <SuccessModal 
                    isOpen={showSuccess} 
                    onClose={() => setShowSuccess(false)} 
                    points={lastAwardedPoints} 
                    teacherMail={teacherMail}
                    isAdmin={isAdmin}
                />
                <div className="mb-8 px-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-blue-600 text-white rounded-xl"><Trophy size={20} /></span>
                        {isAdmin ? 'Award' : 'Request'} <span className="bg-gradient-to-r from-amber-400 via-amber-600 to-amber-500 bg-clip-text text-transparent">Zehnuth</span>
                    </h1>  
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        {isAdmin ? 'Instantly award points to any student' : 'Submit an achievement on behalf of your mentee'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Student Selection */}
                    <div className="space-y-3 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Search Student</label>
                        <div className="relative">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Enter AD No or Name..."
                                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all pr-12"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                    <Search size={20} />
                                </div>
                            </div>

                            {showSuggestions && searchTerm && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {filteredMentees.length > 0 ? (
                                        filteredMentees.map((rel) => (
                                            <button
                                                key={rel.menteeId._id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMentee(rel.menteeId._id);
                                                    setSearchTerm(`${rel.menteeId["SHORT NAME"] || rel.menteeId["FULL NAME"]} (${rel.menteeId.ADNO})`);
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                                            >
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 uppercase">{rel.menteeId["SHORT NAME"] || rel.menteeId["FULL NAME"]}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AD: {rel.menteeId.ADNO}</p>
                                                </div>
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                                    <Plus size={16} />
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No students found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                        <div className="flex flex-wrap gap-2 px-1">
                            {CATEGORY_DATA.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setSelectedAchievement(null);
                                        if (isAdmin) setPoints(cat.points[0]);
                                    }}
                                    className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 whitespace-nowrap
                                        ${selectedCategory === cat.id 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <span className="text-lg">{cat.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Achievement Selection */}
                    <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 min-h-[300px]">
                        {selectedCategory === 'Exam' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <Card label="1st Rank" />
                                    <Card label="2nd Rank" />
                                    <Card label="3rd Rank" />
                                </div>
                                <table className="w-full text-[13px]">
                                    <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="pb-2 text-left px-2">Criteria</th><th className="pb-2 text-left px-2">Condition</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <Row label="High score bonus (90%)" condition="Above 90%" badgeColor="teal" />
                                        <Row label="High score bonus (95%)" condition="Above 95%" badgeColor="blue" />
                                        <Row label="Improvement bonus" condition="Performance increase" badgeColor="amber" />
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'Writings' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Full-length works</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {['Essay', 'Story', 'Poem', 'Translation', 'Feature'].map(item => (
                                            <Card key={item} label={item} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Short works</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {['Short story', 'Short poem', 'Travelogue'].map(item => (
                                            <Card key={item} label={item} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Brief writings</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {['Note', 'Response', 'Letter', 'Drawing', 'Cartoon'].map(item => (
                                            <Card key={item} label={item} />
                                        ))}
                                    </div>
                                </div>
                                <table className="w-full text-[13px] border-t border-slate-100 pt-4">
                                    <tbody className="divide-y divide-slate-100">
                                        <Row label="Class magazine" condition="Published in secondary class magazine" badgeColor="coral" />
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'Presentation' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Out of campus</p>
                                    <table className="w-full text-[13px]">
                                        <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="pb-2 text-left px-2">Type</th><th className="pb-2 text-left px-2">Level</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="Paper presentation (State)" condition="State" badgeColor="teal" />
                                            <Row label="Paper presentation (National)" condition="National" badgeColor="blue" />
                                            <Row label="Paper presentation (International)" condition="International" badgeColor="purple" />
                                            <Row label="Keynote address" condition="Guest Speaker" badgeColor="blue" />
                                            <Row label="Khutba" condition="Public Address" badgeColor="teal" />
                                            <Row label="Other presentations (Out)" condition="External" badgeColor="amber" />
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Inside campus</p>
                                    <table className="w-full text-[13px]">
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="Speech" condition="Campus Event" badgeColor="blue" />
                                            <Row label="Other presentations (In)" condition="Campus internal" badgeColor="teal" />
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Achievements' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <Card label="Courses" />
                                    <Card label="Innovations" />
                                    <Card label="Awards" />
                                    <Card label="Publications" />
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Competitions' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Out of campus</p>
                                    <table className="w-full text-[13px]">
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="1st Place (Out)" condition="Out of Campus" badgeColor="amber" />
                                            <Row label="2nd Place (Out)" condition="Out of Campus" badgeColor="teal" />
                                            <Row label="3rd Place (Out)" condition="Out of Campus" badgeColor="blue" />
                                            <Row label="Participation (Out)" condition="Out of Campus" badgeColor="purple" />
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Inside campus</p>
                                    <table className="w-full text-[13px]">
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="1st Place (In)" condition="Inside Campus" badgeColor="amber" />
                                            <Row label="2nd Place (In)" condition="Inside Campus" badgeColor="teal" />
                                            <Row label="3rd Place (In)" condition="Inside Campus" badgeColor="blue" />
                                            <Row label="Participation (In)" condition="Inside Campus" badgeColor="purple" />
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Mentor' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <table className="w-full text-[13px]">
                                    <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="pb-2 text-left px-2">Activity</th><th className="pb-2 text-left px-2">Details</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <Row label="Language conversation" condition="Min. 20 minutes" badgeColor="teal" />
                                        <Row label="Personal creative work" condition="Poem / Story / Essay / Translation" badgeColor="purple" />
                                        <Row label="Active student bonus" condition="Lesson plans listed" badgeColor="amber" />
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Award Points - ONLY for Admin */}
                    {isAdmin && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Star size={12} className="text-amber-500" /> Award Points (Admin Only)
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {CATEGORY_DATA.find(c => c.id === selectedCategory)?.points.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPoints(p)}
                                        className={`py-4 rounded-2xl text-sm font-black transition-all border-2
                                            ${points === p 
                                                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100 scale-95' 
                                                : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selected Achievement</label>
                            <div className="px-2">
                                {selectedAchievement ? (
                                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-[11px] font-black uppercase flex items-center justify-between animate-in slide-in-from-left-2 duration-200">
                                        <span className="flex items-center gap-3"><Trophy size={14} /> {selectedAchievement}</span>
                                        <button onClick={() => setSelectedAchievement(null)} className="hover:text-blue-900"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-bold text-slate-400 italic">No achievement selected.</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !selectedAchievement || !selectedMentee}
                            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3
                                ${(!selectedAchievement || !selectedMentee) ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-blue-600 active:scale-95 shadow-slate-200'}`}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            {submitting ? 'Submitting...' : 'Award Achievement'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
