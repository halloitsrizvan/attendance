import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import DatePicker from './DatePicker';
import { FaHome, FaSadCry } from "react-icons/fa";
import { Plus, Minus } from 'lucide-react';
import Header from '../Header/Header';
import './styles/leaveForm.css'; 
import BulkStudents from './BulkStudents';
const SelectionButton = ({ label, isSelected, onClick, type }) => (
  <button
    onClick={onClick}
    className={`w-full py-2 px-3 text-sm font-medium border rounded-lg transition-all duration-200
      ${isSelected
        ? type === "From Date" || type === "From Time" ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]'
          : type === "Reason" ? "bg-red-600 text-white border-indigo-600 shadow-md transform scale-[1.02]"
            : 'bg-green-600 text-white border-indigo-600 shadow-md transform scale-[1.02]'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }
    `}
  >
    {label}
  </button>
);

const TimePicker = ({ label, selectedTime, setSelectedTime, options, customTime, setCustomTime }) => (
  <div className="mb-6 p-2 bg-white rounded-xl shadow-inner border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{label}</h3>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
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

const ShortLeaveTimePicker = ({ fromPeriod, setFromPeriod, toPeriod, setToPeriod, fromCustomTime, setFromCustomTime, toCustomTime, setToCustomTime }) => {
  const periodOptions = Array.from({ length: 11 }, (_, i) => i); // 0 to 10

  return (
    <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-200">
      
      {/* From Period */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">From Time</label>
        <select
          value={fromPeriod}
          onChange={(e) => setFromPeriod(parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {periodOptions.map(period => (
            <option key={`from-${period}`} value={period}>
             {period==0?"Custom Time":`Period ${period}` }
            </option>
          ))}
        </select>
        
        {fromPeriod === 0 && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-indigo-600 mb-1">
              Custom From Time:
            </label>
            <input
              type="time"
              value={fromCustomTime}
              onChange={(e) => setFromCustomTime(e.target.value)}
              className="w-full border border-indigo-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* To Period */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">To Time</label>
        <select
          value={toPeriod}
          onChange={(e) => setToPeriod(parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {periodOptions.map(period => (
            <option key={`to-${period}`} value={period}>
              {period==0?"Custom Time":`Period ${period}` }
            </option>
          ))}
        </select>
        
        {toPeriod === 0 && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-indigo-600 mb-1">
              Custom To Time:
            </label>
            <input
              type="time"
              value={toCustomTime}
              onChange={(e) => setToCustomTime(e.target.value)}
              className="w-full border border-indigo-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ReasonPicker = ({ selectedReason, setSelectedReason, customReason, setCustomReason, leaveType }) => {
  const teacher = localStorage.getItem("teacher")
    ? JSON.parse(localStorage.getItem("teacher"))
    : null;
  const classNum = teacher.classNum;
  
  let reasonOptions = [];
  if(leaveType==="leave"){
      if (classNum > 4) {
      reasonOptions = ['Medical','Medical (Room)'];
    } else {
      reasonOptions = ['Medical','Medical (Room)', 'Marriage', 'Function', 'Custom'];
    }
  }else{
    reasonOptions=[,"Custom"]
  }
  

  useEffect(() => {
    console.log(reasonOptions, classNum);
  }, [reasonOptions, classNum]);

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
  const [reason, setReason] = useState('Medical');
  const [toDate, setToDate] = useState('Tomorrow');
  const [toTime, setToTime] = useState('Evening');
  const [toCustomDate, setToCustomDate] = useState('');
  const [toCustomTime, setToCustomTime] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showEndDateForMedical, setShowEndDateForMedical] = useState(false);

  // Short Leave states
  const [leaveType, setLeaveType] = useState('leave');
  const [shortLeaveStudents, setShortLeaveStudents] = useState([{ ad: '', name: '', classNum: '', student: null }]);
  const [shortLeaveFromPeriod, setShortLeaveFromPeriod] = useState(1);
  const [shortLeaveToPeriod, setShortLeaveToPeriod] = useState(1);
  const [shortLeaveFromCustomTime, setShortLeaveFromCustomTime] = useState('');
  const [shortLeaveToCustomTime, setShortLeaveToCustomTime] = useState('');
  const [shortLeaveReason, setShortLeaveReason] = useState('Custom');
  const [shortLeaveCustomReason, setShortLeaveCustomReason] = useState('');
  const [shortLeaveSuggestions, setShortLeaveSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const [shortLeaveDate,setShortLeaveDate] = useState('Today')
  const [shortLeaveCustomDate,setShortLeaveCustomDate] = useState('')
  const fromTimeOptions = ['Morning', 'Evening', 'Now', 'Clock'];
  const toTimeOptions = ['Morning', 'Evening', 'Clock'];

  useEffect(() => {
    if (teacher?.role === "teacher") {
      navigate('/leave-dashboard');
    }
  }, [teacher.role]);

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
        } else if (teacher.name === "SHANOOB HUDAWI") {
          filteredStudents = res.data.filter(std => std.CLASS === 10);
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

  // Reset showEndDateForMedical when reason changes
  useEffect(() => {
    if (reason !== 'Medical' && reason !== 'Medical (Room)') {
      setShowEndDateForMedical(true);
    } else {
      setShowEndDateForMedical(false);
    }
  }, [reason]);

  // Short Leave Functions
  const addShortLeaveStudent = () => {
    setShortLeaveStudents([...shortLeaveStudents, { ad: '', name: '', classNum: '', student: null }]);
  };

  const removeShortLeaveStudent = (index) => {
    if (shortLeaveStudents.length > 1) {
      const updatedStudents = shortLeaveStudents.filter((_, i) => i !== index);
      setShortLeaveStudents(updatedStudents);
    }
  };

  const updateShortLeaveStudent = (index, field, value) => {
    const updatedStudents = [...shortLeaveStudents];
    updatedStudents[index][field] = value;

    // If AD is updated, auto-fill name and class
    if (field === 'ad' && value) {
      const found = students.find((std) => String(std.ADNO) === String(value));
      if (found) {
        updatedStudents[index].student = found;
        updatedStudents[index].name = found["SHORT NAME"];
        updatedStudents[index].classNum = found.CLASS;
      } else {
        updatedStudents[index].student = null;
        updatedStudents[index].name = '';
        updatedStudents[index].classNum = '';
      }
    }

    setShortLeaveStudents(updatedStudents);
  };

  const getPeriodTime = (period, customTime, isFrom = true) => {
    if (period === 0 && customTime) {
      return customTime;
    }

    const timeMap = {
      1: isFrom ? "07:30" : "08:10",
      2: isFrom ? "08:10" : "08:50",
      3: isFrom ? "08:50" : "10:00",
      4: isFrom ? "10:00" : "10:40",
      5: isFrom ? "10:40" : "11:20",
      6: isFrom ? "11:30" : "12:10",
      7: isFrom ? "12:10" : "12:50",
      8: isFrom ? "14:00" : "14:40",
      9: isFrom ? "14:40" : "15:20",
      10: isFrom ? "15:20" : "16:10"
    };

    return timeMap[period] || "07:30";
  };

  const handleShortLeaveSubmit = (e) => {
    e.preventDefault();

    // Validate all students are selected
    const invalidStudents = shortLeaveStudents.filter(student => !student.ad || !student.name || !student.classNum );
    if (invalidStudents.length > 0 ||!shortLeaveCustomReason) {
      alert("Please enter all fields first.");
      return;
    }

    setLoading(true);

    const finalFromTime = getPeriodTime(shortLeaveFromPeriod, shortLeaveFromCustomTime, true);
    const finalToTime = getPeriodTime(shortLeaveToPeriod, shortLeaveToCustomTime, false);
    const finalReason = shortLeaveReason === 'Custom' ? shortLeaveCustomReason : shortLeaveReason;

    let finalDate;
    if (shortLeaveDate === 'Calendar') {
      finalDate = fromCustomDate;
    } else if (fromDate === 'Today') {
      finalDate = new Date();
    } else if (fromDate === 'Tomorrow') {
      const tomorrow = new Date();
      finalDate =  tomorrow.setDate(tomorrow.getDate() + 1);
    } else if (fromDate === 'Day After') {
      const dayAfter = new Date();
      finalDate =  dayAfter.setDate(dayAfter.getDate() + 2);
    } else {
      finalDate = new Date();
    }

    // Submit for each student
    const submitPromises = shortLeaveStudents.map(studentData => {
      const payload = {
        ad: studentData.ad,
        name: studentData.name,
        classNum: studentData.classNum,
        fromTime: finalFromTime,
        toTime: finalToTime,
        reason: finalReason,
        teacher: teacher.name,
        date:finalDate
      };

      return axios.post(`${API_PORT}/class-excused-pass`, payload);
    });

    Promise.all(submitPromises)
      .then(() => {
        console.log("All short leaves submitted successfully!");
        resetShortLeaveForm();
      })
      .catch((err) => {
        console.log("Error submitting short leaves", err);
        alert("Error submitting short leaves. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  const resetShortLeaveForm = () => {
    setShortLeaveStudents([{ ad: '', name: '', classNum: '', student: null }]);
    setShortLeaveFromPeriod(1);
    setShortLeaveToPeriod(1);
    setShortLeaveFromCustomTime('');
    setShortLeaveToCustomTime('');
    setShortLeaveReason('Custom');
    setShortLeaveCustomReason('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!ad || !name || !classNum) {
      alert("Please select a student first.");
      return;
    }

    setLoading(true);

    const getFormattedDate = (date) => date.toISOString().split('T')[0];

    const getFormattedTime = (timeOption, customTime, label = '') => {
      const pad = (n) => String(n).padStart(2, "0");

      if (timeOption === "Clock") return customTime;
      if (label === "From Time") {
        if (timeOption === "Morning") return "05:30";
        if (timeOption === "Evening") return "16:30";
      } else if (label === "To Time") {
        if (timeOption === "Morning") return "07:00";
        if (timeOption === "Evening") return "18:00";
      } else {
        if (timeOption === "Morning") return "05:30";
        if (timeOption === "Evening") return "16:30";
      }
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

    const finalFromTime = getFormattedTime(fromTime, fromCustomTime, 'From Time');
    const finalReason = reason === 'Custom' ? customReason : reason;

    // For medical reasons, set toDate and toTime to null unless user explicitly sets them
    const isMedicalReason = reason === 'Medical' || reason === 'Medical (Room)';
    
    let finalToDate = null;
    let finalToTime = null;

    // Only set toDate and toTime if it's NOT a medical reason OR if user has explicitly selected them
    if (!isMedicalReason || showEndDateForMedical) {
      // Calculate To Date only if needed
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
      } else if (toDate) {
        finalToDate = getFormattedDate(new Date());
      }

      finalToTime = getFormattedTime(toTime, toCustomTime, 'To Time');
    }

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
        // Reset form
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
        setShowEndDateForMedical(false);
      })
      .catch((err) => {
        console.log("Error submitting leave", err);
        alert("Error submitting leave. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };


  const [showBulkModal, setShowBulkModal] = useState(false);
  const [Bulkstudents, setBulkStudents] = useState([]);
  const [classValue, setClassValue] = useState(teacher?.classNum || "3"); 
  const [selectedBulkStudents, setSelectedBulkStudents] = useState([]);
// Update Bulkstudents when classValue OR students changes
      useEffect(() => { 
        if (students.length > 0) {
          const filteredStudents = students
            .filter(student => student.CLASS == classValue)
            .map((student, index) => ({
              SL: student.SL,
              ADNO: student.ADNO,
              "SHORT NAME": student["SHORT NAME"],
              CLASS: student.CLASS,
              selected: false
            }));
            filteredStudents.sort((a, b) => a.SL - b.SL);
          setBulkStudents(filteredStudents);
        } else {
          setBulkStudents([]);
        }
      }, [classValue, students]);

      const handleSelectAll = () => {
      const allStudents = Bulkstudents.map(student => ({
        ADNO: student.ADNO,
        name: student["SHORT NAME"],
        classNum: student.CLASS
      }));
      setSelectedBulkStudents(allStudents);
    };
      // Also, update the initial classValue to be dynamic based on teacher

      let classValues = []; 
      if (teacher.role === "class_teacher") {
        classValues = [teacher.classNum];
      } else if (teacher.role === "HOD") {
        classValues = [8, 9, 10];
      } else if (teacher.role === "HOS") {
        classValues = [5, 6, 7];
      } else {
        classValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      }
 
      const handleRemoveBulkStudent = (adno) => {
        setSelectedBulkStudents(prev => prev.filter(student => student.ADNO !== adno));
      };
      const handleAdd = (student) => {
        const isAlreadyAdded = selectedBulkStudents.some(s => s.ADNO === student.ADNO);
        
        if (!isAlreadyAdded) {
          // Add student to selected list
          setSelectedBulkStudents(prev => [...prev, {
            ADNO: student.ADNO,
            name: student["SHORT NAME"],
            classNum: student.CLASS
          }]);
        }
      };
const handleBulkSubmit = async () => {
  if (selectedBulkStudents.length === 0) {
    alert("Please select at least one student.");
    return;
  }

  // Use the same validation as regular form
  if (!reason) {
    alert("Please select a reason.");
    return;
  }

  setLoading(true);

  const getFormattedDate = (date) => date.toISOString().split('T')[0];

  const getFormattedTime = (timeOption, customTime, label = '') => {
    const pad = (n) => String(n).padStart(2, "0");

    if (timeOption === "Clock") return customTime;
    if (label === "From Time") {
      if (timeOption === "Morning") return "05:30";
      if (timeOption === "Evening") return "16:30";
    } else if (label === "To Time") {
      if (timeOption === "Morning") return "07:00";
      if (timeOption === "Evening") return "18:00";
    } else {
      if (timeOption === "Morning") return "05:30";
      if (timeOption === "Evening") return "16:30";
    }
    if (timeOption === "Now") {
      const now = new Date();
      return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    return "07:30";
  };

  // Calculate From Date (same as regular form)
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

  const finalFromTime = getFormattedTime(fromTime, fromCustomTime, 'From Time');
  const finalReason = reason === 'Custom' ? customReason : reason;

  // For medical reasons, set toDate and toTime to null unless user explicitly sets them
  const isMedicalReason = reason === 'Medical' || reason === 'Medical (Room)';
  
  let finalToDate = null;
  let finalToTime = null;

  // Only set toDate and toTime if it's NOT a medical reason OR if user has explicitly selected them
  if (!isMedicalReason || showEndDateForMedical) {
    // Calculate To Date only if needed
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
    } else if (toDate) {
      finalToDate = getFormattedDate(new Date());
    }

    finalToTime = getFormattedTime(toTime, toCustomTime, 'To Time');
  }

  // Create an array of promises for all selected students
  const submitPromises = selectedBulkStudents.map(studentData => {
    const payload = {
      ad: studentData.ADNO,
      name: studentData.name,
      classNum: studentData.classNum,
      fromDate: finalFromDate,
      fromTime: finalFromTime,
      toDate: finalToDate, 
      toTime: finalToTime,
      reason: finalReason,
      teacher: teacher.name,
      status: "Scheduled"
    };

    return axios.post(`${API_PORT}/leave`, payload);
  });

  try {
    // Submit all leaves at once
    await Promise.all(submitPromises);
    
    console.log("All bulk leaves submitted successfully!");
    
    // Reset bulk form
    setSelectedBulkStudents([]);
    setShowBulkModal(false);
    
    // Reset regular form as well (optional)
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
    setShowEndDateForMedical(false);
    
    alert(`Successfully submitted ${selectedBulkStudents.length} leave(s)!`);
  } catch (error) {
    console.error("Error submitting bulk leaves:", error);
    alert("Error submitting bulk leaves. Please try again.");
  } finally {
    setLoading(false);
  }
};
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
         <Header/>
          {/* <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold animate-pulse">Processing...</p>
          </div> */}
          {/* <div className="loader">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div> */}
          <div className="boxes">
            <div className="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div className="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div className="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div className="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white text-base font-medium shadow-sm hover:bg-green-600 transition"
          onClick={() => navigate(`/leave-dashboard`)}
        >
          <FaHome /> Leave Dashboard
        </button>
       {["HOD","HOS","super_admin"].includes(teacher.role) 
       &&
       <button
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500 text-white text-base font-medium shadow-sm hover:bg-blue-600 transition"
          onClick={() => {
            if (leaveType === "leave") {
              setLeaveType('short-leave')
            } else {
              setLeaveType('leave')
            }
          }}
        >
          {leaveType === "leave" ? "Class Excused Pass" : "Leave"}
        </button>}
      </div>

      {leaveType === "leave" ? (
        <div className="max-w-xl mx-auto space-y-8 pb-16">
          {/* Regular Leave Form */}
         {!showBulkModal && <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
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
                  <button className='mt-3 ml-8 comic-button '
                  onClick={()=>{
                    if(showBulkModal){
                      setShowBulkModal(false)
                    }else{  
                    setShowBulkModal(true)}}
                  }
                  > Bulk</button>
                </div>


              <div className="col-span-2">
                <label htmlFor="name" className="block text-xs font-medium text-gray-500 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled
                  className={`w-full border border-gray-300 rounded-lg p-2 text-sm ${student ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  placeholder="Student Name"
                />
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
                  className={`w-full border border-gray-300 rounded-lg p-2 text-sm ${student ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  placeholder="00"
                />
              </div>

            </div>
          </div>}
      {showBulkModal && 
  <div className="min-h-screen sm:p-8 flex justify-center items-start font-sans mt-4">
    {/* Card that holds the UI */}
    <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-lg w-full max-w-md backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center space-x-2">
          <label htmlFor="classInput" className="text-gray-700 font-medium text-lg">
            Class
          </label>
          <select 
            value={classValue}
            onChange={(e) => setClassValue(e.target.value)}
            className='bg-white border border-gray-400 rounded-md px-3 py-1.5 w-18 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500'>
            {classValues.map((item,index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
         {/* <button 
          onClick={handleSelectAll}
          className="px-3 py-1 ml-8 bg-blue-500 text-white text-base rounded-lg hover:bg-blue-600 transition"
        >
          Select All
        </button> */}
        <button className='comic-button mr-2'
          onClick={() => setShowBulkModal(false)}>
          Regular
        </button>
      </div>

      {/* Selected Students Summary */}
      {selectedBulkStudents.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700">
              Selected: {selectedBulkStudents.length} student(s)
            </span>
            <button
              onClick={() => setSelectedBulkStudents([])}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedBulkStudents.map((student) => (
              <div key={student.ADNO} className="flex items-center gap-1 bg-white border border-blue-300 rounded-full px-2 py-1 text-xs">
                <span>{student.ADNO} - {student.name}</span>
                <button
                  onClick={() => handleRemoveBulkStudent(student.ADNO)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-500 shadow-inner">
        <table className="w-full border-collapse">
          <thead className="bg-gray-300">
            <tr>
              <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/6">Sl</th>
              <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/6">Ad</th>
              <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/2">Name</th>
              <th className="p-3 text-center font-bold text-gray-800 border-b-2 border-gray-500 w-1/6">
                <span 
                onClick={handleSelectAll}
                className="w-16 h-8 flex items-center justify-center bg-white text-gray-600 rounded-md transition-colors text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer">
                  +
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Bulkstudents.length > 0 ? (
              Bulkstudents.map((student) => {
                const isSelected = selectedBulkStudents.some(s => s.ADNO === student.ADNO);
                return (
                  <tr key={student.ADNO} className="bg-white border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                    <td className="p-3 text-center text-gray-700 border-r border-gray-300 w-1/6">{student.SL}</td>
                    <td className="p-3 text-center text-gray-700 border-r border-gray-300 w-1/6">{student.ADNO}</td>
                    <td className="p-3 text-left text-gray-900 border-r border-gray-300 w-1/2">{student["SHORT NAME"]}</td>
                    <td className="p-3 text-center w-1/6">
                     <button
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveBulkStudent(student.ADNO);
                          } else {
                            handleAdd(student);
                          }
                        }}
                        className={`
                          flex items-center cursor-pointer font-medium text-white text-[12px]
                          px-[1.1em] py-[0.7em]
                          rounded-[20em] tracking-wide 
                          border-none
                          ${isSelected 
                            ? 'bg-gradient-to-t from-[rgba(100,100,100,1)] to-[rgba(200,200,200,1)] text-gray-300 cursor-not-allowed shadow-[0_0.7em_1.5em_-0.5em_#88888898]' 
                            : 'bg-gradient-to-t from-[rgba(20,167,62,1)] to-[rgba(102,247,113,1)] shadow-[0_0.7em_1.5em_-0.5em_#14a73e98] hover:shadow-[0_0.5em_1.5em_-0.5em_#14a73e98] active:shadow-[0_0.3em_1em_-0.5em_#14a73e98]'
                          }
                        `}
                        disabled={isSelected}
                      >
                        {isSelected ? (
                          <>
                            {/* <svg
                              height="20"
                              width="20"
                              viewBox="0 0 24 24"
                              className="mr-[6px]"
                              fill="currentColor"
                            >
                              <path d="M0 0h24v24H0z" fill="none"></path>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                            </svg> */}
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            {/* <svg
                              height="20"
                              width="20"
                              viewBox="0 0 24 24"
                              className="mr-[6px]"
                              fill="currentColor"
                            >
                              <path d="M0 0h24v24H0z" fill="none"></path>
                              <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"></path>
                            </svg> */}
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No students found in Class {classValue}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

     
    </div>
  </div>
}
          {/* Reason */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <ReasonPicker
              selectedReason={reason}
              setSelectedReason={setReason}
              customReason={customReason}
              setCustomReason={setCustomReason}
              leaveType={leaveType}
            />
          </div>

          {/* From Date & Time */}
          <div className=" bg-white p-4 rounded-2xl shadow-lg">
          <h2 className='p-2'>From Date & Time</h2>

          <div className='grid grid-cols-2  gap-1'>
           <div className='grid grid-cols-1'>
            <DatePicker
              label=""
              selectedDate={fromDate}
              setSelectedDate={setFromDate}
              customDate={fromCustomDate}
              setCustomDate={setFromCustomDate}
              />

           </div>
            <div className='grid grid-cols-1'>
            <TimePicker
              label=""
              selectedTime={fromTime}
              setSelectedTime={setFromTime}
              options={fromTimeOptions}
              customTime={fromCustomTime}
              setCustomTime={setFromCustomTime}
            />
           </div>
              </div>
          </div>

          {/* Conditional To Date & Time */}
          {(reason !== 'Medical' && reason !== 'Medical (Room)') || showEndDateForMedical ? (
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className='p-2'>To Date & Time</h2>
          <div className='grid grid-cols-2  gap-1'>
           <div className='grid grid-cols-1'>
              <DatePicker
                label=""
                selectedDate={toDate}
                setSelectedDate={setToDate}
                customDate={toCustomDate}
                setCustomDate={setToCustomDate}
              />
              </div>
            <div className='grid grid-cols-1'>
              <TimePicker
                label=""
                selectedTime={toTime}
                setSelectedTime={setToTime}
                options={toTimeOptions}
                customTime={toCustomTime}
                setCustomTime={setToCustomTime}
              />
               </div>
              </div>
            </div>
          ) : (
            // Show button to add end date for medical reasons
            (reason === 'Medical' || reason === 'Medical (Room)') && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 text-center">
                <p className="text-gray-600 mb-4">Medical leave - No end date needed</p>
                <button
                  type="button"
                  onClick={() => setShowEndDateForMedical(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  + Add End Date (Optional)
                </button>
              </div>
            )
          )}

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl">
            <button
              type="button"
              onClick={(e)=>{
                if(showBulkModal){
                   handleBulkSubmit();
                }else{
                  handleSubmit(e);
                }
              } }
              disabled={loading}
              className="w-full py-3 bg-green-500 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-green-600 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Approve Leave '}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-2 pb-16">
          {/* Short Leave Form */}
          {shortLeaveStudents.map((studentData, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 relative">
              {shortLeaveStudents.length > 1 && (
                <button
                  onClick={() => removeShortLeaveStudent(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <Minus size={16} />
                </button>
              )}

              <div className="grid grid-cols-7 gap-2">
                <div className="col-span-3 relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    AD / Name
                  </label>
                  <input
                    type="text"
                    value={studentData.ad}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      updateShortLeaveStudent(index, 'ad', value);

                      if (value === "") {
                        setShortLeaveSuggestions([]);
                        setActiveSuggestionIndex(null);
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

                      setShortLeaveSuggestions(filtered.slice(0, 5));
                      setActiveSuggestionIndex(index);
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="AD / Name"
                  />

                  {activeSuggestionIndex === index && shortLeaveSuggestions.length > 0 && (
                    <div className="absolute bg-white border border-gray-200 mt-1 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-full">
                      {shortLeaveSuggestions.map((s) => (
                        <div
                          key={s.ADNO}
                          className="px-3 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
                          onClick={() => {
                            updateShortLeaveStudent(index, 'ad', s.ADNO);
                            setShortLeaveSuggestions([]);
                            setActiveSuggestionIndex(null);
                          }}
                        >
                          <span className="font-medium">{s.ADNO}</span> – {s["SHORT NAME"]} – {s.CLASS}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Class
                  </label>
                  <input
                    type="text"
                    value={studentData.classNum}
                    onChange={(e) => updateShortLeaveStudent(index, 'classNum', e.target.value)}
                    disabled
                    className={`w-full border border-gray-300 rounded-lg p-2 text-sm ${studentData.student ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    placeholder="00"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={studentData.name}
                    onChange={(e) => updateShortLeaveStudent(index, 'name', e.target.value)}
                    disabled
                    className={`w-full border border-gray-300 rounded-lg p-2 text-sm ${studentData.student ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    placeholder="Student Name"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Student Button */}
          <div className="flex justify-center">
            <button
              onClick={addShortLeaveStudent}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-base font-medium shadow-sm hover:bg-green-700 transition"
            >
              <Plus size={16} /> Add Student
            </button>
          </div>

          <DatePicker
            label="Date"
            selectedDate={shortLeaveDate}
            setSelectedDate={setShortLeaveDate}
            customDate={shortLeaveCustomDate}
            setCustomDate={setShortLeaveCustomDate}
          />

          {/* Short Leave Time Picker */}
          <ShortLeaveTimePicker
            fromPeriod={shortLeaveFromPeriod}
            setFromPeriod={setShortLeaveFromPeriod}
            toPeriod={shortLeaveToPeriod}
            setToPeriod={setShortLeaveToPeriod}
            fromCustomTime={shortLeaveFromCustomTime}
            setFromCustomTime={setShortLeaveFromCustomTime}
            toCustomTime={shortLeaveToCustomTime}
            setToCustomTime={setShortLeaveToCustomTime}
          />

          {/* Reason */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <ReasonPicker
              selectedReason={shortLeaveReason}
              setSelectedReason={setShortLeaveReason}
              customReason={shortLeaveCustomReason}
              setCustomReason={setShortLeaveCustomReason}
              leaveType={leaveType}
            />
          </div>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl">
            <button
              type="button"
              onClick={handleShortLeaveSubmit}
              disabled={loading}
              className="w-full py-3 bg-green-500 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-green-600 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Approve Class Excused Pass'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveForm;