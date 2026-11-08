"use client";
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header/Header';
import AuthGuard from '@/components/auth/AuthGuard';
import { FileCheck2, Search, RefreshCw, Check, FileText, ArrowUpRight, X } from 'lucide-react';
import styles from './Documentation.module.css';
const CLASS_ROLES = ['class_teacher'];
const dateLabel = value => value ? new Date(value.length === 10 ? value + 'T12:00:00+05:30' : value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) : ''; 

const auth = () => ({ headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
const hasMedical = leave => Boolean(leave.documentUrl || leave.isMedicalSubmitted || leave.documented);
const hasProgram = leave => Boolean(leave.programDocumentUrl || leave.isProgramSubmitted || leave.programDocumented);
const verifiedLeave = leave => (!hasMedical(leave) || leave.documented) && (!hasProgram(leave) || leave.programDocumented) && (hasMedical(leave) || hasProgram(leave));
export default function ClassLeaveDocumentation() {
    const [leaves, setLeaves] = useState([]);
    const [classNumber, setClassNumber] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(null);
    const [search, setSearch] = useState('');
    const [preview, setPreview] = useState(null);
    const [tab, setTab] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [commonSearched, setCommonSearched] = useState(false);
    useEffect(() => { setCommonSearched(false); }, [fromDate, toDate, selectedStudents]);
    useEffect(() => { setSelected(new Set()); }, [tab, search, fromDate, toDate, selectedStudents]);
    async function load() {
        setLoading(true); setError('');
        try { const { data } = await axios.get('/api/class-leave-docs', auth()); setLeaves(data.leaves); setClassNumber(data.classNumber); setStudents(data.students || []); setSelectedStudents(new Set((data.students || []).map(student => student._id))); }
        catch (error) { setError(error.response?.data?.error || 'Unable to load documentation. Please try again.'); }
        finally { setLoading(false); }
    }
    useEffect(() => { load(); }, []);
    async function update(leave, type) {
        if (busy) return;
        if (type === 'medical' ? leave.documented : leave.programDocumented) return;
        const verified = true;
        setBusy(leave._id); setError(''); setNotice('');
        try {
            const { data } = await axios.patch('/api/class-leave-docs', { id: leave._id, type, verified }, auth());
            setLeaves(previous => previous.map(item => item._id === leave._id ? { ...item, ...data } : item));
            setNotice('Leave marked as documented.');
        } catch (error) { setError(error.response?.data?.error || 'Unable to update documentation.'); }
        finally { setBusy(null); }
    }
    const scope = leaves.filter(leave => tab === 'common' ? Boolean(leave.returnedAt) : tab === 'medical' ? hasMedical(leave) : tab === 'program' ? hasProgram(leave) : hasMedical(leave) || hasProgram(leave));
    const isVerified = leave => tab === 'medical' ? leave.documented : tab === 'program' ? leave.programDocumented : verifiedLeave(leave);
    const validRange = tab !== 'common' || !fromDate || !toDate || fromDate <= toDate;
    const visible = scope.filter(leave => {
        const student = leave.studentId || {};
        return validRange && (tab !== 'common' || (commonSearched && selectedStudents.has(student._id))) &&
            (tab !== 'all' || [student['FULL NAME'], student['SHORT NAME']].join(' ').toLowerCase().includes(search.trim().toLowerCase())) &&
            (tab !== 'common' || ((!fromDate || (leave.toDate || leave.fromDate) >= fromDate) && (!toDate || leave.fromDate <= toDate)));
    }).sort((a, b) => Number(Boolean(isVerified(a))) - Number(Boolean(isVerified(b))));
    const tabs = [['all', 'All documents', leaves.filter(leave => hasMedical(leave) || hasProgram(leave)).length], ['common', 'Common leave docs', leaves.filter(leave => leave.returnedAt).length]];
    async function bulkDocument(type) {
        const targets = visible.filter(leave => selected.has(leave._id));
        if (busy || !targets.length || !window.confirm('Mark ' + targets.length + ' selected leaves as documented?')) return;
        setBusy('bulk'); setError(''); setNotice('');
        let completed = 0;
        for (const leave of targets) {
            try {
                const types = type === 'both' ? ['medical', 'program'] : [type];
                for (const itemType of types) {
                    const { data } = await axios.patch('/api/class-leave-docs', { id: leave._id, type: itemType, verified: true }, auth());
                    setLeaves(previous => previous.map(item => item._id === leave._id ? { ...item, ...data } : item));
                }
                completed++;
            } catch { /* Keep successful updates visible and report incomplete leaves. */ }
        }
        setSelected(new Set()); setBusy(null);
        setNotice(completed + ' of ' + targets.length + ' leaves documented.');
        if (completed !== targets.length) setError('Some leaves could not be documented. Refresh and review the remaining records before trying again.');
    }
    return <AuthGuard roles={CLASS_ROLES}><Header /><main className={styles.page}>
        <section className={styles.hero}>
            <div className={styles.heroTop}><span className={styles.classBadge}>Class {classNumber || '-'}</span><button className={styles.refresh} onClick={load} disabled={loading || busy !== null} aria-label="Refresh leave documentation"><RefreshCw size={18} className={loading ? styles.spin : ''} /></button></div>
            <div className={styles.heroBody}><div><h1>Leave<br />documentation</h1><p>Review and verify your class leaves.</p></div><div className={styles.heroIcon}><FileCheck2 size={44} strokeWidth={1.5} /></div></div>
        </section>
        <section className={styles.controls} aria-label="Find leave documents">
            <div className={styles.tabs} role="group" aria-label="Documentation categories">{tabs.map(([value, label, count]) => <button key={value} onClick={() => setTab(value)} aria-pressed={tab === value} className={tab === value ? styles.activeTab : ''}>{label}<span>{loading ? '-' : count}</span></button>)}</div>
            {tab === 'all' && <div className={styles.search}><Search size={18} /><input aria-label="Search leaves" placeholder={tab === 'all' ? 'Search student name' : 'Student name or admission number'} value={search} onChange={event => setSearch(event.target.value)} />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={16} /></button>}</div>}
            {tab === 'common' && <div className={styles.filters}>
                <label>From date<input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} /></label>
                <label>To date<input type="date" min={fromDate} value={toDate} onChange={event => setToDate(event.target.value)} /></label>
            </div>}
            {tab === 'common' && <fieldset className={styles.studentSelector} disabled={loading || busy !== null}>
                <legend>Students <span>{selectedStudents.size} / {students.length} selected</span></legend>
                <label className={styles.selectAll}><input type="checkbox" checked={students.length > 0 && selectedStudents.size === students.length} onChange={event => setSelectedStudents(event.target.checked ? new Set(students.map(student => student._id)) : new Set())} />Select all students</label>
                <div className={styles.studentGrid}>{students.map(student => <label key={student._id} className={selectedStudents.has(student._id) ? styles.chosenStudent : ''}>
                    <input type="checkbox" checked={selectedStudents.has(student._id)} onChange={event => setSelectedStudents(previous => { const next = new Set(previous); event.target.checked ? next.add(student._id) : next.delete(student._id); return next; })} />
                    <span>{student['FULL NAME'] || student['SHORT NAME'] || 'Student'}<small>AD {student.ADNO}</small></span>
                </label>)}</div>
                {!loading && !students.length && <p className={styles.hint}>No students are assigned to this class.</p>}
            </fieldset>}
            {!validRange && <p role="alert" className={styles.hint}>End date must be on or after the start date.</p>}
            {tab === 'common' && <><button className={styles.verify} disabled={loading || busy !== null || !validRange || !fromDate || !toDate || !selectedStudents.size} onClick={() => { setSelected(new Set()); setCommonSearched(true); }}><Search size={16} />Search leaves</button><p className={styles.hint}>Choose dates and students, then search. Only returned leaves are shown for documentation.</p></>}
        </section>
        {error && <div role="alert" className={styles.error}>{error}<button onClick={load}>Retry</button></div>}
        {notice && <div role="status" className={styles.notice}><Check size={18} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button></div>}
        {loading ? <div className={styles.list} role="status" aria-label="Loading your class leaves">{[1, 2, 3].map(item => <div key={item} className={styles.skeleton} />)}</div> : <>
            <p className={styles.resultCount}>{visible.length} {visible.length === 1 ? 'leave' : 'leaves'}</p>
            {tab === 'common' && commonSearched && <div className={styles.bulk}>
                <span>{selected.size} selected</span>
                <button disabled={busy !== null || !selected.size} onClick={() => bulkDocument('medical')}>Document medical</button>
                <button disabled={busy !== null || !selected.size} onClick={() => bulkDocument('program')}>Document program / official</button>
                <button disabled={busy !== null || !selected.size} onClick={() => bulkDocument('both')}>{busy === 'bulk' ? 'Saving...' : 'Document both'}</button>
            </div>}
            {tab === 'common' && !!visible.length && <label className={styles.selectAll}><input type="checkbox" checked={visible.every(leave => selected.has(leave._id))} disabled={busy !== null} onChange={event => setSelected(event.target.checked ? new Set(visible.map(leave => leave._id)) : new Set())} />Select all visible leaves</label>}
            <div className={styles.cardList}>{visible.map(leave => {
                const student = leave.studentId || {}, name = student['FULL NAME'] || 'Student';
                const types = tab === 'medical' ? ['medical'] : tab === 'program' ? ['program'] : tab === 'common' ? [/ogea|official|external edu/i.test(leave.reason || '') || (!hasMedical(leave) && hasProgram(leave)) ? 'program' : 'medical'] : [...(hasMedical(leave) ? ['medical'] : []), ...(hasProgram(leave) ? ['program'] : [])];
                const files = [[leave.documentUrl, 'Medical document'], [leave.programDocumentUrl, 'Program / Official document']].filter(([url]) => url);
                return <article key={leave._id} className={styles.leaveCard}>
                    <div className={styles.student}>
                        {tab === 'common' && <input type="checkbox" aria-label={'Select leave for ' + name} checked={selected.has(leave._id)} disabled={busy !== null} onChange={event => setSelected(previous => { const next = new Set(previous); event.target.checked ? next.add(leave._id) : next.delete(leave._id); return next; })} />}
                        <span className={styles.initials}>{name.slice(0, 2).toUpperCase()}</span><div><h2>{name}</h2><p>AD {student.ADNO || '-'}</p></div>
                    </div>
                    <div className={styles.details}><p>{dateLabel(leave.fromDate)}{leave.toDate && leave.toDate !== leave.fromDate ? ' - ' + dateLabel(leave.toDate) : ''}</p><p className={styles.reason}>{leave.reason}</p><span className={styles.subtext}>{leave.returnedAt ? 'Returned ' + dateLabel(leave.returnedAt) : 'Not returned'}</span></div>
                    <div className={styles.files}>{files.length ? files.map(([url, label]) => <a key={label} href={url} onClick={event => { if (label === 'Medical document') { event.preventDefault(); setPreview({ url, name }); } }} target="_blank" rel="noopener noreferrer"><FileText size={15} /><span>{label}</span><ArrowUpRight size={14} /></a>) : <p>No file uploaded</p>}</div>
                    <div className={styles.cardActions}>{types.map(type => {
                        const verified = type === 'medical' ? leave.documented : leave.programDocumented;
                        return <div key={type}><span className={verified ? styles.verified : styles.pending}>{type === 'medical' ? 'Medical' : 'Program / Official'}: {verified ? 'Verified' : 'Pending'}</span>{!verified && <button onClick={() => update(leave, type)} disabled={busy !== null || !leave.returnedAt} className={styles.verify}>{busy === leave._id ? 'Saving...' : 'Approve document'}</button>}</div>;
                    })}</div>{!leave.returnedAt && <p className={styles.hint}>Approval available after return.</p>}
                </article>;
            })}</div>
            {!visible.length && !error && <div className={styles.empty}><FileCheck2 size={32} /><h2>{tab === 'common' && !commonSearched ? 'Find class leaves' : search ? 'No matching leaves' : 'No leaves here yet'}</h2><p>{tab === 'common' && !commonSearched ? 'Select a date range and students, then tap Search leaves.' : search ? 'Try another student name.' : 'No leaves match your selection.'}</p>{search && <button onClick={() => setSearch('')}>Clear search</button>}</div>}
        </>}
        {preview && <DocumentPreview key={preview.url} document={preview} onClose={() => setPreview(null)} />}
    </main></AuthGuard>;
}

function DocumentPreview({ document: file, onClose }) {
    const dialog = useRef(null);
    const [failed, setFailed] = useState(false);
    const pdf = /\.pdf(?:[?#]|$)/i.test(file.url);
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const previousFocus = document.activeElement;
        document.body.style.overflow = 'hidden';
        dialog.current?.showModal();
        return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
    }, []);
    return <dialog ref={dialog} className={styles.preview} aria-labelledby="document-preview-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}>
        <div className={styles.previewPanel}>
            <div className={styles.previewHeader}><div><h2 id="document-preview-title">Medical document</h2><p>{file.name}</p></div><button autoFocus onClick={onClose} aria-label="Close document preview"><X size={22} /></button></div>
            <div className={styles.previewBody}>{pdf ? <iframe title="Medical document PDF" src={file.url} /> : failed ? <p>Preview unavailable. Open the original document using the link below.</p> : <img src={file.url} alt={'Medical document for ' + file.name} onError={() => setFailed(true)} />}</div>
            <a className={styles.original} href={file.url} target="_blank" rel="noopener noreferrer">Open original document <ArrowUpRight size={16} /></a>
        </div>
    </dialog>;
}
