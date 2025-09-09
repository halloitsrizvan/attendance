import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { TfiLayoutGrid3,TfiLayoutGrid2  } from "react-icons/tfi";
import { FaHome } from "react-icons/fa";

function EditAtt() {
    const [students,setStudents] = useState([])
    const [err,setErr]= useState('')
    const {id} = useParams()
    const [status,setStatus] = useState({})
    const [summary, setSummary] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const navigate=useNavigate()
    const [cards,setCards] = useState('No')
    
    useEffect(() => {
      axios
        .get("https://clg-project-hsns.onrender.com/set-attentence")
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
        })
        .catch((err) => {
          setErr(err.message);
        });
    }, [id]);
    
    

    const handleCheckboxChange = (ad, isChecked) => {
      setStatus((prev) => ({
        ...prev,
        [ad]: isChecked ? "Present" : "Absent",
      }));
    };
    const handleSubmit=async(e)=>{
      e.preventDefault();
      try{
        const updatedData = students.map((student) => ({
          _id: student._id,
          nameOfStd: student.name, 
          ad: student.ad,
          class: student.class,
          status: status[student.ad] || student.status, 
          SL: student.SL,
          attentenceTime: student.attentenceTime,
          attentenceDate: student.attentenceDate,
          
        }));

        await axios.patch("https://clg-project-hsns.onrender.com/set-attentence",{updates:updatedData})

        const strength = students.length;
        const present = updatedData.filter((s) => s.status === "Present").length;
        const absent = strength - present;
        const percent = ((present / strength) * 100).toFixed(1);

        setSummary({ strength, present, absent, percent });
        setShowSummary(true);

        await axios.patch(`https://clg-project-hsns.onrender.com/classes/by-number/${id}`, {
          totalstudents: strength,
          presentstudents: present,
          absentstudents: absent,
          percentage: percent,
        });

        const payload2 = students.map((student) => {
          // attendance record keys: ad, nameOfStd, SL, class, status, attentenceTime, attentenceDate
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
  
        await axios.patch("https://clg-project-hsns.onrender.com/students/bulk-update/students",{updates:payload2})

      }catch(err){
        console.log(err)
      }
    }
    
  const handleOk = () => {
    setShowSummary(false);
    navigate("/edit-attentence-classes");
  };
  return (
    <div className='p-4' style={{"marginTop":"4.2rem"}}>
      <div >
     <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center ">
        Edit Attendance || Class: {id}
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-100 p-3 rounded-lg shadow-sm mb-1">
        <span className="text-sm md:text-base text-gray-700">
           Date & Time:{" "}
          {students[0]?.attentenceDate
            ? new Date(students[0].attentenceDate).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "N/A"} ({students[0]?.attentenceTime || "N/A"})
        </span>

  
      </div>

      <div className="flex gap-3 p-2">
          <button
            onClick={() => setCards("Cards")}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition ${
              cards === "Cards"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <TfiLayoutGrid2 className="text-lg" />
            Cards
          </button>

          <button
            onClick={() => setCards("No")}
            type="button"
            className={`flex items-center  gap-2 px-4 py-2 rounded-lg shadow-sm transition ${
              cards === "No"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <TfiLayoutGrid3 className="text-lg" />
            Table
          </button>

        
          <button
            onClick={() => navigate("/edit-attentence-classes")}
            type="button"
            className="block md:hidden ml-14 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition bg-green-500 text-white"
          >
            <FaHome className="text-lg" />
            Home
          </button>
        </div>

      </div>

      {cards==="No" &&
        <div className='p-2'>
        <form onSubmit={handleSubmit}>
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
                const currentStatus= status[student.ad] || student.status
                return(
                <tr key={index}>
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

      {cards==="Cards" &&
      <div>
      <form onSubmit={handleSubmit}>
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
      
      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 text-center">
            <h3 className="text-xl font-bold mb-4">Updated Attendance Summary</h3>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default EditAtt