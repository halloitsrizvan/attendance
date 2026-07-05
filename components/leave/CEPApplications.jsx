"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, X, Check, Loader2, Search, Users } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => { }, removeItem: () => { } };

const CEPCardSkeleton = () => (
  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="w-2/3 h-5 bg-slate-200 rounded-lg"></div>
          <div className="w-1/3 h-3 bg-slate-100 rounded-md"></div>
        </div>
      </div>
      <div className="w-16 h-7 bg-slate-100 rounded-full"></div>
    </div>
    
    <div className="space-y-4">
      <div className="w-full h-12 bg-slate-100 rounded-2xl border border-slate-50"></div>
      <div className="flex gap-2">
        <div className="w-16 h-6 bg-slate-100 rounded-xl"></div>
        <div className="w-16 h-6 bg-slate-100 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="space-y-1">
          <div className="w-10 h-3 bg-slate-200 rounded"></div>
          <div className="w-24 h-4 bg-slate-100 rounded-md"></div>
        </div>
        <div className="space-y-1">
          <div className="w-10 h-3 bg-slate-200 rounded"></div>
          <div className="w-24 h-4 bg-slate-100 rounded-md"></div>
        </div>
      </div>
    </div>

    <div className="flex gap-3 pt-2">
      <div className="flex-grow h-12 bg-slate-200 rounded-2xl"></div>
      <div className="w-24 h-12 bg-slate-100 rounded-2xl"></div>
    </div>
  </div>
);

const CEPSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-4 md:p-8 mt-16">
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-pulse">
        <div className="space-y-2">
          <div className="w-48 h-8 bg-slate-200 rounded-lg"></div>
          <div className="w-36 h-4 bg-slate-100 rounded-md"></div>
        </div>
        <div className="w-full md:w-80 h-12 bg-slate-200 rounded-2xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <CEPCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

