"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useNavigationRouter as useRouter } from '@/components/navigation/NavigationProvider';
import axios from 'axios';
import { Home, Check, Copy, Loader2, X } from 'lucide-react';
import StudentsLoad from '@/components/load-UI/StudentsLoad';
import { API_PORT } from '@/Constants';
import { attendanceDateKey, editableAttendanceStatus, selectAttendanceSession } from '@/lib/attendanceSession.mjs';
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
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quickAction, setQuickAction] = useState('All Absent');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRecords([]); setStatuses({}); setSaved(false); setConfirm(false);
    const params = { classNumber: id };
    if (date) params.date = date;
    if (time) params.time = time;
    if (time === 'Period' && period) params.period = period;
    if (['Jamath', 'More'].includes(time) && custom) params.custom = custom;
    axios.get(`${API_PORT}/set-attendance`, { params, signal: controller.signal })
      .then(response => {
        if (controller.signal.aborted) return;
        const session = selectAttendanceSession(response.data, { date, time, period, custom });
        setRecords(session);
        setStatuses(Object.fromEntries(session.map(record => [record._id, editableAttendanceStatus(record)])));
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.response?.data?.error || 'Could not load attendance. Please refresh and try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, date, time, period, custom]);

  const absent = records.filter(record => statuses[record._id] !== 'Present');
  const present = records.length - absent.length;
  const sessionDate = records[0] ? attendanceDateKey(records[0].attendanceDate) : date;
  const sessionTime = records[0]?.attendanceTime || time;
  const sessionPeriod = records[0]?.period || period;
  const sessionCustom = records[0]?.custom || records[0]?.more || custom;
  const sessionLabel = [sessionTime, sessionTime === 'Period' ? sessionPeriod : sessionCustom].filter(Boolean).join(' - ');
  const toggle = record => {
    setStatuses(previous => ({ ...previous, [record._id]: previous[record._id] === 'Present' ? 'Absent' : 'Present' }));
    setSaved(false);
  };
  const setAll = action => {
    setStatuses(Object.fromEntries(records.map(record => [record._id, action === 'Reset' ? editableAttendanceStatus(record) : action])));
    setSaved(false);
  };
  const handleQuickAction = () => {
    setAll(quickAction === 'Previous' ? 'Reset' : quickAction === 'All Present' ? 'Present' : 'Absent');
    setQuickAction(quickAction === 'Previous' ? 'All Present' : quickAction === 'All Present' ? 'All Absent' : 'Previous');
  };
  const copyAbsentees = async () => {
    try {
      await navigator.clipboard.writeText(`Class ${id} - Absentees\n${sessionDate} | ${sessionLabel}\n\n${absent.length ? absent.map(record => `${studentName(record)} (AD: ${admissionNumber(record)})`).join('\n') : 'All students are present.'}`);
      setCopied(true);
    } catch { setError('Could not copy the list. Please check clipboard permission.'); }
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
            return <tr key={record._id} onClick={() => { if (!saving) toggle(record); }} className="group transition-colors hover:bg-sky-50/50 cursor-pointer">
              <td className="hidden sm:table-cell px-6 py-4 text-sm font-medium text-slate-400">{index + 1}</td>
              <td className="hidden sm:table-cell px-6 py-4 text-sm font-mono text-slate-500">{admissionNumber(record)}</td>
              <td className="px-4 sm:px-6 py-4"><div className="flex flex-col"><span className="font-bold transition-colors leading-tight text-slate-900 group-hover:text-sky-700">{studentName(record)}</span><span className="text-[10px] sm:hidden font-mono text-slate-400 mt-0.5">AD: {admissionNumber(record)} &bull; SL: {index + 1}</span></div></td>
              <td className="px-4 sm:px-6 py-4 text-center"><button type="button" disabled={saving} aria-pressed={isPresent} aria-label={`${studentName(record)}: ${isPresent ? 'Present' : 'Absent'}. Tap to change.`} onClick={event => { event.stopPropagation(); toggle(record); }} className={`min-w-[80px] sm:min-w-[100px] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter shadow-sm transition-all duration-200 ${isPresent ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'}`}>{isPresent ? 'Present' : 'Absent'}</button></td>
            </tr>;
          })}</tbody>
        </table></div>
        <div className="bg-slate-50 p-8 border-t border-slate-100 flex justify-center"><button type="submit" disabled={saving} className="btn-primary flex items-center gap-3 px-10 py-4 rounded-2xl shadow-2xl shadow-sky-500/30 text-base"><Check size={20} />Save Changes</button></div>
      </div>
    </form>}
    {confirm && <div className={styles.overlay}>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-edit-title" className={styles.modal}>
        <div className={styles.modalTitle}><h2 id="confirm-edit-title">Confirm attendance</h2><button type="button" disabled={saving} aria-label="Close confirmation" onClick={() => setConfirm(false)}><X size={21} /></button></div>
        <p>Class {id} | {sessionDate} | {sessionLabel}</p>
        <div className={styles.totals}><span><strong>{present}</strong> present</span><span><strong>{absent.length}</strong> absent</span></div>
        <div className={styles.absentees}>{absent.length ? absent.map(record => <div key={record._id}><strong>{studentName(record)}</strong><span>AD {admissionNumber(record)} - Absent</span></div>) : <p>All students are present.</p>}</div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button className={styles.copy} type="button" onClick={copyAbsentees}><Copy size={16} />{copied ? 'Copied' : 'Copy absent list'}</button>
        <button className={styles.save} type="button" disabled={saving} onClick={save}>{saving ? <Loader2 size={18} /> : <Check size={18} />}{saving ? 'Saving...' : 'Save changes'}</button>
      </section>
    </div>}
  </main>;
}
