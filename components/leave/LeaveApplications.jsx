"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, X, Check, Trash2, Loader2, Search, Edit3 } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => { }, removeItem: () => { } };

const ModifyModal = ({ isOpen, onClose, leave, onSave }) => {
  const [formData, setFormData] = useState({
    fromDate: '',
    fromTime: '',
    toDate: '',
    toTime: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leave) {
      setFormData({
        fromDate: leave.fromDate || '',
        fromTime: leave.fromTime || '',
        toDate: leave.toDate || '',
        toTime: leave.toTime || ''
      });
    }
  }, [leave]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(leave._id, formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update leave details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-sky-500 p-6 flex justify-between items-center">
          <h3 className="text-white font-black uppercase tracking-tighter italic text-xl">Modify Leave</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Date</label>
              <input 
                type="date" 
                value={formData.fromDate}
                onChange={(e) => setFormData({...formData, fromDate: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Time</label>
              <input 
                type="time" 
                value={formData.fromTime}
                onChange={(e) => setFormData({...formData, fromTime: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">To Date</label>
              <input 
                type="date" 
                value={formData.toDate}
                onChange={(e) => setFormData({...formData, toDate: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">To Time</label>
              <input 
                type="time" 
                value={formData.toTime}
                onChange={(e) => setFormData({...formData, toTime: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-sky-600 transition-all shadow-lg shadow-sky-200"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            Confirm Changes
          </button>
        </form>
      </div>
    </div>
  );
};

function LeaveApplications() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModifyOpen, setIsModifyOpen] = useState(false);

  const teacher = useMemo(() => {
    const storedTeacher = getSafeLocalStorage().getItem("teacher");
    return storedTeacher ? JSON.parse(storedTeacher) : null;
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_PORT}/leave`);
      const teacherId = teacher?.id || teacher?._id;
      
      const applications = res.data.filter(l => 
        l.approved === false && 
        String(l.teacherId?._id || l.teacherId) === String(teacherId)
      );
      
      setLeaves(applications);
    } catch (err) {
      console.error(err);
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [teacher]);

  const handleApprove = async (id) => {
    if (!confirm("Are you sure you want to approve this leave request?")) return;
    setActionLoading(id);
    try {
      await axios.patch(`${API_PORT}/leave/${id}`, { approved: true });
      setLeaves(prev => prev.filter(l => l._id !== id));
      alert("Leave request approved.");
    } catch (err) {
      console.error(err);
      alert("Failed to approve leave.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Are you sure you want to reject this leave request?")) return;
    setActionLoading(id);
    try {
      await axios.patch(`${API_PORT}/leave/${id}`, { status: 'rejected', approved: false });
      setLeaves(prev => prev.filter(l => l._id !== id));
      alert("Leave request rejected.");
    } catch (err) {
      console.error(err);
      alert("Failed to reject leave.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveModification = async (id, updatedData) => {
    await axios.patch(`${API_PORT}/leave/${id}`, updatedData);
    setLeaves(prev => prev.map(l => l._id === id ? { ...l, ...updatedData } : l));
    alert("Leave details updated successfully.");
  };

  const filteredLeaves = useMemo(() => {
    if (!searchValue) return leaves;
    const s = searchValue.toLowerCase();
    return leaves.filter(l => {
      const name = (l.studentId?.['SHORT NAME'] || l.studentId?.['FULL NAME'] || l.name || '').toLowerCase();
      const ad = String(l.studentId?.ADNO || l.ad);
      return name.includes(s) || ad.includes(s);
    });
  }, [leaves, searchValue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 mt-16">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 mt-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">Leave Applications</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-amber-500" /> Pending Your Approval
            </p>
          </div>
          
          <div className="flex items-center bg-white border-2 border-slate-100 rounded-2xl px-4 py-2.5 gap-3 shadow-sm focus-within:border-sky-400 transition-all w-full md:w-80">
            <Search size={18} className="text-slate-300" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 w-full"
            />
          </div>
        </div>

        {filteredLeaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLeaves.map((leave) => (
              <div key={leave._id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className="h-1.5 bg-amber-400"></div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-200">
                        {leave.studentId?.ADNO || leave.ad}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">{leave.studentId?.['SHORT NAME'] || 'Student'}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class {leave.studentId?.CLASS || leave.classNum}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                      <button 
                        onClick={() => { setSelectedLeave(leave); setIsModifyOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all border border-transparent hover:border-sky-100"
                        title="Modify Details"
                      >
                       <span>Modify</span>
                       <Edit3 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-sm">
                      “{leave.reason}
                      {leave.disease ? ` - ${leave.disease}` : ''}
                      {leave.program ? ` - ${leave.program}` : ''}”
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">From</span>
                        <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {leave.fromDate} <span className="text-slate-300 mx-1">•</span> {leave.fromTime}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">To</span>
                        <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {leave.toDate || 'EOD'} <span className="text-slate-300 mx-1">•</span> {leave.toTime || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApprove(leave._id)}
                      disabled={actionLoading === leave._id}
                      className="flex-grow py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-200"
                    >
                      {actionLoading === leave._id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Approve Leave
                    </button>
                    <button 
                      onClick={() => handleReject(leave._id)}
                      disabled={actionLoading === leave._id}
                      className="px-4 py-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
                      title="Reject Request"
                    >
                     <span>Reject</span>
                     <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 opacity-50 text-center px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase italic tracking-tighter">Everything Clear!</h3>
            <p className="text-xs font-bold text-slate-300 uppercase mt-2 tracking-widest">No pending leave applications found for you.</p>
          </div>
        )}
      </div>

      <ModifyModal 
        isOpen={isModifyOpen}
        onClose={() => setIsModifyOpen(false)}
        leave={selectedLeave}
        onSave={handleSaveModification}
      />
    </div>
  );
}

export default LeaveApplications;