const DetailModal = ({ isOpen, onClose, collection, onConfirm, formatTime }) => {
  const [studentActions, setStudentActions] = useState({});

  useEffect(() => {
    if (collection) {
      const initialActions = {};
      collection.items.forEach(item => {
        initialActions[item.passId] = 'approve'; // default to 'approve'
      });
      setStudentActions(initialActions);
    }
  }, [collection]);

  if (!isOpen || !collection) return null;

  const handleConfirm = () => {
    const approves = [];
    const rejects = [];
    Object.entries(studentActions).forEach(([passId, action]) => {
      if (action === 'approve') {
        approves.push(passId);
      } else {
        rejects.push(passId);
      }
    });

    if (approves.length === 0 && rejects.length === 0) {
      alert("No actions to perform.");
      return;
    }

    if (!confirm(`Are you sure you want to perform these actions? (${approves.length} to Approve, ${rejects.length} to Reject)`)) {
      return;
    }

    onConfirm({ approves, rejects });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 p-6 flex justify-between items-center">
          <h3 className="text-white font-black uppercase tracking-tighter italic text-xl">CEP Collection Details</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Reason */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reason</span>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-sm">
              “{collection.reason}”
            </div>
          </div>

          {/* Time & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Date</span>
              <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" />
                {new Date(collection.date || collection.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Duration</span>
              <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Clock size={12} className="text-slate-400" />
                {collection.fromTime && collection.toTime ? `${formatTime(collection.fromTime)} - ${formatTime(collection.toTime)}` : 'Full Day'}
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Students ({collection.items.length})</span>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {collection.items.map((item, index) => {
                const std = item.student;
                const passId = item.passId;
                const currentAction = studentActions[passId] || 'approve';

                return (
                  <div key={passId || index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">
                        {std?.ADNO || 'AD'}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800">{std?.['SHORT NAME'] || std?.['FULL NAME'] || 'Student'}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Class {std?.CLASS || '—'}</span>
                      </div>
                    </div>

                    {/* Toggle Button Pair */}
                    <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-300/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setStudentActions({ ...studentActions, [passId]: 'approve' })}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                          currentAction === 'approve' 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentActions({ ...studentActions, [passId]: 'reject' })}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                          currentAction === 'reject' 
                            ? 'bg-rose-500 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button 
              onClick={handleConfirm}
              className="flex-grow py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100"
            >
              <Check size={16} /> Confirm Actions
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all font-black uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function CEPApplications() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const teacher = useMemo(() => {
    const storedTeacher = getSafeLocalStorage().getItem("teacher");
    return storedTeacher ? JSON.parse(storedTeacher) : null;
  }, []);

  const hasRole = (role) => {
    if (!teacher?.role) return false;
    const roles = Array.isArray(teacher.role) ? teacher.role : [teacher.role];
    return roles.includes(role);
  };

  const isCEPApprovalTeacher = useMemo(() => {
    return hasRole('CEPApproval');
  }, [teacher]);

  const formatTimeTo12h = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hourStr, minuteStr] = timeStr.split(':');
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${String(hour).padStart(2, '0')}:${minuteStr} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const fetchApplications = async () => {
    if (!isCEPApprovalTeacher) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_PORT}/class-excused-pass`);
      // Filter for passes where ApproveCEP is false (pending approval)
      const pendingPasses = (res.data || []).filter(pass => pass.ApproveCEP === false);
      setPasses(pendingPasses);
    } catch (err) {
      console.error(err);
      setError("Failed to load CEP applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [teacher]);

  // Group passes by groupId
  const groupedCollections = useMemo(() => {
    const groups = {};
    passes.forEach(pass => {
      const key = pass.groupId || `SINGLE-${pass._id}`;
      if (!groups[key]) {
        groups[key] = {
          groupId: key,
          date: pass.date,
          fromTime: pass.fromTime,
          toTime: pass.toTime,
          reason: pass.reason,
          createdAt: pass.createdAt,
          items: []
        };
      }
      groups[key].items.push({
        passId: pass._id,
        student: pass.studentId
      });
    });
    return Object.values(groups).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [passes]);

  const handleApprove = async (passIds) => {
    if (!confirm(`Are you sure you want to approve this CEP collection (${passIds.length} pass(es))?`)) return;
    setActionLoading(passIds[0]);
    const teacherId = teacher?.id || teacher?._id;
    try {
      const promises = passIds.map(id => 
        axios.patch(`${API_PORT}/class-excused-pass/${id}`, { 
          ApproveCEP: true,
          teacherId: teacherId 
        })
      );
      await Promise.all(promises);
      setPasses(prev => prev.filter(p => !passIds.includes(p._id)));
      alert("CEP approved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to approve CEP.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (passIds) => {
    if (!confirm(`Are you sure you want to reject and delete this CEP collection (${passIds.length} pass(es))?`)) return;
    setActionLoading(passIds[0]);
    try {
      const promises = passIds.map(id => 
        axios.delete(`${API_PORT}/class-excused-pass/${id}`)
      );
      await Promise.all(promises);
      setPasses(prev => prev.filter(p => !passIds.includes(p._id)));
      alert("CEP request rejected.");
    } catch (err) {
      console.error(err);
      alert("Failed to reject CEP.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmActions = async ({ approves, rejects }) => {
    const teacherId = teacher?.id || teacher?._id;
    const firstLoadingId = approves[0] || rejects[0];
    setActionLoading(firstLoadingId);
    try {
      const approvePromises = approves.map(id => 
        axios.patch(`${API_PORT}/class-excused-pass/${id}`, { 
          ApproveCEP: true,
          teacherId: teacherId 
        })
      );
      const rejectPromises = rejects.map(id => 
        axios.delete(`${API_PORT}/class-excused-pass/${id}`)
      );
      
      await Promise.all([...approvePromises, ...rejectPromises]);
      
      const allActionedIds = [...approves, ...rejects];
      setPasses(prev => prev.filter(p => !allActionedIds.includes(p._id)));
      alert("CEP actions completed successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to complete CEP actions.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCollections = useMemo(() => {
    if (!searchValue) return groupedCollections;
    const s = searchValue.toLowerCase();
    return groupedCollections.filter(group => {
      const matchReason = (group.reason || '').toLowerCase().includes(s);
      const matchStudent = group.items.some(item => {
        const name = (item.student?.['SHORT NAME'] || item.student?.['FULL NAME'] || '').toLowerCase();
        const ad = String(item.student?.ADNO || '');
        return name.includes(s) || ad.includes(s);
      });
      return matchReason || matchStudent;
    });
  }, [groupedCollections, searchValue]);

  if (!isCEPApprovalTeacher) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 mt-16">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm max-w-md text-center space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <X size={32} />
          </div>
          <h2 className="text-xl font-black text-rose-500 uppercase tracking-tight italic">Access Denied</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
            You do not have the required "CEP Approval" role to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <CEPSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 mt-16 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">CEP Applications</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-amber-500 animate-pulse" /> Pending CEP Approvals
            </p>
          </div>
          
          <div className="flex items-center bg-white border-2 border-slate-100 rounded-2xl px-4 py-2.5 gap-3 shadow-sm focus-within:border-sky-400 transition-all w-full md:w-80">
            <Search size={18} className="text-slate-300" />
            <input 
              type="text" 
              placeholder="Search by student or reason..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 w-full"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-[2.5rem] border border-rose-100 text-sm font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCollections.map((group) => {
              const passIds = group.items.map(item => item.passId);
              return (
                <div 
                  key={group.groupId} 
                  className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group"
                  onClick={() => { setSelectedCollection(group); setIsDetailOpen(true); }}
                >
                  <div>
                    <div className="h-1.5 bg-amber-400"></div>
                    <div className="p-8 pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                            <Users size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">
                              {group.items.length > 1 ? "CEP Collection" : "CEP Request"}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {group.items.length} student{group.items.length === 1 ? '' : 's'} included
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-sm truncate">
                          “{group.reason}”
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-12 overflow-hidden">
                          {group.items.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-[9px] font-black uppercase">
                              {item.student?.['SHORT NAME'] || 'Student'}
                            </span>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Date</span>
                            <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-400" />
                              {new Date(group.date || group.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Duration</span>
                            <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                              <Clock size={12} className="text-slate-400" />
                              {group.fromTime && group.toTime ? `${formatTimeTo12h(group.fromTime)} - ${formatTimeTo12h(group.toTime)}` : 'Full Day'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* <div className="px-8 pb-8 pt-2 flex gap-3" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleApprove(passIds)}
                      disabled={actionLoading === passIds[0]}
                      className="flex-grow py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                    >
                      {actionLoading === passIds[0] ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Approve Collection
                    </button>
                    <button 
                      onClick={() => handleReject(passIds)}
                      disabled={actionLoading === passIds[0]}
                      className="px-4 py-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center gap-2 font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                      title="Reject Request"
                    >
                      <span>Reject</span>
                      <X size={14} />
                    </button>
                  </div> */}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 opacity-50 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase italic tracking-tighter">Everything Clear!</h3>
            <p className="text-xs font-bold text-slate-300 uppercase mt-2 tracking-widest">No pending CEP applications found.</p>
          </div>
        )}
      </div>

      <DetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        collection={selectedCollection}
        onConfirm={handleConfirmActions}
        formatTime={formatTimeTo12h}
      />
    </div>
  );
}

export default CEPApplications;
