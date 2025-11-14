import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams,useLocation, data  } from "react-router-dom";
import { TfiLayoutGrid3,TfiLayoutGrid2  } from "react-icons/tfi";
import { FaHome, FaSadCry } from "react-icons/fa";
import StudentsLoad from "../load-UI/StudentsLoad";
import { API_PORT } from "../../Constants";
function Hajar() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [cards,setCards] = useState('No')
  const [summary, setSummary] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();
  const [load,setLoad]= useState(false)
  const [dataLoad,setDataLoad] = useState(false)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const date = queryParams.get("date") || "";
  const time = queryParams.get("time") || "Night";
  const period = queryParams.get("period") ;
  const more = queryParams.get("more") ;
  //confirm attendance
  const [absentees,setAbsenties] = useState([])
  const [confirmAttendance,setConfirmAttendance] = useState(false)
 
  //teacher data
  const token = localStorage.getItem("token")
  const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) : 'Teacher Panel';

  const initialAttendance = {}

  useEffect(() => {
    console.log(period);
    
    setDataLoad(true)
    axios
      .get(`${API_PORT}/students/`)
      .then((res) => {
        const filtered = res.data
          .filter((student) => student.CLASS === Number(id))
          .sort((a, b) => a.SL - b.SL);

        // set all initially
        filtered.forEach((s) => {
          initialAttendance[s.ADNO] = "Present";
        });

        setStudents(filtered);
        setAttendance(initialAttendance);
        setDataLoad(false)
      })
      .catch((err) => {
        console.error(err);
        setDataLoad(false)
      });
  }, [id,period]);

  const handleCheckboxChange = (ad, isChecked) => {
    setAttendance((prev) => ({
      ...prev,
      [ad]: isChecked ? "Present" : "Absent",
    }));
  };
  const preSumbit=(e)=>{
    e.preventDefault();
    const absentiesList=students.filter((s)=>attendance[s.ADNO] !== "Present")

    setAbsenties(absentiesList)
    setConfirmAttendance(true)
  }

  const handleSubmit = async () => {

   setConfirmAttendance(false)
    setLoad(true)
    
    const payload = students.map((student) => ({
      nameOfStd: student["SHORT NAME"],
      ad: student.ADNO,
      class: student.CLASS,
      status: attendance[student.ADNO] || "Absent",
      SL:student.SL,
      attendanceTime: time,
      attendanceDate: date ? new Date(date + 'T00:00:00').toISOString() : new Date().toISOString(),
      teacher:teacher.name,
      ...(period && {period:period}),
      ...(more && {custom:more})
    }));

    try {
      
      await axios.post(`${API_PORT}/set-attendance`, payload);

      //  calculate summary
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

      const payload2 = students.map((student) => ({
        _id:student._id,
        SL:student.SL,
        ADNO: student.ADNO,
        ["FULL NAME"]: student["FULL NAME"],
        ["SHORT NAME"]: student["SHORT NAME"],
        CLASS: student.CLASS,
        Status: attendance[student.ADNO] || "Absent",
        Time: time,
        Date:date ||new Date().toISOString().split("T")[0],
        
        
      }));

      await axios.patch(`${API_PORT}/students/bulk-update/students`,{updates:payload2})
      setLoad(false)
    } catch (err) {
      console.error(err);
      setLoad(false)
      alert("Error submitting attendance"+err);
      
    }
  };

  const handleOk = () => {
    setShowSummary(false);
    navigate(`/api-recall/${time}`);
  };

    const [copy,setCopy] = useState(false)

  const handleCopyAbsentees = () => {
    
    if (absentees.length > 0) {
      const text = absentees
        .map((s) => `${s["SHORT NAME"]} (AdNo: ${s.ADNO})`)
        .join("\n");
  
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopy(true)
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    } else {
      navigator.clipboard.writeText("No absentees 🎉");
      setCopy(true)
    }
    setTimeout(()=>{
      setCopy(false)
    },4000)
  };

  const [quickAction,setQuickAction] = useState("All Absent")

  const handleQuickAction = () => {
    setQuickAction(prev => prev === "Previous" ? "All Present" : prev === "All Present" ? "All Absent" : "Previous");
    const updated = {};
    students.forEach((s) => (updated[s.ADNO] = quickAction === "Previous" ? s.Status : quickAction === "All Present" ? "Present" : "Absent"));
    setAttendance(updated);
  }
 

  return (
    <div className="p-3 sm:p-6 mt-12">
   <div className="space-y-3">

   

    {/* Date and Time */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm flex-wrap mt-4">
      <span className="text-sm md:text-base text-gray-700">
        📅 {date
          ? new Date(date).toLocaleDateString("en-US", { dateStyle: "medium" })
          : "N/A"}{" "}
      ||  ⏰ {time || "N/A"} {period && `( ${period} )`} {more && `( ${more} )`}
      </span>

      {/* <button
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white  text-lg font-medium shadow-sm hover:bg-green-600 transition ml-16"
        onClick={() => navigate(`/api-recall/${time}`)}
      >
        <FaHome />
      </button> */}
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600  text-sm font-medium shadow-sm hover:bg-blue-500 transition text-white"
      onClick={() => navigate(`/api-recall/${time}`)}
      >
        Class: {id}
      </button>
      
    </div>


   
    {/* <div className="flex justify-center bg-gray-100 p-2 rounded-lg shadow-sm">
      <div className="inline-flex rounded-md bg-white shadow-sm overflow-hidden border">
        <button
          onClick={() => setCards("Cards")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            cards === "Cards"
              ? "bg-indigo-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <TfiLayoutGrid2 />
          Cards
        </button>
        <button
          onClick={() => setCards("No")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            cards === "No"
              ? "bg-indigo-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <TfiLayoutGrid3 />
          Table
        </button>
        
      </div>
      <button
        onClick={() => navigate(`/api-recall/${time}`)}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium transition hover:bg-green-700 ml-16"
      >
        <FaHome />
        Home
      </button>
    </div> */}

    {/* Quick Actions */}
    <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg shadow-sm overflow-x-auto scrollbar-hide whitespace-nowrap">
    <button
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white  text-lg font-medium shadow-sm hover:bg-green-600 transition"
        onClick={() => navigate(`/api-recall/${time}`)}
      >
        <FaHome />
      </button>
  {/* <button
    onClick={() => {
      const updated = {};
      students.forEach((s) => (updated[s.ADNO] = "Present"));
      setAttendance(updated);
    }}
    className="flex-shrink-0 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition"
  >
    All Present
  </button>

  <button
    onClick={() => {
      const updated = {};
      students.forEach((s) => (updated[s.ADNO] = "Absent"));
      setAttendance(updated);
    }}
    className="flex-shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition"
  >
    All Absent
  </button>

  <button
    onClick={() => {
      const updated = {};
      students.forEach((s) => (updated[s.ADNO] = s.Status));
      setAttendance(updated);
    }}
    className="flex-shrink-0 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition"
  >
     Previous
  </button>
  
  */}

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



      {dataLoad &&<StudentsLoad/>}

     {cards==="No"&& !dataLoad&& <div>
      <form onSubmit={preSumbit}>
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
              students.map((student, index) => (
                <tr key={index} 
                onClick={() =>
                  handleCheckboxChange(
                    student.ADNO,
                    attendance[student.ADNO] !== "Present"
                  )
                }
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
                    <button
                      type="button"
                      onClick={() =>
                        handleCheckboxChange(
                          student.ADNO,
                          attendance[student.ADNO] !== "Present"
                        )
                      }
                      className={`px-4 py-1 rounded-full font-medium transition ${
                        attendance[student.ADNO] === "Present"
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-red-500 text-white hover:bg-red-600"
                      } ${student.Status=="Absent"&& attendance[student.ADNO] === "Absent"    &&   "border-2 border-blue-600"}`}
                    >
                      {attendance[student.ADNO] === "Present"
                        ? "Present"
                        : "Absent"}
                    </button>
                   {/* {student.Status =="Absent" && <span class="bg-red-100 text-red-800 text-xs  me-2 px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300"></span>} */}
                  </td>
                </tr>
              ))
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
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-blue-600 hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
          >
             Submit Attendance
          </button>
        </div>
      </form>
      </div>}


      {cards==="Cards" && !dataLoad && 
      <div>
    <form onSubmit={preSumbit}>
      <main>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mt-2">
            {students.length > 0 ? (
              students.map((student, index) => {
                const isPresent = attendance[student.ADNO] === "Present"; //  check attendance
                return (
                  <div
                    key={index}
                    onClick={() =>
                      handleCheckboxChange(student.ADNO, !isPresent)
                    }
                    className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 text-center transition-all duration-300 transform cursor-pointer hover:scale-105 ${
                      isPresent
                        ? "bg-green-500 shadow-sm hover:shadow-lg"
                        : "bg-red-500 shadow-sm hover:shadow-lg"
                    }`}
                  >
                    {/* Roll Circle */}
                    <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg text-white transition-colors duration-300 ${
                          isPresent ? "bg-indigo-500" : "bg-indigo-500"
                        }`}
                      >
                        {student.SL}
                      </div>
                    </div>

                    {/* Student Info */}
                    <h3 className={`text-xs sm:text-sm md:text-base font-semibold truncate px-1 ${isPresent?"text-gray-800":"text-white"}`}>
                      {student["SHORT NAME"]}
                    </h3>
                    <p className={`text-xs sm:text-sm mb-2 sm:mb-3 md:mb-4 ${isPresent?"text-gray-700":"text-gray-100"}`}>
                      Ad: {student.ADNO}
                    </p>

                   
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
      </div>}
      
      {confirmAttendance &&(
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
          className="flex-2 px-3 sm:px-4 py-2 bg-green-500 text-white text-sm sm:text-base rounded-lg hover:bg-green-600 transition ">
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
      )

      }

  

      {/*  Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          {load &&(
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
          {!load && 
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
          </div>}
        </div>
      )}
    </div>
  );
}

export default Hajar;
