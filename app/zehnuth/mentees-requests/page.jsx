"use client";

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, CheckCircle2, XCircle, Loader2, User, Activity, Clock, ChevronRight, AlertTriangle, Inbox, Check, X, Image as ImageIcon, Upload, ExternalLink, MoreVertical } from 'lucide-react';

const ReviewModal = ({ request, isOpen, onClose, onAction, onUpload, uploading, processing }) => {
    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 uppercase italic leading-tight">Review Achievement</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student: {request.studentId?.["SHORT NAME"] || request.studentId?.["FULL NAME"]}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-md tracking-wider">
                                    {request.category}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{request.activity}"</p>

                            {request.remarks && (
                                <div className="mt-4 pt-4 border-t border-slate-200/60">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        Remarks
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed">"{request.remarks}"</p>
                                </div>
                            )}
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">Evidence of Work</label>
                            {request.imageUrl ? (
                                <div className="relative group rounded-3xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                                    <img src={request.imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-slate-900 rounded-2xl shadow-xl hover:scale-110 transition-transform">
                                            <ExternalLink size={20} />
                                        </a>
                                        <button
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/*';
                                                input.onchange = (e) => onUpload(request._id, e);
                                                input.click();
                                            }}
                                            className="p-3 bg-white text-indigo-600 rounded-2xl shadow-xl hover:scale-110 transition-transform"
                                        >
                                            <Upload size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/50 flex flex-col items-center justify-center transition-all hover:bg-slate-50">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-4">
                                        <ImageIcon size={24} />
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onUpload(request._id, e)}
                                        className="hidden"
                                        id="modal-upload"
                                    />
                                    <label
                                        htmlFor="modal-upload"
                                        className={`cursor-pointer px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2
                                            ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                                    >
                                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                        {uploading ? 'Uploading...' : 'Upload Evidence Image'}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            disabled={processing}
                            onClick={() => onAction(request._id, 'reject')}
                            className="py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95"
                        >
                            <X size={16} /> REJECT
                        </button>
                        <button
                            disabled={processing}
                            onClick={() => onAction(request._id, 'approve')}
                            className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                        >
                            {processing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <><Check size={16} className="text-emerald-400" /> VERIFY & FORWARD</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestSkeleton = () => (
    <div className="w-full flex items-center justify-between p-6 border-b border-slate-50 last:border-0 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
            <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-100 rounded-lg"></div>
                <div className="h-3 w-48 bg-slate-50 rounded-md"></div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end space-y-2">
                <div className="h-2 w-16 bg-slate-50 rounded"></div>
                <div className="h-3 w-12 bg-slate-100 rounded"></div>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl"></div>
        </div>
    </div>
);

export default function MenteeRequests() {
    const [teacher, setTeacher] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            const teacherData = JSON.parse(storedTeacher);
            setTeacher(teacherData);
            fetchMenteeRequests(teacherData);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchMenteeRequests = async (teacherData) => {
        const mentorId = teacherData.id || teacherData._id;
        try {
            const res = await axios.get(`/api/zehnuth/points?mentorId=${mentorId}&status=pending`);
            const pendingRequests = res.data.filter(r => !r.mentorApproved);
            setRequests(pendingRequests);
        } catch (err) {
            console.error("Error fetching mentee requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (requestId, e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingId(requestId);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'college_db');

        try {
            const res = await axios.post(
                'https://api.cloudinary.com/v1_1/dqgspgrul/image/upload',
                formData
            );
            const imageUrl = res.data.secure_url;
            await axios.put('/api/zehnuth/points', { id: requestId, imageUrl });

            setRequests(prev => prev.map(r => r._id === requestId ? { ...r, imageUrl } : r));
            if (selectedRequest && selectedRequest._id === requestId) {
                setSelectedRequest(prev => ({ ...prev, imageUrl }));
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image.");
        } finally {
            setUploadingId(null);
        }
    };

    const handleAction = async (requestId, action) => {
        if (!confirm(`Are you sure you want to ${action === 'approve' ? 'verify' : 'reject'} this request?`)) return;

        setProcessingId(requestId);
        try {
            if (action === 'approve') {
                await axios.put('/api/zehnuth/points', { id: requestId, mentorApproved: true });
            } else {
                await axios.put('/api/zehnuth/points', { id: requestId, status: 'rejected' });
            }
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
        <div className="min-h-screen bg-slate-50">
            <Header />
            <main className="max-w-2xl mx-auto px-4 pt-24 pb-20">
                <div className="mb-10 px-2 flex items-center justify-between">
                    <div className="space-y-3">
                        <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div className="h-2 w-24 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                    <div className="w-24 h-10 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
                </div>
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
                    {[1, 2, 3, 4, 5].map(i => <RequestSkeleton key={i} />)}
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <ReviewModal
                request={selectedRequest}
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                onAction={handleAction}
                onUpload={handleUpload}
                uploading={!!uploadingId}
                processing={!!processingId}
            />

            <main className="max-w-2xl mx-auto px-4 pt-24 pb-20">
                <div className="mb-10 px-2 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase leading-none">Requests</h1>
                        <p className="text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em]">Pending Review</p>
                    </div>
                    <div className="bg-white px-5 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{requests.length} Total</span>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
                    {requests.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {requests.map((request) => (
                                <button
                                    key={request._id}
                                    onClick={() => setSelectedRequest(request)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-all duration-300 group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            {request.imageUrl ? <div className="w-8 h-8 rounded-lg overflow-hidden"><img src={request.imageUrl} className="w-full h-full object-cover" /></div> : <User size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase italic mb-0.5">{request.studentId?.["SHORT NAME"] || request.studentId?.["FULL NAME"]} ({request.studentId?.CLASS})</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                {request.category} • {request.activity}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Click to Review</span>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1">Open <ChevronRight size={12} /></span>
                                        </div>
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                            <MoreVertical size={18} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Inbox size={40} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase italic mb-1">Inbox Clear!</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No pending mentee requests.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
