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
    const [shortLeaveData, setShortLeaveData] = useState([]);
    const [leaveData, setLeaveData] = useState([]);
    const [returnedStudents, setReturnedStudents] = useState([]);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedReturnStudent, setSelectedReturnStudent] = useState(null);
    const [teacher, setTeacher] = useState(null);

    useEffect(() => {
        const storedTeacher = localStorage.getItem("teacher");
        if (storedTeacher) {
          try {
            setTeacher(JSON.parse(storedTeacher));
          } catch (e) {
            console.error("Failed to parse teacher");
          }
        }
    }, []);

    const convertTimeToMinutes = (timeString) => {
      if (!timeString) return 0;
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const getCurrentTimeString = () => {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };

    const isStudentOnShortLeave = (studentAdno) => {
      const today = students[0]?.attendanceDate ? new Date(students[0].attendanceDate) : new Date();
      const currentTime = convertTimeToMinutes(getCurrentTimeString());

      return shortLeaveData.some(leave => {
        if (leave.ad !== studentAdno) return false;
        const leaveDate = new Date(leave.date);
        const isSameDate =
          leaveDate.getDate() === today.getDate() &&
          leaveDate.getMonth() === today.getMonth() &&
          leaveDate.getFullYear() === today.getFullYear();

        if (!isSameDate) return false;
        const fromTime = convertTimeToMinutes(leave.fromTime);
        const toTime = convertTimeToMinutes(leave.toTime);
        return currentTime >= fromTime && currentTime <= toTime;
      });
    };

    const isStudentOnMedicalLeave = (studentAdno) => {
      const today = students[0]?.attendanceDate ? new Date(students[0].attendanceDate) : new Date();
      const currentTime = convertTimeToMinutes(getCurrentTimeString());

      return leaveData.some(leave => {
        if (leave.ad !== studentAdno) return false;
        const isMedicalLeave = leave.reason === 'Medical' || leave.reason === 'Medical (Home)' || leave.reason === 'Medical (Room)';
        if (!isMedicalLeave) return false;
        const fromDate = new Date(leave.fromDate);
        const toDate = leave.toDate ? new Date(leave.toDate) : null;
        const isInDateRange = today >= fromDate && (toDate === null || today <= toDate);
        if (!isInDateRange) return false;
        if (leave.status === 'returned') return false;
        const fromTime = convertTimeToMinutes(leave.fromTime);
        if (!leave.toTime) return currentTime >= fromTime;
        const toTime = convertTimeToMinutes(leave.toTime);
        return currentTime >= fromTime && currentTime <= toTime;
      });
    };

    const openReturnModal = (student) => {
      setSelectedReturnStudent(student);
      setShowReturnModal(true);
    };

    const confirmReturn = () => {
      if (!selectedReturnStudent) return;
      const ad = selectedReturnStudent.studentId?.ADNO || selectedReturnStudent.ad;
      setReturnedStudents(prev => [...prev, ad]);
      setStatus(prev => ({ ...prev, [ad]: "Present" }));
      setShowReturnModal(false);
      setSelectedReturnStudent(null);
    };

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
      setLoad(true);
      Promise.all([
        axios.get(`${API_PORT}/class-excused-pass`),
        axios.get(`${API_PORT}/leave`),
        axios.get(`${API_PORT}/set-attendance`)
      ]).then(([shortLeaveRes, leaveRes, attendanceRes]) => {
        setShortLeaveData(shortLeaveRes.data);
        setLeaveData(leaveRes.data);
        
        const filteredData = attendanceRes.data.filter(
          (student) => String(student.classNumber || student.class) === String(id)
        );
    
        if (filteredData.length > 0) {
          const latestByStudent = {};
          filteredData.forEach((s) => {
            const studentAd = s.studentId?.ADNO || s.ad;
            if (!studentAd) return;
            const existing = latestByStudent[studentAd];
            const existingDate = existing?.attendanceDate ? new Date(existing.attendanceDate) : null;
            const currentDate = s.attendanceDate ? new Date(s.attendanceDate) : null;
            if (!existing || (currentDate && existingDate && currentDate > existingDate)) {
              latestByStudent[studentAd] = s;
            }
          });
    
          const latestData = Object.values(latestByStudent).sort(
            (a, b) => (a.studentId?.SL || a.SL) - (b.studentId?.SL || b.SL)
          );
          
          setStudents(latestData);
          const initialStatus = {};
          latestData.forEach((s) => {
            const ad = s.studentId?.ADNO || s.ad;
            initialStatus[ad] = s.status;
          });
          setStatus(initialStatus);
        } else {
          setStudents([]);
        }
        setLoad(false);
      }).catch((err) => {
        setErr(err.message);
        setLoad(false);
      });
    }, [id]);
    
    

    const handleCheckboxChange = (ad, isChecked) => {
      setStatus((prev) => ({
        ...prev,
        [ad]: isChecked ? "Present" : "Absent",
      }));
    };

  const preSubmit = (e) => {
    if (e) e.preventDefault();
    const absentList = students.filter((s) => {
      const ad = s.studentId?.ADNO || s.ad;
      const isReturned = returnedStudents.includes(ad);
      const isOnLeave = (isStudentOnShortLeave(ad) || isStudentOnMedicalLeave(ad)) && !isReturned;
      return (status[ad] ?? s.status) !== "Present" || isOnLeave;
    });
    setAbsentees(absentList);
    setConfirmAttendance(true);
  };
  
  const handleCopyAbsentees = () => {
    const attendanceDate = students[0]?.attendanceDate ? new Date(students[0].attendanceDate).toLocaleDateString("en-US", { dateStyle: "long" }) : "N/A";
    const attendanceTime = students[0]?.attendanceTime || students[0]?.attentenceTime || "N/A";
    const headText = `Class ${id} Attendance\n${attendanceDate} | ${attendanceTime}\n\n`;

    if (absentees.length > 0) {
      const text = absentees
        .map((s) => `${s.studentId?.['SHORT NAME'] || s.studentId?.['FULL NAME'] || s.nameOfStd || s.name} (AdNo: ${s.studentId?.ADNO || s.ad})`)
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
        setSummaryLoad(true);
        
        // Save Return Data for Medical Leaves
        if (returnedStudents.length > 0) {
          await Promise.all(returnedStudents.map(async (ad) => {
            const findStd = leaveData.find(leave => leave.ad === ad && leave.status !== 'returned');
            if (findStd) {
              await axios.put(`${API_PORT}/leave/${findStd._id}`, { 
                status: 'returned', 
                markReturnedTeacher: teacher?.name || 'Unknown' 
              });
              await axios.put(`${API_PORT}/students/${ad}`, { onLeave: false });
            }
          }));
        }

        const updatedData = students.map((student) => {
          const ad = student.studentId?.ADNO || student.ad;
          const isReturned = returnedStudents.includes(ad);
          const isOnLeave = (isStudentOnShortLeave(ad) || isStudentOnMedicalLeave(ad)) && !isReturned;
          const finalStatus = isOnLeave ? "Absent" : (status[ad] || student.status);

          return {
            _id: student._id,
            nameOfStd: student.studentId?.['SHORT NAME'] || student.name || student.nameOfStd, 
            ad: ad,
            class: student.class,
            status: finalStatus, 
            SL: student.studentId?.SL || student.SL,
            attendanceTime: student.attentenceTime || student.attendanceTime,
            onLeave: isOnLeave
          };
        });

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

        const payload2 = updatedData.map((s) => ({
          _id: s._id,
          Status: s.status,
          Time: s.attendanceTime,
          Date: students[0]?.attendanceDate ? (typeof students[0].attendanceDate === 'string' ? students[0].attendanceDate.split('T')[0] : new Date(students[0].attendanceDate).toISOString().split('T')[0]) : new Date().toISOString().split("T")[0]
        }));
  
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
      students.forEach((s) => (updated[s.ad] = quickAction === "Previous" ? s.status : quickAction === "All Present" ? "Present" : "Absent"));
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
                      const ad = student.studentId?.ADNO || student.ad;
                      const currentStatus = status[ad] !== undefined ? status[ad] : student.status;
                      const isOnShortLeave = isStudentOnShortLeave(ad);
                      const isOnMedicalLeave = isStudentOnMedicalLeave(ad);
                      const isReturned = returnedStudents.includes(ad);
                      const isOnLeave = (isOnShortLeave || isOnMedicalLeave);
                      const displayOnLeave = isOnLeave && !isReturned;

                      let leaveType = "";
                      if (displayOnLeave) {
                        if (isOnShortLeave) leaveType = "CEP";
                        else if (isOnMedicalLeave) leaveType = "Medical";
                        else leaveType = "Leave";
                      }

                      return (
                        <tr
                          key={index}
                          onClick={() => {
                            if (!displayOnLeave) {
                              handleCheckboxChange(ad, currentStatus !== 'Present');
                            }
                          }}
                          className={`group transition-colors ${displayOnLeave ? "bg-amber-50/30 cursor-not-allowed" : "hover:bg-sky-50/50 cursor-pointer"}`}
                        >
                          <td className="hidden sm:table-cell px-6 py-4 text-sm font-medium text-slate-400">{student.studentId?.SL || student.SL}</td>
                          <td className="hidden sm:table-cell px-6 py-4 text-sm font-mono text-slate-500">{ad}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex flex-col">
                              <span className={`font-bold transition-colors leading-tight ${displayOnLeave ? "text-slate-400" : "text-slate-900 group-hover:text-sky-700"}`}>
                                {student.studentId?.['SHORT NAME'] || student.studentId?.['FULL NAME'] || student.name || student.nameOfStd || "Unknown"}
                              </span>
                              <span className="text-[10px] sm:hidden font-mono text-slate-400 mt-0.5">
                                AD: {ad} {(student.studentId?.SL || student.SL) > 0 && `• SL: ${student.studentId?.SL || student.SL}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                disabled={displayOnLeave}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (!displayOnLeave) handleCheckboxChange(ad, currentStatus !== 'Present'); 
                                }}
                                className={`min-w-[80px] sm:min-w-[100px] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter shadow-sm transition-all duration-200 ${
                                  displayOnLeave 
                                    ? "bg-amber-100 text-amber-600 border border-amber-200"
                                    : currentStatus === 'Present'
                                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                                      : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'
                                }`}
                              >
                                {displayOnLeave ? leaveType : currentStatus}
                              </button>
                              {isOnLeave && (
                                <button 
                                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-white transition-all hover:scale-110 shadow-sm ${isReturned ? "bg-emerald-600" : "bg-sky-500"}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isReturned) {
                                      setReturnedStudents(prev => prev.filter(id => id !== ad));
                                      setStatus(prev => ({ ...prev, [ad]: "Absent" }));
                                    } else {
                                      openReturnModal(student);
                                    }
                                  }}
                                >
                                  <span className="text-[10px] font-bold">{isReturned ? "↩" : "R"}</span>
                                </button>
                              )}
                            </div>
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
                const ad = student.studentId?.ADNO || student.ad;
                const isOnShortLeave = isStudentOnShortLeave(ad);
                const isOnMedicalLeave = isStudentOnMedicalLeave(ad);
                const isReturned = returnedStudents.includes(ad);
                const isOnLeave = (isOnShortLeave || isOnMedicalLeave);
                const displayOnLeave = isOnLeave && !isReturned;
                const currentStatus = status[ad] || student.status;
                const isPresent = currentStatus === "Present" && !displayOnLeave;
                
                return (
                   <div
                    key={index}
                    onClick={() => {
                      if (!displayOnLeave) {
                        handleCheckboxChange(ad, !isPresent);
                      }
                    }}
                    className={`relative p-5 rounded-3xl border-2 transition-all duration-300 active:scale-95 cursor-pointer ${
                      displayOnLeave 
                        ? 'bg-amber-50 border-amber-200 shadow-lg shadow-amber-500/5' 
                        : isPresent
                          ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/5'
                          : 'bg-rose-50 border-rose-200 shadow-lg shadow-rose-500/5'
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${
                        displayOnLeave ? 'bg-amber-400 text-white' : 
                        isPresent ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                      }`}>
                        {student.studentId?.SL || student.SL}
                      </div>
                    </div>
                    <h3 className={`text-sm font-bold truncate mb-1 ${displayOnLeave ? 'text-amber-800' : isPresent ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {student.studentId?.['SHORT NAME'] || student.studentId?.['FULL NAME'] || student.name || student.nameOfStd || "Unknown"}
                    </h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 mb-3 ${displayOnLeave ? 'text-amber-700' : isPresent ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Ad: {ad}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-center ${
                        displayOnLeave ? 'bg-amber-200/50 text-amber-700' : 
                        isPresent ? 'bg-emerald-200/50 text-emerald-700' : 'bg-rose-200/50 text-rose-700'
                      }`}>
                        {displayOnLeave ? "Leave" : isPresent ? "Present" : "Absent"}
                      </div>
                      {isOnLeave && (
                        <button 
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-white transition-all hover:scale-110 shadow-sm ${isReturned ? "bg-emerald-600" : "bg-sky-500"}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isReturned) {
                              setReturnedStudents(prev => prev.filter(id => id !== ad));
                              setStatus(prev => ({ ...prev, [ad]: "Absent" }));
                            } else {
                              openReturnModal(student);
                            }
                          }}
                        >
                          <span className="text-[10px] font-bold">{isReturned ? "↩" : "R"}</span>
                        </button>
                      )}
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

      {/* Return Confirmation Modal */}
      {showReturnModal && selectedReturnStudent && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white p-8">
            <button 
              onClick={() => setShowReturnModal(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Status Update</h3>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Return</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase px-4 leading-relaxed">
                Mark <span className="text-sky-600">
                  {selectedReturnStudent.studentId?.['SHORT NAME'] || selectedReturnStudent.name || selectedReturnStudent.nameOfStd}
                </span> as returned?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="col-span-1 py-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all font-mono"
              >
                Cancel
              </button>
              <button
                onClick={confirmReturn}
                className="col-span-1 py-4 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAttendance && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          
          <div className="relative bg-white w-full max-w-sm sm:max-w-md rounded-[2.5rem] shadow-2xl border border-white p-8 overflow-hidden">
            <div className="text-center mb-6">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Attention Required</h3>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Submission</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">The following {absentees.length} students are absent</p>
            </div>

            {absentees.length > 0 ? (
              <div className="max-h-60 overflow-y-auto mb-6 no-scrollbar rounded-3xl bg-rose-50 border border-rose-100 p-4">
                <div className="space-y-3">
                  {absentees.map((s) => (
                    <div key={s.studentId?.ADNO || s.ad} className="flex flex-col border-b border-rose-100 last:border-0 pb-2 last:pb-0">
                      <span className="text-sm font-black text-rose-600">
                        {s.studentId?.['SHORT NAME'] || s.studentId?.['FULL NAME'] || s.nameOfStd || s.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">AD: {s.studentId?.ADNO || s.ad}</span>
                        {(s.studentId?.SL || s.SL) > 0 && <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">• SL: {s.studentId?.SL || s.SL}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-emerald-50 rounded-3xl border border-emerald-100 mb-6">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">No absentees found</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmAttendance(false)}
                className="col-span-1 py-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyAbsentees}
                className="col-span-1 py-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
              >
                {copy ? "Copied" : "Copy List"}
              </button>
              <button
                onClick={handleSubmit}
                className="col-span-2 py-4 bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-500/20 hover:bg-sky-600 transition-all active:scale-[0.98]"
              >
                Confirm Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white p-8 overflow-hidden">
            {summaryLoad ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Saving Attendance</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Please wait a moment...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center space-y-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Summary</h3>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Changes Saved</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</span>
                    <span className="text-xl font-black text-slate-800">{summary.strength}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Present</span>
                    <span className="text-xl font-black text-emerald-600">{summary.present}</span>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100 flex flex-col items-center text-center">
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Absent</span>
                    <span className="text-xl font-black text-rose-600">{summary.absent}</span>
                  </div>
                  <div className="bg-sky-50 p-4 rounded-3xl border border-sky-100 flex flex-col items-center text-center">
                    <span className="text-[8px] font-black text-sky-500 uppercase tracking-widest mb-1">Ratio</span>
                    <span className="text-xl font-black text-sky-600 font-mono tracking-tighter">{summary.percent}%</span>
                  </div>
                </div>

                <button
                  onClick={handleOk}
                  className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Confirm & Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EditAtt
