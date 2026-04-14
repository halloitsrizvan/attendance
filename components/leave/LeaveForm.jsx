"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import axios from 'axios';
import { API_PORT } from '../../Constants';
import BulkStudents from './BulkStudents';
import CustomAlert from '../common/CustomAlert';
import DatePicker from './DatePicker';
import SelectionButton from './SelectionButton';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => { }, removeItem: () => { } };

import { FaHome, FaSadCry } from "react-icons/fa";
import { Plus, Minus, Calendar, Clock, CalendarClock, X, Database } from 'lucide-react';
import Header from '../Header/Header';
import './styles/leaveForm.css';

const TimePicker = ({ label, selectedTime, setSelectedTime, options, customTime, setCustomTime, type, disabled }) => (
  <div className={`space-y-3 ${disabled ? 'pointer-events-none' : ''}`}>
    {label && (
      <div className="flex items-center gap-2 px-1">
        <Clock size={12} className="text-slate-400" />
        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</h3>
      </div>
    )}
    <div className="grid grid-cols-4 gap-2">
      {options.map(option => (
        <SelectionButton
          key={option}
          type={type || label}
          label={option}
          isSelected={selectedTime === option}
          onClick={() => {
            if (disabled) return;
            setSelectedTime(option);
            if (option !== 'Clock') {
              setCustomTime('');
            }
          }}
          disabled={disabled}
        />
      ))}
    </div>
    {selectedTime === 'Clock' && (
      <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
        <input
          id={`${label}-time-input`}
          type="time"
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          disabled={disabled}
          className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all ${disabled ? 'opacity-50' : ''}`}
        />
      </div>
    )}
  </div>
);

const ShortLeaveTimePicker = ({ fromPeriod, setFromPeriod, toPeriod, setToPeriod, fromCustomTime, setFromCustomTime, toCustomTime, setToCustomTime }) => {
  const periodOptions = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">From Period</label>
          <select
            value={fromPeriod}
            onChange={(e) => setFromPeriod(parseInt(e.target.value))}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white transition-all outline-none appearance-none"
          >
            {periodOptions.map(period => (
              <option key={`from-${period}`} value={period}>
                {period === 0 ? "Custom" : `Period ${period}`}
              </option>
            ))}
          </select>
          {fromPeriod === 0 && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                type="time"
                value={fromCustomTime}
                onChange={(e) => setFromCustomTime(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">To Period</label>
          <select
            value={toPeriod}
            onChange={(e) => setToPeriod(parseInt(e.target.value))}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white transition-all outline-none appearance-none"
          >
            {periodOptions.map(period => (
              <option key={`to-${period}`} value={period}>
                {period === 0 ? "Custom" : `Period ${period}`}
              </option>
            ))}
          </select>
          {toPeriod === 0 && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                type="time"
                value={toCustomTime}
                onChange={(e) => setToCustomTime(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TemplatePicker = ({ selectedTemplate, setSelectedTemplate, onTemplateSelect, setShowEndDateForMedical }) => {
  const templates = [
    { id: 'today-tmw-eve', label: 'Today Eve - Tmrw Eve' },
    { id: 'today-tmw-morn', label: 'Today Eve - Tmrw Morn' },
    { id: 'tmrw-dayafter-eve', label: 'Tmrw Eve - DayAfter Eve' },
    { id: 'thu-fri-eve', label: 'Thu Eve - Fri Eve' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Quick Templates</h3>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setShowEndDateForMedical(false);
          }}
          className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {templates.map(t => (
          <SelectionButton
            key={t.id}
            label={t.label}
            type={'Template'}
            isSelected={selectedTemplate === t.id}
            onClick={() => {
              setSelectedTemplate(t.id);
              onTemplateSelect(t.id);
              setShowEndDateForMedical(true);
            }}
          />
        ))}
      </div>
    </div>
  );
};

const ReasonPicker = ({ selectedReason, setSelectedReason, customReason, setCustomReason, leaveType, teacher, disabled }) => {
  const classNum = teacher?.classNum;

  let reasonOptions = [];
  const classTeacher_reasons_for_primary = ['Medical (Home)', 'Room', 'Marriage', 'Hospital', 'Urgent (Death)', 'Custom'];
  const classTeacher_reasons_for_s5_ss_d = ['Medical (Home)', 'Room', 'Hospital', 'Urgent (Death)'];
  const teacher_reasons_for_hos_hod = ['Medical (Home)', 'Room', 'Marriage', 'Custom'];
  const super_admin_reasons = ['Medical (Home)', 'Room', 'Marriage', 'Custom'];
  if (leaveType === "leave") {
    if (teacher?.role?.includes("super_admin")) {
      reasonOptions = super_admin_reasons;
    } else if (teacher?.classNum) {
      if (teacher?.classNum <= 4) {
        reasonOptions = classTeacher_reasons_for_primary;
      } else {
        reasonOptions = classTeacher_reasons_for_s5_ss_d;
      }
    } else if (teacher?.role?.includes("HOD") || teacher?.role?.includes("HOS")) {
      reasonOptions = teacher_reasons_for_hos_hod;
    } else {
      reasonOptions = ['Custom'];
    }
  } else {
    reasonOptions = ["Custom"];
  }


  return (
    <div className={`space-y-4 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Select Reason</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-3">
        {reasonOptions.map(option => (
          <SelectionButton
            key={option}
            label={option}
            type={'Reason'}
            isSelected={selectedReason === option}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setSelectedReason(option);
              if (option !== 'Custom') {
                setCustomReason('');
              }
            }}
          />
        ))}
      </div>
      {selectedReason === 'Custom' && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <input
            id="custom-reason-input"
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            disabled={disabled}
            className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all ${disabled ? 'opacity-50' : ''}`}
            placeholder="Type your reason here..."
          />
        </div>
      )}
    </div>
  );
};

function LeaveForm({ initialStudents = null, initialLeaves = null }) {
  const [teacher, setTeacher] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create', 'extend', 'add', 'schedule'
  const [activeLeave, setActiveLeave] = useState(null);

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

  const navigate = useRouter();

  // States
  const [ad, setAd] = useState('');
  const [student, setStudent] = useState(null);
  const [name, setName] = useState('');
  const [classNum, setClassNum] = useState('');
  const [students, setStudents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leaveData, setLeaveData] = useState(initialLeaves || []);
  const [originalToDate, setOriginalToDate] = useState('');
  const [originalToTime, setOriginalToTime] = useState('');

  // Form states
  const [fromDate, setFromDate] = useState('Today');
  const [fromTime, setFromTime] = useState('Evening');
  const [fromCustomDate, setFromCustomDate] = useState('');
  const [fromCustomTime, setFromCustomTime] = useState('');
  const [reason, setReason] = useState('Medical (Home)');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [toDate, setToDate] = useState('Tomorrow');
  const [toTime, setToTime] = useState('Evening');
  const [toCustomDate, setToCustomDate] = useState('');
  const [toCustomTime, setToCustomTime] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showEndDateForMedical, setShowEndDateForMedical] = useState(false);

  // Short Leave states
  const [leaveType, setLeaveType] = useState('leave'); // 'leave' or 'short'

  const handleTemplateSelect = (templateId) => {
    switch (templateId) {
      case 'today-tmw-eve':
        setFromDate('Today');
        setFromTime('Evening');
        setToDate('Tomorrow');
        setToTime('Evening');
        break;
      case 'today-tmw-morn':
        setFromDate('Today');
        setFromTime('Evening');
        setToDate('Tomorrow');
        setToTime('Morning');
        break;
      case 'tmrw-dayafter-eve':
        setFromDate('Tomorrow');
        setFromTime('Evening');
        setToDate('Day After');
        setToTime('Evening');
        break;
      case 'thu-fri-eve': {
        const now = new Date();
        const day = now.getDay();

        // Calculate Thursday (4) and Friday (5)
        let Thu = new Date(now);
        Thu.setDate(now.getDate() + (4 - day));

        let Fri = new Date(now);
        Fri.setDate(now.getDate() + (5 - day));

        // If today is Friday or later, move to next week's Thu/Fri
        if (day >= 5) {
          Thu.setDate(Thu.getDate() + 7);
          Fri.setDate(Fri.getDate() + 7);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        const tmrwStr = tmrw.toISOString().split('T')[0];
        
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];

        const thuStr = Thu.toISOString().split('T')[0];
        const friStr = Fri.toISOString().split('T')[0];

        // Helper to set date state correctly matching DatePicker options
        const setDateHelper = (dateStr, setDateFn, setCustomFn) => {
          if (dateStr === todayStr) {
            setDateFn('Today');
            setCustomFn('');
          } else if (dateStr === tmrwStr) {
            setDateFn('Tomorrow');
            setCustomFn('');
          } else if (dateStr === dayAfterStr) {
            setDateFn('Day After');
            setCustomFn('');
          } else {
            setDateFn('Calendar');
            setCustomFn(dateStr);
          }
        };

        setDateHelper(thuStr, setFromDate, setFromCustomDate);
        setFromTime('Evening');

        setDateHelper(friStr, setToDate, setToCustomDate);
        setToTime('Evening');
        break;
      }
      default:
        break;
    }
  };

  const [shortLeaveStudents, setShortLeaveStudents] = useState([{ ad: '', name: '', classNum: '', student: null }]);
  const [shortLeaveFromPeriod, setShortLeaveFromPeriod] = useState(1);
  const [shortLeaveToPeriod, setShortLeaveToPeriod] = useState(1);
  const [shortLeaveFromCustomTime, setShortLeaveFromCustomTime] = useState('');
  const [shortLeaveToCustomTime, setShortLeaveToCustomTime] = useState('');
  const [cepMode, setCepMode] = useState('period'); // 'period' or 'dars'
  const [shortLeaveReason, setShortLeaveReason] = useState('Custom');
  const [shortLeaveCustomReason, setShortLeaveCustomReason] = useState('');
  const [shortLeaveSuggestions, setShortLeaveSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const [shortLeaveDate, setShortLeaveDate] = useState('Today')
  const [shortLeaveCustomDate, setShortLeaveCustomDate] = useState('')
  const fromTimeOptions = ['Morning', 'Evening', 'Now', 'Clock'];
  const toTimeOptions = ['Morning', 'Evening', 'Clock'];
  const [academicYear, setAcademicYear] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [startImmediately, setStartImmediately] = useState(false);

  useEffect(() => {
    axios.get(`${API_PORT}/settings`)
      .then(res => {
        if (res.data.academicYear) setAcademicYear(res.data.academicYear);
        if (res.data.academicYearId) setAcademicYearId(res.data.academicYearId);
      })
      .catch(err => console.error("Error fetching academic year:", err));
  }, []);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info', actions: null });

  const showAlert = (message, title = "Notice", type = "info", actions = null) => {
    setAlertState({ isOpen: true, title, message, type, actions });
  };

  useEffect(() => {
    if (teacher?.role?.includes("teacher") && teacher?.role?.length === 1) {
      navigate.push('/leave-dashboard');
    }
  }, [teacher?.role]);

  // Fetch all students based on teacher role
  useEffect(() => {
    if (initialStudents) {
      let filteredStudents = initialStudents;
      if (teacher && teacher?.role?.includes("super_admin")) {
        // Super admin sees all students
      } else if (teacher && teacher?.role?.includes("class_teacher")) {
        filteredStudents = initialStudents.filter(std => std.CLASS === teacher.classNum);
      } else if (teacher && teacher?.role?.includes("HOD")) {
        filteredStudents = initialStudents.filter(std => [8, 9, 10].includes(std.CLASS));
      } else if (teacher && teacher?.role?.includes("HOS")) {
        filteredStudents = initialStudents.filter(std => [1, 2, 3, 4, 5, 6, 7].includes(std.CLASS));
      }
      setStudents(filteredStudents);
      return;
    }

    setLoading(true);
    axios.get(`${API_PORT}/students`)
      .then((res) => {
        let filteredStudents = res.data;
        if (teacher && teacher?.role?.includes("super_admin")) {
          // Super admin sees all students
        } else if (teacher && teacher?.role?.includes("class_teacher")) {
          filteredStudents = res.data.filter(std => std.CLASS === teacher.classNum);
        } else if (teacher && teacher?.role?.includes("HOD")) {
          filteredStudents = res.data.filter(std => [8, 9, 10].includes(std.CLASS));
        } else if (teacher && teacher?.role?.includes("HOS")) {
          filteredStudents = res.data.filter(std => [5, 6, 7].includes(std.CLASS));
        }
        setStudents(filteredStudents);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [teacher?.role, teacher?.classNum, initialStudents]);

  const formatTimeTo12h = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours);
      const m = minutes || '00';
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const getRelativeDate = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date().toISOString().split('T')[0];
    const tmw = new Date(); tmw.setDate(tmw.getDate() + 1);
    const tomorrow = tmw.toISOString().split('T')[0];
    const da = new Date(); da.setDate(da.getDate() + 2);
    const dayAfter = da.toISOString().split('T')[0];
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yesterday = yest.toISOString().split('T')[0];

    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    if (dateStr === dayAfter) return "Day After";
    if (dateStr === yesterday) return "Yesterday";
    
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleMarkReturned = async (leave) => {
    setLoading(true);
    try {
      const payload = { 
        status: 'returned', 
        markReturnedTeacher: teacher?.name || 'Unknown',
        returnedAt: new Date().toISOString() 
      };
      await axios.put(`${API_PORT}/leave/${leave._id}`, payload);
      await axios.patch(`${API_PORT}/students/on-leave/${leave.studentId?.ADNO || leave.ad}`, { onLeave: false });
      
      // Refresh local data
      const res = await axios.get(`${API_PORT}/leave`);
      setLeaveData(res.data);
      
      setAd('');
      setAlertState(prev => ({ ...prev, isOpen: false }));
      showAlert(`${leave.studentId?.['SHORT NAME'] || 'Student'} marked as returned.`, "Success", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartLeave = async (leave) => {
    setLoading(true);
    try {
      const payload = { 
        status: 'active', 
        leaveStartTeacher: teacher?.name || 'Unknown' 
      };
      await axios.put(`${API_PORT}/leave/${leave._id}`, payload);
      await axios.patch(`${API_PORT}/students/on-leave/${leave.studentId?.ADNO || leave.ad}`, { onLeave: true });
      
      const res = await axios.get(`${API_PORT}/leave`);
      setLeaveData(res.data);

      setAd('');
      setAlertState(prev => ({ ...prev, isOpen: false }));
      showAlert(`Leave started for ${leave.studentId?.['SHORT NAME'] || 'student'}.`, "Success", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to start leave.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoomToMedical = async (leave) => {
    setLoading(true);
    try {
      const now = new Date();
      // 1. Return from room
      await axios.put(`${API_PORT}/leave/${leave._id}`, {
        status: 'returned',
        markReturnedTeacher: teacher?.name || 'Unknown',
        returnedAt: now.toISOString()
      });

      // 2. Create medical leave
      const sid = (leave.studentId && typeof leave.studentId === 'object') ? leave.studentId._id : leave.studentId;
      await axios.post(`${API_PORT}/leave`, {
        studentId: sid,
        teacherId: teacher?.id || teacher?._id,
        fromDate: now.toISOString().split('T')[0],
        fromTime: now.toTimeString().substring(0, 5),
        reason: 'Medical (Home)',
        status: 'active',
        leaveStartTeacher: teacher?.name || 'Unknown',
        academicYearId: academicYearId || undefined
      });

      await axios.patch(`${API_PORT}/students/on-leave/${leave.studentId?.ADNO || leave.ad}`, { onLeave: true });
      
      const res = await axios.get(`${API_PORT}/leave`);
      setLeaveData(res.data);

      setAd('');
      setAlertState(prev => ({ ...prev, isOpen: false }));
      showAlert("Student transitioned to Medical Home leave.", "Success", "success");
    } catch (err) {
      console.error(err);
      showAlert("Transition failed.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch leave data
  useEffect(() => {
    if (initialLeaves) return;

    axios.get(`${API_PORT}/leave`)
      .then((res) => {
        setLeaveData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching leaves data:", err);
      });
  }, [initialLeaves]);

  const checkLeaveStatus = (studentAd) => {
    try {
      const studentObj = students.find(s => String(s.ADNO) === String(studentAd));
      if (!studentObj) return false;

      // Filter leaves for this student by matching studentId
      const studentLeaves = leaveData.filter(leave => {
        const leaveStudentId = typeof leave.studentId === 'object' ? leave.studentId?._id : leave.studentId;
        return String(leaveStudentId) === String(studentObj._id);
      });

      if (studentLeaves.length === 0) return false;

      // Sort by creation time (descending) to get the latest document
      studentLeaves.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : null;
        const dateB = b.createdAt ? new Date(b.createdAt) : null;
        if (dateA && dateB) return dateB - dateA;
        if (a._id && b._id) return a._id < b._id ? 1 : -1;
        return 0;
      });

      const latestLeave = studentLeaves[0];
      // console.log(`Latest leave for ${studentAd}:`, latestLeave);

      // Check if the latest leave is NOT returned
      const status = latestLeave.status ? latestLeave.status.toLowerCase() : '';

      return status !== 'returned' ? latestLeave : null;
    } catch (error) {
      console.error("Error checking leave status:", error);
      return null;
    }
  };

  const getActiveLeaveDays = (fromDateStr, fromTimeStr, returnedAt) => {
    const start = new Date(`${fromDateStr}T${fromTimeStr}`);
    const end = new Date(returnedAt);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let count = 0;
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (current <= endDay) {
      if (current.getDay() !== 5) { // Skip Fridays
        const dayStart = new Date(current);
        dayStart.setHours(7, 0, 0, 0);
        const dayEnd = new Date(current);
        dayEnd.setHours(16, 0, 0, 0);
        
        const overlapStart = start > dayStart ? start : dayStart;
        const overlapEnd = end < dayEnd ? end : dayEnd;
        
        if (overlapStart < overlapEnd) {
          count++;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const checkRecoveryStatus = (studentAd) => {
    try {
      const studentObj = students.find(s => String(s.ADNO) === String(studentAd));
      if (!studentObj) return true;

      const studentLeaves = leaveData.filter(leave => {
        const leaveStudentId = typeof leave.studentId === 'object' ? leave.studentId?._id : leave.studentId;
        const isStudentMatch = String(leaveStudentId) === String(studentObj._id);
        const isReturned = leave.status === 'returned' || (leave.status && leave.status.toLowerCase() === 'returned');
        return isStudentMatch && isReturned;
      });

      if (studentLeaves.length === 0) return true;

      // Sort by returnedAt desc to get the most recent return
      studentLeaves.sort((a, b) => {
        const dateA = a.returnedAt ? new Date(a.returnedAt) : new Date(0);
        const dateB = b.returnedAt ? new Date(b.returnedAt) : new Date(0);
        return dateB - dateA;
      });

      const lastReturn = studentLeaves[0];
      if (lastReturn.recovery) return true;

      // Calculate active leave days
      const leaveDays = getActiveLeaveDays(lastReturn.fromDate, lastReturn.fromTime, lastReturn.returnedAt);
      
      // If no class days were missed, recovery is effectively complete
      if (leaveDays === 0) return true;

      const graceDays = leaveDays * 2;
      const returned = new Date(lastReturn.returnedAt);
      const deadline = new Date(returned.getTime() + (graceDays * 24 * 60 * 60 * 1000));
      const now = new Date();

      if (now > deadline) {
        return false; // Recovery not completed and deadline passed
      }
      return true;
    } catch (error) {
      console.error("Error checking recovery status:", error);
      return true;
    }
  };

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
      setName(found["SHORT NAME"] || found["FULL NAME"] || found.name || "Unknown");
      setClassNum(found.CLASS);
      
      const activeRecord = checkLeaveStatus(found.ADNO);
      if (activeRecord) {
        const now = new Date();
        const fromDateTime = new Date(`${activeRecord.fromDate}T${activeRecord.fromTime}`);
        const isScheduled = now < fromDateTime;
        const isRoom = activeRecord.reason === 'Room' || activeRecord.reason === 'Medical (Room)';

        const leaveInfo = (
          <div className="space-y-4 text-left p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
             <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</span>
                   <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-[10px] font-black uppercase">
                     {activeRecord.reason}
                   </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Started</div>
                      <div className="text-xs font-bold text-slate-700">{getRelativeDate(activeRecord.fromDate)} • {formatTimeTo12h(activeRecord.fromTime)}</div>
                   </div>
                   {activeRecord.toDate && (
                     <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Ending</div>
                        <div className="text-xs font-bold text-slate-700">{getRelativeDate(activeRecord.toDate)} • {formatTimeTo12h(activeRecord.toTime)}</div>
                     </div>
                   )}
                </div>
             </div>
             <div className="pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500 italic">
               What would you like to do with this record?
             </div>
          </div>
        );

        setActiveLeave(activeRecord);
        
        const popupButtons = [
          { 
            label: isScheduled ? "Start Leave Now" : (isRoom ? "Return to Class" : "Mark Returned"), 
            onClick: () => isScheduled ? handleStartLeave(activeRecord) : handleMarkReturned(activeRecord),
            className: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
          }
        ];

        // Add "Medical Home" transition for Room patients
        if (isRoom) {
          popupButtons.push({
            label: "Move to Medical Home",
            onClick: () => handleRoomToMedical(activeRecord),
            className: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
          });
        }

        popupButtons.push(
          { 
            label: isScheduled ? "Modify Scheduled" : "Extend Leave", 
            onClick: () => handleExtendMode(activeRecord),
            className: "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
          },
          { 
            label: "Add Another Reason", 
            onClick: () => handleAddReasonMode(activeRecord), 
            className: "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
          },
          { 
            label: "Schedule Future Leave", 
            onClick: () => handleScheduleNextMode(activeRecord),
            className: "bg-violet-500 hover:bg-violet-600 shadow-violet-500/20"
          }
        );

        showAlert(
          leaveInfo, 
          isScheduled ? `${found["SHORT NAME"]} has Scheduled Leave` : `${found["SHORT NAME"]} is Already on Leave`, 
          isScheduled ? "info" : "warning",
          popupButtons
        );
        return;
      }
      
      if (!checkRecoveryStatus(found.ADNO)) {
        showAlert(`${found["SHORT NAME"] || found["FULL NAME"]} has an uncompleted recovery from their previous leave.`, "Recovery Not Completed", "error");
        setAd('');
        return;
      }
    } else {
      setStudent(null);
      setName('');
      setClassNum('');
    }
  }, [ad, students, teacher, navigate, leaveData]);

  // Reset showEndDateForMedical ONLY when reason changes
  useEffect(() => {
    if (reason !== 'Medical' && reason !== 'Medical (Home)' && reason !== 'Room') {
      setShowEndDateForMedical(true);
      setStartImmediately(false);
    } else {
      setShowEndDateForMedical(false);
      // For immediate medical/room needs, set time to Now and auto-start
      if (reason === 'Room') {
        setFromTime('Now');
        setFromDate('Today');
        setStartImmediately(true);
      } else if (reason === 'Medical' || reason === 'Medical (Home)') {
        setStartImmediately(true);
      }
    }
  }, [reason]);

  // Set startImmediately to true if fromTime is Now
  useEffect(() => {
    if (fromTime === 'Now' && fromDate === 'Today') {
      setStartImmediately(true);
    }
  }, [fromTime, fromDate]);

  // Helper to map DB values back to form options
  const mapDataToForm = (leave) => {
    // 1. Map Reason
    // We need to know current reason options to see if it's "Custom"
    // Since ReasonPicker determines this, we'll try to find a match
    const standardReasons = ['Medical (Home)', 'Room', 'Marriage', 'Hospital', 'Urgent (Death)'];
    if (standardReasons.includes(leave.reason)) {
      setReason(leave.reason);
      setCustomReason('');
    } else {
      setReason('Custom');
      setCustomReason(leave.reason);
    }

    // 2. Map Dates
    const today = new Date().toISOString().split('T')[0];
    const tmw = new Date(); tmw.setDate(tmw.getDate() + 1);
    const tomorrow = tmw.toISOString().split('T')[0];
    const da = new Date(); da.setDate(da.getDate() + 2);
    const dayAfter = da.toISOString().split('T')[0];

    const processDate = (dateStr, setDate, setCustom) => {
      if (dateStr === today) setDate('Today');
      else if (dateStr === tomorrow) setDate('Tomorrow');
      else if (dateStr === dayAfter) setDate('Day After');
      else if (!dateStr) setDate('');
      else { setDate('Calendar'); setCustom(dateStr); }
    };

    processDate(leave.fromDate, setFromDate, setFromCustomDate);
    processDate(leave.toDate, setToDate, setToCustomDate);

    // 3. Map Times
    const processTime = (timeStr, setTime, setCustom, isFrom) => {
      const morning = isFrom ? "05:30" : "07:00";
      const evening = isFrom ? "16:30" : "18:00";

      if (timeStr === morning) setTime('Morning');
      else if (timeStr === evening) setTime('Evening');
      else { setTime('Clock'); setCustom(timeStr); }
    };

    processTime(leave.fromTime, setFromTime, setFromCustomTime, true);
    processTime(leave.toTime, setToTime, setToCustomTime, false);
  };

  // Handle Extension Mode
  const handleExtendMode = (leave) => {
    setFormMode('extend');
    mapDataToForm(leave);
    setOriginalToDate(leave.toDate);
    setOriginalToTime(leave.toTime);
  };

  // Handle Add Reason Mode
  const handleAddReasonMode = (leave) => {
    setFormMode('add');
    mapDataToForm(leave);
    // Overwrite reason for "add" mode to let them pick something else
    setReason('Custom');
    setCustomReason('');
  };

  // Handle Schedule Next Mode
  const handleScheduleNextMode = (leave) => {
    setFormMode('schedule');
    // Set from date to the day after existing toDate
    if (leave.toDate && leave.toDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const nextDay = new Date(leave.toDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      const today = new Date().toISOString().split('T')[0];
      const tmw = new Date(); tmw.setDate(tmw.getDate() + 1);
      const tomorrow = tmw.toISOString().split('T')[0];

      if (nextDayStr === today) setFromDate('Today');
      else if (nextDayStr === tomorrow) setFromDate('Tomorrow');
      else { setFromDate('Calendar'); setFromCustomDate(nextDayStr); }
      
      setFromTime('Morning');
    } else {
      setFromDate('Tomorrow');
      setFromTime('Morning');
    }
    setToDate('Tomorrow');
    setToTime('Evening');
    setReason('Medical (Home)');
    setCustomReason('');
  };

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
        updatedStudents[index].name = found["SHORT NAME"] || found["FULL NAME"] || found.name || "Unknown";
        updatedStudents[index].classNum = found.CLASS;
        if (checkLeaveStatus(found.ADNO)) {
          showAlert(`Student on Leave: ${found["SHORT NAME"] || found.name} already has an active or scheduled leave record.`, "Student on Leave", "warning");
          updatedStudents[index].ad = '';
        } else if (!checkRecoveryStatus(found.ADNO)) {
          showAlert(`${found["SHORT NAME"] || found.name} has an uncompleted recovery.`, "Recovery Not Completed", "error");
          updatedStudents[index].ad = '';
        }
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
    const invalidStudents = shortLeaveStudents.filter(student => !student.ad || !student.name || !student.classNum);
    if (invalidStudents.length > 0) {
      showAlert("Please ensure all student details are filled.", "Missing Info", "info");
      return;
    }
    if (!shortLeaveCustomReason.trim() && shortLeaveReason === 'Custom') {
      showAlert("Please provide a reason for the pass.", "Reason Required", "info");
      return;
    }

    // Check if any student is already on leave or has incomplete recovery
    const unavailableStudents = shortLeaveStudents.filter(student => checkLeaveStatus(student.ad) || !checkRecoveryStatus(student.ad));
    if (unavailableStudents.length > 0) {
      const names = unavailableStudents.map(s => s.name).join(', ');
      showAlert(`Cannot submit. These students are currently unavailable (On Leave or Incomplete Recovery): ${names}`, "Student Status Error", "error");
      return;
    }

    setLoading(true);

    const finalFromTime = cepMode === 'dars' ? '19:00' : getPeriodTime(shortLeaveFromPeriod, shortLeaveFromCustomTime, true);
    const finalToTime = cepMode === 'dars' ? '20:30' : getPeriodTime(shortLeaveToPeriod, shortLeaveToCustomTime, false);
    const finalReason = shortLeaveReason === 'Custom' ? shortLeaveCustomReason : shortLeaveReason;

    let finalDate;
    if (shortLeaveDate === 'Calendar') {
      finalDate = fromCustomDate;
    } else if (fromDate === 'Today') {
      finalDate = new Date();
    } else if (fromDate === 'Tomorrow') {
      const tomorrow = new Date();
      finalDate = tomorrow.setDate(tomorrow.getDate() + 1);
    } else if (fromDate === 'Day After') {
      const dayAfter = new Date();
      finalDate = dayAfter.setDate(dayAfter.getDate() + 2);
    } else {
      finalDate = new Date();
    }

    if (!teacher?.id && !teacher?._id) {
      setLoading(false);
      showAlert("Your session is missing teacher details. Please Logout and Login again to continue.", "Update Failed", "error");
      return;
    }

    const currentTeacherId = teacher?.id || teacher?._id;

    // Submit for each student
    const submitPromises = shortLeaveStudents.map(studentData => {
      const payload = {
        studentId: studentData.student?._id || studentData.student?.id,
        teacherId: currentTeacherId,
        fromTime: finalFromTime,
        toTime: finalToTime,
        reason: finalReason,
        date: finalDate,
        ...(academicYearId && { academicYearId })
      };

      return axios.post(`${API_PORT}/class-excused-pass`, payload);
    });

    Promise.all(submitPromises)
      .then(() => {
        const studentCount = shortLeaveStudents.filter(s => s.student).length;
        showAlert(`Leave approved for ${studentCount} student${studentCount === 1 ? '' : 's'}.`, "Approval Successful", "success");
        resetShortLeaveForm();
      })
      .catch((err) => {
        console.error("Error submitting short leaves", err);
        showAlert("There was an error submitting the short leave requests. Please try again.", "Submission Failed", "error");
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
      showAlert("Please search for and select a student first.", "Missing Selection", "info");
      return;
    }

    if (formMode === 'create' && checkLeaveStatus(ad)) {
      showAlert(`${name} is currently marked as on leave or absent.`, "Student Unavailable", "error");
      setAd('');
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
    const isMedicalReason = reason === 'Medical' || reason === 'Medical (Home)' || reason === 'Medical (Room)' || reason === 'Room';

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

    if (formMode === 'extend' || formMode === 'add') {
      const updatePayload = {};
      
      if (formMode === 'extend') {
        updatePayload.toDate = finalToDate;
        updatePayload.toTime = finalToTime;
        updatePayload.extensionHistory = [
          ...(activeLeave.extensionHistory || []),
          {
            previousToDate: originalToDate,
            previousToTime: originalToTime,
            newToDate: finalToDate,
            newToTime: finalToTime,
            teacherId: teacher?.id || teacher?._id,
            timestamp: new Date()
          }
        ];
      } else if (formMode === 'add') {
        updatePayload.reason = finalReason;
        updatePayload.toDate = finalToDate;
        updatePayload.toTime = finalToTime;
        updatePayload.reasonHistory = [
          ...(activeLeave.reasonHistory || []),
          {
            reason: finalReason,
            teacherId: teacher?.id || teacher?._id,
            timestamp: new Date()
          }
        ];
      }

      axios.patch(`${API_PORT}/leave/${activeLeave._id}`, updatePayload)
        .then(() => {
          showAlert(`Leave ${formMode === 'extend' ? 'extended' : 'reason updated'} successfully for ${name}.`, "Update Successful", "success");
          resetForm();
        })
        .catch((err) => {
          console.error(`Error updating leave (${formMode})`, err);
          showAlert("Error updating leave request. Please try again.", "Error", "error");
        })
        .finally(() => setLoading(false));
      
      return;
    }

    const payload = {
      studentId: student?._id || student?.id,
      teacherId: teacher?.id || teacher?._id,
      ...(academicYearId && { academicYearId }),
      fromDate: finalFromDate,
      fromTime: finalFromTime,
      toDate: finalToDate,
      toTime: finalToTime,
      reason: finalReason,
      status: startImmediately ? "active" : "Scheduled",
      recovery: false,
      approved: true,
      reasonHistory: [{ reason: finalReason, teacherId: teacher?.id || teacher?._id, timestamp: new Date() }]
    };

    console.log('Submitting leave:', payload);

    axios.post(`${API_PORT}/leave`, payload)
      .then(() => {
        showAlert(`Leave approved for ${name}.`, "Approval Successful", "success");
        resetForm();
      })
      .catch((err) => {
        console.error("Error submitting leave", err);
        showAlert("Error submitting leave request. Please try again.", "Error", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const resetForm = () => {
    setAd('');
    setStudent(null);
    setName('');
    setClassNum('');
    setFromDate('Today');
    setFromTime('Now');
    setFromCustomDate('');
    setFromCustomTime('');
    setToDate('Today');
    setToTime('Evening');
    setToCustomDate('');
    setToCustomTime('');
    setReason('Medical (Home)');
    setCustomReason('');
    setSuggestions([]);
    setShowEndDateForMedical(false);
    setStartImmediately(false);
    setFormMode('create');
    setActiveLeave(null);
  };


  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [studentHistory, setStudentHistory] = useState([]);
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
          "SHORT NAME": student["SHORT NAME"] || student["FULL NAME"] || student.name || "Unknown",
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
      name: student["SHORT NAME"] || student["FULL NAME"] || student.name || "Unknown",
      classNum: student.CLASS
    }));
    setSelectedBulkStudents(allStudents);
  };
  // Also, update the initial classValue to be dynamic based on teacher

  let classValues = [];
  if (teacher?.role?.includes("class_teacher")) {
    classValues = [teacher?.classNum];
  } else if (teacher?.role?.includes("HOD")) {
    classValues = [8, 9, 10];
  } else if (teacher?.role?.includes("HOS")) {
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
      if (checkLeaveStatus(student.ADNO)) {
        showAlert(`Student on Leave: ${student["SHORT NAME"]} already has an active or scheduled leave record.`, "Student on Leave", "warning");
        return;
      }
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
      showAlert("Please select at least one student from the list.", "Selection Required", "info");
      return;
    }

    // Use the same validation as regular form
    if (!reason || (reason === "Custom" && !customReason.trim())) {
      showAlert("Please provide a reason for the bulk leave request.", "Reason Required", "info");
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
    const isMedicalReason = reason === 'Medical' || reason === 'Medical (Home)' || reason === 'Medical (Room)' || reason === 'Room';

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

    if (!teacher?.id && !teacher?._id) {
      setLoading(false);
      showAlert("Your session is missing teacher details. Please Logout and Login again to continue.", "Update Failed", "error");
      return;
    }

    const currentTeacherId = teacher?.id || teacher?._id;

    // Create an array of promises for all selected students
    const submitPromises = selectedBulkStudents.map(studentData => {
      const studentObj = students.find(s => String(s.ADNO) === String(studentData.ADNO));

      const payload = {
        studentId: studentObj?._id || studentData.studentId || studentData._id || studentData.id,
        teacherId: currentTeacherId,
        ...(academicYearId && { academicYearId }),
        fromDate: finalFromDate,
        fromTime: finalFromTime,
        toDate: finalToDate,
        toTime: finalToTime,
        reason: finalReason,
        status: startImmediately ? "active" : "Scheduled",
        recovery: false
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
      setReason('Medical (Home)');
      setCustomReason('');
      setSuggestions([]);
      setShowEndDateForMedical(false);

      showAlert(`Leave approved for ${selectedBulkStudents.length} students.`, "Approval Successful", "success");
      setSelectedBulkStudents([]);
      setStartImmediately(false);
      setShowBulkModal(false);
    } catch (error) {
      console.error("Error submitting bulk leaves:", error);
      showAlert("There was an error approving the bulk leave request.", "Submission Failed", "error");
    } finally {
      setLoading(false);
    }
  };
  // const [leaveData,setLeaveData]=useState([]);
  // const [isOnleaveAlerted,setIsOnLeaveAlerted]=useState(false);
  // useEffect(()=>{
  //   axios.get(`${API_PORT}/leaves`)
  //   .then((res)=>{
  //     setLeaveData(res.data);
  //   })
  //   .catch((err)=>{
  //     console.error("Error fetching leaves data:", err);
  //   })
  // })
  // const isOnLeave=(stdAd)=>{
  //   const filter = leaveData.filter(leave=>String(leave.ad)===String(stdAd) && leave.status!=="returned" );
  //   if(filter.length>0 && !isOnleaveAlerted){
  //     alert(`Student AD ${stdAd} is already on leave!`);
  //     setIsOnLeaveAlerted(true);
  //   }
  // }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-8 mt-16">

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white p-10 rounded-[2rem] shadow-2xl">
            <div className="w-14 h-14 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
            <p className="text-sky-600 font-bold tracking-wider uppercase text-sm">Processing…</p>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-sky-200 transition-all"
          onClick={() => navigate.push('/leave-dashboard')}
        >
          <FaHome size={16} /> Leave Dashboard
        </button>
        {(Array.isArray(teacher?.role) ? teacher.role.some(r => ["HOD", "HOS", "super_admin"].includes(r)) : ["HOD", "HOS", "super_admin"].includes(teacher?.role)) && (
          <button
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all ${leaveType === "leave"
              ? "bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20"
              : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
              }`}
            onClick={() => setLeaveType(leaveType === "leave" ? 'short-leave' : 'leave')}
          >
            {leaveType === "leave" ? "Class Excused Pass" : "← Regular Leave"}
          </button>
        )}
      </div>

      {leaveType === "leave" ? (
        <div className="max-w-xl mx-auto space-y-8 pb-16">
          {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-yellow-500 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Full Leave History (AD: {ad})</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {studentHistory.length > 0 ? (
                <div className="space-y-4">
                  {studentHistory.sort((a,b) => new Date(b.fromDate) - new Date(a.fromDate)).map((leave, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-slate-400 capitalize px-2 py-0.5 bg-white border border-slate-100 rounded-md">
                            {leave.reason || 'General Leave'}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            leave.status === 'returned' || leave.status === 'Arrived' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-700 truncate">
                          {leave.fromDate === leave.toDate ? leave.fromDate : `${leave.fromDate} to ${leave.toDate || 'End'}`}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500">
                           {leave.fromTime} {leave.toTime ? `→ ${leave.toTime}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        {leave.markReturnedTeacher && (
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Returned To</span>
                            <span className="text-[10px] font-black text-sky-600">{leave.markReturnedTeacher}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                    <Database className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Leave Records Found</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Regular Leave Form */}
          {!showBulkModal && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 relative">
                  <label htmlFor="ad" className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">
                    Student Search
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
                        filtered = students.filter((std) => String(std.ADNO).startsWith(value));
                      } else {
                        filtered = students.filter((std) =>
                          (std["SHORT NAME"] || "").toLowerCase().includes(value.toLowerCase()) ||
                          (std["FULL NAME"] || "").toLowerCase().includes(value.toLowerCase())
                        );
                      }
                      setSuggestions(filtered.slice(0, 5));
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                    placeholder="AD No or Name..."
                  />

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50">
                      {suggestions.map((s) => (
                        <div
                          key={s.ADNO}
                          className="px-4 py-3 hover:bg-sky-50 cursor-pointer flex items-center justify-between"
                          onClick={() => {
                            setAd(s.ADNO);
                            setName(s["SHORT NAME"] || s["FULL NAME"]);
                            setClassNum(s.CLASS);
                            setStudent(s);
                            setSuggestions([]);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800">{s["SHORT NAME"] || s["FULL NAME"]}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">AD: {s.ADNO}</span>
                          </div>
                          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black italic">
                            {s.CLASS}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-1">
                  <label 
                    onClick={() => {
                        if (ad && student) {
                            const studentId = student?._id || student?.id;
                            const history = leaveData.filter(leave => {
                                const leaveStudentId = typeof leave.studentId === 'object' ? leave.studentId?._id : leave.studentId;
                                const adMatch = String(leave.hasOwnProperty('ad') ? leave.ad : leave.studentId?.ADNO) === String(ad);
                                const idMatch = studentId && String(leaveStudentId) === String(studentId);
                                return idMatch || adMatch;
                            });
                            setStudentHistory(history);
                            setShowHistoryModal(true);
                        }
                    }}
                    className={`block text-[10px] font-black uppercase tracking-widest px-1 mb-2 cursor-pointer transition-colors ${ad ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-300'}`}
                  >
                    History {ad && "• View"}
                  </label>
                  <button
                    type="button"
                    className="w-full h-[46px] rounded-2xl bg-white border-2 border-sky-100 text-sky-500 font-black text-[10px] uppercase tracking-widest hover:bg-sky-50 transition-all flex items-center justify-center"
                    onClick={() => setShowBulkModal(true)}
                  >
                    Bulk
                  </button>
                </div>

                <div className="col-span-2">
                  <label htmlFor="name" className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">
                    Selected Student
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    disabled
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-400"
                    placeholder="Student Name"
                  />
                </div>

                <div className="col-span-1">
                  <label htmlFor="classNum" className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">
                    Class
                  </label>
                  <input
                    id="classNum"
                    type="text"
                    value={classNum}
                    disabled
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-400 text-center"
                    placeholder="—"
                  />
                </div>
              </div>
            </div>
          )}
          {showBulkModal && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50 space-y-6">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Class</span>
                  <select
                    value={classValue}
                    onChange={(e) => setClassValue(e.target.value)}
                    className="bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-1.5 text-xs font-black text-slate-700 focus:border-sky-400 transition-all outline-none"
                  >
                    {classValues.map((item, index) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                  onClick={() => setShowBulkModal(false)}
                >
                  Exit Bulk
                </button>
              </div>

              {selectedBulkStudents.length > 0 && (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                      Selected: {selectedBulkStudents.length} Students
                    </span>
                    <button onClick={() => setSelectedBulkStudents([])} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBulkStudents.map((student) => (
                      <div key={student.ADNO} className="flex items-center gap-1.5 bg-white border border-sky-100 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-black text-slate-700">{student.name}</span>
                        <button onClick={() => handleRemoveBulkStudent(student.ADNO)} className="text-rose-400 hover:text-rose-600">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">No</th>
                      <th className="p-3 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Student</th>
                      <th className="p-3 text-center">
                        <button onClick={handleSelectAll} className="w-8 h-8 rounded-lg bg-sky-500 text-white text-lg font-black">+</button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Bulkstudents.length > 0 ? (
                      Bulkstudents.map((student) => {
                        const isSelected = selectedBulkStudents.some(s => s.ADNO === student.ADNO);
                        return (
                          <tr key={student.ADNO} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-xs font-black text-slate-400">{student.SL}</td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800">{student["SHORT NAME"] || student["FULL NAME"]}</span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight">AD: {student.ADNO}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => isSelected ? handleRemoveBulkStudent(student.ADNO) : handleAdd(student)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 text-white rotate-0' : 'bg-slate-100 text-slate-400 hover:bg-sky-100 hover:text-sky-500'
                                  }`}
                              >
                                {isSelected ? '✓' : '+'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="3" className="p-8 text-center text-xs font-bold text-slate-400 italic">No students found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Reason */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50">
            <ReasonPicker
              selectedReason={reason}
              setSelectedReason={setReason}
              customReason={customReason}
              setCustomReason={setCustomReason}
              leaveType={leaveType}
              teacher={teacher}
              disabled={formMode === 'extend'}
            />
          </div>

          {/* templates */}
          {formMode !== 'extend' && formMode !== 'add' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50">
              <TemplatePicker
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                setShowEndDateForMedical={setShowEndDateForMedical}
              />
            </div>
          )}

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <CalendarClock size={16} className="text-sky-500" />
              <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">From Date & Time</h2>
            </div>
            <div className="space-y-6"> {/* Stacked for clarity on mobile */}
              <DatePicker
                label="Date"
                selectedDate={fromDate}
                setSelectedDate={setFromDate}
                customDate={fromCustomDate}
                setCustomDate={setFromCustomDate}
                type="From"
                disabled={formMode === 'extend' || formMode === 'add'}
              />
              <TimePicker
                label="Time"
                selectedTime={fromTime}
                setSelectedTime={setFromTime}
                options={fromTimeOptions}
                customTime={fromCustomTime}
                setCustomTime={setFromCustomTime}
                type="From"
                disabled={formMode === 'extend' || formMode === 'add'}
              />
            </div>
          </div>

          {(reason !== 'Medical' && reason !== 'Medical (Home)' && reason !== 'Room') || showEndDateForMedical ? (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50 space-y-6">
              <div className="flex items-center gap-2 px-1">
                <CalendarClock size={16} className="text-amber-500" />
                <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">To Date & Time</h2>
              </div>
              <div className="space-y-6">
                <DatePicker
                  label="Date"
                  selectedDate={toDate}
                  setSelectedDate={setToDate}
                  customDate={toCustomDate}
                  setCustomDate={setToCustomDate}
                  type="To"
                />
                <TimePicker
                  label="Time"
                  selectedTime={toTime}
                  setSelectedTime={setToTime}
                  options={toTimeOptions}
                  customTime={toCustomTime}
                  setCustomTime={setToCustomTime}
                  type="To"
                />
              </div>
            </div>
          ) : (
            (reason === 'Medical' || reason === 'Medical (Home)' || reason === 'Room') && (
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border-2 border-dashed border-slate-100 text-center space-y-4">
                <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-sky-500 font-black italic text-xl">m</span>
                </div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  {reason === 'Room' ? "Medical Room- No end date needed" : "Medical leave - No end date needed"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowEndDateForMedical(true)}
                  className="px-6 py-2 bg-sky-50 text-sky-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-sky-100 transition-all"
                >
                  + Add End Date
                </button>
              </div>
            )
          )}

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-40">
            <div className="max-w-xl mx-auto flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  if (showBulkModal) {
                    handleBulkSubmit();
                  } else {
                    handleSubmit(e);
                  }
                }}
                disabled={loading}
                className="flex-1 py-4 bg-emerald-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : leaveType === 'leave' ? 'Approve Leave' : 'Approve Pass'}
              </button>

              <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={startImmediately}
                    onChange={(e) => setStartImmediately(e.target.checked)}
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Start</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-4 pb-16">
          {/* Short Leave Pass Section */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50 space-y-6">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Class Excused Pass</h3>

            {/* Added Students Chips */}
            <div className="space-y-3">
              {shortLeaveStudents.filter(s => s.student).map((studentData, index) => (
                <div key={studentData.ad} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800">{studentData.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AD: {studentData.ad}</span>
                      <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest bg-white px-1.5 py-0.5 rounded border border-sky-100">Class {studentData.classNum}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeShortLeaveStudent(shortLeaveStudents.findIndex(s => s.ad === studentData.ad))}
                    className="w-8 h-8 rounded-xl bg-white text-rose-500 border border-rose-50 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Search Input for adding new students */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={shortLeaveStudents[shortLeaveStudents.length - 1]?.student ? "" : shortLeaveStudents[shortLeaveStudents.length - 1]?.ad || ""}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    const lastIndex = shortLeaveStudents.length - 1;

                    // If last one is already a student, create a new entry
                    if (shortLeaveStudents[lastIndex].student) {
                      setShortLeaveStudents([...shortLeaveStudents, { ad: value, name: '', classNum: '', student: null }]);
                      setActiveSuggestionIndex(lastIndex + 1);
                    } else {
                      updateShortLeaveStudent(lastIndex, 'ad', value);
                      setActiveSuggestionIndex(lastIndex);
                    }

                    if (value === "") { setShortLeaveSuggestions([]); return; }
                    const isNumber = /^\d+$/.test(value);
                    const filtered = isNumber ? students.filter(std => String(std.ADNO).startsWith(value)) : students.filter(std => (std["SHORT NAME"] || "").toLowerCase().includes(value.toLowerCase()));
                    setShortLeaveSuggestions(filtered.slice(0, 5));
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                  placeholder="Search student to add..."
                />
                {shortLeaveSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50">
                    {shortLeaveSuggestions.map((s) => (
                      <div
                        key={s.ADNO}
                        className="px-4 py-4 hover:bg-sky-50 cursor-pointer flex items-center justify-between transition-colors"
                        onClick={() => {
                          const lastIndex = shortLeaveStudents.length - 1;
                          if (shortLeaveStudents[lastIndex].student) {
                            setShortLeaveStudents([...shortLeaveStudents, { ad: String(s.ADNO), name: s["SHORT NAME"] || s["FULL NAME"], classNum: s.CLASS, student: s }]);
                          } else {
                            updateShortLeaveStudent(lastIndex, 'ad', s.ADNO);
                          }
                          setShortLeaveSuggestions([]);
                          setActiveSuggestionIndex(null);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">{s["SHORT NAME"] || s["FULL NAME"]}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">AD: {s.ADNO} • Class {s.CLASS}</span>
                        </div>
                        <Plus size={16} className="text-sky-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Select Time</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCepMode('period')}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${cepMode === 'period' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Periods
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCepMode('dars');
                    setShortLeaveReason('Dars');
                  }}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${cepMode === 'dars' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Dars
                </button>
              </div>
            </div>

            {cepMode === 'period' ? (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-300 uppercase px-1">From Period</span>
                  <select
                    value={shortLeaveFromPeriod}
                    onChange={(e) => setShortLeaveFromPeriod(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-sky-400 transition-all appearance-none"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>{i === 0 ? "Custom" : `Period ${i}`}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-300 uppercase px-1">To Period</span>
                  <select
                    value={shortLeaveToPeriod}
                    onChange={(e) => setShortLeaveToPeriod(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-sky-400 transition-all appearance-none"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>{i === 0 ? "Custom" : `Period ${i}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/50 p-6 rounded-2xl border-2 border-dashed border-emerald-100 text-center space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-center gap-3 text-emerald-600">
                   <Clock size={20} strokeWidth={2.5} />
                   <span className="text-sm font-black uppercase tracking-widest">7:00 pm - 8:30 pm</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Time set for Dars session</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50">
            <ReasonPicker
              selectedReason={shortLeaveReason}
              setSelectedReason={setShortLeaveReason}
              customReason={shortLeaveCustomReason}
              setCustomReason={setShortLeaveCustomReason}
              leaveType={leaveType}
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-40">
            <button
              type="button"
              onClick={handleShortLeaveSubmit}
              disabled={loading}
              className="w-full max-w-xl mx-auto py-4 bg-amber-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : 'Approve Pass'}
            </button>
          </div>
        </div>
      )}
      {/* Custom Alert Modal */}
      <CustomAlert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        actions={alertState.actions}
        onClose={() => {
          setAlertState({ ...alertState, isOpen: false });
          // If it was a student status alert, clear the selection
          if (alertState.title?.includes("Leave")) {
            setAd('');
            setStudent(null);
            setName('');
            setClassNum('');
          }
        }}
      />
    </div>
  );
}

export default LeaveForm;
