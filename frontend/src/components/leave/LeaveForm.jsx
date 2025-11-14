import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import DatePicker from './DatePicker';
import { FaHome, FaSadCry } from "react-icons/fa";
const SelectionButton = ({ label, isSelected, onClick ,type}) => (
   <button
    onClick={onClick}
    className={`w-full py-2 px-3 text-sm font-medium border rounded-lg transition-all duration-200
      ${isSelected
        ? type === "From Date" || type === "From Time"? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' 
        : type=="Reason"? "bg-red-600 text-white border-indigo-600 shadow-md transform scale-[1.02]"
        :'bg-green-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' 
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }
    `}
  >
    {label}
      
  </button>
);

const TimePicker = ({ label, selectedTime, setSelectedTime, options, customTime, setCustomTime }) => (
  <div className="mb-6 p-4 bg-white rounded-xl shadow-inner border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{label}</h3>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {options.map(option => (
        <SelectionButton
          key={option}
          type={label}
          label={option}
          isSelected={selectedTime === option}
          onClick={() => {
            setSelectedTime(option);
            if (option !== 'Clock') {
              setCustomTime('');
            }
          }}
        />
      ))}
    </div>
    {selectedTime === 'Clock' && (
      <div className="mt-4 pt-3 border-t border-gray-200">
        <label htmlFor={`${label}-time-input`} className="block text-sm font-medium text-indigo-600 mb-2">
          Select Custom Time:
        </label>
        <input
          id={`${label}-time-input`}
          type="time"
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          className="w-full border border-indigo-300 rounded-lg p-3 text-base focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
        />
      </div>
    )}
  </div>
);

const ReasonPicker = ({ selectedReason, setSelectedReason, customReason, setCustomReason }) => {
 const teacher = localStorage.getItem("teacher")
    ? JSON.parse(localStorage.getItem("teacher"))
    : null;
    const classNum=teacher.classNum
  let reasonOptions = [];
  if(classNum>4){
 reasonOptions =['Medical']  
  } else {
 reasonOptions = ['Medical', 'Marriage', 'Function', 'Custom'];
  }

 useEffect(()=>{
  console.log(reasonOptions,classNum);
  
 },[reasonOptions,classNum])
  

  return (
    <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Reason</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {reasonOptions.map(option => (
          <SelectionButton
            key={option}
            label={option}
            type={'Reason'}
            isSelected={selectedReason === option}
            onClick={() => {
              setSelectedReason(option);
              if (option !== 'Custom') {
                setCustomReason('');
              }
            }}
          />
        ))}
      </div>
      {selectedReason === 'Custom' && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <label htmlFor="custom-reason-input" className="block text-sm font-medium text-indigo-600 mb-2">
            Specify Reason:
          </label>
          <input
            id="custom-reason-input"
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full border border-indigo-300 rounded-lg p-3 text-base focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            placeholder="e.g., Meelad rally"
          />
        </div>
      )}
    </div>
  );
};

