"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, CheckCircle2, XCircle, Loader2, User, Activity, Clock, ChevronRight, AlertTriangle, Inbox, Check, X, Image as ImageIcon, Upload, ExternalLink, MoreVertical } from 'lucide-react';

const ReviewModal = ({ request, isOpen, onClose, onAction, onUpload, uploading, processing }) => {
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen || !request) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onUpload(request._id, { target: { files: [file] } });
        } else {
            alert("Please upload an image file.");
        }
    };

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
                                <label
                                    htmlFor="modal-upload"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer
                                        ${isDragging
                                            ? 'border-indigo-500 bg-indigo-50/70 scale-[1.02] shadow-inner'
                                            : 'border-slate-200 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-300'}`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onUpload(request._id, e)}
                                        className="hidden"
                                        id="modal-upload"
                                        disabled={uploading}
                                    />
                                    <div className="pointer-events-none flex flex-col items-center justify-center text-center">
                                        {uploading ? (
                                            <Loader2 size={24} className="animate-spin text-indigo-600 mb-2" />
                                        ) : (
                                            <Upload size={24} className={`mb-2 transition-transform duration-300 ${isDragging ? 'scale-110 text-indigo-600' : 'text-slate-400'}`} />
                                        )}
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {uploading ? 'Uploading...' : 'Drag & Drop or Click to Upload Evidence'}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">
                                            JPG, PNG, WEBP (Max 5MB)
                                        </p>
                                    </div>
                                </label>
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

// Group review popup modal component
const GroupReviewModal = ({ group, onClose, decisions, toggleDecision, onSave, saving }) => {
    const student = group.student;
    const items = group.items;
    const studentId = student?._id || student?.id;
    const studentName = student?.["SHORT NAME"] || student?.["FULL NAME"] || 'Unknown';
    const studentClass = student?.CLASS || '-';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[1rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500 flex flex-col max-h-[85vh]">
                 
                {/* Header */}
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-black uppercase italic leading-tight">Mentees Requests</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Student: {studentName} (Class {studentClass}) • {items.length} Pending
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
                    <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                        {items.map((item) => {
                            const decision = decisions[item._id] || 'approve';
                            return (
                                <div key={item._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        {/* Image proof or icon */}
                                        {item.imageUrl ? (
                                            <a 
                                                href={item.imageUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 block hover:opacity-85 transition-opacity"
                                            >
                                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                                            </a>
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                                <ImageIcon size={22} />
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded-md tracking-wider">
                                                    {item.category}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-700">
                                                    {item.activity}
                                                </span>
                                            </div>
                                            {item.remarks && (
                                                <p className="text-[10px] text-slate-400 italic mt-1 leading-relaxed">
                                                    "{item.remarks}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Toggle buttons */}
                                    <div className="flex items-center justify-end gap-3 shrink-0 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => toggleDecision(item._id)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 border
                                                ${decision === 'reject'
                                                    ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                                                    : 'bg-white text-rose-500 border-rose-200 hover:bg-rose-50'}`}
                                        >
                                            {decision === 'reject' ? (
                                                <><CheckCircle2 size={12} /> Approve</>
                                            ) : (
                                                <><XCircle size={12} /> Reject</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Batch Save Action */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={() => onSave(studentId, items)}
                        disabled={saving}
                        className="px-6 py-4 bg-slate-900 text-white hover:bg-indigo-600 disabled:bg-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95 transition-all w-full sm:w-auto justify-center"
                    >
                        {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={14} className="text-emerald-400" />
                        )}
                        {saving ? 'Saving Decisions...' : 'Verify & Save Decisions'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default function MenteeRequests() {
    const [teacher, setTeacher] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Grouping & Batching states
    const [selectedGroupForModal, setSelectedGroupForModal] = useState(null);
    const [decisions, setDecisions] = useState({});
    const [savingStudentId, setSavingStudentId] = useState(null);

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

    const toggleDecision = (requestId) => {
        setDecisions(prev => ({
            ...prev,
            [requestId]: (prev[requestId] || 'approve') === 'approve' ? 'reject' : 'approve'
        }));
    };

    const handleSaveGroup = async (studentId, items) => {
        if (!confirm(`Are you sure you want to verify these decisions?`)) return;
        setSavingStudentId(studentId);
        try {
            const promises = items.map(item => {
                const decision = decisions[item._id] || 'approve';
                if (decision === 'approve') {
                    return axios.put('/api/zehnuth/points', { id: item._id, mentorApproved: true });
                } else {
                    return axios.put('/api/zehnuth/points', { id: item._id, status: 'rejected' });
                }
            });
            await Promise.all(promises);
            // Remove the completed ones from the state list
            const itemIds = items.map(item => item._id);
            setRequests(prev => prev.filter(r => !itemIds.includes(r._id)));
            setSelectedGroupForModal(null);
            alert("Group decisions saved successfully.");
        } catch (err) {
            console.error("Error saving batch decisions:", err);
            alert("Failed to save some decisions.");
        } finally {
            setSavingStudentId(null);
        }
    };

    const groupedRequests = useMemo(() => {
        const groups = {};
        requests.forEach(r => {
            const studentId = r.studentId?._id || r.studentId?.id || 'unknown';
            if (!groups[studentId]) {
                groups[studentId] = {
                    student: r.studentId,
                    items: []
                };
            }
            groups[studentId].items.push(r);
        });
        return Object.values(groups);
    }, [requests]);

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

            {selectedGroupForModal && (
                <GroupReviewModal
                    group={selectedGroupForModal}
                    decisions={decisions}
                    toggleDecision={toggleDecision}
                    onClose={() => setSelectedGroupForModal(null)}
                    onSave={handleSaveGroup}
                    saving={savingStudentId === (selectedGroupForModal.student?._id || selectedGroupForModal.student?.id)}
                />
            )}

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

                <div className="space-y-6">
                    {groupedRequests.length > 0 ? (
                        groupedRequests.map((group) => {
                            const studentId = group.student?._id || group.student?.id || 'unknown';
                            const studentName = group.student?.["SHORT NAME"] || group.student?.["FULL NAME"] || 'Unknown';
                            const studentClass = group.student?.CLASS || '-';
                            const requestCount = group.items.length;
                            
                            return (
                                <div key={studentId} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                                    {/* Student Header Card */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedGroupForModal(group)}
                                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all text-left outline-none"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase italic mb-0.5">{studentName}</h3>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Class {studentClass} • {requestCount} Pending {requestCount === 1 ? 'Request' : 'Requests'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition-all">
                                                View list <ChevronRight size={12} />
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-20 text-center">
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
