import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { TfiLayoutGrid3, TfiLayoutGrid2 } from "react-icons/tfi";
import { FaHome } from "react-icons/fa";
import StudentsLoad from "../load-UI/StudentsLoad";
import { Import } from "lucide-react";
import { API_PORT } from "../../Constants";

function Hajar() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [cards, setCards] = useState('No');
  const [summary, setSummary] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [dataLoad, setDataLoad] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const date = queryParams.get("date") || "";
  const time = queryParams.get("time") || "Night";
  const period = queryParams.get("period");
  const more = queryParams.get("more");

  //confirm attendance
  const [absentees, setAbsenties] = useState([]);
  const [confirmAttendance, setConfirmAttendance] = useState(false);

  //teacher data
  const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) : 'Teacher Panel';

  const [shortLeaveData, setShortLeaveData] = useState([]);
  const [leaveData, setLeaveData] = useState([]); // New state for medical leaves
  const [returnedStudents, setReturnedStudents] = useState([]); // Track students returned locally

  const convertTimeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if student is currently on short leave
  const isStudentOnShortLeave = (studentAdno) => {
    const today = date ? new Date(date) : new Date();
    const currentTime = convertTimeToMinutes(getCurrentTimeString());

    return shortLeaveData.some(leave => {
      // Check ADNO match
      if (leave.ad !== studentAdno) return false;

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

  // Check if student is on medical leave (medical room or medical without end date)
  const isStudentOnMedicalLeave = (studentAdno) => {
    const today = date ? new Date(date) : new Date();
    const currentTime = convertTimeToMinutes(getCurrentTimeString());

    return leaveData.some(leave => {
      // Check ADNO match and leave type
      if (leave.ad !== studentAdno) return false;

      // Check if it's a medical leave (room or without end date)
      const isMedicalLeave = leave.reason === 'Medical' || leave.reason === 'Medical (Room)';
      if (!isMedicalLeave) return false;

      // Check date range
      const fromDate = new Date(leave.fromDate);
      const toDate = leave.toDate ? new Date(leave.toDate) : null;
      const isInDateRange = today >= fromDate && (toDate === null || today <= toDate);

      if (!isInDateRange) return false;

      // For medical leaves, check if they haven't returned
      if (leave.status === 'returned') return false;

      // Check time - if current time is after leave start time
      const fromTime = convertTimeToMinutes(leave.fromTime);

      // For medical without end date, just check if current time is after start time
      if (!leave.toTime) {
        return currentTime >= fromTime;
      }

      // For medical room with end time, check time range
      const toTime = convertTimeToMinutes(leave.toTime);
      return currentTime >= fromTime && currentTime <= toTime;
    });
  };

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
      axios.get(`${API_PORT}/leave`), //  medical leaves
      axios.get(`${API_PORT}/students/`)

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
          const isOnMedicalLeave = isStudentOnMedicalLeave(student.ADNO);
          const isOnLeave = student.onLeave || isOnShortLeave || isOnMedicalLeave;

          console.log(`Student ${student.ADNO}:`, {
            onLeave: student.onLeave,
            shortLeave: isOnShortLeave,
            medicalLeave: isOnMedicalLeave,
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
  }, [id, period, date, time]);

  const handleCheckboxChange = (ad, isChecked) => {
    const student = students.find(s => s.ADNO === ad);
    const isOnShortLeave = isStudentOnShortLeave(ad);
    const isOnMedicalLeave = isStudentOnMedicalLeave(ad);
    const isOnLeave = student.onLeave || isOnShortLeave || isOnMedicalLeave;

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
      const isOnMedicalLeave = isStudentOnMedicalLeave(s.ADNO);
      const isReturned = returnedStudents.includes(s.ADNO);
      const isOnLeave = (s.onLeave || isOnShortLeave || isOnMedicalLeave) && !isReturned;
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
          const findStd = leaveData.find(leave => leave.ad === ad && leave.status !== 'returned');
          if (findStd) {
            await axios.put(`${API_PORT}/leave/${findStd._id}`, { status: 'returned', markReturnedTeacher: teacher.name });
            await axios.put(`${API_PORT}/students/${ad}`, { onLeave: false });
          }
        }));
      }
    } catch (err) {
      console.error("Error updating return status:", err);
      // Continue with attendance submission even if return update fails? 
      // Maybe better to alert but for now we proceed or the main attendance might fail too.
    }

    const payload = students.map((student) => {
      const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
      const isOnMedicalLeave = isStudentOnMedicalLeave(student.ADNO);
      const isReturned = returnedStudents.includes(student.ADNO);
      const isOnLeave = (student.onLeave || isOnShortLeave || isOnMedicalLeave) && !isReturned;
      const status = isOnLeave ? "Absent" : (attendance[student.ADNO] || "Absent");

      return {
        nameOfStd: student["SHORT NAME"],
        ad: student.ADNO,
        class: student.CLASS,
        status: status,
        SL: student.SL,
        attendanceTime: time,
        attendanceDate: new Date(),
        teacher: teacher.name,
        ...(period && { period: period }),
        ...(more && { custom: more }),
        onLeave: isOnLeave,
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
        const isOnMedicalLeave = isStudentOnMedicalLeave(student.ADNO);
        const isReturned = returnedStudents.includes(student.ADNO);
        const isOnLeave = (student.onLeave || isOnShortLeave || isOnMedicalLeave) && !isReturned;
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
      alert("Error submitting attendance" + err);
    }
  };

  const handleOk = () => {
    setShowSummary(false);
    navigate(`/api-recall/${time}`);
  };

  const [copy, setCopy] = useState(false);

  const handleCopyAbsentees = () => {
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
        isStudentOnMedicalLeave(s.ADNO) && !s.onLeave && !isStudentOnShortLeave(s.ADNO)
      );

      const onLeaveStudents = absentees.filter(s =>
        s.onLeave && !isStudentOnShortLeave(s.ADNO) && !isStudentOnMedicalLeave(s.ADNO)
      );

      let text = "";
      const classofStd = `Class ${absentees[0].CLASS}`;

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

      navigator.clipboard.writeText(classofStd + "\n" + text)
        .then(() => {
          setCopy(true);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    } else {
      navigator.clipboard.writeText("No absentees 🎉");
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
    <div className="p-3 sm:p-6 mt-12">
      <div className="space-y-3">
        {/* Date and Time */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm flex-wrap mt-4">
          <span className="text-sm md:text-base text-gray-700">
            📅 {date
              ? new Date(date).toLocaleDateString("en-US", { dateStyle: "medium" })
              : "N/A"}{" "}
            || ⏰ {time || "N/A"} {period && `( ${period} )`} {more && `( ${more} )`}
          </span>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-sm font-medium shadow-sm hover:bg-blue-500 transition text-white"
            onClick={() => navigate(`/api-recall/${time}`)}
          >
            Class: {id}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg shadow-sm overflow-x-auto scrollbar-hide whitespace-nowrap">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white text-lg font-medium shadow-sm hover:bg-green-600 transition"
            onClick={() => navigate(`/api-recall/${time}`)}
          >
            <FaHome />
          </button>

          <button
            onClick={handleQuickAction}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition ml-auto ${quickAction === "Previous"
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : quickAction === "All Present"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : quickAction === "All Absent"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
          >
            {quickAction}
          </button>
        </div>
      </div>

      {dataLoad && <StudentsLoad />}

      {cards === "No" && !dataLoad && (
        <div>
          <form >
            <table className="table-auto border-collapse border border-gray-300 w-full">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">SL</th>
                  <th className="border border-gray-300 px-4 py-2">Ad</th>
                  <th className="border border-gray-300 px-4 py-2">Name</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student, index) => {
                    const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
                    const isOnMedicalLeave = isStudentOnMedicalLeave(student.ADNO);
                    const isReturned = returnedStudents.includes(student.ADNO);
                    const isOnLeave = (student.onLeave || isOnShortLeave || isOnMedicalLeave);
                    const displayOnLeave = isOnLeave && !isReturned;

                    // Determine leave type for display
                    let leaveType = "";
                    if (displayOnLeave) {
                      if (student.onLeave) leaveType = "Leave";
                      else if (isOnShortLeave) leaveType = "CEP";
                      else if (isOnMedicalLeave) leaveType = "Medical ";
                    }

                    return (
                      <tr
                        key={index}
                        onClick={() => {
                          if (!displayOnLeave) {
                            handleCheckboxChange(
                              student.ADNO,
                              attendance[student.ADNO] !== "Present"
                            );
                          }
                        }}
                        className={displayOnLeave ? "cursor-not-allowed" : "cursor-pointer"}
                      >
                        <td className="border border-gray-300 px-4 py-2">
                          {student.SL}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {student.ADNO}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {student["SHORT NAME"]}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={displayOnLeave}
                              onClick={() => {
                                if (!displayOnLeave) {
                                  handleCheckboxChange(
                                    student.ADNO,
                                    attendance[student.ADNO] !== "Present"
                                  );
                                }
                              }}
                              className={`px-4 py-1 rounded-full font-medium transition ${displayOnLeave
                                ? "bg-yellow-500 text-white cursor-not-allowed"
                                : attendance[student.ADNO] === "Present"
                                  ? "bg-green-500 text-white hover:bg-green-600"
                                  : "bg-red-500 text-white hover:bg-red-600"
                                }`}
                            >
                              {displayOnLeave
                                ? leaveType
                                : attendance[student.ADNO] === "Present"
                                  ? "Present"
                                  : "Absent"}
                            </button>

                            {isOnLeave && (
                              <button className={`text-xs text-white italic px-4 py-2 rounded-full font-bold ${isReturned ? "bg-green-600" : "bg-blue-500"}`}
                                type="button"
                                onClick={() => {
                                  if (isReturned) {
                                    // Toggle Off
                                    setReturnedStudents(prev => prev.filter(id => id !== student.ADNO));
                                    setAttendance(prev => ({ ...prev, [student.ADNO]: "Absent" }));
                                  } else {
                                    openReturnModal(student);
                                  }
                                }}
                              >
                                {isReturned ? "↩" : "R"}
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-500">
                      No students found in Class {id}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-6 flex justify-center">
              <button
                onClick={preSumbit}
                disabled={load}
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-blue-600 hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
              >
             {load ?"Submitting":"Submit Attendance"}   
              </button>
            </div>
          </form>
        </div>
      )}

      {cards === "Cards" && !dataLoad && (
        <div>
          <form onSubmit={preSumbit}>
            <main>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mt-2">
                {students.length > 0 ? (
                  students.map((student, index) => {
                    const isOnShortLeave = isStudentOnShortLeave(student.ADNO);
                    const isOnMedicalLeave = isStudentOnMedicalLeave(student.ADNO);
                    const isReturned = returnedStudents.includes(student.ADNO);
                    const isOnLeave = (student.onLeave || isOnShortLeave || isOnMedicalLeave);
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
                        className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 text-center transition-all duration-300 transform cursor-pointer hover:scale-105 ${displayOnLeave
                          ? "bg-yellow-500 shadow-sm hover:shadow-lg"
                          : isPresent
                            ? "bg-green-500 shadow-sm hover:shadow-lg"
                            : "bg-red-500 shadow-sm hover:shadow-lg"
                          }`}
                      >
                        {/* Roll Circle */}
                        <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg text-white transition-colors duration-300 ${isOnLeave ? "bg-yellow-600" : isPresent ? "bg-indigo-500" : "bg-indigo-500"
                              }`}
                          >
                            {student.SL}
                          </div>
                        </div>

                        {/* Student Info */}
                        <h3 className={`text-xs sm:text-sm md:text-base font-semibold truncate px-1 ${isOnLeave ? "text-white" : isPresent ? "text-gray-800" : "text-white"
                          }`}>
                          {student["SHORT NAME"]}
                        </h3>
                        <p className={`text-xs sm:text-sm mb-2 sm:mb-3 md:mb-4 ${isOnLeave ? "text-gray-100" : isPresent ? "text-gray-700" : "text-gray-100"
                          }`}>
                          Ad: {student.ADNO}
                        </p>

                        {/* Status */}
                        <div className={`text-xs font-medium ${displayOnLeave ? "text-white" : isPresent ? "text-green-800" : "text-red-100"
                          }`}>
                          {displayOnLeave ? "On Leave" : isPresent ? "Present" : "Absent"}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 text-center p-4 text-gray-500">
                    <p className="text-sm sm:text-base">No students found in Class {id}</p>
                  </div>
                )}
              </div>
            </main>

            <footer className="mt-6 sm:mt-8 text-center">
              <button className="bg-indigo-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 text-sm sm:text-base rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Submit Attendance
              </button>
            </footer>
          </form>
        </div>
      )}

      {confirmAttendance && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
            <h3 className="text-base sm:text-lg font-bold mb-4 text-center">
              Confirm Submission
            </h3>
            <p className="mb-2 text-sm sm:text-base">The following students are absent:</p>
            {absentees.length > 0 ? (
              <div className="max-h-40 sm:max-h-48 overflow-y-auto mb-4">
                <ul className="list-disc list-inside text-red-600 text-sm sm:text-base space-y-1">
                  {absentees.map((s) => (
                    <li key={s.ADNO} className="break-words">
                      {s["SHORT NAME"]} (AdNo: {s.ADNO})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-green-600 mb-4 text-sm sm:text-base">No absentees 🎉</p>
            )}

            <div className="flex flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setConfirmAttendance(false)}
                className="flex-2 px-3 sm:px-4 py-2 bg-gray-300 text-sm sm:text-base rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyAbsentees}
                className="flex-2 px-3 sm:px-4 py-2 bg-green-500 text-white text-sm sm:text-base rounded-lg hover:bg-green-600 transition"
              >
                {copy ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          {load && (
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
              {/* Spinner Container */}
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4">
                {/* Outer Spinner */}
                <div
                  className="absolute w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"
                  style={{ animationDuration: '2.5s' }}
                ></div>

                {/* Inner Spinner */}
                <div
                  className="absolute w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"
                  style={{ animationDuration: '0.8s' }}
                ></div>

                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-blue-600 font-extrabold text-lg sm:text-xl animate-pulse">⏳</span>
                </div>
              </div>

              {/* Text */}
              <p className="mt-2 text-blue-700 font-semibold text-base sm:text-lg">Submitting Attendance...</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">Please wait while we process your data</p>
            </div>
          )}
          {!load && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md text-center">
              <h3 className="text-lg sm:text-xl font-bold mb-4">📊 Attendance Summary</h3>
              <div className="space-y-2 sm:space-y-3">
                <p className="text-sm sm:text-base">👥 Strength: {summary.strength}</p>
                <p className="text-sm sm:text-base text-green-600">✅ Present: {summary.present}</p>
                <p className="text-sm sm:text-base text-red-600">❌ Absent: {summary.absent}</p>
                <p className="text-sm sm:text-base font-semibold">📈 Presence: {summary.percent}%</p>
              </div>

              <button
                onClick={handleOk}
                className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}

      {/* Return Confirmation Modal */}
      {showReturnModal && selectedReturnStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Confirm Return</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 font-medium">
                  Mark <span className="font-bold text-blue-600">{selectedReturnStudent["SHORT NAME"]}</span> as returned?
                </p>
              </div>

              {/* Minimal Details Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm space-y-3 shadow-inner">
                {(() => {
                  const ad = selectedReturnStudent.ADNO;
                  // Find Medical Leave
                  const medical = leaveData.find(leave => leave.ad === ad && leave.status !== 'returned');

                  // Find CEP (Short Leave)
                  // Re-using logic to match currently active short leave
                  const today = date ? new Date(date) : new Date();
                  const currentTime = convertTimeToMinutes(getCurrentTimeString());
                  const cep = shortLeaveData.find(leave => {
                    if (leave.ad !== ad) return false;
                    const leaveDate = new Date(leave.date);
                    const isSameDate = leaveDate.getDate() === today.getDate() &&
                      leaveDate.getMonth() === today.getMonth() &&
                      leaveDate.getFullYear() === today.getFullYear();
                    if (!isSameDate) return false;
                    const fromTime = convertTimeToMinutes(leave.fromTime);
                    const toTime = convertTimeToMinutes(leave.toTime);
                    return currentTime >= fromTime && currentTime <= toTime;
                  });

                  if (medical) {
                    return (
                      <>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                          <span className="text-gray-500 font-medium">Type</span>
                          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">Medical Leave</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Reason</span>
                          <span className="font-medium text-gray-800">{medical.reason || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Start Time</span>
                          <span className="font-mono text-gray-700">{medical.fromTime || "N/A"}</span>
                        </div>
                      </>
                    );
                  } else if (cep) {
                    return (
                      <>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                          <span className="text-gray-500 font-medium">Type</span>
                          <span className="font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-xs">CEP (Short Leave)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Reason</span>
                          <span className="font-medium text-gray-800">{cep.reason || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Duration</span>
                          <span className="font-mono text-gray-700">{cep.fromTime} - {cep.toTime}</span>
                        </div>
                      </>
                    );
                  } else {
                    return <div className="text-center text-gray-500 italic py-2">No specific leave details found.</div>;
                  }
                })()}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmReturn}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hajar;