function LeaveForm() {
  const teacher = localStorage.getItem("teacher")
    ? JSON.parse(localStorage.getItem("teacher"))
    : null;

  const navigate = useNavigate();

  // States
  const [ad, setAd] = useState('');
  const [student, setStudent] = useState(null);
  const [name, setName] = useState('');
  const [classNum, setClassNum] = useState('');
  const [students, setStudents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fromDate, setFromDate] = useState('Today');
  const [fromTime, setFromTime] = useState('Evening');
  const [fromCustomDate, setFromCustomDate] = useState('');
  const [fromCustomTime, setFromCustomTime] = useState('');
  const [toDate, setToDate] = useState('Tomorrow');
  const [toTime, setToTime] = useState('Evening');
  const [toCustomDate, setToCustomDate] = useState('');
  const [toCustomTime, setToCustomTime] = useState('');
  const [reason, setReason] = useState('Medical');
  const [customReason, setCustomReason] = useState('');

  const fromTimeOptions = ['Morning', 'Evening', 'Now', 'Clock'];
  const toTimeOptions = ['Morning', 'Evening', 'Clock'];

  useEffect(()=>{
     if (teacher?.role === "teacher") {
      navigate('/leave-dashboard');
    }
  },[teacher.role])

  // Fetch all students based on teacher role
  useEffect(() => {
    setLoading(true);
    axios.get(`${API_PORT}/students`)
      .then((res) => {
        let filteredStudents = res.data;

        if (teacher.role === "class_teacher") {
          filteredStudents = res.data.filter(std => std.CLASS === teacher.classNum);
        } else if (teacher.role === "HOD") {
          filteredStudents = res.data.filter(std => [8, 9, 10].includes(std.CLASS));
        } else if (teacher.role === "HOS") {
          filteredStudents = res.data.filter(std => [5, 6, 7].includes(std.CLASS));
        }

        setStudents(filteredStudents);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [teacher.role, teacher.classNum]);

  // Fetch student when AD changes
  useEffect(() => {
    if (!ad) {
      setStudent(null);
      setName('');
      setClassNum('');
      return;
    }

    const found = students.find((std) => String(std.ADNO) === String(ad));
    if (found) {
      setStudent(found);
      setName(found["SHORT NAME"]);
      setClassNum(found.CLASS);
    } else {
      setStudent(null);
      setName('');
      setClassNum('');
    }

   
  }, [ad, students, teacher, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!ad || !name || !classNum) {
      alert("Please select a student first.");
      return;
    }

    setLoading(true);

    const getFormattedDate = (date) => date.toISOString().split('T')[0];

    const getFormattedTime = (timeOption, customTime,label='') => {
      const pad = (n) => String(n).padStart(2, "0");

      if (timeOption === "Clock") return customTime;
      if(label==="From Time"){
        if (timeOption === "Morning") return "05:30";
        if (timeOption === "Evening") return "16:30";
      }else if(label==="To Time"){
        if (timeOption === "Morning") return "07:00";
        if (timeOption === "Evening") return "18:00";
      }else{
        if (timeOption === "Morning") return "05:30";
        if (timeOption === "Evening") return "16:30";
      }
      // if (timeOption === "Night") return "22:00";
      if (timeOption === "Now") {
        const now = new Date();
        return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      }
      return "07:30";
    };

    // Calculate From Date
    let finalFromDate;
    if (fromDate === 'Calendar') {
      finalFromDate = fromCustomDate;
    } else if (fromDate === 'Today') {
      finalFromDate = getFormattedDate(new Date());
    } else if (fromDate === 'Tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      finalFromDate = getFormattedDate(tomorrow);
    } else if (fromDate === 'Day After') {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      finalFromDate = getFormattedDate(dayAfter);
    } else {
      finalFromDate = getFormattedDate(new Date());
    }

    

    // Calculate To Date
    let finalToDate;
    if (toDate === 'Calendar') {
      finalToDate = toCustomDate;
    } else if (toDate === 'Today') {
      finalToDate = getFormattedDate(new Date());
    } else if (toDate === 'Tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      finalToDate = getFormattedDate(tomorrow);
    } else if (toDate === 'Day After') {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      finalToDate = getFormattedDate(dayAfter);
    } else {
      finalToDate = getFormattedDate(new Date());
    }

    const finalFromTime = getFormattedTime(fromTime, fromCustomTime,'From Time');
    const finalToTime = getFormattedTime(toTime, toCustomTime,'To Time');
    const finalReason = reason === 'Custom' ? customReason : reason;

    const payload = {
      ad,
      name,
      classNum,
      fromDate: finalFromDate,
      fromTime: finalFromTime,
      toDate: finalToDate,
      toTime: finalToTime,
      reason: finalReason,
      teacher: teacher.name,
      status: "Scheduled"
    };

    console.log('Submitting leave:', payload);

    axios.post(`${API_PORT}/leave`, payload)
      .then(() => {
        console.log("Leave submitted successfully!");
        // axios.patch(`${API_PORT}/students/on-leave/${ad}`, {onLeave: true})
        // .then(() => {
        //   console.log("Student on leave updated successfully!");
        //   resetForm();
        // })
        // .catch((err) => {
        //   console.log("Error updating student on leave", err);
        //   alert("Error updating student on leave. Please try again.");
        // });
      })
      .catch((err) => {
        console.log("Error submitting leave", err);
        alert("Error submitting leave. Please try again.");
      })
      .finally(() =>{ setLoading(false); 
       
          setAd('');
          setStudent(null);
          setName('');
          setClassNum('');
          setFromDate('Today');
          setFromTime('Evening');
          setFromCustomDate('');
          setFromCustomTime('');
          setToDate('Tomorrow');
          setToTime('Evening');
          setToCustomDate('');
          setToCustomTime('');
          setReason('Medical');
          setCustomReason('');
          setSuggestions([]);
        
      });
  };
  


  // Function to reset form
  

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-inter p-4 sm:p-8 mt-16">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; }
          .form-header {
            position: sticky;
            top: 0;
            z-index: 10;
            background-color: #f3f4f6;
          }
        `}
      </style>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-40 z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold animate-pulse">Processing...</p>
          </div>
        </div>
      )}

      <button
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white  text-lg font-medium shadow-sm hover:bg-green-600 transition mb-2 ml-2"
        onClick={() => navigate(`/leave-dashboard`)}
      >
        <FaHome /> Leave Dashboard
      </button>

      {/* Remove form tag and use div instead, OR keep form but ensure all buttons have type="button" */}
      <div className="max-w-xl mx-auto space-y-8 pb-16">
        

      

        {/* Student Information */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 relative">
              <label htmlFor="ad" className="block text-xs font-medium text-gray-500 mb-1">
                AD / Name
              </label>
              <input
                id="ad"
                type="text"
                value={ad}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setAd(value); 

                  if (value === "") {
                    setSuggestions([]);
                    return;
                  }

                  const isNumber = /^\d+$/.test(value);
                  let filtered;

                  if (isNumber) {
                    filtered = students.filter((std) =>
                      String(std.ADNO).startsWith(value)  
                    );
                  } else {
                    filtered = students.filter((std) =>
                      std["SHORT NAME"].toLowerCase().includes(value.toLowerCase())
                    );
                  }

                  setSuggestions(filtered.slice(0, 5));
                }}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter AD or Name"
              />

              {suggestions.length > 0 && (
                <div className="absolute bg-white border border-gray-200 mt-1 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-full">
                  {suggestions.map((s) => (
                    <div
                      key={s.ADNO}
                      className="px-3 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
                      onClick={() => {
                        setAd(s.ADNO);
                        setName(s["SHORT NAME"]);
                        setClassNum(s.CLASS);
                        setStudent(s);
                        setSuggestions([]);
                      }}
                    >
                      <span className="font-medium">{s.ADNO}</span> – {s["SHORT NAME"]} – {s.CLASS}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-1">
              <label htmlFor="classNum" className="block text-xs font-medium text-gray-500 mb-1">
                Class
              </label>
              <input
                id="classNum"
                type="text"
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
                disabled
                className={`w-full border border-gray-300 rounded-lg p-2 text-sm ${
                  student ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="00"
              />
            </div>

            <div className="col-span-3">
              <label htmlFor="name" className="block text-xs font-medium text-gray-500 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled
                className={`w-full border border-gray-300 rounded-lg p-2 text-sm ${
                  student ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Student Name"
              />
            </div>
          </div>
        </div>

        {/* From Date & Time */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <DatePicker
            label="From Date"
            selectedDate={fromDate}
            setSelectedDate={setFromDate}
            customDate={fromCustomDate}
            setCustomDate={setFromCustomDate}
          />
          <TimePicker
            label="From Time"
            selectedTime={fromTime}
            setSelectedTime={setFromTime}
            options={fromTimeOptions}
            customTime={fromCustomTime}
            setCustomTime={setFromCustomTime}
          />
        </div>

        {/* To Date & Time */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <DatePicker
            label="To Date"
            selectedDate={toDate}
            setSelectedDate={setToDate}
            customDate={toCustomDate}
            setCustomDate={setToCustomDate}
          />
          <TimePicker
            label="To Time"
            selectedTime={toTime}
            setSelectedTime={setToTime}
            options={toTimeOptions}
            customTime={toCustomTime}
            setCustomTime={setToCustomTime}
          />
        </div>

        {/* Reason */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <ReasonPicker
            selectedReason={reason}
            setSelectedReason={setReason}
            customReason={customReason}
            setCustomReason={setCustomReason}
            classNumber={teacher.classNum}
          />
        </div>

        {/* Submit Button - This is the ONLY element that should trigger form submission */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl">
          <button
            type="button" // Changed to type="button" since we're not using form
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-green-600 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Approve Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaveForm;