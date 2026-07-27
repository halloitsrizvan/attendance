"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, CheckCircle2, XCircle, Loader2, User, Activity, Star, AlertTriangle, Clock, ChevronRight, Search } from 'lucide-react';

const ADMIN_EMAIL = 'krehmankoolivayal13889@gmail.com';

const CATEGORIES = [
    { id: 'Writings', label: 'Writings/Articles', icon: '✍️', points: [20, 10, 5] },
    { id: 'Presentation', label: 'Presentations', icon: '🎤', points: [40, 30, 20, 10, 5] },
    { id: 'Achievements', label: 'Achievements/Awards', icon: '🏆', points: [20, 10] },
    { id: 'Competitions', label: 'Competitions', icon: '🏅', points: [25, 20, 15, 10, 5, 3] },
    { id: 'MentorBonus', label: 'Mentor Bonus', icon: '🤝', points: [5, 4, 3, 2, 1] },
    { id: 'Exam', label: 'Academic/Exam', icon: '🎓', points: [50, 35, 25, 20, 10] },
    { id: 'Works', label: 'Works', icon: '🎨', points: [4] },
];

const ACTIVITY_POINTS = {
    // Writings
    'Essay': [20], 'Story': [20], 'Poem': [20], 'Translation': [20], 'Feature': [20], 'Full paper': [20],
    'Short story': [10], 'Short poem': [10], 'Travelogue': [10],
    'Note': [5], 'Response': [5], 'Letter': [5], 'Drawing': [5], 'Cartoon': [5], 'Abstract': [5],
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

const ReviewModal = ({ request, isOpen, onClose, onAction, processingId }) => {
    const [points, setPoints] = useState(0);
    const categoryObj = CATEGORIES.find(c => c.id === request?.category);

    // Determine which points to show: activity-specific or category fallback
    const displayPoints = request?.activity && ACTIVITY_POINTS[request.activity]
        ? ACTIVITY_POINTS[request.activity]
        : (categoryObj?.points || [0]);

    useEffect(() => {
        if (displayPoints.length > 0) setPoints(displayPoints[0]);
    }, [request, displayPoints]);

    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-xl">
                                {categoryObj?.icon || '⭐'}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 uppercase italic leading-tight">Review Achievement</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{categoryObj?.label || request.category}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Student</p>
                                <p className="text-sm font-black text-slate-800 uppercase italic">
                                    {request.studentId?.["SHORT NAME"] || request.studentId?.["FULL NAME"]}
                                    <span className="ml-2 text-[10px] text-blue-500">Class: {request.studentId?.CLASS} • AD: {request.studentId?.ADNO}</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Activity size={10} /> Activity Details
                            </p>
                            <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{request.activity}"</p>
                            
                            {request.activity === 'Innovations' && request.websiteLink && (
                                <div className="mt-3 pt-3 border-t border-blue-100/30">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">
                                        Innovation Details
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500">Type:</span>
                                            <span className="text-[10px] font-black text-slate-700 uppercase bg-white px-2 py-1 rounded-md border border-slate-200">{request.innovationType || 'Not specified'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500">Link:</span>
                                            <a href={request.websiteLink.startsWith('http') ? request.websiteLink : `https://${request.websiteLink}`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-600 hover:underline break-all">
                                                {request.websiteLink}
                                            </a>
                                        </div>
                                        {request.isAiGenerated && (
                                            <div className="mt-2 flex items-center gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                <AlertTriangle size={12} /> AI GENERATED WEBSITE DETECTED
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {request.remarks && (
                                <div className="mt-3 pt-3 border-t border-blue-100/30">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">
                                        Remarks
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed">"{request.remarks}"</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-100/30">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {request.mentorApproved ? 'by' : 'by'} <span className="text-blue-600"> {request.mentorId?.name}</span>
                                </p>
                                {request.mentorApproved ? (
                                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Mentor Verified
                                    </span>
                                ) : (
                                    <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1">
                                        <Clock size={10} /> Pending Mentor
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Image Evidence Section */}
                        {request.imageUrl && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">Evidence Attached</label>
                                <div className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                                    <img src={request.imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                                    <a
                                        href={request.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black uppercase text-[10px] tracking-[0.2em] gap-2"
                                    >
                                        Click to View Full Image
                                    </a>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">Set Points Value</label>
                            <div className="flex items-center justify-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <button
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
                                    onClick={() => setPoints(prev => prev + 1)}
                                    className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-200"
                                >
                                    <span className="text-2xl font-light leading-none mb-1">+</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            disabled={processingId === request._id}
                            onClick={() => onAction(request._id, 'reject')}
                            className="py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95"
                        >
                            <XCircle size={16} /> REJECT
                        </button>
                        <button
                            disabled={processingId === request._id}
                            onClick={() => onAction(request._id, 'approve', points)}
                            className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                        >
                            {processingId === request._id ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={16} className="text-emerald-400" /> APPROVE & AWARD
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestSkeleton = () => (
    <div className="w-full py-6 flex items-center justify-between border-b border-slate-50 animate-pulse px-2">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
            <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
                <div className="h-3 w-48 bg-slate-50 rounded"></div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="h-3 w-12 bg-slate-50 rounded hidden sm:block"></div>
            <div className="w-4 h-4 bg-slate-100 rounded"></div>
        </div>
    </div>
);

export default function ZehnuthRequests() {
    const [teacher, setTeacher] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    // Pagination state
    const [displayLimit, setDisplayLimit] = useState(50);

    useEffect(() => {
        setDisplayLimit(50);
    }, [searchQuery]);

    // Derived unique students for suggestions from current requests
    const uniqueStudentsMap = new Map();
    requests.forEach(r => {
        const name = r.studentId?.["SHORT NAME"] || r.studentId?.["FULL NAME"];
        const classNum = r.studentId?.CLASS;
        if (name && !uniqueStudentsMap.has(name)) {
            uniqueStudentsMap.set(name, { name, classNum });
        }
    });
    const uniqueStudents = Array.from(uniqueStudentsMap.values());
    const suggestions = uniqueStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filtered requests based on search query
    const filteredRequests = requests.filter(r => {
        if (!searchQuery) return true;
        const name = r.studentId?.["SHORT NAME"] || r.studentId?.["FULL NAME"];
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            setTeacher(teacherData);
            
            const teacherId = teacherData.id || teacherData._id;
            if (teacherId) {
                axios.get(`/api/teachers/${teacherId}`)
                    .then(res => {
                        if (res.data) {
                            const updatedTeacher = {
                                ...teacherData,
                                ...res.data,
                                id: res.data._id
                            };
                            setTeacher(updatedTeacher);
                            localStorage.setItem('teacher', JSON.stringify(updatedTeacher));
                            
                            const roles = Array.isArray(updatedTeacher.role) ? updatedTeacher.role : [updatedTeacher.role];
                            if ((updatedTeacher.email || updatedTeacher.EMAIL) === ADMIN_EMAIL || roles.includes('zehnuth_admin')) {
                                fetchRequests();
                            } else {
                                setLoading(false);
                            }
                        } else {
                            setLoading(false);
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching latest teacher details, falling back to local storage:", err);
                        const roles = Array.isArray(teacherData.role) ? teacherData.role : [teacherData.role];
                        if ((teacherData.email || teacherData.EMAIL) === ADMIN_EMAIL || roles.includes('zehnuth_admin')) {
                            fetchRequests();
                        } else {
                            setLoading(false);
                        }
                    });
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/zehnuth/points?status=pending');
            setRequests(res.data.filter(r => r.mentorApproved === true));
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, action, points = 0) => {
        setProcessingId(requestId);
        try {
            await axios.put('/api/zehnuth/points', {
                id: requestId,
                status: action === 'approve' ? 'approved' : 'rejected',
                approved: action === 'approve',
                points: points
            });
            setRequests(prev => prev.filter(r => r._id !== requestId));
            setSelectedRequest(null);
        } catch (err) {
            console.error(`Error ${action}ing request:`, err);
            alert(`Failed to ${action} request`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-3xl mx-auto px-6 pt-24 pb-20">
                <div className="mb-10 flex items-end justify-between px-2">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
                        <div className="h-3 w-64 bg-slate-50 rounded animate-pulse"></div>
                    </div>
                    <div className="w-24 sm:w-32 h-10 sm:h-12 bg-slate-50 rounded-2xl animate-pulse shrink-0"></div>
                </div>
                <div className="divide-y divide-slate-50 border-t border-slate-50">
                    {[1, 2, 3, 4, 5, 6].map(i => <RequestSkeleton key={i} />)}
                </div>
            </main>
        </div>
    );

    const isZehnuthAdmin = teacher && (
        (teacher.email || teacher.EMAIL) === ADMIN_EMAIL ||
        (Array.isArray(teacher.role) ? teacher.role.includes('zehnuth_admin') : teacher.role === 'zehnuth_admin')
    );

    if (!teacher || !isZehnuthAdmin) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="max-w-xl mx-auto px-4 pt-32 pb-12 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <AlertTriangle size={40} />
                    </div>
                    <h1 className="text-xl font-black text-slate-800 uppercase italic">Access Denied</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 leading-relaxed">
                        This administrative panel is restricted to the head mentor only.
                    </p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <ReviewModal
                isOpen={!!selectedRequest}
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
                onAction={handleAction}
                processingId={processingId}
            />

            <main className="max-w-3xl mx-auto px-4 pt-20 pb-12">
                <div className="mb-10 flex items-end justify-between px-2">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200"><Clock size={20} /></span>
                            Approval <span className="bg-gradient-to-r from-amber-400 via-amber-600 to-amber-500 bg-clip-text text-transparent">Desk</span>
                        </h1>
                        {/* <p className="text-slate-500 text-sm font-medium mt-1">Review and validate student achievements</p> */}
                    </div>
                    <div className="bg-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-sm border border-slate-100 shrink-0">
                        <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue</span>
                        <span className="text-xs sm:text-sm font-black text-blue-600 uppercase">{requests.length} Pending</span>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <div className="relative flex items-center">
                        <div className="absolute left-4 text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by student name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 text-slate-400 hover:text-slate-600"
                            >
                                <XCircle size={18} />
                            </button>
                        )}
                    </div>
                    
                    {/* Suggestions Dropdown */}
                    {isSearchFocused && searchQuery && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {suggestions.map(s => (
                                <button
                                    key={s.name}
                                    onClick={() => setSearchQuery(s.name)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-sm font-bold text-slate-700 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <User size={14} className="text-blue-500" />
                                        {s.name}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                                        Class {s.classNum || 'N/A'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {filteredRequests.length > 0 ? (
                        filteredRequests.slice(0, displayLimit).map((request) => {
                            const categoryObj = CATEGORIES.find(c => c.id === request.category);
                            return (
                                <button
                                    key={request._id}
                                    onClick={() => setSelectedRequest(request)}
                                    className="w-full bg-white rounded-3xl p-5 border border-slate-100 flex items-center justify-between hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            {request.imageUrl ? (
                                                <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-100">
                                                    <img src={request.imageUrl} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <span className="text-2xl">{categoryObj?.icon || '⭐'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm font-black text-slate-800 uppercase italic">{request.studentId?.["SHORT NAME"] || request.studentId?.["FULL NAME"]}</h3>
                                                <span className="text-[9px] font-black text-slate-400">Class: {request.studentId?.CLASS}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                                                {categoryObj?.label} • <span className="text-slate-300 italic font-medium">{request.mentorId?.name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:flex flex-col items-end">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Review</span>
                                            <span className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1">Click to Award <Star size={10} /></span>
                                        </div>
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-100">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase italic mb-1">
                                {searchQuery && requests.length > 0 ? "No matches found" : "Inbox Clear!"}
                            </h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                {searchQuery && requests.length > 0 ? "No pending requests found for this student." : "No pending achievement requests."}
                            </p>
                        </div>
                    )}
                </div>

                {filteredRequests.length > displayLimit && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => setDisplayLimit(prev => prev + 50)}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
