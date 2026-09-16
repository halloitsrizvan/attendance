"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  Clock3,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  ShieldAlert,
  FileText,
  ArrowRight,
  Layers,
  X,
  ExternalLink,
  ChevronDown,
  HeartPulse
} from 'lucide-react';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending'); // 'All' | 'Pending' | 'Resolved' | 'Rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedClaim, setSelectedClaim] = useState('All');
  const [allSessions, setAllSessions] = useState(false);

  // Decision Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState('Resolved'); // 'Resolved' or 'Rejected'
  const [adminRemark, setAdminRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [allSessions]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const url = `${API_PORT}/complaints${allSessions ? '?all=true' : ''}`;
      const res = await axios.get(url);
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const openDecisionModal = (complaint, status) => {
    setActiveComplaint(complaint);
    setDecisionStatus(status);
    setAdminRemark(complaint.adminRemark || '');
    setModalOpen(true);
  };

  const closeDecisionModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setActiveComplaint(null);
    setAdminRemark('');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    setSubmitting(true);
    try {
      const payload = {
        id: activeComplaint._id,
        status: decisionStatus,
        adminRemark: adminRemark.trim()
      };

      const res = await axios.patch(`${API_PORT}/complaints`, payload);
      const updated = res.data;

      // Update state in place
      setComplaints(prev => prev.map(c =>
        c._id === activeComplaint._id ? { ...c, ...updated } : c
      ));

      closeDecisionModal();
      alert(`Complaint successfully marked as ${decisionStatus}!${decisionStatus === 'Resolved' ? ' Attendance record has been automatically updated.' : ''}`);
    } catch (err) {
      console.error("Error submitting decision:", err);
      alert(err.response?.data?.error || "Failed to update complaint status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this complaint log?")) return;

    try {
      await axios.delete(`${API_PORT}/complaints?id=${id}`);
      setComplaints(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error("Failed to delete complaint:", err);
      alert("Failed to delete complaint record.");
    }
  };

  // Compute available classes from loaded data
  const availableClasses = useMemo(() => {
    const classes = new Set();
    complaints.forEach(c => {
      const cls = c.studentId?.CLASS || c.attendanceId?.class;
      if (cls !== undefined && cls !== null && cls !== '') {
        classes.add(cls.toString());
      }
    });
    return Array.from(classes).sort((a, b) => Number(a) - Number(b));
  }, [complaints]);

  // Statistics
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const rejected = complaints.filter(c => c.status === 'Rejected').length;
    const claimsPresent = complaints.filter(c => c.actualStatus === 'Present').length;
    return { total, pending, resolved, rejected, claimsPresent };
  }, [complaints]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // Tab match
      if (activeTab !== 'All' && c.status !== activeTab) return false;

      // Class match
      if (selectedClass !== 'All') {
        const cls = (c.studentId?.CLASS || c.attendanceId?.class || '').toString();
        if (cls !== selectedClass) return false;
      }

      // Claim match
      if (selectedClaim !== 'All' && c.actualStatus !== selectedClaim) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentName = (c.studentId?.["FULL NAME"] || '').toLowerCase();
        const adno = (c.studentId?.ADNO || '').toString().toLowerCase();
        const message = (c.message || '').toLowerCase();
        const teacherName = (c.teacherId?.name || '').toLowerCase();
        const remark = (c.adminRemark || '').toLowerCase();

        const matches =
          studentName.includes(q) ||
          adno.includes(q) ||
          message.includes(q) ||
          teacherName.includes(q) ||
          remark.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [complaints, activeTab, selectedClass, selectedClaim, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return '—';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl shadow-inner font-black">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  Attendance Complaints
                </h1>
                <span className="bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Institutional attendance dispute review & one-click corrections
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Session Scope Toggle */}
            <button
              onClick={() => setAllSessions(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${allSessions
                  ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              title="Toggle between current academic year and all-time records"
            >
              <Layers size={15} />
              {allSessions ? 'Scope: All Sessions' : 'Scope: Active Session'}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-2.5 px-5 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing || loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Filed</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{stats.total}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">All recorded disputes</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
              <FileText size={22} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Review</p>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{stats.pending}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Awaiting decision</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Resolved & Corrected</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.resolved}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Attendance corrected</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Rejected</p>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{stats.rejected}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Marked invalid</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
              <XCircle size={22} />
            </div>
          </div>
        </div>

        {/* Filter & Controls Panel */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search student, ADNO, teacher, or complaint message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3.5 pl-12 text-sm font-bold text-slate-700 focus:border-rose-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              {/* Class Filter */}
              <div className="relative min-w-[130px] flex-1 sm:flex-none">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 pr-9 text-xs font-bold text-slate-700 focus:border-rose-400 outline-none transition-all cursor-pointer"
                >
                  <option value="All">All Classes</option>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Claim Filter */}
              <div className="relative min-w-[140px] flex-1 sm:flex-none">
                <select
                  value={selectedClaim}
                  onChange={(e) => setSelectedClaim(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 pr-9 text-xs font-bold text-slate-700 focus:border-rose-400 outline-none transition-all cursor-pointer"
                >
                  <option value="All">All Claims</option>
                  <option value="Present">Claimed Present</option>
                  <option value="Leave">Claimed Leave</option>
                  <option value="CEP">Claimed CEP</option>
                  <option value="Other">Claimed Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
            {[
              { id: 'Pending', label: 'Pending', count: stats.pending, color: 'text-amber-600 bg-amber-50' },
              { id: 'All', label: 'All Complaints', count: stats.total, color: 'text-slate-600 bg-slate-100' },
              { id: 'Resolved', label: 'Resolved', count: stats.resolved, color: 'text-emerald-600 bg-emerald-50' },
              { id: 'Rejected', label: 'Rejected', count: stats.rejected, color: 'text-rose-600 bg-rose-50' }
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isSelected
                      ? 'bg-slate-800 text-white shadow-md shadow-slate-900/10 scale-[1.02]'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isSelected ? 'bg-white/20 text-white' : tab.color
                    }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Complaints Listing */}
        {loading ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading attendance complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-3xl mx-auto text-slate-300">
              <Filter size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">No Complaints Found</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              There are no dispute records matching the current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => {
              const student = complaint.studentId || {};
              const attendance = complaint.attendanceId;
              const teacher = complaint.teacherId;
              const isPending = complaint.status === 'Pending';
              const isResolved = complaint.status === 'Resolved';
              const isRejected = complaint.status === 'Rejected';

              return (
                <div
                  key={complaint._id}
                  className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-all hover:shadow-md ${isPending
                      ? 'border-amber-200/80 bg-gradient-to-r from-amber-500/[0.02] to-white'
                      : 'border-slate-100'
                    }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-50">
                    {/* Student Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 font-black text-lg flex items-center justify-center shrink-0 shadow-inner">
                        {(student["FULL NAME"] || 'S').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-800 tracking-tight">
                            {student["FULL NAME"] || 'Unknown Student'}
                          </h3>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black">
                            Class {student.CLASS || attendance?.class || '—'}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          ADNO: {student.ADNO || '—'} • Filed {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge & Super Admin Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
                      {/* <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isPending
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : isResolved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                        {complaint.status}
                      </span> */}

                      {isPending ? (
                        <>
                          <button
                            onClick={() => openDecisionModal(complaint, 'Resolved')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-500/30 active:scale-95"
                          >
                            <CheckCircle size={14} /> Approve & Correct
                          </button>
                          <button
                            onClick={() => openDecisionModal(complaint, 'Rejected')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openDecisionModal(complaint, isResolved ? 'Rejected' : 'Resolved')}
                          className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                          Change to {isResolved ? 'Rejected' : 'Resolved'}
                        </button>
                      )}

                      {/* <button
                        onClick={() => handleDeleteComplaint(complaint._id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete complaint log"
                      >
                        <Trash2 size={16} />
                      </button> */}
                    </div>
                  </div>

                  {/* Disputed Attendance Context Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 my-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Session Date</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Calendar size={14} className="text-sky-500" />
                        {formatDate(attendance?.attendanceDate || complaint.createdAt)}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Time / Period</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Clock3 size={14} className="text-amber-500" />
                        {attendance?.attendanceTime || 'Period'}
                        {attendance?.period && (
                          <span className="bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-black">
                            P{attendance.period}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Marked Status</span>
                      <div className="flex items-center gap-2 font-bold flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-black text-[10px] uppercase">
                          {attendance?.status || 'Absent'}
                        </span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase">
                          Claims: {complaint.actualStatus}
                        </span>
                        {(complaint.isMedical || complaint.message?.toLowerCase().includes('[medical leave]')) && (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-black text-[10px] uppercase flex items-center gap-1">
                            <HeartPulse size={10} /> [Medical Leave]
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Recorded By Faculty</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
                        <User size={14} className="text-slate-400" />
                        <span className="truncate">{teacher?.name || 'General Faculty'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Student Complaint Message */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                    {(complaint.isMedical || complaint.message?.toLowerCase().includes('[medical leave]')) && (
                      <div className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                        <HeartPulse size={10} /> Medical Leave Claim
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                        Student's Reason / Explanation:
                      </span>
                      <p className="text-sm font-bold text-slate-700 italic">
                        "{(complaint.message || 'No detailed explanation provided.').replace(/^\[Medical Leave\]\s*/i, '').replace(/^\[Medical\]\s*/i, '')}"
                      </p>
                    </div>
                  </div>

                  {/* Admin Resolution / Remark Banner */}
                  {complaint.adminRemark && (
                    <div className="mt-3 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">
                          Admin Resolution Note:
                        </span>
                        <p className="text-xs font-bold text-emerald-800 italic mt-0.5">
                          "{complaint.adminRemark}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Super Admin Decision Modal */}
      {modalOpen && activeComplaint && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={closeDecisionModal}
          />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className={`p-6 sm:p-8 text-white relative ${decisionStatus === 'Resolved' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  {decisionStatus === 'Resolved' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    {decisionStatus === 'Resolved' ? 'Approve & Correct Attendance' : 'Reject Attendance Complaint'}
                  </h2>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-0.5">
                    Super Admin Resolution
                  </p>
                </div>
              </div>
              <button
                onClick={closeDecisionModal}
                disabled={submitting}
                className="absolute top-6 right-6 text-white/60 hover:text-white p-2 bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleDecisionSubmit} className="p-6 sm:p-8 space-y-5">
              {/* Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>Student:</span>
                  <span className="font-black text-slate-800 uppercase">
                    {activeComplaint.studentId?.["FULL NAME"]} (AD: {activeComplaint.studentId?.ADNO})
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>Claimed Status:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-black uppercase text-[10px]">
                      {activeComplaint.actualStatus}
                    </span>
                    {(activeComplaint.isMedical || activeComplaint.message?.toLowerCase().includes('[medical leave]')) && (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-black uppercase text-[10px] flex items-center gap-1">
                        <HeartPulse size={10} /> [Medical Leave]
                      </span>
                    )}
                  </div>
                </div>
                {/* <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>Recorded Attendance ID:</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {activeComplaint.attendanceId?._id || activeComplaint.attendanceId || 'N/A'}
                  </span>
                </div> */}

                {/* {decisionStatus === 'Resolved' ? (
                  <div className="mt-3 p-3 bg-emerald-100/60 rounded-xl text-[11px] font-bold text-emerald-800">
                    💡 <strong>Automated Database Correction:</strong> Submitting will immediately update the student's attendance record in the database to <strong>{activeComplaint.actualStatus}</strong>.
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-rose-100/60 rounded-xl text-[11px] font-bold text-rose-800">
                    ⚠️ <strong>Dispute Dismissal:</strong> The complaint will be marked as Rejected. The attendance record will remain unchanged.
                  </div>
                )} */}
              </div>

              {/* Status Switcher in Modal */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">
                  Decision Outcome
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionStatus('Resolved')}
                    className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider border-2 transition-all ${decisionStatus === 'Resolved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    ✓ Resolve & Correct
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionStatus('Rejected')}
                    className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider border-2 transition-all ${decisionStatus === 'Rejected'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    ✕ Reject Complaint
                  </button>
                </div>
              </div>

              {/* Remark Field */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">
                  Administrative Note / Reason (Visible to Student)
                </label>
                <textarea
                  rows={3}
                  placeholder={decisionStatus === 'Resolved' ? 'e.g. Verified by attendance register. Marked present.' : 'e.g. Discrepancy could not be verified.'}
                  value={adminRemark}
                  onChange={(e) => setAdminRemark(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:border-slate-400 focus:bg-white outline-none transition-all resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDecisionModal}
                  disabled={submitting}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-[2] py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 ${decisionStatus === 'Resolved'
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                    }`}
                >
                  {submitting ? 'Updating...' : `Confirm ${decisionStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
