"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Search, User, Calendar, Clock, FileText, AlertCircle, CheckCircle, XCircle, ChevronRight, Filter, MinusCircle, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import Header from '@/components/Header/Header';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function StudentSearchPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allAttendance, setAllAttendance] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [allCEP, setAllCEP] = useState([]);
  const [allMinus, setAllMinus] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes, leavesRes, cepRes, minusRes] = await Promise.all([
        axios.get(`${API_PORT}/students`),
        axios.get(`${API_PORT}/set-attendance`),
        axios.get(`${API_PORT}/leave`),
        axios.get(`${API_PORT}/class-excused-pass`),
        axios.get(`${API_PORT}/minus`)
      ]);
      setStudents(studentsRes.data);
      setAllAttendance(attendanceRes.data);
      setAllLeaves(leavesRes.data);
      setAllCEP(cepRes.data);
      setAllMinus(minusRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      String(s.ADNO).includes(query) || 
      (s["FULL NAME"] || "").toLowerCase().includes(query) ||
      (s["SHORT NAME"] || "").toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery, students]);

  const studentData = useMemo(() => {
    if (!selectedStudent) return null;
    
    const ad = selectedStudent.ADNO;
    const sId = selectedStudent._id;

    const filterFn = (item) => {
      if (!item) return false;
      // Check direct 'ad' field
      if (item.ad && String(item.ad) === String(ad)) return true;
      // Check 'studentId'
      if (item.studentId) {
        if (typeof item.studentId === 'object') {
          return String(item.studentId.ADNO) === String(ad) || String(item.studentId._id) === String(sId);
        }
        return String(item.studentId) === String(sId);
      }
      return false;
    };

    const attendance = (allAttendance || []).filter(filterFn);
    const leaves = (allLeaves || []).filter(filterFn);
    const cep = (allCEP || []).filter(filterFn);
    const minus = (allMinus || []).filter(filterFn);

    // Calculate recovery status
    const lastLeave = leaves
      .filter(l => l.status === 'returned' && l.returnedAt)
      .sort((a, b) => new Date(b.returnedAt) - new Date(a.returnedAt))[0];
    
    let recoveryStatus = { completed: true, remainingDays: 0 };
    if (lastLeave && lastLeave.returnedAt) {
      const returnedDate = new Date(lastLeave.returnedAt);
      const today = new Date();
      const diffDays = Math.ceil((today - returnedDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        recoveryStatus = { completed: false, remainingDays: 4 - diffDays };
      }
    }

    return {
      profile: selectedStudent,
      attendance,
      leaves,
      cep,
      minus,
      recoveryStatus
    };
  }, [selectedStudent, allAttendance, allLeaves, allCEP, allMinus]);

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
        activeTab === id 
        ? 'border-sky-500 text-sky-600 bg-sky-50/50' 
        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pt-16 items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Student Registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Student Insights</h1>
          <p className="text-slate-500 text-sm font-medium mb-6">Search student by ADNO or Name to view their entire record.</p>
          
          <div className="relative">
            <div className="flex items-center bg-white border-2 border-slate-100 rounded-[1.5rem] p-2 shadow-sm focus-within:border-sky-400 focus-within:shadow-xl focus-within:shadow-sky-500/10 transition-all">
              <div className="w-12 h-12 flex items-center justify-center text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Type Admission Number or Student Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent outline-none text-lg font-bold text-slate-700 placeholder:text-slate-300"
              />
              {selectedStudent && (
                <button 
                  onClick={() => { setSelectedStudent(null); setSearchQuery(''); }}
                  className="px-4 py-2 text-xs font-black text-rose-500 uppercase hover:bg-rose-50 rounded-xl transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Autocomplete Suggestions */}
            {!selectedStudent && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                {filteredSuggestions.map((s) => (
                  <div
                    key={s.ADNO}
                    onClick={() => {
                      setSelectedStudent(s);
                      setSearchQuery('');
                      setActiveTab('overview');
                    }}
                    className="flex items-center justify-between p-4 hover:bg-sky-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        {s.ADNO}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 tracking-tight">{s["SHORT NAME"] || s["FULL NAME"]}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class {s.CLASS}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedStudent ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Student Profile Overview Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-white overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-sky-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <User size={120} />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black shadow-2xl">
                    {selectedStudent["SHORT NAME"]?.[0] || selectedStudent["FULL NAME"]?.[0] || 'S'}
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                       <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20">AD NO: {studentData.profile.ADNO}</span>
                       <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20">Class: {studentData.profile.CLASS}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">{studentData.profile["FULL NAME"]}</h2>
                    <p className="text-sky-100/80 font-medium">{studentData.profile["SHORT NAME"]}</p>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 bg-white">
                <div className="p-6 text-center border-r border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                  <p className="text-2xl font-black text-slate-800">{studentData.attendance.length} <span className="text-xs text-slate-400 font-bold">Records</span></p>
                </div>
                <div className="p-6 text-center border-r border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leaves</p>
                  <p className="text-2xl font-black text-slate-800">{studentData.leaves.length} <span className="text-xs text-slate-400 font-bold">Taken</span></p>
                </div>
                <div className="p-6 text-center border-r border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CEP Pass</p>
                  <p className="text-2xl font-black text-slate-800">{studentData.cep.length} <span className="text-xs text-slate-400 font-bold">Issued</span></p>
                </div>
                <div className="p-6 text-center hover:bg-slate-50/50 transition-colors text-rose-500">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Minus</p>
                  <p className="text-2xl font-black">{studentData.minus.length} <span className="text-xs text-rose-400 font-bold">Points</span></p>
                </div>
              </div>

              {/* Recovery Banner */}
              {!studentData.recoveryStatus.completed && (
                <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-center gap-3">
                   <AlertCircle className="text-amber-500" size={18} />
                   <p className="text-amber-800 text-sm font-bold">
                     Recovery In Progress: <span className="font-black">{studentData.recoveryStatus.remainingDays} days</span> remaining from last leave.
                   </p>
                </div>
              )}

              {/* Content Tabs */}
              <div className="flex bg-white overflow-x-auto border-b border-slate-100 overscroll-contain">
                <TabButton id="overview" label="Overview" icon={User} />
                <TabButton id="attendance" label={`Attendance (${studentData.attendance.length})`} icon={Calendar} />
                <TabButton id="leave" label={`Leave History (${studentData.leaves.length})`} icon={FileText} />
                <TabButton id="cep" label={`CEP (${studentData.cep.length})`} icon={Clock} />
                <TabButton id="minus" label={`Minus (${studentData.minus.length})`} icon={MinusCircle} />
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-sky-500 pl-4">Personal Details</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <DetailRow label="Full Name" value={studentData.profile["FULL NAME"]} />
                          <DetailRow label="Short Name" value={studentData.profile["SHORT NAME"]} />
                          <DetailRow label="Admission No" value={studentData.profile.ADNO} />
                          <DetailRow label="Class" value={studentData.profile.CLASS} />
                          <DetailRow label="Status" value={studentData.recoveryStatus.completed ? "Normal" : "In Recovery"} isStatus />
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Quick Insights</h3>
                        <div className="space-y-4">
                          <SummaryMetric label="Attendance Rate" value={`${Math.round((studentData.attendance.filter(a => a.status === 'Present').length / (studentData.attendance.length || 1)) * 100)}%`} icon={TrendingUp} />
                          <SummaryMetric label="Total Absent" value={studentData.attendance.filter(a => a.status === 'Absent').length} icon={XCircle} color="text-rose-500" />
                          <SummaryMetric label="Last Leave" value={studentData.leaves[0]?.fromDate || 'Never'} icon={Calendar} />
                          <SummaryMetric label="CEP Count" value={studentData.cep.length} icon={Clock} color="text-sky-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {studentData.attendance.length > 0 ? (
                      <div className="space-y-4">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Session</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {studentData.attendance.slice().reverse().map((att, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{formatDate(att.attendanceDate || att.createdAt)}</td>
                                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">{att.attendanceTime} {att.period ? `(P${att.period})` : ''}</td>
                                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{att.teacherId?.name || att.teacher || 'N/A'}</td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${att.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {att.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          {studentData.attendance.slice().reverse().map((att, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center gap-4">
                              <div className="flex-grow">
                                <p className="text-xs font-black text-slate-800 mb-1">{formatDate(att.attendanceDate || att.createdAt)}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{att.attendanceTime} {att.period ? `P${att.period}` : ''}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] font-bold text-sky-600">{att.teacherId?.name || att.teacher || 'N/A'}</span>
                                </div>
                              </div>
                              <span className={`shrink-0 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${att.status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {att.status === 'Present' ? 'P' : 'A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState message="No attendance records found." />
                    )}
                  </div>
                )}

                {activeTab === 'leave' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {studentData.leaves.length > 0 ? (
                      <div className="space-y-4">
                        {studentData.leaves.slice().reverse().map((leave, i) => (
                          <div key={i} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                             <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                               <div className="flex items-center gap-3">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${leave.status === 'returned' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                   <FileText size={20} />
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="text-sm font-black text-slate-800 tracking-tight">{leave.fromDate} → {leave.toDate || '—'}</span>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leave.fromTime} • Issued {formatDate(leave.createdAt)}</p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-3">
                                 <div className="text-right flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued By</p>
                                    <p className="text-xs font-black text-sky-600 uppercase">{leave.teacherId?.name || leave.teacher || 'Admin'}</p>
                                 </div>
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-center shadow-sm ${leave.status === 'returned' ? 'bg-white text-emerald-600 border border-emerald-100' : 'bg-amber-500 text-white'}`}>
                                   {leave.status}
                                 </span>
                               </div>
                             </div>
                             <div className="bg-white/50 rounded-2xl p-4 border border-white">
                               <p className="text-xs text-slate-600 font-medium leading-relaxed italic">" {leave.reason} "</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No leave history available." />
                    )}
                  </div>
                )}

                {activeTab === 'cep' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {studentData.cep.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentData.cep.slice().reverse().map((pass, i) => (
                          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all group">
                             <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center transition-colors group-hover:bg-sky-500 group-hover:text-white">
                                   <Clock size={16} />
                                 </div>
                                 <div>
                                   <p className="text-sm font-black text-slate-800 tracking-tight">{pass.date}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(pass.createdAt)}</p>
                                 </div>
                               </div>
                               <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-tight">CEP PASS</span>
                             </div>
                             <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                                <div className="flex flex-col">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                                  <p className="text-xs font-black text-slate-700">{pass.fromTime} - {pass.toTime}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teacher</p>
                                  <p className="text-xs font-black text-sky-600 uppercase">{pass.teacherId?.name || pass.teacher || 'N/A'}</p>
                                </div>
                             </div>
                             <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-500 italic truncate italic">" {pass.reason} "</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No Class Excused Passes found." />
                    )}
                  </div>
                )}

                {activeTab === 'minus' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {studentData.minus.length > 0 ? (
                      <div className="space-y-3">
                        {studentData.minus.slice().reverse().map((m, i) => (
                          <div key={i} className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-lg">
                                 -1
                               </div>
                               <div>
                                 <p className="text-sm font-black text-slate-800">{m.date || m.attendanceDate}</p>
                                 <p className="text-xs text-rose-500 font-bold uppercase tracking-widest">{m.reason || 'Attendance Penalty'}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Recorded In</p>
                               <p className="text-xs font-black text-slate-600">{m.attendanceTime === 'Period' ? `Period ${m.period}` : m.attendanceTime}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No minus records found. Student is doing great!" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty Search State */
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mb-6">
               <User size={64} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-2">Registry Search</h2>
            <p className="max-w-xs text-sm font-medium text-slate-500">Global student database access. Enter credentials above to retrieve comprehensive records.</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value, isStatus }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 group">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      {isStatus ? (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${value === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {value}
        </span>
      ) : (
        <span className="text-sm font-bold text-slate-700 group-hover:text-sky-600 transition-colors uppercase">{value || 'N/A'}</span>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, icon: Icon, color = "text-slate-600" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white shadow-sm ${color}`}>
          <Icon size={14} />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className={`text-sm font-black ${color}`}>{value}</span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-3xl">
      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic">{message}</p>
    </div>
  );
}

function TrendingUp(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
