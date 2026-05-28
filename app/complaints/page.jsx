"use client";

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  User, 
  Clock3,
  CheckCircle,
  XCircle,
  CornerDownRight,
  Send
} from 'lucide-react';

const ComplaintsPage = () => {
  const [teacher, setTeacher] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminViewFilter, setAdminViewFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedTeacher = localStorage.getItem('teacher');
    if (storedTeacher) {
      const parsedTeacher = JSON.parse(storedTeacher);
      setTeacher(parsedTeacher);
      const tid = parsedTeacher._id || parsedTeacher.id;
      if (tid) {
        fetchComplaints(parsedTeacher);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchComplaints = async (teacherObj) => {
    try {
      setLoading(true);
      const tid = teacherObj._id || teacherObj.id;
      const isSuperAdmin = teacherObj.role === 'super_admin' || (Array.isArray(teacherObj.role) && teacherObj.role.includes('super_admin'));
      
      const res = await axios.get(`${API_PORT}/complaints${isSuperAdmin ? '' : `?teacherId=${tid}`}`);
      setComplaints(res.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, status) => {
    try {
      setSubmitting(true);
      await axios.patch(`${API_PORT}/complaints`, {
        id,
        status,
        adminRemark: remark
      });
      
      // Update local state
      setComplaints(prev => prev.map(c => 
        c._id === id ? { ...c, status, adminRemark: remark } : c
      ));
      
      setSelectedComplaint(null);
      setRemark('');
      alert(`Complaint ${status} successfully.`);
    } catch (err) {
      console.error("Error updating complaint:", err);
      alert("Failed to update complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = teacher?.role === 'super_admin' || (Array.isArray(teacher?.role) && teacher?.role.includes('super_admin'));

  const filteredComplaints = complaints.filter(c => {
    const matchesTab = activeTab === 'All' || c.status === activeTab;
    const matchesSearch = 
      (c.studentId?.["FULL NAME"] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.studentId?.ADNO || '').toString().includes(searchQuery) ||
      (c.message || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    let matchesAdminFilter = true;
    if (isSuperAdmin && adminViewFilter === 'Mine') {
      const currentTeacherId = teacher?._id || teacher?.id;
      const assignedTeacherId = c.teacherId?._id || c.teacherId;
      matchesAdminFilter = currentTeacherId && assignedTeacherId && currentTeacherId.toString() === assignedTeacherId.toString();
    }
      
    return matchesTab && matchesSearch && matchesAdminFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
              <MessageSquare size={32} className="text-rose-500 shrink-0" />
              Disputes
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
              <Clock size={14} className="text-sky-500" /> Review student complaints
            </p>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
            {['All', 'Pending', 'Resolved', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[8px] ${
                  activeTab === tab ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  {tab === 'All' ? complaints.length : complaints.filter(c => c.status === tab).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 flex gap-3 items-center w-full max-w-3xl">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search student, ADNO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-50 rounded-2xl py-3 md:py-4 pl-11 md:pl-14 pr-4 text-sm font-bold text-slate-700 shadow-sm focus:border-rose-300 outline-none transition-all truncate"
            />
          </div>

          {isSuperAdmin && (
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 shrink-0">
              <button
                onClick={() => setAdminViewFilter('All')}
                className={`px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                  adminViewFilter === 'All'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAdminViewFilter('Mine')}
                className={`px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                  adminViewFilter === 'Mine'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                To Me
              </button>
            </div>
          )}
        </div>

        {/* Complaints Layout */}
        <div className="grid grid-cols-1 gap-8">
          {/* List */}
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {loading ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
                <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading...</p>
              </div>
            ) : filteredComplaints.length > 0 ? (
              filteredComplaints.map(complaint => (
                <div 
                  key={complaint._id}
                  className={`bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border p-4 md:p-6 transition-all cursor-pointer group hover:border-rose-200 hover:shadow-md ${
                    selectedComplaint?._id === complaint._id 
                    ? 'border-rose-400 ring-2 md:ring-4 ring-rose-50 shadow-xl' 
                    : 'border-slate-50'
                  }`}
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300 font-black text-lg md:text-xl">
                        {complaint.studentId?.["FULL NAME"]?.[0] || 'S'}
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight leading-tight uppercase italic">
                          {complaint.studentId?.["FULL NAME"]}
                        </h3>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          AD: {complaint.studentId?.ADNO} • Class {complaint.studentId?.CLASS}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                      <span className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                        complaint.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {complaint.status}
                      </span>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase">
                        {formatDate(complaint.createdAt)}
                      </p>
                    </div>
                  </div>

                 

                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 md:px-3 py-1.5 rounded-lg border border-slate-100 text-slate-400">
                      <Calendar size={12} />
                      {formatDate(complaint.attendanceId?.attendanceDate)}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 md:px-3 py-1.5 rounded-lg border border-slate-100 text-slate-400">
                      <Clock3 size={12} />
                      {complaint.attendanceId?.attendanceTime}
                      {complaint.attendanceId?.period && (
                        <span className="ml-1 bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                          P{complaint.attendanceId.period}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2 md:px-3 py-1.5 rounded-lg border border-rose-100">
                      Was: {complaint.attendanceId?.status}
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1.5 rounded-lg border border-emerald-100">
                    Student claimed as: {complaint.actualStatus}
                    </div>
                  </div>
                   <div className="p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                    <p className="text-xs md:text-sm font-bold text-slate-700 italic">“{complaint.message}”</p>
                  </div>

                  {complaint.adminRemark && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 italic">
                        <span className="text-[8px] font-black uppercase text-emerald-400 block mb-1">Response</span>
                        “{complaint.adminRemark}”
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[2rem] p-12 md:p-20 text-center border border-slate-100">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Filter size={32} className="text-slate-200" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-2">No data found</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">Adjust your filters or search</p>
              </div>
            )}
          </div>
        </div>

      {/* Resolution Popup Modal */}
      {selectedComplaint && (() => {
        const currentTeacherId = teacher?._id || teacher?.id;
        const assignedTeacherId = selectedComplaint.teacherId?._id || selectedComplaint.teacherId;
        const isAssignedToMe = currentTeacherId && assignedTeacherId && currentTeacherId.toString() === assignedTeacherId.toString();

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => !submitting && setSelectedComplaint(null)}
            />
            <div className="relative bg-white w-full max-w-md rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
              <div className="p-6 md:p-8 bg-rose-500 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase italic leading-none">Decision</h2>
                  <p className="text-[9px] md:text-[10px] font-bold opacity-80 uppercase tracking-widest mt-2">Update student status</p>
                </div>
                <button 
                  onClick={() => setSelectedComplaint(null)} 
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  disabled={submitting}
                >
                  <AlertCircle size={20} />
                </button>
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student</span>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedComplaint.studentId?.["FULL NAME"]}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Claims:</span>
                    <span className="text-[10px] font-black text-rose-500 uppercase">{selectedComplaint.actualStatus}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">My Response (Optional)</label>
                  <textarea
                    placeholder="Explain your decision..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    disabled={selectedComplaint.status !== 'Pending' || submitting || !isAssignedToMe}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-rose-400 outline-none transition-all h-32 resize-none disabled:opacity-50"
                  />
                </div>

                {selectedComplaint.status === 'Pending' ? (
                  isAssignedToMe ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleResolve(selectedComplaint._id, 'Rejected')}
                        disabled={submitting}
                        className="py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      <button
                        onClick={() => handleResolve(selectedComplaint._id, 'Resolved')}
                        disabled={submitting}
                        className="py-4 bg-rose-500 text-white rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle size={16} />
                        )} 
                        Approve
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl text-center border-2 border-dashed bg-slate-50 border-slate-200 text-slate-500">
                      <p className="text-[10px] font-black uppercase tracking-widest">Admin View</p>
                      <p className="text-xs font-bold mt-1">Only the assigned teacher can resolve this.</p>
                    </div>
                  )
                ) : (
                  <div className={`p-4 rounded-2xl text-center border-2 border-dashed ${
                    selectedComplaint.status === 'Resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'
                  }`}>
                    <p className="text-[10px] font-black uppercase tracking-widest">Marked As</p>
                    <p className="text-lg font-black uppercase italic">{selectedComplaint.status}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      </main>
    </div>
  );
};

export default ComplaintsPage;
