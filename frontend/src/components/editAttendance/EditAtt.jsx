import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { TfiLayoutGrid3,TfiLayoutGrid2  } from "react-icons/tfi";
import { FaHome,FaEdit } from "react-icons/fa";
import StudentsLoad from '../load-UI/StudentsLoad';
import { API_PORT } from '../../Constants';

function EditAtt() {
    const [students,setStudents] = useState([])
    const [err,setErr]= useState('')
    const {id} = useParams()
    const [status,setStatus] = useState({})
    const [summary, setSummary] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const navigate=useNavigate()
    const [summaryLoad,setSummaryLoad] = useState(false)
    const [load,setLoad] = useState(false)
    const [cards,setCards] = useState('No') 
  const [confirmAttendance, setConfirmAttendance] = useState(false)
  const [absentees, setAbsentees] = useState([])
  const [copy, setCopy] = useState(false)
    const latestDate=students[0]?.attentenceDate
    const latestTime=students[0]?.attentenceTime
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
              if (!existing || new Date(s.attentenceDate) > new Date(existing.attentenceDate)) {
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
    if (absentees.length > 0) {
      const text = absentees
        .map((s) => `${s.nameOfStd} (AdNo: ${s.ad})`)
        .join("\n");
      navigator.clipboard.writeText("Class :"+absentees[0].class+"\n"+text)
        .then(() => setCopy(true))
        .catch((err) => console.error("Failed to copy: ", err));
    } else {
      navigator.clipboard.writeText("No absentees 🎉");
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
          attendanceDate: student.attentenceDate,
          
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
            Date: student.attentenceDate ?? student.Date ?? new Date().toISOString().split("T")[0]
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
    navigate("/edit-attendance-classes");
  };
  const [quickAction,setQuickAction] = useState("All Present")
  
    const handleQuickAction = () => {
      setQuickAction(prev => prev === "Previous" ? "All Present" : prev === "All Present" ? "All Absent" : "Previous");
      const updated = {};
      students.forEach((s) => (updated[s.ADNO] = quickAction === "Previous" ? s.Status : quickAction === "All Present" ? "Present" : "Absent"));
      setStatus(updated);
    }

  return (
    <div className='p-4' style={{"marginTop":"4.2rem"}}>

       <div className="space-y-3">
          {/* Date and Time */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm flex-wrap mt-4">
            <span className="text-sm md:text-base text-gray-700">
              📅 {students[0]?.attendanceDate
                ? new Date(students[0]?.attendanceDate).toLocaleDateString("en-US", { dateStyle: "medium" })
                : "N/A"}{" "}
            ||  ⏰ {students[0]?.attendanceTime || "N/A"} {students[0]?.period && `( ${students[0]?.period} )`} {students[0]?.more && `( ${students[0]?.more} )`}
            </span>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600  text-sm font-medium shadow-sm hover:bg-blue-500 transition text-white"
            onClick={() => navigate(`/edit-attendance-classes`)}
            > 
              Class: {id}
            </button>
          </div>
          {/* Quick Actions */}
          <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg shadow-sm overflow-x-auto scrollbar-hide whitespace-nowrap">
          <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white  text-lg font-medium shadow-sm hover:bg-green-600 transition"
              onClick={() => navigate(`/edit-attendance-classes`)}
            >
              <FaEdit />
            </button>
              <button
              onClick={handleQuickAction}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition ml-auto ${
                quickAction === "Previous"
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



      {load &&<StudentsLoad/>}
      {cards==="No"&&!load &&
        <div className='p-2'>
        <form onSubmit={preSubmit}>
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
                const currentStatus= status[student.ad] !== undefined ? status[student.ad] : student.status;
                return(
                <tr key={index}
                onClick={() =>
                  handleCheckboxChange(student.ad, currentStatus !== 'Present')
                }
                >
                  <td className="border border-gray-300 px-4 py-2">
                    {student.SL}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {student.ad}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {student.nameOfStd}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                   
                        <button
                          type="button"
                          onClick={() =>
                            handleCheckboxChange(student.ad, currentStatus !== 'Present')
                          }
                          className={`px-4 py-1 rounded-full font-medium transition ${
                            currentStatus === 'Present'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          {currentStatus}
                        </button>

                  </td>
                </tr>
              )})
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
            type="submit"
            className="px-6 py-3 mb-4 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-blue-600 hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
          >
             Submit Attendance
          </button>
        </div>
      </form>
      </div>}

      {cards==="Cards" &&!load&&
      <div>
      <form onSubmit={preSubmit}>
        <main>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {students.length > 0 ? (
                students.map((student, index) => {
                  const currentStatus= status[student.ad] || student.status
                  return (
                    <div
                      key={index}
                      onClick={() =>
                        handleCheckboxChange(student.ad, currentStatus !== 'Present')
                      }
                      className={`rounded-2xl p-5 text-center transition-all duration-300 transform  cursor-pointer ${
                        currentStatus==="Present"
                          ? "bg-white shadow-sm hover:shadow-lg"
                          : "bg-gray-100"
                      }`}
                    >
                      {/* Roll Circle */}
                      <div className="flex justify-center mb-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white transition-colors duration-300 ${
                            currentStatus==="Present" ? "bg-indigo-500" : "bg-gray-400"
                          }`}
                        >
                          {student.SL}
                        </div>
                      </div>
  
                      {/* Student Info */}
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {student.nameOfStd}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Ad No: {student.ad}
                      </p>
  
                      {/* Status Badge */}
                      <div
                        className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-colors duration-300 ${
                          currentStatus==="Present" ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {currentStatus==="Present" ? "Present" : "Absent"}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-3 text-center p-4 text-gray-500">
                  No students found in Class {id}
                </p>
              )}
            </div>
          </main>
  
          
          <footer className="mt-8 text-center">
              <button className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Submit Attendance
              </button>
          </footer>
          </form>
        </div>

      }
      
      {confirmAttendance && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4 text-center">
              Confirm Submission
            </h3>
            <p className="mb-2">The following students are absent:</p>
            {absentees.length > 0 ? (
              <ul className="list-disc list-inside mb-4 text-red-600">
                {absentees.map((s) => (
                  <li key={s.ad}>
                    {s.nameOfStd} (AdNo: {s.ad})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-green-600 mb-4">No absentees 🎉</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCopyAbsentees}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-14"
              >
                {copy ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setConfirmAttendance(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          {summaryLoad &&(
            <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-blue-600 font-semibold">Submitting Attendance...</p>
          </div>
          )}
          {!summaryLoad && 
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 text-center">
            <h3 className="text-xl font-bold mb-4">📊 Attendance Summary</h3>
            <p className="mb-2">👥 Strength: {summary.strength}</p>
            <p className="mb-2 text-green-600">✅ Present: {summary.present}</p>
            <p className="mb-2 text-red-600">❌ Absent: {summary.absent}</p>
            <p className="mb-4">📈 Presence : {summary.percent}%</p>
            

            <button
              onClick={handleOk}
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              OK
            </button>
          </div>}
        </div>
      )}

    </div>
  )
}

export default EditAtt