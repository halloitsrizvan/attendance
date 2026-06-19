"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Star, Send, Loader2, User, Activity, Plus, CheckCircle2, X, ChevronDown, AlertTriangle, Search, CheckCircle, Image as ImageIcon, Upload } from 'lucide-react';

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
    { id: 'Writings', label: 'Writings', icon: '✍️', points: [20, 10, 5] },
    { id: 'Achievements', label: 'Achievements', icon: '🏆', points: [20, 10] },
    { id: 'Presentation', label: 'Presentations', icon: '🎤', points: [40, 30, 20, 10, 5] },
    { id: 'Exam', label: 'Exam', icon: '🎓', points: [50, 35, 25, 20, 10] },
    { id: 'Mentor', label: 'Mentor', icon: '🤝', points: [5, 4, 3, 2, 1] },
    { id: 'Competitions', label: 'Competitions', icon: '🏅', points: [25, 20, 15, 10, 5, 3] },
    { id: 'Works', label: 'Works', icon: '🎨', points: [4] },
];

const ACTIVITY_POINTS = {
    // Writings
    'Essay': [20], 'Story': [20], 'Poem': [20], 'Translation': [20], 'Feature': [20],
    'Short story': [10], 'Short poem': [10], 'Travelogue': [10],
    'Note': [5], 'Response': [5], 'Letter': [5], 'Drawing': [5], 'Cartoon': [5],
    'Class magazine': [5],

    // Exam
    '1st Rank': [50], '2nd Rank': [35], '3rd Rank': [25],
    'High score bonus (90%)': [20], 'High score bonus (95%)': [25], 'Improvement bonus': [10],

    // Presentations
    'Paper presentation (State)': [40], 'Paper presentation (National)': [50], 'Paper presentation (International)': [60],
    'Keynote address': [30], 'Khutba': [20], 'Other presentations (Out)': [10],
    'Speech': [10], 'Other presentations (In)': [5],

    // Achievements
    'Courses': [20], 'Innovations': [20], 'Awards': [20], 'Publications': [20],

    // Competitions
    '1st Place (Out)': [25], '2nd Place (Out)': [20], '3rd Place (Out)': [15], 'Participation (Out)': [5],
    '1st Place (In)': [10], '2nd Place (In)': [8], '3rd Place (In)': [5], 'Participation (In)': [3],

    // Mentor
    'Language conversation': [5], 'Personal creative work': [5], 'Active student bonus': [5],

    // Works
    'Social works': [4], 'Poster design': [4], 'video edit': [4]
};

export default function SubmitPoint() {
    const [teacher, setTeacher] = useState(null);
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedMentee, setSelectedMentee] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Writings');
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [points, setPoints] = useState(0);
    const [remarks, setRemarks] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAwardedPoints, setLastAwardedPoints] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fileUrl, setFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);

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
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

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

    useEffect(() => {
        const categoryObj = CATEGORY_DATA.find(c => c.id === selectedCategory);
        const displayPoints = selectedAchievement && ACTIVITY_POINTS[selectedAchievement]
            ? ACTIVITY_POINTS[selectedAchievement]
            : (categoryObj?.points || [0]);
        if (displayPoints.length > 0) {
            setPoints(displayPoints[0]);
        } else {
            setPoints(0);
        }
    }, [selectedAchievement, selectedCategory]);

    const fetchMentees = async (teacherData) => {
        const mentorId = teacherData.id || teacherData._id;
        const roles = Array.isArray(teacherData.role) ? teacherData.role : [teacherData.role];
        const isSpecialTeacher = (teacherData.email || teacherData.EMAIL) === ADMIN_EMAIL || roles.includes('zehnuth_admin');

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
    const isAdmin = currentEmail.toLowerCase() === ADMIN_EMAIL.trim().toLowerCase() ||
        (Array.isArray(teacher?.role) ? teacher.role.includes('zehnuth_admin') : teacher?.role === 'zehnuth_admin');
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
                status: isAdmin ? 'approved' : 'pending',
                remarks: remarks || null,
                imageUrl: fileUrl || null
            });
            setLastAwardedPoints(points);
            setShowSuccess(true);
            setSelectedAchievement(null);
            setSelectedMentee('');
            setSearchTerm('');
            setPoints(0);
            setRemarks('');
            setFileUrl('');
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

    const PageSkeleton = () => (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-8 px-2 space-y-3">
                    <div className="h-8 w-64 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-48 bg-slate-50 rounded animate-pulse"></div>
                </div>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="h-3 w-32 bg-slate-100 rounded animate-pulse"></div>
                        <div className="h-14 w-full bg-slate-50 rounded-2xl animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                        <div className="flex gap-2 overflow-hidden">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-slate-50 rounded-xl shrink-0 animate-pulse"></div>)}
                        </div>
                    </div>
                    <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 min-h-[300px]">
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-slate-100 rounded-2xl animate-pulse"></div>)}
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-slate-50 rounded-xl animate-pulse"></div>)}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );

    if (loading) return <PageSkeleton />;

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

                        {selectedCategory === 'Works' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                    <Card label="Social works" />
                                    <Card label="Poster design" />
                                    <Card label="video edit" />
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
                            <div className="flex items-center justify-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPoints(prev => Math.max(0, prev - 1))}
                                    className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-amber-400 hover:text-amber-500 transition-all active:scale-95 shadow-sm"
                                >
                                    <span className="text-2xl font-light leading-none mb-1">-</span>
                                </button>

                                <div className="w-24 text-center">
                                    <span className="text-4xl font-black text-slate-800 tracking-tight">{points}</span>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Points</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPoints(prev => prev + 1)}
                                    className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-200"
                                >
                                    <span className="text-2xl font-light leading-none mb-1">+</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Evidence / Proof</label>
                            <div className="px-1">
                                {fileUrl ? (
                                    <div className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                                        <img src={fileUrl} alt="Evidence" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = handleUpload;
                                                    input.click();
                                                }}
                                                className="p-2 bg-white text-indigo-600 rounded-xl shadow-lg"
                                            >
                                                <Upload size={18} />
                                            </button>
                                            <button type="button" onClick={() => setFileUrl('')} className="p-2 bg-white text-rose-500 rounded-xl shadow-lg">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50 flex flex-col items-center justify-center transition-all hover:bg-slate-50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUpload}
                                            className="hidden"
                                            id="zehnuth-submit-upload"
                                        />
                                        <label
                                            htmlFor="zehnuth-submit-upload"
                                            className={`cursor-pointer px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2
                                                ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                            {uploading ? 'Uploading...' : 'Attach Proof Image (Optional)'}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Remarks (Optional)</label>
                            <div className="px-1">
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add any additional context or details here..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-blue-400 focus:bg-white outline-none transition-all resize-none h-24"
                                />
                            </div>
                        </div>

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
