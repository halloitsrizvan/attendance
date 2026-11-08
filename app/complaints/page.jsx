"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header/Header';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import { complaintMatchesClass } from '@/lib/complaintRouting.mjs';
import { useNavigationRouter } from '@/components/navigation/NavigationProvider';
import { teacherSignInPath } from '@/lib/teacherSession.mjs';
import styles from './ComplaintsFeedback.module.css';

const complaintAuth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
  Send,
  HeartPulse,
  Loader2,
  X
} from 'lucide-react';

const ComplaintsPage = () => {
  const router = useNavigationRouter();
  const [teacher, setTeacher] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminViewFilter, setAdminViewFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [decisionError, setDecisionError] = useState('');
  const [decision, setDecision] = useState(null);
  const [reviewedId, setReviewedId] = useState(null);

  useEffect(() => {
    if (!reviewedId) return;
    const timer = setTimeout(() => setReviewedId(null), 3500);
    return () => clearTimeout(timer);
  }, [reviewedId]);

  useEffect(() => {
    const storedTeacher = localStorage.getItem('teacher');
    if (storedTeacher) {
      const parsedTeacher = JSON.parse(storedTeacher);
      setTeacher(parsedTeacher);
      const tid = parsedTeacher._id || parsedTeacher.id;
      if (tid) {
        fetchComplaints();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const isSuperAdmin = useMemo(() => {
    if (!teacher) return false;
    const email = (teacher.email || teacher.EMAIL || '').trim().toLowerCase();
    return teacher.role === 'super_admin' || 
      (Array.isArray(teacher.role) && teacher.role.includes('super_admin')) ||
      email === 'test@gmail.com';
  }, [teacher]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setLoadError('');

      
      const res = await axios.get(`${API_PORT}/complaints`, complaintAuth());
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('teacher');
        router.replace(teacherSignInPath('/complaints', 'session-invalid'));
        return;
      }
      setLoadError(err.response?.data?.error || 'Could not load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, status) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setDecision(status);
      setDecisionError('');
      setNotice(null);
      const response = await axios.patch(`${API_PORT}/complaints`, {
        id,
        status
      }, complaintAuth());
      
      // Update local state
      setComplaints(prev => prev.map(c => 
        c._id === id ? { ...c, ...response.data } : c
      ));
      
      setSelectedComplaint(null);
      setReviewedId(id);
      setNotice({ id, approved: status === 'Resolved', name: response.data.studentId?.['FULL NAME'] || response.data.studentId?.['SHORT NAME'] || 'Student', attendanceUpdated: Boolean(response.data.attendanceId && ['Present', 'Leave', 'CEP'].includes(response.data.actualStatus)) });
    } catch (err) {
      console.error("Error updating complaint:", err);
      setDecisionError(err.response?.data?.error || 'Could not save your decision. Please try again.');
    } finally {
      setSubmitting(false);
      setDecision(null);
    }
  };

  // Base list of complaints visible to the current user
  const teacherComplaints = useMemo(() => {
    if (!teacher) return [];


    return complaints.filter(c => {

      const isAssignedToMe = complaintMatchesClass(c, teacher);

      if (isSuperAdmin) {
        if (adminViewFilter === 'Mine') {
          return isAssignedToMe;
        }
        return true;
      }

      // The API has already restricted this list to the authenticated class.
      return true;
    });
  }, [complaints, teacher, isSuperAdmin, adminViewFilter]);

  const tabCounts = useMemo(() => {
    return {
      All: teacherComplaints.length,
      Pending: teacherComplaints.filter(c => c.status === 'Pending').length,
      Resolved: teacherComplaints.filter(c => c.status === 'Resolved').length,
    };
  }, [teacherComplaints]);

  const filteredComplaints = useMemo(() => {
    return teacherComplaints.filter(c => {
      const matchesTab = activeTab === 'All' || c.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (c.studentId?.["FULL NAME"] || '').toLowerCase().includes(q) ||
        (c.studentId?.ADNO || '').toString().includes(q) ||
        (c.message || '').toLowerCase().includes(q) ||
        (c.actualStatus || '').toLowerCase().includes(q);
        
      return matchesTab && matchesSearch;
    });
  }, [teacherComplaints, activeTab, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch (e) {
      return '—';
    }
  };

  const attendanceSession = (complaint) => {
    const attendance = complaint.attendanceId;
    if (!attendance) return '';
    const session = attendance.attendanceTime || attendance.attentenceTime || '';
    if (session === 'Period' && attendance.period) return `Period ${attendance.period}`;
    const detail = attendance.custom || attendance.more;
    return detail ? `${session} - ${detail}` : session;
  };

  const isMedicalComplaint = (complaint) => {
    return Boolean(
      complaint?.isMedical ||
      complaint?.message?.toLowerCase().includes('[medical leave]') ||
      complaint?.message?.toLowerCase().includes('[medical]')
    );
  };

  const getCleanMessage = (message) => {
    if (!message) return '';
    return message
      .replace(/^\[Medical Leave\]\s*/i, '')
      .replace(/^\[Medical\]\s*/i, '')
      .trim();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        {loadError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{loadError}</p>}
        {/* Page Header */}
        <div className="mb-4 md:mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
              <MessageSquare size={32} className="text-rose-500 shrink-0" />
              Comaplaints
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
              <Clock size={14} className="text-sky-500" /> 
              {isSuperAdmin ? 'Review student complaints & disputes' : 'Review all complaints from your class'}
            </p>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
            {['All', 'Pending', 'Resolved'].map(tab => (
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
                  {tabCounts[tab] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-4 flex gap-3 items-center w-full max-w-3xl">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search student, ADNO, message..."
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
                My Class
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
              filteredComplaints.map(complaint => {
                const isMedical = isMedicalComplaint(complaint);
                const cleanMsg = getCleanMessage(complaint.message);

                return (
                  <div 
                    key={complaint._id}
                    className={`${reviewedId === complaint._id ? styles.reviewed : ''} bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border p-4 md:p-6 transition-all cursor-pointer group hover:border-rose-200 hover:shadow-md ${
                      selectedComplaint?._id === complaint._id 
                      ? 'border-rose-400 ring-2 md:ring-4 ring-rose-50 shadow-xl' 
                      : 'border-slate-50'
                    }`}
                    onClick={() => { setSelectedComplaint(complaint); setDecisionError(''); }}
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

                    {complaint.attendanceId ? (
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 md:px-3 py-1.5 rounded-lg border border-slate-100 text-slate-400">
                          <Calendar size={12} />
                          {formatDate(complaint.attendanceId?.attendanceDate)}
                          <Clock3 size={12} />
                          {attendanceSession(complaint)}
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2 md:px-3 py-1.5 rounded-lg border border-rose-100">
                          Was: {complaint.actualStatus === 'Leave' ? 'Absent, not on leave' : complaint.attendanceId?.status}
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1.5 rounded-lg border border-emerald-100">
                          Claimed: {complaint.actualStatus}
                        </div>
                        {isMedical && (
                          <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 md:px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm animate-pulse">
                            <HeartPulse size={12} className="text-rose-500" />
                            [Medical Leave]
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2 md:px-3 py-1.5 rounded-lg border border-purple-100">
                          Type: Leave Recovery / Issue
                        </div>
                        {complaint.actualStatus === 'Leave' && <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2 md:px-3 py-1.5 rounded-lg border border-rose-100">Was: Absent, not on leave</div>}
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1.5 rounded-lg border border-emerald-100">
                          Claimed: {complaint.actualStatus}
                        </div>
                        {isMedical && (
                          <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 md:px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm animate-pulse">
                            <HeartPulse size={12} className="text-rose-500" />
                            [Medical Leave]
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 mt-4 space-y-2">
                      {/* {isMedical && (
                        <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                          <HeartPulse size={11} />
                          Medical Leave Claim
                        </div>
                      )}
                       */}
                      <p className="text-xs md:text-sm font-bold text-slate-700 italic">
                        “{cleanMsg || complaint.message || 'No description provided'}”
                      </p>
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
                );
              })
            ) : (
              <div className="bg-white rounded-[2rem] p-12 md:p-20 text-center border border-slate-100">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Filter size={32} className="text-slate-200" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-2">No complaints found</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">
                  {isSuperAdmin ? 'Adjust your filters or search' : 'No complaints from your class match these filters'}
                </p>
              </div>
            )}
          </div>
        </div>

      {/* Resolution Popup Modal */}
      {selectedComplaint && (() => {

        const isAssignedToMe = !isSuperAdmin || complaintMatchesClass(selectedComplaint, teacher);
        const isMedical = isMedicalComplaint(selectedComplaint);
        const cleanMsg = getCleanMessage(selectedComplaint.message);

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
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student</span>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedComplaint.studentId?.["FULL NAME"]}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      AD: {selectedComplaint.studentId?.ADNO} • Class {selectedComplaint.studentId?.CLASS}
                    </p>
                  </div>
                  
                  {selectedComplaint.attendanceId && <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex-wrap">
                    <Calendar size={13} /><span>{formatDate(selectedComplaint.attendanceId.attendanceDate)}</span>
                    <Clock3 size={13} /><span>{attendanceSession(selectedComplaint)}</span>
                  </div>}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Was: {selectedComplaint.actualStatus === 'Leave' ? 'Absent, not on leave' : selectedComplaint.attendanceId?.status || 'Absent'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Claims:</span>
                    <span className="text-[10px] font-black text-rose-500 uppercase">{selectedComplaint.actualStatus}</span>
                    {isMedical && (
                      <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                        <HeartPulse size={10} /> [Medical Leave]
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student Reason</span>
                    <p className="text-xs font-bold text-slate-700 italic">
                      “{cleanMsg || selectedComplaint.message || 'No description provided'}”
                    </p>
                  </div>
                </div>

                {decisionError && <p role="alert" className={styles.error}>{decisionError}</p>}
                {selectedComplaint.status === 'Pending' ? (
                  (isAssignedToMe || isSuperAdmin) ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleResolve(selectedComplaint._id, 'Rejected')}
                        disabled={submitting}
                        className="py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 transition-all disabled:opacity-50"
                      >
                        {submitting && decision === 'Rejected' ? <Loader2 size={16} className={styles.spinner} /> : <XCircle size={16} />}
                        {submitting && decision === 'Rejected' ? 'Rejecting...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleResolve(selectedComplaint._id, 'Resolved')}
                        disabled={submitting}
                        className="py-4 bg-rose-500 text-white rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
                      >
                        {submitting && decision === 'Resolved' ? (
                          <Loader2 size={16} className={styles.spinner} />
                        ) : (
                          <CheckCircle size={16} />
                        )} 
                        {submitting && decision === 'Resolved' ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl text-center border-2 border-dashed bg-slate-50 border-slate-200 text-slate-500">
                      <p className="text-[10px] font-black uppercase tracking-widest">Teacher View</p>
                      <p className="text-xs font-bold mt-1">Only the class teacher or Super Admin can resolve this.</p>
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
      {notice && <div className={styles.toast}>
        <span className={styles.successIcon}>{notice.approved ? <CheckCircle2 size={25} /> : <CheckCircle size={25} />}</span>
        <div className={styles.toastContent}>
          <div role="status" aria-live="polite"><strong>{notice.approved ? 'Complaint approved' : 'Complaint rejected'}</strong><p>{notice.name}</p><span>{notice.approved ? notice.attendanceUpdated ? 'Attendance corrected. Moved to Resolved.' : 'Moved to Resolved.' : 'Your decision has been saved.'}</span></div>
          {notice.approved && <button type="button" className={styles.viewResolved} onClick={() => { setActiveTab('Resolved'); setSearchQuery(''); setReviewedId(notice.id); setNotice(null); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>View resolved <ChevronRight size={14} /></button>}
        </div>
        <button className={styles.dismiss} type="button" aria-label="Dismiss confirmation" onClick={() => setNotice(null)}><X size={17} /></button>
      </div>}
    </div>
  );
};

export default ComplaintsPage;
