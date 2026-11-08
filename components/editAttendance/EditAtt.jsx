"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useNavigationRouter as useRouter } from '@/components/navigation/NavigationProvider';
import axios from 'axios';
import { ArrowLeft, Check, Copy, LayoutGrid, List, Loader2, X } from 'lucide-react';
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
  const [cards, setCards] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return <main className={styles.page}>
    <section className={styles.heading}>
      <button type="button" className={styles.back} aria-label="Back to attendance classes" onClick={() => router.push('/')}><ArrowLeft size={19} /></button>
      <div><span className={styles.classTag}>Class {id}</span><h1>Edit attendance</h1><p>{sessionDate || 'Latest session'}{sessionLabel && ` | ${sessionLabel}`}</p></div>
      <button type="button" className={styles.view} aria-label={cards ? 'Switch to list view' : 'Switch to cards view'} onClick={() => setCards(!cards)}>{cards ? <List size={20} /> : <LayoutGrid size={20} />}</button>
    </section>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {saved && <div role="status" className={styles.success}><Check size={18} />Attendance changes saved.</div>}
    {loading ? <div className={styles.loading} role="status"><Loader2 size={24} />Loading attendance...</div> : !records.length ? <section className={styles.empty}><h2>No attendance found</h2><p>No records were found for this class and session.</p><button onClick={() => router.push('/')}>Back to classes</button></section> : <>
      <div className={styles.totals}><span><strong>{records.length}</strong> students</span><span><strong>{present}</strong> present</span><span><strong>{absent.length}</strong> absent</span></div>
      <div className={styles.actions} aria-label="Set attendance for all students">{['Present', 'Absent', 'Reset'].map(action => <button key={action} type="button" disabled={saving} onClick={() => setAll(action)}>{action === 'Reset' ? 'Reset changes' : `All ${action.toLowerCase()}`}</button>)}</div>
      <p className={styles.hint}>Tap a status to change it. Leave, late and medical entries are shown as Absent.</p>
      <div className={cards ? styles.cards : styles.list} aria-label="Student attendance">
        {records.map((record, index) => {
          const isPresent = statuses[record._id] === 'Present';
          return <div key={record._id} className={`${styles.student} ${isPresent ? styles.present : styles.absent}`}>
            <span className={styles.number}>{record.studentId?.SL || record.SL || index + 1}</span>
            <div className={styles.studentInfo}><strong>{studentName(record)}</strong><span>AD {admissionNumber(record)}</span></div>
            <button type="button" disabled={saving} className={styles.status} aria-label={`${studentName(record)}: ${isPresent ? 'Present' : 'Absent'}. Tap to change.`} aria-pressed={isPresent} onClick={() => toggle(record)}>{isPresent ? 'Present' : 'Absent'}</button>
          </div>;
        })}
      </div>
      <button type="button" className={styles.save} disabled={saving} onClick={() => { setConfirm(true); setCopied(false); }}><Check size={18} />Review changes</button>
    </>}
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
