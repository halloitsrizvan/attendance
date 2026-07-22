"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import {
  Trophy, Star, BookOpen, Medal, CheckCircle2, XCircle,
  Search, Filter, Loader2, ArrowLeft, Image as ImageIcon,
  ExternalLink, Calendar, User, ShieldAlert, Clock, RefreshCw, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'krehmankoolivayal13889@gmail.com';

const CATEGORY_COLORS = {
  Achievements: 'bg-amber-50 text-amber-600 border-amber-100',
  Competitions: 'bg-rose-50 text-rose-600 border-rose-100',
  Presentation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const ACTIVITY_ICONS = {
  'Awards': <Trophy className="w-4 h-4 text-amber-500" />,
  'Publications': <BookOpen className="w-4 h-4 text-indigo-500" />,
  'Innovations': <Star className="w-4 h-4 text-amber-500" />,
  'Courses': <BookOpen className="w-4 h-4 text-blue-500" />,
  'Essay': <BookOpen className="w-4 h-4 text-slate-500" />,
  'Poem': <BookOpen className="w-4 h-4 text-slate-500" />,
  'Story': <BookOpen className="w-4 h-4 text-slate-500" />,
  'Full paper': <BookOpen className="w-4 h-4 text-slate-500" />,
  'Abstract': <BookOpen className="w-4 h-4 text-slate-500" />,
  '1st Place (Out)': <Medal className="w-4 h-4 text-yellow-500" />,
  '2nd Place (Out)': <Medal className="w-4 h-4 text-slate-400" />,
  '3rd Place (Out)': <Medal className="w-4 h-4 text-amber-600" />,
  'Paper presentation (State)': <Medal className="w-4 h-4 text-teal-500" />,
  'Paper presentation (National)': <Medal className="w-4 h-4 text-blue-500" />,
  'Paper presentation (International)': <Medal className="w-4 h-4 text-purple-500" />
};

export default function AdminAchievements() {
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pointsData, setPointsData] = useState([]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

  // UI states
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const storedTeacher = localStorage.getItem('teacher');
    if (storedTeacher) {
      const teacherData = JSON.parse(storedTeacher);
      setTeacher(teacherData);

      const teacherId = teacherData.id || teacherData._id;
      if (teacherId) {
        // Fetch latest teacher info to make sure role is up to date
        axios.get(`/api/teachers/${teacherId}`)
          .then(res => {
            if (res.data) {
              const updatedTeacher = {
                ...teacherData,
                ...res.data,
                id: res.data._id
              };
              setTeacher(updatedTeacher);
              localStorage.setItem('teacher', JSON.stringify(updatedTeacher));

              const roles = Array.isArray(updatedTeacher.role) ? updatedTeacher.role : [updatedTeacher.role];
              if ((updatedTeacher.email || updatedTeacher.EMAIL) === ADMIN_EMAIL || roles.includes('zehnuth_admin')) {
                fetchAchievements();
              } else {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          })
          .catch(err => {
            console.error("Error updating teacher data, falling back to local storage:", err);
            const roles = Array.isArray(teacherData.role) ? teacherData.role : [teacherData.role];
            if ((teacherData.email || teacherData.EMAIL) === ADMIN_EMAIL || roles.includes('zehnuth_admin')) {
              fetchAchievements();
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

  const fetchAchievements = async () => {
    setRefreshing(true);
    try {
      // Query achievements, competitions, presentations, and writings
      const activities = [
        'Awards', 
        'Publications', 
        'Innovations',
        'Courses',
        '1st Place (Out)', 
        '2nd Place (Out)', 
        '3rd Place (Out)',
        'Participation (Out)',
        '1st Place (In)', 
        '2nd Place (In)', 
        '3rd Place (In)',
        'Participation (In)',
        'Paper presentation (State)',
        'Paper presentation (National)',
        'Paper presentation (International)',
        'Keynote address',
        'Khutba',
        'Other presentations (Out)',
        'Speech',
        'Other presentations (In)',
        'Essay',
        'Poem',
        'Story',
        'Full paper',
        'Abstract'
      ].join(',');
      const res = await axios.get(`/api/zehnuth/points?activities=${activities}`);
      setPointsData(res.data);
    } catch (err) {
      console.error("Error fetching achievements data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (requestId, action, defaultPoints = 0) => {
    setProcessingId(requestId);
    try {
      await axios.put('/api/zehnuth/points', {
        id: requestId,
        status: action === 'approve' ? 'approved' : 'rejected',
        approved: action === 'approve',
        points: defaultPoints
      });
      // Refresh achievements list
      fetchAchievements();
    } catch (err) {
      console.error(`Error ${action}ing achievement:`, err);
      alert(`Failed to ${action} achievement`);
    } finally {
      setProcessingId(null);
    }
  };

  const isZehnuthAdmin = teacher && (
    (teacher.email || teacher.EMAIL) === ADMIN_EMAIL ||
    (Array.isArray(teacher.role) ? teacher.role.includes('zehnuth_admin') : teacher.role === 'zehnuth_admin')
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-2" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
      </div>
    );
  }

  if (!teacher || !isZehnuthAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-xl mx-auto px-4 pt-32 pb-12 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-rose-500">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-xl font-black text-slate-800 uppercase italic">Access Denied</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 leading-relaxed">
            This administrative page is restricted to ZEHNUTH Admins only.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-8 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Go Back Home
          </button>
        </main>
      </div>
    );
  }

  // Get dynamic unique classes for filtering
  const classList = Array.from(new Set(pointsData.map(p => p.studentId?.CLASS).filter(Boolean))).sort();

  // Filter implementation
  const filteredData = pointsData.filter(item => {
    if (item.status !== 'approved') return false; // only show approved achievements
    const student = item.studentId || {};
    const studentName = (student["SHORT NAME"] || student["FULL NAME"] || "").toLowerCase();
    const adNo = (student.ADNO || "").toString();
    const searchMatch = studentName.includes(searchTerm.toLowerCase()) || adNo.includes(searchTerm);

    const classMatch = classFilter === 'all' || student.CLASS === classFilter;

    const activityMatch = activityFilter === 'all' || item.activity === activityFilter;

    return searchMatch && classMatch && activityMatch;
  });

  // Calculate Metrics from Approved achievements
  const approvedItems = pointsData.filter(p => p.status === 'approved');

  const metrics = {
    totalApprovedPoints: approvedItems.reduce((sum, p) => sum + (p.points || 0), 0),
    totalAwards: approvedItems.filter(p => p.activity === 'Awards').length,
    totalPublications: approvedItems.filter(p => p.activity === 'Publications').length,
    totalCompetitions: approvedItems.filter(p => ['1st Place (Out)', '2nd Place (Out)', '3rd Place (Out)'].includes(p.activity)).length,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Page Title & Refresh */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100">
                <Trophy size={24} />
              </span>
              ZEHNUTH <span className="bg-gradient-to-r from-indigo-500 to-blue-600 bg-clip-text text-transparent">achievements</span>
            </h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              View and manage Awards, Publications, Presentations, and External Competitions (1st/2nd/3rd Places)
            </p>
          </div>

          <button
            onClick={fetchAchievements}
            disabled={refreshing}
            className="self-start sm:self-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center gap-2"
          >
            <RefreshCw size={14} className={`${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>



        {/* Filters Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Filter size={16} className="text-slate-400" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Records</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Student or AD No..."
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none transition-all pl-11"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>

            {/* Activity Filter */}
            <div>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-xs font-bold text-slate-600 outline-none cursor-pointer appearance-none transition-all"
              >
                <option value="all">🏆 All Activities</option>
                <optgroup label="Achievements">
                  <option value="Awards">Awards</option>
                  <option value="Publications">Publications</option>
                  <option value="Innovations">Innovations</option>
                  <option value="Courses">Courses</option>
                </optgroup>
                <optgroup label="Writings">
                  <option value="Essay">Essay</option>
                  <option value="Poem">Poem</option>
                  <option value="Story">Story</option>
                  <option value="Full paper">Full paper</option>
                  <option value="Abstract">Abstract</option>
                </optgroup>
                <optgroup label="Presentations">
                  <option value="Paper presentation (State)">Paper presentation (State)</option>
                  <option value="Paper presentation (National)">Paper presentation (National)</option>
                  <option value="Paper presentation (International)">Paper presentation (International)</option>
                  <option value="Keynote address">Keynote address</option>
                  <option value="Khutba">Khutba</option>
                  <option value="Other presentations (Out)">Other presentations (Out)</option>
                  <option value="Speech">Speech</option>
                  <option value="Other presentations (In)">Other presentations (In)</option>
                </optgroup>
                <optgroup label="Competitions">
                  <option value="1st Place (Out)">1st Place (Out)</option>
                  <option value="2nd Place (Out)">2nd Place (Out)</option>
                  <option value="3rd Place (Out)">3rd Place (Out)</option>
                  <option value="Participation (Out)">Participation (Out)</option>
                  <option value="1st Place (In)">1st Place (In)</option>
                  <option value="2nd Place (In)">2nd Place (In)</option>
                  <option value="3rd Place (In)">3rd Place (In)</option>
                  <option value="Participation (In)">Participation (In)</option>
                </optgroup>
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-xs font-bold text-slate-600 outline-none cursor-pointer appearance-none transition-all"
              >
                <option value="all">🏫 All Classes</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Desktop Table View & Mobile Cards View */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Found {filteredData.length} records
            </span>
          </div>

          {filteredData.length > 0 ? (
            <>
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-6">Class</th>
                      <th className="py-4 px-6">Activity</th>
                      <th className="py-4 px-6">Points</th>
                      <th className="py-4 px-6">Proof</th>
                      <th className="py-4 px-6">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {filteredData.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-black text-slate-800 uppercase italic">
                            {item.studentId?.["SHORT NAME"] || item.studentId?.["FULL NAME"]}
                          </div>
                          <div className="text-[9px] text-slate-400 tracking-wider">
                            ADNO: {item.studentId?.ADNO}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          Class {item.studentId?.CLASS || 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            {ACTIVITY_ICONS[item.activity] || <Trophy className="w-4 h-4 text-slate-400" />}
                            <span className="font-extrabold uppercase text-slate-800 text-[11px]">
                              {item.activity}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-black text-amber-500 text-sm">
                            <Star size={14} fill="currentColor" />
                            <span>+{item.points}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {item.imageUrl ? (
                            <button
                              onClick={() => setSelectedImage({ url: item.imageUrl, title: `${item.studentId?.["SHORT NAME"]} - ${item.activity}` })}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 relative group flex items-center justify-center bg-slate-50 hover:border-indigo-400 transition-all active:scale-95"
                            >
                              <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ExternalLink size={12} />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold italic uppercase">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 max-w-[150px]">
                          {item.remarks ? (
                            <button
                              onClick={() => setSelectedRemark({ content: item.remarks, title: `${item.studentId?.["SHORT NAME"]}'s Remark` })}
                              className="text-left text-slate-500 hover:text-indigo-600 truncate block w-full outline-none"
                            >
                              {item.remarks}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold italic uppercase">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden p-4 space-y-4 bg-slate-50/50">
                {filteredData.map((item) => (
                  <div key={item._id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={10} /> {formatDate(item.createdAt)}
                        </span>
                        <h3 className="font-black text-slate-800 text-base uppercase italic mt-1.5 leading-tight">
                          {item.studentId?.["SHORT NAME"] || item.studentId?.["FULL NAME"]}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          AD No: {item.studentId?.ADNO} • Class {item.studentId?.CLASS || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {ACTIVITY_ICONS[item.activity] || <Trophy className="w-4 h-4 text-slate-400" />}
                          <span className="font-extrabold uppercase text-slate-800 text-xs">
                            {item.activity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-black text-amber-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-black">+{item.points} PTS</span>
                        </div>
                      </div>

                      {item.remarks && (
                        <p className="text-xs text-slate-500 font-medium italic border-t border-slate-100/50 pt-2 leading-relaxed">
                          "{item.remarks}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      {item.imageUrl ? (
                        <button
                          onClick={() => setSelectedImage({ url: item.imageUrl, title: `${item.studentId?.["SHORT NAME"]} - ${item.activity}` })}
                          className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-wider hover:text-indigo-700 active:scale-95 transition-all"
                        >
                          <ImageIcon size={14} /> View Evidence Proof
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold italic uppercase">No Proof Attached</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy size={32} />
              </div>
              <h3 className="text-slate-700 font-black uppercase italic text-sm">No Achievements Found</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                Try adjusting your search criteria or filter dropdowns.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Lightbox / Proof Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}></div>
          <div className="relative bg-white max-w-4xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col">

            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase italic">Evidence File</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">{selectedImage.title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedImage(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 flex-1 overflow-auto flex items-center justify-center bg-slate-50">
              <img src={selectedImage.url} alt="Proof" className="max-h-[50vh] object-contain rounded-2xl shadow-md border border-slate-200" />
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 flex justify-end bg-white">
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-md flex items-center gap-2"
              >
                Open in New Tab <ExternalLink size={12} />
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Remarks Dialog Modal */}
      {selectedRemark && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedRemark(null)}></div>
          <div className="relative bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">

            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-white">
              <h3 className="text-sm font-black text-slate-800 uppercase italic">Remarks Details</h3>
              <button onClick={() => setSelectedRemark(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 bg-slate-50">
              <p className="text-slate-600 text-xs font-bold leading-relaxed whitespace-pre-line bg-white p-5 rounded-2xl border border-slate-100 italic shadow-inner">
                "{selectedRemark.content}"
              </p>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 flex justify-end bg-white">
              <button
                onClick={() => setSelectedRemark(null)}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
