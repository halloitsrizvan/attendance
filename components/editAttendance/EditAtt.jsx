"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useNavigationRouter as useRouter } from '@/components/navigation/NavigationProvider';
import axios from 'axios';
import { Home, Check, Loader2, X } from 'lucide-react';
import StudentsLoad from '@/components/load-UI/StudentsLoad';
import { API_PORT } from '@/Constants';
import { attendanceDateKey, editableAttendanceStatus, selectAttendanceSession } from '@/lib/attendanceSession.mjs';
import { editAttendanceLeaveInfo, formatEditAbsentees } from '@/lib/attendanceEditLeave.mjs';
import { isTeacherAuthorizedForLateReturn } from '@/utils/leaveReturnUtils';
import styles from './EditAtt.module.css';

const studentName = record => record.studentId?.['SHORT NAME'] || record.studentId?.['FULL NAME'] || record.nameOfStd || record.name || 'Unknown student';
const admissionNumber = record => record.studentId?.ADNO || record.ad;

export default function EditAtt() {
  const { id } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const date = search.get('date') || '';
  const time = search.get('time') || '';
  const period = search.get('period') || '';
  const custom = search.get('custom') || search.get('more') || '';
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [passes, setPasses] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quickAction, setQuickAction] = useState('All Absent');
  const [teacher, setTeacher] = useState(null);
  const [returnRecord, setReturnRecord] = useState(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    try { setTeacher(JSON.parse(localStorage.getItem('teacher') || 'null')); }
    catch { setTeacher(null); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRecords([]); setStatuses({}); setSaved(false); setConfirm(false);
    const params = { classNumber: id };
    if (date) params.date = date;
    if (time) params.time = time;
    if (time === 'Period' && period) params.period = period;
    if (['Jamath', 'More'].includes(time) && custom) params.custom = custom;
    Promise.all([
      axios.get(`${API_PORT}/set-attendance`, { params, signal: controller.signal }),
      axios.get(`${API_PORT}/leave`, { params: { classes: id, all: true }, signal: controller.signal }),
      axios.get(`${API_PORT}/class-excused-pass`, { signal: controller.signal }),
    ])
      .then(([response, leaveResponse, passResponse]) => {
        if (controller.signal.aborted) return;
        const session = selectAttendanceSession(response.data, { date, time, period, custom });
        setRecords(session);
        setLeaves(leaveResponse.data);
        setPasses(passResponse.data);
        setStatuses(Object.fromEntries(session.map(record => [record._id, editableAttendanceStatus(record)])));
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.response?.data?.error || 'Could not load attendance. Please refresh and try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, date, time, period, custom]);

  const absent = records.filter(record => statuses[record._id] !== 'Present');
  const leaveInfo = Object.fromEntries(records.map(record => [record._id, editAttendanceLeaveInfo(record, leaves, passes)]));
  const leaveTypes = Object.fromEntries(records.map(record => [record._id, leaveInfo[record._id]?.type || null]));
  const sessionDate = records[0] ? attendanceDateKey(records[0].attendanceDate) : date;
  const sessionTime = records[0]?.attendanceTime || time;
  const sessionPeriod = records[0]?.period || period;
  const sessionCustom = records[0]?.custom || records[0]?.more || custom;
  const sessionLabel = [sessionTime, sessionTime === 'Period' ? sessionPeriod : sessionCustom].filter(Boolean).join(' - ');
  const toggle = record => {
    if (leaveTypes[record._id]) return;
    setStatuses(previous => ({ ...previous, [record._id]: previous[record._id] === 'Present' ? 'Absent' : 'Present' }));
    setSaved(false);
  };
  const setAll = action => {
    setStatuses(Object.fromEntries(records.map(record => [record._id, leaveTypes[record._id] ? 'Absent' : action === 'Reset' ? editableAttendanceStatus(record) : action])));
    setSaved(false);
  };
  const handleQuickAction = () => {
    setAll(quickAction === 'Previous' ? 'Reset' : quickAction === 'All Present' ? 'Present' : 'Absent');
    setQuickAction(quickAction === 'Previous' ? 'All Present' : quickAction === 'All Present' ? 'All Absent' : 'Previous');
  };
  const copyAbsentees = async () => {
    try {
      const copyTime = `${sessionTime}${sessionTime === 'Period' && sessionPeriod ? ` (P${sessionPeriod})` : ''}${sessionTime !== 'Period' && sessionCustom ? ` - ${sessionCustom}` : ''}`;
      await navigator.clipboard.writeText(formatEditAbsentees({ classNumber: id, date: sessionDate, time: copyTime, records, statuses, leaveTypes }));
      setCopied(true);
    } catch { setError('Could not copy the list. Please check clipboard permission.'); }
  };
  const confirmReturn = async () => {
    const record = returnRecord;
    const info = record && leaveInfo[record._id];
    if (!info || !isTeacherAuthorizedForLateReturn(teacher, record.studentId?.CLASS || record.classNumber || id)) return;
    setReturning(true); setError('');
    try {
      const returnedAt = new Date().toISOString();
      const updates = [];
      if (info.leave) updates.push(axios.patch(`${API_PORT}/leave/${info.leave._id}`, { status: 'returned', returnedAt, markReturnedTeacher: teacher?.name || 'Unknown' }));
      if (info.pass) updates.push(axios.patch(`${API_PORT}/class-excused-pass/${info.pass._id}`, { status: 'returned', returnedAt }));
      updates.push(axios.patch(`${API_PORT}/students/on-leave/${admissionNumber(record)}`, { onLeave: false }));
      await Promise.all(updates);
      setLeaves(previous => previous.map(item => item._id === info.leave?._id ? { ...item, status: 'returned', returnedAt } : item));
      setPasses(previous => previous.map(item => item._id === info.pass?._id ? { ...item, status: 'returned', returnedAt } : item));
      setRecords(previous => previous.map(item => item.studentId?._id === record.studentId?._id ? { ...item, studentId: { ...item.studentId, onLeave: false } } : item));
      try { sessionStorage.removeItem('hajar_data'); } catch { /* Ignore storage restrictions. */ }
      setReturnRecord(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not return this student from leave. Please try again.');
      const refreshed = await Promise.allSettled([
        axios.get(`${API_PORT}/leave`, { params: { classes: id, all: true } }),
        axios.get(`${API_PORT}/class-excused-pass`),
      ]);
      if (refreshed[0].status === 'fulfilled') setLeaves(refreshed[0].value.data);
      if (refreshed[1].status === 'fulfilled') setPasses(refreshed[1].value.data);
      setReturnRecord(null);
    } finally { setReturning(false); }
  };
  const save = async () => {
    if (saving || !records.length) return;
    setSaving(true); setError('');
    try {
      const updates = records.map(record => ({ _id: record._id, status: statuses[record._id] }));
      await axios.patch(`${API_PORT}/set-attendance`, { updates });
      // A historical correction must not change today's student/leave state.
      setRecords(previous => previous.map(record => {
        const status = statuses[record._id];
        return status === 'Present'
          ? { ...record, status, onLeave: false, isLate: false, leaveId: null, shortLeaveId: null }
          : { ...record, status };
      }));
      try {
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith('attendance_')) sessionStorage.removeItem(key);
        }
      } catch { /* Storage restrictions must not turn a successful save into an error. */ }
      setConfirm(false); setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes. Please try again.');
    } finally { setSaving(false); }
  };

  return <main className="p-4 sm:p-8 mt-12 max-w-7xl mx-auto">
    <div className="mb-2 space-y-4">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 bg-white p-6 rounded-3xl shadow-sm border border-sky-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-black rounded-full uppercase tracking-wider">Class {id}</span>
            <span className="text-slate-900 font-black text-sm uppercase tracking-tight">{sessionLabel || 'Latest session'}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Editing</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">{sessionDate ? new Date(`${sessionDate}T12:00:00+05:30`).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }) : 'Loading session...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push('/')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Back to attendance classes"><Home size={18} /></button>
          <button type="button" disabled={loading || saving || !records.length} onClick={handleQuickAction} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 ${quickAction === 'All Present' ? 'bg-emerald-500 text-white shadow-emerald-500/10' : quickAction === 'All Absent' ? 'bg-rose-500 text-white shadow-rose-500/10' : 'bg-sky-500 text-white shadow-sky-500/10'}`}>Mark {quickAction}</button>
        </div>
      </section>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {saved && <div role="status" className={styles.success}><Check size={18} />Attendance changes saved.</div>}
    {loading ? <StudentsLoad /> : !records.length ? <section className={styles.empty}><h2>No attendance found</h2><p>No records were found for this class and session.</p><button onClick={() => router.push('/')}>Back to classes</button></section> : <form onSubmit={event => { event.preventDefault(); setConfirm(true); setCopied(false); }}>
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full border-collapse" aria-label="Student attendance">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-16">Sl</th>
            <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-24">Ad</th>
            <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Student Info</th>
            <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest w-28 sm:w-40">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">{records.map((record, index) => {
            const isPresent = statuses[record._id] === 'Present';
            const leaveType = leaveTypes[record._id];
            const canReturn = leaveType && isTeacherAuthorizedForLateReturn(teacher, record.studentId?.CLASS || record.classNumber || id);
            return <tr key={record._id} onClick={() => { if (!saving) toggle(record); }} className={`group transition-colors ${leaveType ? 'bg-amber-50/30 cursor-not-allowed' : 'hover:bg-sky-50/50 cursor-pointer'}`}>
              <td className="hidden sm:table-cell px-6 py-4 text-sm font-medium text-slate-400">{index + 1}</td>
              <td className="hidden sm:table-cell px-6 py-4 text-sm font-mono text-slate-500">{admissionNumber(record)}</td>
              <td className="px-4 sm:px-6 py-4"><div className="flex flex-col"><span className={`font-bold transition-colors leading-tight ${leaveType ? leaveType === 'Late' ? 'text-rose-700' : 'text-slate-400' : 'text-slate-900 group-hover:text-sky-700'}`}>{studentName(record)}</span><span className="text-[10px] sm:hidden font-mono text-slate-400 mt-0.5">AD: {admissionNumber(record)} &bull; SL: {index + 1}</span></div></td>
              <td className="px-4 sm:px-6 py-4 text-center"><div className="flex items-center justify-center gap-1.5 sm:gap-2"><button type="button" disabled={saving || Boolean(leaveType)} aria-pressed={isPresent} aria-label={`${studentName(record)}: ${leaveType || (isPresent ? 'Present' : 'Absent')}${leaveType ? ', locked while on leave' : '. Tap to change.'}`} onClick={event => { event.stopPropagation(); toggle(record); }} className={`min-w-[80px] sm:min-w-[100px] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter shadow-sm transition-all duration-200 ${leaveType ? leaveType === 'Late' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-600 border border-amber-200' : isPresent ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'}`}>{leaveType || (isPresent ? 'Present' : 'Absent')}</button>{canReturn && <button type="button" disabled={saving || returning} onClick={event => { event.stopPropagation(); setReturnRecord(record); }} aria-label={`Return ${studentName(record)} from leave`} className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 rounded-lg sm:rounded-xl bg-sky-500 text-white text-[10px] sm:text-xs font-bold shadow-sm hover:bg-sky-600 disabled:opacity-50">R</button>}</div></td>
            </tr>;
          })}</tbody>
        </table></div>
        <div className="bg-slate-50 p-8 border-t border-slate-100 flex justify-center"><button type="submit" disabled={saving} className="btn-primary flex items-center gap-3 px-10 py-4 rounded-2xl shadow-2xl shadow-sky-500/30 text-base"><Check size={20} />Save Changes</button></div>
      </div>
    </form>}
    {confirm && <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-edit-title" className="relative bg-white w-full max-w-sm sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2.5rem] shadow-2xl border border-white p-8">
        <div className="text-center mb-6">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Attention Required</h3>
          <h2 id="confirm-edit-title" className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Submission</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">The following {absent.length} students are absent</p>
        </div>
        {absent.length ? <div className="max-h-60 overflow-y-auto mb-6 no-scrollbar rounded-3xl bg-rose-50 border border-rose-100 p-4">
          <div className="space-y-3">{absent.map(record => <div key={record._id} className="flex items-center justify-between border-b border-rose-100 last:border-0 pb-2 last:pb-0">
            <div className="flex flex-col"><span className="text-sm font-black text-rose-600">{studentName(record)}</span><div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">AD: {admissionNumber(record)}</span><span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">• SL: {records.findIndex(item => item._id === record._id) + 1}</span></div></div>
            {leaveTypes[record._id] && <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${leaveTypes[record._id] === 'Late' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>{leaveTypes[record._id] === 'Late' ? 'Late' : 'On Leave'}</span>}
          </div>)}</div>
        </div> : <div className="py-8 text-center bg-emerald-50 rounded-3xl border border-emerald-100 mb-6"><span className="text-4xl block mb-2">🎉</span><p className="text-sm font-black text-emerald-600 uppercase tracking-widest">No absentees found</p></div>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={saving} onClick={() => setConfirm(false)} className="col-span-1 py-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all font-mono">Cancel</button>
          <button type="button" onClick={copyAbsentees} className="col-span-1 py-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">{copied ? 'Copied' : 'Copy List'}</button>
          <button type="button" disabled={saving} onClick={save} className="col-span-2 py-4 bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-500/20 hover:bg-sky-600 transition-all active:scale-[0.98] disabled:opacity-50">{saving ? 'Saving...' : 'Confirm Recording'}</button>
        </div>
      </section>
    </div>}
    {returnRecord && <div className="fixed inset-0 flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-return-title" className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white p-8">
        <button type="button" disabled={returning} onClick={() => setReturnRecord(null)} aria-label="Close return confirmation" className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
        <div className="text-center mb-6"><h3 className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Status Update</h3><h2 id="confirm-return-title" className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Return</h2><p className="text-[10px] font-bold text-slate-400 mt-2 uppercase px-4 leading-relaxed">Mark <span className="text-sky-600">{studentName(returnRecord)}</span> as returned from leave?</p></div>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200/50 pb-3"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</span><span className="text-[9px] font-black text-sky-500 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded uppercase tracking-widest">{leaveTypes[returnRecord._id]}</span></div>
          <div className="flex justify-between items-center border-b border-slate-200/50 pb-3"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</span><span className="text-[10px] font-bold text-slate-700 uppercase">{leaveInfo[returnRecord._id]?.leave?.reason || leaveInfo[returnRecord._id]?.pass?.reason || 'N/A'}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3"><button type="button" disabled={returning} onClick={() => setReturnRecord(null)} className="py-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all font-mono">Cancel</button><button type="button" disabled={returning} onClick={confirmReturn} className="py-4 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all disabled:opacity-50">{returning ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirm Return'}</button></div>
      </section>
    </div>}
  </main>;
}
