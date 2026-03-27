"use client";

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter, useParams } from "next/navigation";
import { TfiLayoutGrid3,TfiLayoutGrid2  } from "react-icons/tfi";
import { FaHome, FaArrowLeft } from "react-icons/fa";
import StudentsLoad from '../load-UI/StudentsLoad';
import { API_PORT } from '../../Constants';

function EditAtt() {
    const [students,setStudents] = useState([])
    const [err,setErr]= useState('')
    const {id} = useParams()
    const [status,setStatus] = useState({})
    const [summary, setSummary] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const navigate=useRouter()
    const [summaryLoad,setSummaryLoad] = useState(false)
    const [load,setLoad] = useState(false)
    const [cards,setCards] = useState('No') 
  const [confirmAttendance, setConfirmAttendance] = useState(false)
  const [absentees, setAbsentees] = useState([])
  const [copy, setCopy] = useState(false)
    const latestDate=students[0]?.attendanceDate
    const latestTime=students[0]?.attentenceTime
    const [academicYear, setAcademicYear] = useState('');

    useEffect(() => {
        axios.get(`${API_PORT}/settings`)
            .then(res => {
                if (res.data.academicYear) {
                    setAcademicYear(res.data.academicYear);
                }
            })
            .catch(err => console.error("Error fetching academic year:", err));
    }, []);
    useEffect(() => {
      setLoad(true)
      console.log(latestDate,latestTime);
      
      axios
        .get(`${API_PORT}/set-attendance`)
        .then((res) => {
          const filteredData = res.data.filter(
            (student) => student.class === Number(id)
          );
    
          if (filteredData.length > 0) {
            // Group by AD (unique student)
            const latestByStudent = {};
            filteredData.forEach((s) => {
              const existing = latestByStudent[s.ad];
              const existingDate = existing?.attendanceDate ? new Date(existing.attendanceDate) : null;
              const currentDate = s.attendanceDate ? new Date(s.attendanceDate) : null;
              if (!existing || (currentDate && existingDate && currentDate > existingDate)) {
                latestByStudent[s.ad] = s;
              }
            });
    
            // Convert to array + sort by SL
            const latestData = Object.values(latestByStudent).sort(
              (a, b) => a.SL - b.SL
            );
            console.log("data",latestData);
            
            setStudents(latestData);
    
            // initial status
            const initialStatus = {};
            latestData.forEach((s) => {
              initialStatus[s.ad] = s.status;
            });
            setStatus(initialStatus);

          } else {
            setStudents([]);
          }
          setLoad(false)
        })
        .catch((err) => {
          setErr(err.message);
          setLoad(false)
        });
    }, [id]);
    
    

    const handleCheckboxChange = (ad, isChecked) => {
      setStatus((prev) => ({
        ...prev,
        [ad]: isChecked ? "Present" : "Absent",
      }));
    };

  const preSubmit = (e) => {
    e.preventDefault()
    const absentList = students.filter((s) => (status[s.ad] ?? s.status) !== "Present")
    setAbsentees(absentList)
    setConfirmAttendance(true)
  }
  
  const handleCopyAbsentees = () => {
    const attendanceDate = students[0]?.attendanceDate ? new Date(students[0].attendanceDate).toLocaleDateString("en-US", { dateStyle: "long" }) : "N/A";
    const attendanceTime = students[0]?.attendanceTime || students[0]?.attentenceTime || "N/A";
    const headText = `Class ${id} Attendance\n${attendanceDate} | ${attendanceTime}\n\n`;

    if (absentees.length > 0) {
      const text = absentees
        .map((s) => `${s.nameOfStd} (AdNo: ${s.ad})`)
        .join("\n");
      navigator.clipboard.writeText(headText + text)
        .then(() => setCopy(true))
        .catch((err) => console.error("Failed to copy: ", err));
    } else {
      navigator.clipboard.writeText(headText + "No absentees 🎉");
      setCopy(true)
    }
    setTimeout(() => setCopy(false), 4000)
  }
  
    const handleSubmit=async(e)=>{
      if (e) e.preventDefault();
      try{
        setSummaryLoad(true)
        const updatedData = students.map((student) => ({
          _id: student._id,
          nameOfStd: student.name, 
          ad: student.ad,
          class: student.class,
          status: status[student.ad] || student.status, 
          SL: student.SL,
          attendanceTime: student.attentenceTime,
          attendanceDate: student.attendanceDate ? (typeof student.attendanceDate === 'string' ? new Date(student.attendanceDate).toISOString() : new Date(student.attendanceDate).toISOString()) : new Date().toISOString(),
          academicYear: academicYear,
        }));

        await axios.patch(`${API_PORT}/set-attendance`,{updates:updatedData})

        const strength = students.length;
        const present = updatedData.filter((s) => s.status === "Present").length;
        const absent = strength - present;
        const percent = ((present / strength) * 100).toFixed(1);

        setSummary({ strength, present, absent, percent });
        setShowSummary(true);

        await axios.patch(`${API_PORT}/classes/by-number/${id}`, {
          totalStudents: strength,
          presentStudents: present,
          absentStudents: absent,
          percentage: percent,
        });

        const payload2 = students.map((student) => {
          // attendance record keys: ad, nameOfStd, SL, class, status, attendanceTime, attendanceDate
          const ad = student.ad ?? student.ADNO; // prefer attendance 'ad'
          const fullName = student.nameOfStd ?? student["FULL NAME"] ?? "";
          const shortName = student.nameOfStd ?? student["SHORT NAME"] ?? "";
        
          return {
            ADNO: Number(ad),                            // important: ADNO must match Number in DB
            "FULL NAME": fullName,
            "SHORT NAME": shortName,
            SL: student.SL ?? student.SL,
            CLASS: student.class ?? student.CLASS,
            Status: status[ad] ?? student.status ?? "Absent",
            Time: student.attentenceTime ?? student.Time ?? new Date().toLocaleTimeString(),
            Date: student.attendanceDate ? (typeof student.attendanceDate === 'string' ? student.attendanceDate.split('T')[0] : new Date(student.attendanceDate).toISOString().split('T')[0]) : new Date().toISOString().split("T")[0]
          };
        });
        
        // debug log (temporarily) — check payload in browser console
        console.log("students bulk payload:", payload2);
  
        await axios.patch(`${API_PORT}/students/bulk-update/students`,{updates:payload2})
        setSummaryLoad(false)
      }catch(err){
        console.log(err)
        setSummaryLoad(false)
      }
    }
    
  const handleOk = () => {
    setShowSummary(false);
    navigate.push("/edit-attendance-classes");
  };
  const [quickAction,setQuickAction] = useState("All Present")
  
    const handleQuickAction = () => {
      setQuickAction(prev => prev === "Previous" ? "All Present" : prev === "All Present" ? "All Absent" : "Previous");
      const updated = {};
      students.forEach((s) => (updated[s.ADNO] = quickAction === "Previous" ? s.Status : quickAction === "All Present" ? "Present" : "Absent"));
      setStatus(updated);
    }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto" style={{ marginTop: "4.5rem" }}>
      
      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-sky-100 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-black rounded-full uppercase tracking-wider">
              Class {id}
            </span>
            <span className="text-slate-900 font-black text-sm uppercase tracking-tight">
              {students[0]?.attendanceTime || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">
            {students[0]?.attendanceDate
              ? new Date(students[0].attendanceDate).toLocaleDateString("en-US", { dateStyle: "long" })
              : "N/A"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate.push(`/edit-attendance-classes`)}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Back"
          >
            <FaArrowLeft size={18} />
          </button>
          <button
            onClick={handleQuickAction}
            className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
              quickAction === "All Present" ? "bg-emerald-500 text-white shadow-emerald-500/10"
                : quickAction === "All Absent" ? "bg-rose-500 text-white shadow-rose-500/10"
                : "bg-sky-500 text-white shadow-sky-500/10"
            }`}
          >
            Mark {quickAction}
          </button>
        </div>
      </div>

      {load && <StudentsLoad />}

      {/* Table View */}
      {cards === "No" && !load && (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <form onSubmit={preSubmit}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Sl</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Ad</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                    <th className="px-4 sm:px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-28 sm:w-40">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.length > 0 ? (
                    students.map((student, index) => {
                      const currentStatus = status[student.ad] !== undefined ? status[student.ad] : student.status;
                      return (
                        <tr
                          key={index}
                          onClick={() => handleCheckboxChange(student.ad, currentStatus !== 'Present')}
                          className="group hover:bg-sky-50/50 cursor-pointer transition-colors"
                        >
                          <td className="hidden sm:table-cell px-6 py-4 text-sm font-medium text-slate-400">{student.SL}</td>
                          <td className="hidden sm:table-cell px-6 py-4 text-sm font-mono text-slate-500">{student.ad}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors leading-tight">
                                {student.nameOfStd || student["SHORT NAME"] || student["FULL NAME"] || student.name || "Unknown"}
                              </span>
                              <span className="text-[10px] sm:hidden font-mono text-slate-400 mt-0.5">
                                AD: {student.ad} {student.SL > 0 && `• SL: ${student.SL}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCheckboxChange(student.ad, currentStatus !== 'Present'); }}
                              className={`min-w-[80px] sm:min-w-[100px] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter shadow-sm transition-all duration-200 ${
                                currentStatus === 'Present'
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                                  : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'
                              }`}
                            >
                              {currentStatus}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-20 bg-slate-50">
                        <div className="flex flex-col items-center opacity-40">
                          <span className="text-4xl mb-4">🔍</span>
                          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No students found in Class {id}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-center">
              <button
                type="submit"
                className="btn-primary flex items-center gap-3 px-10 py-4 rounded-2xl shadow-2xl shadow-sky-500/30 text-base group"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards View */}
      {cards === "Cards" && !load && (
        <form onSubmit={preSubmit}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {students.length > 0 ? (
              students.map((student, index) => {
                const currentStatus = status[student.ad] || student.status;
                const isPresent = currentStatus === "Present";
                return (
                  <div
                    key={index}
                    onClick={() => handleCheckboxChange(student.ad, currentStatus !== 'Present')}
                    className={`relative p-5 rounded-3xl border-2 transition-all duration-300 active:scale-95 cursor-pointer ${
                      isPresent
                        ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/5'
                        : 'bg-rose-50 border-rose-200 shadow-lg shadow-rose-500/5'
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${
                        isPresent ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                      }`}>
                        {student.SL}
                      </div>
                    </div>
                    <h3 className={`text-sm font-bold truncate mb-1 ${isPresent ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {student.nameOfStd || student["SHORT NAME"] || student["FULL NAME"] || student.name || "Unknown"}
                    </h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 mb-3 ${isPresent ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Ad: {student.ad}
                    </p>
                    <div className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      isPresent ? 'bg-emerald-200/50 text-emerald-700' : 'bg-rose-200/50 text-rose-700'
                    }`}>
                      {isPresent ? "Present" : "Absent"}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="col-span-6 text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                No students found in Class {id}
              </p>
            )}
          </div>
          <div className="mt-10 flex justify-center pb-20">
            <button type="submit" className="btn-primary px-12 py-4 rounded-2xl shadow-2xl shadow-sky-500/30 text-base font-bold">
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Confirm Modal */}
      {confirmAttendance && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-1 text-center">Confirm Changes</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center mb-6">Review absent students below</p>

            {absentees.length > 0 ? (
              <div className="max-h-48 overflow-y-auto mb-6 space-y-1">
                {absentees.map((s) => (
                  <div key={s.ad} className="flex items-center gap-3 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="w-6 h-6 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-lg">{s.SL}</span>
                    <span className="text-sm font-bold text-rose-800">{s.nameOfStd}</span>
                    <span className="text-xs text-rose-400 font-mono ml-auto">{s.ad}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 mb-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-emerald-700 font-bold text-sm">Full attendance!</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setConfirmAttendance(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition text-sm">
                Cancel
              </button>
              <button onClick={handleCopyAbsentees} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition text-sm">
                {copy ? "✅ Copied" : "Copy"}
              </button>
              <button onClick={handleSubmit} className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition shadow-lg shadow-sky-500/20 text-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50">
          {summaryLoad ? (
            <div className="flex flex-col items-center gap-4 bg-white p-10 rounded-[2rem] shadow-2xl">
              <div className="w-14 h-14 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
              <p className="text-sky-600 font-bold tracking-wider uppercase text-sm">Saving…</p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Attendance Summary</h3>
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl">
                  <span className="text-sm font-bold text-slate-500">Strength</span>
                  <span className="text-lg font-black text-slate-800">{summary.strength}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 rounded-2xl">
                  <span className="text-sm font-bold text-emerald-600">Present</span>
                  <span className="text-lg font-black text-emerald-700">{summary.present}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-rose-50 rounded-2xl">
                  <span className="text-sm font-bold text-rose-600">Absent</span>
                  <span className="text-lg font-black text-rose-700">{summary.absent}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-sky-50 rounded-2xl">
                  <span className="text-sm font-bold text-sky-600">Presence</span>
                  <span className="text-lg font-black text-sky-700">{summary.percent}%</span>
                </div>
              </div>
              <button onClick={handleOk} className="w-full py-4 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition uppercase tracking-widest text-sm">
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EditAtt
