"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { TfiLayoutGrid3, TfiLayoutGrid2 } from "react-icons/tfi";
import { FaHome } from "react-icons/fa";
import StudentsLoad from "../load-UI/StudentsLoad";
import { Import } from "lucide-react";
import { API_PORT } from "../../Constants";
import CustomAlert from "../common/CustomAlert";

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

function Hajar() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [cards, setCards] = useState('No');
  const [summary, setSummary] = useState({});
  const { id } = useParams();
  const searchParams = useSearchParams();
  const navigate = useRouter();
  const [load, setLoad] = useState(false);
  const [dataLoad, setDataLoad] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isAlreadyTaken, setIsAlreadyTaken] = useState(false);

  const showAlert = (message, title = "Notice", type = "info") => {
    setAlertState({ isOpen: true, title, message, type });
  };
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "Night";
  const period = searchParams.get("period");
  const more = searchParams.get("more");

  //confirm attendance
  const [absentees, setAbsenties] = useState([]);
  const [confirmAttendance, setConfirmAttendance] = useState(false);

  //teacher data
  const [teacher, setTeacher] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [shortLeaveData, setShortLeaveData] = useState([]);
  const [leaveData, setLeaveData] = useState([]); // New state for medical leaves
  const [returnedStudents, setReturnedStudents] = useState([]); // Track students returned locally
  const [academicYear, setAcademicYear] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  useEffect(() => {
    axios.get(`${API_PORT}/settings`)
      .then(res => {
        if (res.data.academicYear) setAcademicYear(res.data.academicYear);
        if (res.data.academicYearId) setAcademicYearId(res.data.academicYearId);
      })
      .catch(err => console.error("Error fetching academic year:", err));
  }, []);

  useEffect(() => {
    setMounted(true);
    const storedTeacher = getSafeLocalStorage().getItem("teacher");
    if (storedTeacher) {
      try {
        setTeacher(JSON.parse(storedTeacher));
      } catch (e) {
        console.error("Failed to parse teacher from localStorage");
      }
    }
  }, []);

  const convertTimeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getRelativeDate = (dateInput) => {
    if (!dateInput) return '';
    try {
      const datePart = typeof dateInput === 'string' && dateInput.includes('T') 
        ? dateInput.split('T')[0] 
        : dateInput;
      
      const date = new Date(datePart);
      const today = new Date();
      
      const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const diffTime = d1 - d2;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === -1) return "Yesterday";
      if (diffDays === 1) return "Tomorrow";
      if (diffDays === 2) return "Day After";
      
      return d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return typeof dateInput === 'string' ? dateInput : '';
    }
  };

  // Get active short leave object
  const getStudentActiveShortLeave = (studentAdno) => {
    const today = date ? new Date(date) : new Date();
    const currentTime = convertTimeToMinutes(getCurrentTimeString());

    return shortLeaveData.find(leave => {
      // Check ADNO match
      if (Number(leave.ad) !== Number(studentAdno)) return false;

      // Check date match
      const leaveDate = new Date(leave.date);
      const isSameDate =
        leaveDate.getDate() === today.getDate() &&
        leaveDate.getMonth() === today.getMonth() &&
        leaveDate.getFullYear() === today.getFullYear();

      if (!isSameDate) return false;

      // Check time range
      const fromTime = convertTimeToMinutes(leave.fromTime);
      const toTime = convertTimeToMinutes(leave.toTime);

      return currentTime >= fromTime && currentTime <= toTime;
    });
  };

  // Check if student is currently on short leave
  const isStudentOnShortLeave = (studentAdno) => !!getStudentActiveShortLeave(studentAdno);

  // Get active medical leave object
  const getStudentActiveLeave = (studentAdno) => {
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = convertTimeToMinutes(getCurrentTimeString());

    return leaveData.find(leave => {
      // Check ADNO match (check both flattened 'ad' and populated 'studentId.ADNO')
      const leaveAdno = leave.ad || leave.studentId?.ADNO;
      if (Number(leaveAdno) !== Number(studentAdno)) return false;

      // Status must not be returned
      if (leave.status === 'returned') return false;

      // Date range check
      const fromDate = new Date(leave.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = leave.toDate ? new Date(leave.toDate) : null;
      if (toDate) toDate.setHours(0, 0, 0, 0);

      const fromTime = convertTimeToMinutes(leave.fromTime);
      const toTime = leave.toTime ? convertTimeToMinutes(leave.toTime) : null;

      const isStartDay = today.getTime() === fromDate.getTime();
      const isEndDay = toDate && today.getTime() === toDate.getTime();

      // If it's the start day, check if leave has already begun
      if (isStartDay) {
        if (currentTime < fromTime) return false;
        // If it's also the end day, check if it hasn't ended yet
        if (isEndDay && toTime !== null && currentTime > toTime) return false;
        return true;
      }

      // If it's an intermediate day or past the end day (Late)
      if (today > fromDate) {
        // If it's the end day today, check if it hasn't ended yet
        if (isEndDay && toTime !== null && currentTime > toTime) return false;
        
        // If it's past the end day, they are "Late", so they are still "On Leave"
        return true;
      }

      return false;
    });
  };

  // Check if student is on active leave (any reason)
  const isStudentOnActiveLeave = (studentAdno) => !!getStudentActiveLeave(studentAdno);

  // Alias for backward compatibility/typo fix
  const isStudentOnMedicalLeave = isStudentOnActiveLeave;

  // Get current time in HH:MM format
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    console.log(period);
    setDataLoad(true);

    //  axios.get(`${API_PORT}/class-excused-pass`),
    // Fetch short leave data first, then medical leaves, then students
    Promise.all([
      axios.get(`${API_PORT}/class-excused-pass`),
      axios.get(`${API_PORT}/leave`), // medical leaves
      axios.get(`${API_PORT}/students`) // remove trailing slash
    ])
      .then(([shortLeaveRes, leaveRes, studentsRes]) => {
        setShortLeaveData(shortLeaveRes.data);
        setLeaveData(leaveRes.data);
        console.log("Short leave data:", shortLeaveRes.data);
        console.log("Medical leave data:", leaveRes.data);

        const filtered = studentsRes.data
          .filter((student) => student.CLASS === Number(id))
          .sort((a, b) => a.SL - b.SL);

        const initialAttendance = {};

        // Set initial attendance based on short leave and medical leave status
        filtered.forEach((student) => {
          const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
          const isOnActiveLeave = isStudentOnActiveLeave(student.ADNO);
          const isOnLeave = student.onLeave || isOnShortLeave || isOnActiveLeave;

          console.log(`Student ${student.ADNO}:`, {
            onLeave: student.onLeave,
            shortLeave: isOnShortLeave,
            activeLeave: isOnActiveLeave,
            total: isOnLeave
          });

          if (isOnLeave) {
            initialAttendance[student.ADNO] = "Absent";
          } else {
            initialAttendance[student.ADNO] = "Present";
          }
        });

        setStudents(filtered);
        setAttendance(initialAttendance);
        setDataLoad(false);
      })
      .catch((err) => {
        console.error(err);
        setDataLoad(false);
      });
    const checkAttendanceTaken = async () => {
      try {
        const queryParams = {
          classNumber: id,
          date: date || new Date().toISOString().split('T')[0],
          time: time
        };
        if (period) queryParams.period = period;

        const res = await axios.get(`${API_PORT}/set-attendance`, { params: queryParams });
        if (res.data && res.data.length > 0) {
          setIsAlreadyTaken(true);
        } else {
          setIsAlreadyTaken(false);
        }
      } catch (err) {
        console.error("Error checking existing attendance:", err);
      }
    };

    checkAttendanceTaken();
  }, [id, period, date, time]);

  const handleCheckboxChange = (ad, isChecked) => {
    const student = students.find(s => s.ADNO === ad);
    const isOnShortLeave = isStudentOnShortLeave(ad);
    const isOnActiveLeave = isStudentOnActiveLeave(ad);
    const isOnLeave = student.onLeave || isOnShortLeave || isOnActiveLeave;

    // If student is on leave, don't allow changing status
    if (student && isOnLeave) {
      console.log("Student is on leave, cannot change status");
      return;
    } else {
      setAttendance((prev) => ({
        ...prev,
        [ad]: isChecked ? "Present" : "Absent",
      }));
    }
  };

  const preSumbit = (e) => {
    e.preventDefault();
    const absentiesList = students.filter((s) => {
      const isOnShortLeave = isStudentOnShortLeave(s.ADNO);
      const isOnActiveLeave = isStudentOnActiveLeave(s.ADNO);
      const isReturned = returnedStudents.includes(s.ADNO);
      const isOnLeave = (s.onLeave || isOnShortLeave || isOnActiveLeave) && !isReturned;
      // Students are absent if they're marked absent OR on leave (and not returned)
      return attendance[s.ADNO] !== "Present" || isOnLeave;
    });

    setAbsenties(absentiesList);
    setConfirmAttendance(true);
  };

  const handleSubmit = async () => {
    setConfirmAttendance(false);
    setLoad(true);

    // Save Return Data for Medical Leaves
    try {
      if (returnedStudents.length > 0) {
        await Promise.all(returnedStudents.map(async (ad) => {
          const findStd = getStudentActiveLeave(ad);
          if (findStd) {
            await axios.put(`${API_PORT}/leave/${findStd._id}`, { status: 'returned', markReturnedTeacher: teacher?.name || 'Unknown' });
            await axios.put(`${API_PORT}/students/${ad}`, { onLeave: false });
          }
        }));
      }
    } catch (err) {
      console.error("Error updating return status:", err);
    }

    if (!teacher?.id && !teacher?._id) {
      setLoad(false);
      showAlert("Your session is missing teacher details. Please Logout and Login again to continue.", "Update Failed", "error");
      return;
    }

    const payload = students.map((student) => {
      const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
      const isOnActiveLeave = isStudentOnActiveLeave(student.ADNO);
      const isReturned = returnedStudents.includes(student.ADNO);
      const isOnLeave = (student.onLeave || isOnShortLeave || isOnActiveLeave) && !isReturned;
      const status = isOnLeave ? "Absent" : (attendance[student.ADNO] || "Absent");

      return {
        studentId: student._id,
        teacherId: teacher?.id || teacher?._id,
        classNumber: Number(id),
        ...(academicYearId && { academicYearId }),
        status: status,
        attendanceTime: time,
        attendanceDate: new Date(),
        onLeave: isOnLeave,
        ...(period && { period: Number(period) }),
        ...(more && { custom: more })
      };
    });

    try {
      await axios.post(`${API_PORT}/set-attendance`, payload);

      // calculate summary
      const strength = students.length;
      const present = Object.values(attendance).filter(
        (s) => s === "Present"
      ).length;
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
        const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
        const isOnActiveLeave = isStudentOnActiveLeave(student.ADNO);
        const isReturned = returnedStudents.includes(student.ADNO);
        const isOnLeave = (student.onLeave || isOnShortLeave || isOnActiveLeave) && !isReturned;
        const status = isOnLeave ? "Absent" : (attendance[student.ADNO] || "Absent");

        return {
          _id: student._id,
          SL: student.SL,
          ADNO: student.ADNO,
          ["FULL NAME"]: student["FULL NAME"],
          ["SHORT NAME"]: student["SHORT NAME"],
          CLASS: student.CLASS,
          Status: status,
          Time: time,
          Date: date || new Date().toISOString().split('T')[0],
        };
      });

      await axios.patch(`${API_PORT}/students/bulk-update/students`, { updates: payload2 });
      setLoad(false);
    } catch (err) {
      console.error(err);
      setLoad(false);
      showAlert("There was an error submitting attendance. " + err.message, "Update Failed", "error");
    }
  };

  const handleOk = () => {
    setShowSummary(false);
    navigate.push(`/api-recall/${time}`);
  };

  const [copy, setCopy] = useState(false);

  const handleCopyAbsentees = () => {
    const attendanceDate = date ? new Date(date).toLocaleDateString("en-US", { dateStyle: "long" }) : new Date().toLocaleDateString("en-US", { dateStyle: "long" });
    const attendanceTime = `${time}${period ? ` (P${period})` : ""}${more ? ` - ${more}` : ""}`;
    const headText = `Class ${id} Attendance\n${attendanceDate} | ${attendanceTime}\n\n`;

    if (absentees.length > 0) {
      // Separate regular absentees, short leave, medical leave, and on-leave students
      const regularAbsentees = absentees.filter(s => {
        const isOnShortLeave = isStudentOnShortLeave(s.ADNO);
        const isOnMedicalLeave = isStudentOnMedicalLeave(s.ADNO);
        return !s.onLeave && !isOnShortLeave && !isOnMedicalLeave;
      });

      const shortLeaveStudents = absentees.filter(s =>
        isStudentOnShortLeave(s.ADNO) && !s.onLeave && !isStudentOnMedicalLeave(s.ADNO)
      );

      const medicalLeaveStudents = absentees.filter(s =>
        isStudentOnActiveLeave(s.ADNO) && !s.onLeave && !isStudentOnShortLeave(s.ADNO)
      );

      const onLeaveStudents = absentees.filter(s =>
        s.onLeave && !isStudentOnShortLeave(s.ADNO) && !isStudentOnMedicalLeave(s.ADNO)
      );

      let text = "";

      // Add regular absentees
      if (regularAbsentees.length > 0) {
        text += "Absent:\n" + regularAbsentees
          .map((s) => `${s["SHORT NAME"]} (AdNo: ${s.ADNO})`)
          .join("\n");
      }

      // Add short leave students
      if (shortLeaveStudents.length > 0) {
        if (text) text += "\n\n";
        text += "Class excused pass:\n" + shortLeaveStudents
          .map((s) => `${s["SHORT NAME"]} (AdNo: ${s.ADNO})`)
          .join("\n");
      }

      // Add medical leave students
      if (medicalLeaveStudents.length > 0) {
        if (text) text += "\n\n";
        text += "Medical Leave:\n" + medicalLeaveStudents
          .map((s) => `${s["SHORT NAME"]} (AdNo: ${s.ADNO})`)
          .join("\n");
      }

      // Add on-leave students
      if (onLeaveStudents.length > 0) {
        if (text) text += "\n\n";
        text += "On Leave:\n" + onLeaveStudents
          .map((s) => `${s["SHORT NAME"]} (AdNo: ${s.ADNO})`)
          .join("\n");
      }

      navigator.clipboard.writeText(headText + text)
        .then(() => {
          setCopy(true);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    } else {
      navigator.clipboard.writeText(headText + "No absentees 🎉");
      setCopy(true);
    }
    setTimeout(() => {
      setCopy(false);
    }, 4000);
  };

  const [quickAction, setQuickAction] = useState("All Absent");

  const handleQuickAction = () => {
    setQuickAction(prev => prev === "Previous" ? "All Present" : prev === "All Present" ? "All Absent" : "Previous");
    const updated = {};
    students.forEach((s) => (updated[s.ADNO] = quickAction === "Previous" ? s.Status : quickAction === "All Present" ? "Present" : "Absent"));
    setAttendance(updated);
  };

  // Return Confirmation Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnStudent, setSelectedReturnStudent] = useState(null);

  const openReturnModal = (student) => {
    setSelectedReturnStudent(student);
    setShowReturnModal(true);
  };

  const confirmReturn = async () => {
    if (!selectedReturnStudent) return;
    const ad = selectedReturnStudent.ADNO;

    // Locally mark as returned
    setReturnedStudents(prev => [...prev, ad]);
    setAttendance((prev) => ({
      ...prev,
      [ad]: "Present",
    }));
    setShowReturnModal(false);
    setSelectedReturnStudent(null);
  };

  return (
    <div className="p-4 sm:p-8 mt-12 max-w-7xl mx-auto">
      <div className="mb-8 space-y-4">
        {/* Progress & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 bg-white p-6 rounded-3xl shadow-sm border border-sky-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                Class {id}
              </span>
              <span className="text-slate-900 font-black text-sm uppercase tracking-tight">
                {time || "N/A"} {period && `• P${period}`} {more && `• ${more}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">
              {date ? new Date(date).toLocaleDateString("en-US", { dateStyle: "long" }) : "N/A"}
            </div>
            {isAlreadyTaken && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl animate-in slide-in-from-top-2 duration-500">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  Attendance already taken for this session
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
               onClick={() => navigate.push('/')}
               className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-colors"
               title="Home"
            >
              <FaHome size={18} />
            </button>
            <button
              onClick={handleQuickAction}
              className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                quickAction === "All Present" ? "bg-emerald-500 text-white shadow-emerald-500/10" :
                quickAction === "All Absent" ? "bg-rose-500 text-white shadow-rose-500/10" :
                "bg-sky-500 text-white shadow-sky-500/10"
              }`}
            >
              Mark {quickAction}
            </button>
          </div>
        </div>
      </div>

      {dataLoad && <StudentsLoad />}

      {cards === "No" && !dataLoad && (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <form onSubmit={(e) => { e.preventDefault(); preSumbit(); }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-16">Sl</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-24">Ad</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Student Info</th>
                    <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest w-28 sm:w-40">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.length > 0 ? (
                    students.map((student, index) => {
                      const currentStatus = attendance[student.ADNO] !== undefined ? attendance[student.ADNO] : student.Status;
                      const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
                      const isOnActiveLeave = isStudentOnActiveLeave(student.ADNO);
                      const isReturned = returnedStudents.includes(student.ADNO);
                      const isOnLeave = (student.onLeave || isOnShortLeave || isOnActiveLeave);
                      const displayOnLeave = isOnLeave && !isReturned;

                      let leaveType = "";
                      if (displayOnLeave) {
                        if (student.onLeave) leaveType = "Leave";
                        else if (isOnShortLeave) leaveType = "CEP";
                        else if (isOnActiveLeave) leaveType = "Leave";
                      }

                      return (
                        <tr
                          key={index}
                          onClick={() => {
                            if (!displayOnLeave) {
                              handleCheckboxChange(student.ADNO, currentStatus !== "Present");
                            }
                          }}
                          className={`group transition-colors ${displayOnLeave ? "bg-amber-50/30 cursor-not-allowed" : "hover:bg-sky-50/50 cursor-pointer"}`}
                        >
                          <td className="hidden sm:table-cell px-6 py-4 text-sm font-medium text-slate-400">{student.SL}</td>
                          <td className="hidden sm:table-cell px-6 py-4 text-sm font-mono text-slate-500">{student.ADNO}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex flex-col">
                              <span className={`font-bold transition-colors leading-tight ${displayOnLeave ? "text-slate-400" : "text-slate-900 group-hover:text-sky-700"}`}>
                                {student["SHORT NAME"] || student["FULL NAME"] || student.name || "Unknown"}
                              </span>
                              <span className="text-[10px] sm:hidden font-mono text-slate-400 mt-0.5">
                                AD: {student.ADNO} {student.SL > 0 && `• SL: ${student.SL}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                              <button
                                type="button"
                                disabled={displayOnLeave}
                                className={`min-w-[80px] sm:min-w-[100px] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter shadow-sm transition-all duration-200 ${
                                  displayOnLeave 
                                    ? "bg-amber-100 text-amber-600 border border-amber-200"
                                    : currentStatus === "Present"
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                                      : "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20"
                                }`}
                              >
                                {displayOnLeave ? leaveType : currentStatus}
                              </button>
                              {isOnLeave && (
                                <button 
                                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl text-white transition-all hover:scale-110 shadow-sm ${isReturned ? "bg-emerald-600" : "bg-sky-500"}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isReturned) {
                                      setReturnedStudents(prev => prev.filter(id => id !== student.ADNO));
                                      setAttendance(prev => ({ ...prev, [student.ADNO]: "Absent" }));
                                    } else {
                                      openReturnModal(student);
                                    }
                                  }}
                                >
                                  <span className="text-[10px] sm:text-xs font-bold">{isReturned ? "↩" : "R"}</span>
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
                        <div className="flex flex-col items-center">
                          <span className="text-4xl mb-4">🔍</span>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students found in Class {id}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 p-8 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={preSumbit}
                disabled={load}
                className="btn-primary flex items-center gap-3 px-12 py-4 rounded-2xl shadow-2xl shadow-sky-500/30 text-lg group"
              >
                {load ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{load ? "Processing..." : "Submit Attendance"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {cards === "Cards" && !dataLoad && (
        <div className="space-y-8">
          <form onSubmit={(e) => { e.preventDefault(); preSumbit(); }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {students.map((student, index) => {
                const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
                const isOnActiveLeave = isStudentOnActiveLeave(student.ADNO);
                const isReturned = returnedStudents.includes(student.ADNO);
                const isOnLeave = (student.onLeave || isOnShortLeave || isOnActiveLeave);
                const displayOnLeave = isOnLeave && !isReturned;
                const isPresent = attendance[student.ADNO] === "Present" && !displayOnLeave;

                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (!displayOnLeave) {
                        handleCheckboxChange(student.ADNO, !isPresent);
                      }
                    }}
                    className={`relative p-5 rounded-3xl border-2 transition-all duration-300 transform active:scale-95 cursor-pointer ${
                      displayOnLeave 
                        ? 'bg-amber-50 border-amber-200 grayscale-[0.3]' 
                        : isPresent 
                          ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/5' 
                          : 'bg-rose-50 border-rose-200 shadow-lg shadow-rose-500/5'
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors shadow-lg ${
                        displayOnLeave ? 'bg-amber-400 text-white' : 
                        isPresent ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                        'bg-rose-500 text-white shadow-rose-500/20'
                      }`}>
                        {student.SL}
                      </div>
                    </div>

                    <h3 className={`text-sm font-bold truncate mb-1 ${displayOnLeave ? 'text-amber-800' : isPresent ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {student["SHORT NAME"] || student["FULL NAME"] || student.name || "Unknown"}
                    </h3>
                    <p className={`text-[10px] uppercase font-black tracking-widest opacity-60 mb-4 ${displayOnLeave ? 'text-amber-700' : isPresent ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Ad: {student.ADNO}
                    </p>

                    <div className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      displayOnLeave ? 'bg-amber-200/50 text-amber-700' : 
                      isPresent ? 'bg-emerald-200/50 text-emerald-700' : 
                      'bg-rose-200/50 text-rose-700'
                    }`}>
                      {displayOnLeave ? "On Leave" : isPresent ? "Present" : "Absent"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex justify-center pb-20">
              <button 
                type="submit"
                className="btn-primary px-12 py-4 rounded-2xl shadow-2xl shadow-sky-500/30 text-xl font-bold transition-all"
              >
                Complete Recording
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmAttendance && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          
          <div className="relative bg-white w-full max-w-sm sm:max-w-md rounded-[2.5rem] shadow-2xl border border-white p-8">
            <div className="text-center mb-6">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Attention Required</h3>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirm Submission</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">The following {absentees.length} students are absent</p>
            </div>

            {absentees.length > 0 ? (
              <div className="max-h-60 overflow-y-auto mb-6 no-scrollbar rounded-3xl bg-rose-50 border border-rose-100 p-4">
                <div className="space-y-3">
                  {absentees.map((s) => (
                    <div key={s.ADNO} className="flex flex-col border-b border-rose-100 last:border-0 pb-2 last:pb-0">
                      <span className="text-sm font-black text-rose-600">{s["SHORT NAME"] || s["FULL NAME"] || s.name || "Unknown"}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">AD: {s.ADNO}</span>
                        {s.SL > 0 && <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">• SL: {s.SL}</span>}
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

      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white p-8 overflow-hidden">
            {load ? (
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
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Record Saved</h2>
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

      {/* Return Confirmation Modal */}
      {showReturnModal && selectedReturnStudent && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
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
                Mark <span className="text-sky-600">{selectedReturnStudent["SHORT NAME"]}</span> as returned from leave?
              </p>
            </div>

            {/* Minimal Details Section */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 space-y-4">
              {(() => {
                const ad = selectedReturnStudent.ADNO;
                const medical = getStudentActiveLeave(ad);
                const cep = getStudentActiveShortLeave(ad);

                if (medical) {
                  return (
                    <>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                        <span className="text-[9px] font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-widest">Medical Leave</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</span>
                        <span className="text-[10px] font-bold text-slate-700 uppercase">{medical.reason || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-700 font-mono italic">{getRelativeDate(medical.fromDate) || "N/A"}</span>
                          <span className="text-[10px] font-bold text-slate-700 font-mono">{medical.fromTime || "N/A"}</span>
                        </div>
                      </div>
                      {(medical.toDate || medical.toTime) && (
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Until</span>
                          <div className="flex flex-col items-end text-rose-500">
                            {medical.toDate && <span className="text-[10px] font-bold font-mono italic">{getRelativeDate(medical.toDate)}</span>}
                            {medical.toTime && <span className="text-[10px] font-bold font-mono">{medical.toTime}</span>}
                          </div>
                        </div>
                      )}
                    </>
                  );
                } else if (cep) {
                  return (
                    <>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                        <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-widest">CEP (Short Pass)</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</span>
                        <span className="text-[10px] font-bold text-slate-700 uppercase">{cep.reason || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                        <span className="text-[10px] font-bold text-slate-700 font-mono italic uppercase">{getRelativeDate(cep.date) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                        <span className="text-[10px] font-bold text-emerald-600 font-mono">{cep.fromTime} — {cep.toTime}</span>
                      </div>
                    </>
                  );
                } else {
                  return <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">No active leave data found</div>;
                }
              })()}
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
      <CustomAlert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
      />
    </div>
  );
}

export default Hajar;
