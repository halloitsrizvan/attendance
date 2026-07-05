"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, X, Check, Loader2, Search } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => { }, removeItem: () => { } };

function CEPApplications() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchValue, setSearchValue] = useState('');

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

  const handleApprove = async (id) => {
    if (!confirm("Are you sure you want to approve this CEP request?")) return;
    setActionLoading(id);
    const teacherId = teacher?.id || teacher?._id;
    try {
      await axios.patch(`${API_PORT}/class-excused-pass/${id}`, { 
        ApproveCEP: true,
        teacherId: teacherId 
      });
      setPasses(prev => prev.filter(p => p._id !== id));
      alert("CEP approved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to approve CEP.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Are you sure you want to reject and delete this CEP request?")) return;
    setActionLoading(id);
    try {
      await axios.delete(`${API_PORT}/class-excused-pass/${id}`);
      setPasses(prev => prev.filter(p => p._id !== id));
      alert("CEP request rejected.");
    } catch (err) {
      console.error(err);
      alert("Failed to reject CEP.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPasses = useMemo(() => {
    if (!searchValue) return passes;
    const s = searchValue.toLowerCase();
    return passes.filter(p => {
      const name = (p.studentId?.['SHORT NAME'] || p.studentId?.['FULL NAME'] || '').toLowerCase();
      const ad = String(p.studentId?.ADNO || '');
      const reasonText = (p.reason || '').toLowerCase();
      return name.includes(s) || ad.includes(s) || reasonText.includes(s);
    });
  }, [passes, searchValue]);

  if (!isCEPApprovalTeacher) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 mt-16">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm max-w-md text-center space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
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
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 mt-16">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading CEP Applications...</p>
      </div>
    );
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
          
          <div className="flex items-center bg-white border-2 border-slate-100 rounded-2xl px-4 py-2.5 gap-3 shadow-sm focus-within:border-blue-400 transition-all w-full md:w-80">
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
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-sm font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {filteredPasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPasses.map((pass) => (
              <div key={pass._id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className="h-1.5 bg-amber-400"></div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-200">
                        {pass.studentId?.ADNO || 'AD'}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">{pass.studentId?.['SHORT NAME'] || pass.studentId?.['FULL NAME'] || 'Student'}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class {pass.studentId?.CLASS || '—'}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic font-medium text-slate-600 text-sm">
                      “{pass.reason}”
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Date</span>
                        <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(pass.date || pass.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Duration</span>
                        <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          {pass.fromTime && pass.toTime ? `${formatTimeTo12h(pass.fromTime)} - ${formatTimeTo12h(pass.toTime)}` : 'Full Day'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApprove(pass._id)}
                      disabled={actionLoading === pass._id}
                      className="flex-grow py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                    >
                      {actionLoading === pass._id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Approve CEP
                    </button>
                    <button 
                      onClick={() => handleReject(pass._id)}
                      disabled={actionLoading === pass._id}
                      className="px-4 py-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center gap-2 font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
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
            <p className="text-xs font-bold text-slate-300 uppercase mt-2 tracking-widest">No pending CEP applications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CEPApplications;
