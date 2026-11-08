"use client";

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { User, Users, CheckCircle, Search, AlertCircle, Loader2, X, Plus, Minus, ChevronDown } from 'lucide-react';
import styles from './MinusEntry.module.css';
import { API_PORT } from '../../Constants';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export default function App({ students }) {
    const [suggestions, setSuggestions] = useState([]);
    const [ad, setAd] = useState('');
    const [name, setName] = useState('');
    const [classNum, setClassNum] = useState('');
    const minusCount = 1 / 3;
    const [reason, setReason] = useState('Skipping Jamath');
    const [load, setLoad] = useState(false);
    const [teacher, setTeacher] = useState(null);
    const [status, setStatus] = useState(null);
    const [academicYear, setAcademicYear] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);

    useEffect(() => {
        axios.get(`${API_PORT}/settings`)
            .then(res => {
                if (res.data.academicYear) {
                    setAcademicYear(res.data.academicYear);
                    setAcademicYearId(res.data.academicYearId);
                }
            })
            .catch(err => console.error("Error fetching academic year:", err));
    }, []);

    useEffect(() => {
        const storedTeacher = getSafeLocalStorage().getItem("teacher");
        if (storedTeacher) {
            try {
                setTeacher(JSON.parse(storedTeacher));
            } catch (e) {
                console.error("Failed to parse teacher from localStorage");
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoad(true);
        setStatus(null);

        try {
            const finalReason = reason || 'Skipping Jamath';
            let payload;

            if (bulkMode) {
                if (selectedStudents.length === 0) {
                    setStatus('error');
                    setLoad(false);
                    return;
                }
                payload = selectedStudents.map(s => ({
                    studentId: s._id,
                    reason: finalReason,
                    teacherId: teacher?.id || teacher?._id,
                    minusNum: minusCount,
                    academicYearId: academicYearId
                }));
            } else {
                payload = {
                    studentId: studentId,
                    reason: finalReason,
                    teacherId: teacher?.id || teacher?._id,
                    minusNum: minusCount,
                    academicYearId: academicYearId
                };
            }

            await axios.post(`${API_PORT}/minus`, payload);
            
            setStatus('success');
            setAd('');
            setName('');
            setClassNum('');
            setReason('Skipping Jamath');
            setSelectedStudents([]);
            
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error('Error:', error.response?.data);
            setStatus('error');
        } finally {
            setLoad(false);
        }
    };

    const addStudentToBulk = (student) => {
        if (!selectedStudents.find(s => s._id === student._id)) {
            setSelectedStudents([...selectedStudents, student]);
        }
        setAd('');
        setSuggestions([]);
    };

    const removeStudentFromBulk = (id) => {
        setSelectedStudents(selectedStudents.filter(s => s._id !== id));
    };

    const changeMode = (bulk) => {
        setBulkMode(bulk);
        setSelectedStudents([]);
        setAd(''); setName(''); setClassNum(''); setStudentId('');
        setSuggestions([]); setStatus(null);
    };
    const searchStudents = (value) => {
        setAd(value); setName(''); setClassNum(''); setStudentId(''); setStatus(null);
        const query = value.trim().toLowerCase();
        if (!query) { setSuggestions([]); return; }
        const numeric = /^\d+$/.test(query);
        setSuggestions(students.filter(student => !selectedStudents.some(selected => selected._id === student._id) &&
            (numeric ? String(student.ADNO).startsWith(query) : String(student['SHORT NAME'] || student['FULL NAME'] || '').toLowerCase().includes(query))).slice(0, 5));
    };
    const chooseStudent = (student) => {
        if (bulkMode) { addStudentToBulk(student); return; }
        setAd(String(student.ADNO)); setName(student['SHORT NAME'] || student['FULL NAME']);
        setClassNum(student.CLASS); setStudentId(student._id); setSuggestions([]);
    };
    const canSubmit = !load && (bulkMode ? selectedStudents.length > 0 : Boolean(studentId));

    return <section className={styles.entry} aria-labelledby="minus-entry-title">
        <div className={styles.heading}>
            <div className={styles.headingIcon}><Minus size={21} /></div>
            <div><h2 id="minus-entry-title">Minus entry</h2><p>Record a student point deduction</p></div>
            <span className={styles.points}>&minus;&#8531;<span>point each</span></span>
        </div>
        <form onSubmit={handleSubmit}>
            <fieldset disabled={load} className={styles.fields}>
                <div className={styles.mode} aria-label="Entry mode">
                    <button type="button" aria-pressed={!bulkMode} className={!bulkMode ? styles.active : ''} onClick={() => changeMode(false)}><User size={16} />One student</button>
                    <button type="button" aria-pressed={bulkMode} className={bulkMode ? styles.active : ''} onClick={() => changeMode(true)}><Users size={16} />Multiple students</button>
                </div>
                {status && <div role={status === 'error' ? 'alert' : 'status'} className={status === 'success' ? styles.success : styles.error}>
                    {status === 'success' ? <CheckCircle size={19} /> : <AlertCircle size={19} />}
                    <span>{status === 'success' ? 'Deduction recorded successfully.' : 'Could not save the deduction. Please try again.'}</span>
                </div>}
                <div className={styles.section}>
                    <label htmlFor="minus-student-search">{bulkMode ? 'Add students' : 'Find student'}</label>
                    <p className={styles.hint}>Search by admission number or name</p>
                    <div className={styles.search}>
                        <Search size={18} aria-hidden="true" />
                        <input id="minus-student-search" type="search" autoComplete="off" placeholder="Admission number or name" value={ad} onChange={event => searchStudents(event.target.value)} aria-controls="minus-student-results" aria-expanded={suggestions.length > 0} />
                    </div>
                    {suggestions.length > 0 && <div id="minus-student-results" className={styles.results} aria-label="Matching students">
                        {suggestions.map(student => <button key={student._id} type="button" onClick={() => chooseStudent(student)}>
                            <span className={styles.studentAvatar}>{(student['SHORT NAME'] || student['FULL NAME'] || 'S').charAt(0)}</span>
                            <span className={styles.studentDetails}><strong>{student['SHORT NAME'] || student['FULL NAME']}</strong><small>AD {student.ADNO} &middot; Class {student.CLASS}</small></span>
                            <Plus size={17} />
                        </button>)}
                    </div>}
                    {ad && !studentId && suggestions.length === 0 && <p className={styles.noResults}>No matching students. Try another name or admission number.</p>}
                </div>
                {!bulkMode && studentId && <div className={styles.selectedStudent}>
                    <span className={styles.studentAvatar}><User size={20} /></span>
                    <div className={styles.studentDetails}><strong>{name}</strong><small>AD {ad} &middot; Class {classNum}</small></div>
                    <button type="button" aria-label="Clear selected student" onClick={() => searchStudents('')}><X size={17} /></button>
                </div>}
                {bulkMode && <div className={styles.bulkSelection}>
                    <div className={styles.selectionTitle}><span>Selected students</span><span>{selectedStudents.length}</span></div>
                    {selectedStudents.length ? <div className={styles.chips}>{selectedStudents.map(student => <span key={student._id} className={styles.chip}>
                        <span>{student['SHORT NAME'] || student['FULL NAME']}<small>AD {student.ADNO}</small></span>
                        <button type="button" aria-label={`Remove ${student['SHORT NAME'] || student.ADNO}`} onClick={() => removeStudentFromBulk(student._id)}><X size={15} /></button>
                    </span>)}</div> : <p className={styles.hint}>Search and tap a student to add them.</p>}
                </div>}
                <div className={styles.section}>
                    <label htmlFor="minus-reason">Reason for deduction</label>
                    <div className={styles.reason}>
                        <select id="minus-reason" value={reason} onChange={event => setReason(event.target.value)} required>
                            <option value="Skipping Jamath">Skipping Jamath</option>
                            <option value="Skipping Class">Skipping Class</option>
                            <option value="Late coming without permission">Late coming</option>
                            <option value="Skipping program">Skipping program</option>
                        </select><ChevronDown size={17} aria-hidden="true" />
                    </div>
                </div>
                <div className={styles.summary}><span>{bulkMode ? `${selectedStudents.length} students selected` : studentId ? '1 student selected' : 'Select a student to continue'}</span><strong>&#8531; point{bulkMode ? ' each' : ''}</strong></div>
                <button type="submit" className={styles.submit} disabled={!canSubmit}>{load ? <><Loader2 size={18} className={styles.spinner} />Saving...</> : <><CheckCircle size={18} />{bulkMode && selectedStudents.length ? `Record for ${selectedStudents.length} students` : 'Record deduction'}</>}</button>
            </fieldset>
        </form>
        <footer className={styles.footer}><span>Recorded by <strong>{teacher?.name || 'Teacher'}</strong></span>{academicYear && <span>{academicYear}</span>}</footer>
    </section>;
}
