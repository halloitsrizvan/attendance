"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, CheckCircle, X, Search, Loader2, AlertTriangle, ShieldCheck, Filter, Clock, LayoutGrid, Award, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'krehmankoolivayal13889@gmail.com';

const ReviewModal = ({ activity, isOpen, onClose, onAction, processingId }) => {
    const [points, setPoints] = useState(0);

    useEffect(() => {
        if (activity && isOpen) {
            setPoints(activity.points || 0);
        }
    }, [activity, isOpen]);

    if (!isOpen || !activity) return null;

    const isProcessing = processingId === activity._id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-indigo-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black tracking-tight uppercase italic flex items-center gap-2">
                            <ShieldCheck size={24} /> Admin Review
                        </h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Review Mentor Activity</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all relative z-10"><X size={24} /></button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Mentor Name</p>
                            <p className="text-xl font-black text-slate-800 uppercase italic">{activity.mentorId?.name || 'Unknown Mentor'}</p>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activity Title</p>
                            <p className="text-sm font-black text-slate-700 uppercase">{activity.activityTitle}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                            <p className="text-xs font-medium text-slate-600 leading-relaxed">{activity.description}</p>
                        </div>
                    </div>

                    {activity.imageUrl && (
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Attached Proof</p>
                            <div className="relative group rounded-2xl overflow-hidden border border-slate-200">
                                <img src={activity.imageUrl} alt="Proof" className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <a href={activity.imageUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white rounded-xl text-slate-900 shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
                                        <LayoutGrid size={16} /> View Full Size
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {activity.status === 'pending' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1">Assign Points</label>
                            <div className="flex items-center justify-center gap-4">
                                <button 
                                    onClick={() => setPoints(Math.max(0, Number(points) - 1))}
                                    className="w-14 h-14 shrink-0 rounded-[1.25rem] bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 active:scale-95 transition-all shadow-sm"
                                >
                                    <Minus size={24} strokeWidth={3} />
                                </button>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                    className="w-32 shrink-0 bg-indigo-50 border-2 border-indigo-100 rounded-[1.25rem] p-4 text-3xl font-black text-indigo-800 focus:border-indigo-400 focus:bg-white outline-none transition-all text-center"
                                    placeholder="0"
                                />
                                <button 
                                    onClick={() => setPoints(Number(points) + 1)}
                                    className="w-14 h-14 shrink-0 rounded-[1.25rem] bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 active:scale-95 transition-all shadow-sm"
                                >
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activity.status === 'pending' && (
                        <div className="flex pt-4 border-t border-slate-50">
                            <button 
                                onClick={() => onAction(activity._id, 'approved', points)}
                                disabled={isProcessing || points <= 0}
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                {isProcessing ? 'Processing...' : 'Approve & Award'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function MentorApprovals() {
    const router = useRouter();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            
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
                            localStorage.setItem('teacher', JSON.stringify(updatedTeacher));
                            
                            const email = (updatedTeacher.email || updatedTeacher.EMAIL || updatedTeacher.mail || updatedTeacher.MAIL || '').trim().toLowerCase();
                            const roles = Array.isArray(updatedTeacher.role) ? updatedTeacher.role : [updatedTeacher.role];
                            if (email === ADMIN_EMAIL.trim().toLowerCase() || roles.includes('zehnuth_admin')) {
                                setIsAuthorized(true);
                                fetchActivities();
                            } else {
                                setLoading(false);
                            }
                        } else {
                            setLoading(false);
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching latest teacher details, falling back to local storage:", err);
                        const email = (teacherData.email || teacherData.EMAIL || teacherData.mail || teacherData.MAIL || '').trim().toLowerCase();
                        const roles = Array.isArray(teacherData.role) ? teacherData.role : [teacherData.role];
                        if (email === ADMIN_EMAIL.trim().toLowerCase() || roles.includes('zehnuth_admin')) {
                            setIsAuthorized(true);
                            fetchActivities();
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

    const fetchActivities = async () => {
        try {
            const res = await axios.get('/api/zehnuth/mentor-activities');
            setActivities(res.data);
        } catch (err) {
            console.error("Error fetching activities:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status, points) => {
        setProcessingId(id);
        try {
            await axios.put(`/api/zehnuth/mentor-activities/${id}`, { status, points });
            await fetchActivities();
            setSelectedActivity(null);
        } catch (err) {
            console.error("Action error:", err);
            alert("Failed to update activity");
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
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

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium mt-2">Only the Zehnuth Admin can access this page.</p>
                        <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase">Go Home</button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredActivities = activities.filter(act => {
        if (act.status !== activeTab) return false;
        
        const term = searchTerm.toLowerCase();
        const mentorName = (act.mentorId?.name || '').toLowerCase();
        const title = (act.activityTitle || '').toLowerCase();
        
        return mentorName.includes(term) || title.includes(term);
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />
            <ReviewModal 
                activity={selectedActivity} 
                isOpen={!!selectedActivity} 
                onClose={() => setSelectedActivity(null)} 
                onAction={handleAction}
                processingId={processingId}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 space-y-6">
                
                {/* Header Section */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <ShieldCheck size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Zehnuth Administration</p>
                                    <h1 className="text-3xl font-black uppercase italic tracking-tight">Mentor Approvals</h1>
                                </div>
                            </div>
                            <p className="text-indigo-100 font-medium max-w-xl text-sm leading-relaxed">
                                Review mentor activities, assign points, and manage the mentor leaderboard.
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[100px]">
                                <div className="text-2xl font-black">{activities.filter(a => a.status === 'pending').length}</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mt-1">Pending</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[100px]">
                                <div className="text-2xl font-black">{activities.filter(a => a.status === 'approved').length}</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mt-1">Approved</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by mentor name or activity title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white rounded-2xl p-1 shadow-sm shrink-0 overflow-x-auto">
                        {[
                            { id: 'pending', label: 'Pending', icon: Clock },
                            { id: 'approved', label: 'Approved', icon: CheckCircle }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                        ${activeTab === tab.id 
                                            ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                >
                                    <Icon size={14} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Activity List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredActivities.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No {activeTab} activities found</p>
                        </div>
                    ) : (
                        filteredActivities.map(act => (
                            <div 
                                key={act._id} 
                                onClick={() => setSelectedActivity(act)}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{act.mentorId?.name || 'Unknown'}</p>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">{act.activityTitle}</h3>
                                    </div>
                                    <div className={`p-2 rounded-xl shrink-0 ml-3 ${
                                        act.status === 'approved' ? 'bg-emerald-50 text-emerald-500' :
                                        act.status === 'rejected' ? 'bg-rose-50 text-rose-500' :
                                        'bg-amber-50 text-amber-500'
                                    }`}>
                                        {act.status === 'approved' ? <CheckCircle size={16} /> :
                                         act.status === 'rejected' ? <X size={16} /> :
                                         <Clock size={16} />}
                                    </div>
                                </div>
                                
                                <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 flex-1">
                                    {act.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(act.createdAt)}</p>
                                    
                                    {act.status === 'approved' && (
                                        <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">
                                            <Award size={12} /> {act.points} pts
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
