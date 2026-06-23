"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, User, XCircle, RefreshCw, ChevronRight, ChevronDown, FileSignature, DropletIcon, Search, X, Filter, Clipboard } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import LeaveStatusTable from './LeaveStatusTable';
import ShortLeave from './ShortLeave';
import LeaveDashboardSkeleton from './LeaveDashboardSkeleton';
import CustomAlert from '../common/CustomAlert';

const getSafeLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
  };
};

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

const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap ${isActive
      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
  >
    {label}
  </button>
);

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'Arrived': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircle,
        label: 'Arrived'
      },
      'Late Returned': {
        bg: 'bg-green-100',
        text: 'text-orange-600',
        icon: AlertCircle,
        label: 'Late Returned'
      },
      'On Leave': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: Clock,
        label: 'On Leave'
      },
      'Late': {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: AlertCircle,
        label: 'Late'
      },
      'Pending': {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: Clock,
        label: 'Pending'
      },
      'Scheduled': {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: Calendar,
        label: 'Scheduled'
      },
      'Not Arrived': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Not Arrived'
      },
      'Approval Pending': {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: Clock,
        label: 'Approval Pending'
      },
      'Rejected': {
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        icon: XCircle,
        label: 'Rejected'
      }
    };
    return configs[status] || configs['Approval Pending'];
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
      <Icon size={12} />
      <span>{config.label}</span>
    </span>
  );
};

const EditLeaveModal = ({ leave, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: leave?.reason || '',
    fromDate: leave?.fromDate || '',
    fromTime: leave?.fromTime || '',
    toDate: leave?.toDate || '',
    toTime: leave?.toTime || ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch(`${API_PORT}/leave/${leave._id}`, formData);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update leave record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-800 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Clipboard className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-lg font-black tracking-tight uppercase italic">Edit Record</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {leave.studentId?.['SHORT NAME'] || leave.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reason</label>
            <input 
              type="text" 
              value={formData.reason} 
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Date</label>
              <input 
                type="date" 
                value={formData.fromDate} 
                onChange={e => setFormData({...formData, fromDate: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Time</label>
              <input 
                type="time" 
                value={formData.fromTime} 
                onChange={e => setFormData({...formData, fromTime: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">To Date</label>
              <input 
                type="date" 
                value={formData.toDate} 
                onChange={e => setFormData({...formData, toDate: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">To Time</label>
              <input 
                type="time" 
                value={formData.toTime} 
                onChange={e => setFormData({...formData, toTime: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-900 active:scale-95 transition-all shadow-xl mt-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};
const StudentStatusCard = ({ student, onDelete, onEdit }) => {
  const getRelativeDate = (dateInput) => {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return dateInput;
      
      const today = new Date();

      // Reset hours for accurate day difference
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

  const formatTime = (date, time) => {
    if (!date || !time) return '—';
    try {
      const relDate = getRelativeDate(date);
      const dateTime = new Date(`${date}T${time}`);
      const timeStr = dateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${relDate}, ${timeStr}`;
    } catch (error) {
      return `${date} ${time}`;
    }
  };

  const formatReturnedTime = (returnedAt) => {
    if (!returnedAt) return null;
    try {
      const relDate = getRelativeDate(returnedAt);
      const returnedDate = new Date(returnedAt);
      const timeStr = returnedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${relDate}, ${timeStr}`;
    } catch (error) {
      return null;
    }
  };

  const isArrived = student.displayStatus === 'Arrived' || student.displayStatus === 'Late Returned';
  const statusColor = isArrived
    ? student.displayStatus === 'Late Returned' ? 'bg-green-500' : 'bg-green-500'
    : student.displayStatus === 'On Leave'
      ? 'bg-red-500'
      : student.displayStatus === 'Late'
        ? 'bg-orange-500' : student.displayStatus === 'Scheduled' ? " bg-yellow-500"
          : student.displayStatus === 'Pending' ? "bg-blue-500"
            : student.displayStatus === 'Approval Pending' ? "bg-amber-500"
              : student.displayStatus === 'Rejected' ? "bg-rose-500"
                : 'bg-red-500';

  const returnedTime = formatReturnedTime(student.returnedAt);
  const [showFull, setShowFull] = useState(false);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Status Indicator Bar */}
      <div className={`h-1 ${statusColor}`}></div>

      <div className="p-3 sm:p-4">
        {/* Header Row: AD, Name, Status */}
        <div className="flex items-start justify-between gap-2 mb-2"
          onClick={() => setShowFull(!showFull)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${statusColor} flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0`}>
              {student.studentId?.ADNO || student.ad}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.studentId?.['SHORT NAME'] || student.studentId?.['FULL NAME'] || student.name}</h3>
              <p className="text-xs text-gray-500">Class {student.studentId?.CLASS || student.classNum}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={student.calculatedStatus === 'Late Returned' ? 'Late Returned' : student.displayStatus} />
            <button
              onClick={() => setShowFull(!showFull)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-1/2 transition-all"
            >
              <ChevronDown size={16} className={`transition-transform duration-200 ${showFull ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>


        {showFull &&
          <>
            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{formatTime(student.fromDate, student.fromTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {student.toDate && student.toTime ? formatTime(student.toDate, student.toTime) : 'End of Day'}
                </span>
              </div>
            </div>

            {returnedTime && (
              <div className={`flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded ${student.calculatedStatus === 'Late Returned'
                ? 'text-orange-700 bg-orange-50'
                : 'text-green-700 bg-green-50'
                }`}>
                <CheckCircle size={12} />
                <span>Returned: {returnedTime}</span>
                {student.calculatedStatus === 'Late Returned' && (
                  <span className="ml-1 font-semibold">(Late)</span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-100">

              {student.teacherId?.name && (
                <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  <FileSignature size={12} />
                  <span className="font-medium">{student.teacherId.name}</span>
                </div>
              )}


              {student.leaveStartTeacher && (
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Clock size={12} />
                  <span className="hidden sm:inline">Started: </span>
                  <span className="font-medium">{student.leaveStartTeacher}</span>
                </div>
              )}

              {student.markReturnedTeacher && (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle size={12} />
                  <span className="hidden sm:inline">Returned: </span>
                  <span className="font-medium">{student.markReturnedTeacher}</span>
                </div>
              )}

              {/* Reason */}
              {student.reason && (
                <div className="w-full flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1.5 rounded mt-1 border border-gray-100/50">
                  <span className="italic leading-relaxed">
                    {student.reason}
                    {student.disease ? ` - ${student.disease}` : ''}
                    {student.program ? ` - ${student.program}` : ''}
                  </span>
                </div>
              )}
            </div>
            
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(student)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-sky-50 hover:text-sky-600 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Clipboard size={12} />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(student._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <XCircle size={12} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </>}
      </div>
    </div>
  );
};

function LeaveStatus({ myClassOnly = false }) {
  const [activeTab, setActiveTab] = useState('actions');
  const [activeTabActions, setActiveTabActions] = useState('General');
  const [activeTabMyDB, setActiveTabMyDB] = useState('allActions');
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterClass, setFilterClass] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [filterStartReturn, setFilterStartReturn] = useState('All');
  const [filterReason, setFilterReason] = useState('All');
  const [copyFromDate, setCopyFromDate] = useState('');
  const [copyToDate, setCopyToDate] = useState('');
  const [shortLeaveStatus, setShortLeaveStatus] = useState([]);
  const [editingLeave, setEditingLeave] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info', actions: null });
  const filterRef = useRef(null);

  const teacher = useMemo(() => {
    const ls = getSafeLocalStorage();
    const storedTeacher = ls.getItem("teacher");
    return storedTeacher ? JSON.parse(storedTeacher) : null;
  }, []);

  const forecast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const getCountForDay = (targetDate) => {
      return leaveData.filter(item => {
        if (item.status === 'returned') return false;
        
        const fromDate = new Date(item.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = item.toDate ? new Date(item.toDate) : null;
        if (toDate) toDate.setHours(0, 0, 0, 0);

        // If it's medical/room without end date AND it's not returned, count it for all future days
        if (!toDate) return targetDate >= fromDate;

        return targetDate >= fromDate && targetDate <= toDate;
      }).length;
    };

    return {
      today: getCountForDay(today),
      tomorrow: getCountForDay(tomorrow),
      dayAfter: getCountForDay(dayAfter)
    };
  }, [leaveData]);

  const availableReasons = useMemo(() => {
    const statuses = ['Scheduled', 'On Leave', 'Late', 'Pending'];
    const excludedKeywords = ['medical', 'room', 'marriage', 'hospital', 'function', 'home'];
    
    const reasonCounts = {};
    
    leaveData.forEach(item => {
      const status = item.calculatedStatus || getLeaveStatus(item);
      const reason = item.reason;
      
      if (statuses.includes(status) && reason) {
        const lowerReason = reason.toLowerCase();
        const isExcluded = excludedKeywords.some(keyword => 
          lowerReason.includes(keyword)
        );
        
        if (!isExcluded) {
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
      }
    });
    
    return Object.entries(reasonCounts)
      .filter(([_, count]) => count >= 2)
      .map(([reason]) => reason)
      .sort();
  }, [leaveData]);

  // Calculate leave status
  const getLeaveStatus = (item) => {
    if (item.status === 'rejected') return 'Rejected';
    if (item.approved === false) return 'Approval Pending';
    const now = new Date();
    const fromDateTime = new Date(`${item.fromDate}T${item.fromTime}`);
    const toDateTime = item.toDate && item.toTime ? new Date(`${item.toDate}T${item.toTime}`) : null;

    if (item.status === 'returned') {
      if (toDateTime && item.returnedAt && new Date(item.returnedAt) > toDateTime) {
        return 'Late Returned';
      }
      return 'Returned';
    }

    const dbStatus = (item.status || '').toLowerCase();
    if (dbStatus === 'active' || dbStatus === 'late' || dbStatus === 'on leave') {
      if (dbStatus === 'late' || (toDateTime && now > toDateTime)) return 'Late';
      return 'On Leave';
    }

    if (now < fromDateTime) return 'Scheduled';

    return 'Pending';
  };

  const matchesFilters = (student) => {
    // 0. My Class Filter
    if (myClassOnly && teacher?.classNum) {
      const classNum = student.studentId?.CLASS || student.classNum;
      if (String(classNum) !== String(teacher.classNum)) return false;
    }

    // 1. Search Text
    const searchLower = searchValue.toLowerCase();
    const ad = student.studentId?.ADNO || student.ad;
    const name = (student.studentId?.['SHORT NAME'] || student.studentId?.['FULL NAME'] || student.name || '').toLowerCase();
    const matchesSearch = !searchValue || name.includes(searchLower) || String(ad).toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // 2. Class Filter
    const classNum = student.studentId?.CLASS || student.classNum;
    const matchesClass = filterClass === 'All' || String(classNum) === String(filterClass);

    if (!matchesClass) return false;

    // 3. Start / Return Group Filter
    if (filterStartReturn !== 'All') {
      const status = getLeaveStatus(student);
      if (filterStartReturn === 'To Start' && !['Pending', 'Scheduled'].includes(status)) return false;
      if (filterStartReturn === 'To Return' && !['On Leave', 'Late'].includes(status)) return false;
    }

    // 4. Action / Status Filter
    const status = getLeaveStatus(student);
    const matchesAction = filterAction === 'All' || status === filterAction;

    if (!matchesAction) return false;

    // 5. Reason Filter
    const matchesReason = filterReason === 'All' || student.reason === filterReason;

    return matchesReason;
  };

  const medicalRoomStatus = useMemo(() => {
    return leaveData.filter(student => {
      const isRoom = student.reason === 'Medical (Room)' || student.reason === 'Room';
      const status = getLeaveStatus(student);
      return isRoom && (status === 'On Leave' || status === 'Late') && matchesFilters(student);
    });
  }, [leaveData, searchValue, filterClass, filterAction, filterStartReturn, filterReason]);

  const medicalRoomStatusDB = useMemo(() => {
    return leaveData.filter(student => {
      const isRoom = student.reason === 'Medical (Room)' || student.reason === 'Room';
      const status = getLeaveStatus(student);
      const isMyStudent = student.teacherId?.name === teacher?.name || student.teacher === teacher?.name;
      return isRoom && (status === 'On Leave' || status === 'Late') && isMyStudent && matchesFilters(student);
    });
  }, [leaveData, searchValue, teacher, filterClass, filterAction, filterStartReturn, filterReason]);

  const getDisplayStatus = (status) => {
    const statusMap = {
      'Returned': 'Arrived',
      'Late Returned': 'Late Returned',
      'On Leave': 'On Leave',
      'Late': 'Late',
      'Pending': 'Pending',
      'Scheduled': 'Scheduled',
      'Approval Pending': 'Approval Pending',
      'Rejected': 'Rejected'
    };
    return statusMap[status] || 'Approval Pending';
  };

  useEffect(() => {
    fetchLeaveData();
    fetchShortLeave();
  }, []);

  const fetchLeaveData = () => {
    setLoading(true);
    setError(null);
    axios.get(`${API_PORT}/leave`)
      .then((res) => {
        const processedData = res.data.map(item => {
          const calculatedStatus = getLeaveStatus(item);
          return {
            ...item,
            calculatedStatus,
            displayStatus: getDisplayStatus(calculatedStatus)
          };
        });
        setLeaveData(processedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leave data:', err);
        setError('Failed to load leave data. Please try again.');
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    setAlertState({
      isOpen: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to permanently delete this leave record? This action cannot be undone.",
      type: "error",
      actions: [
        {
          label: "Cancel",
          onClick: () => setAlertState(prev => ({ ...prev, isOpen: false })),
          className: "bg-slate-100 text-slate-600 hover:bg-slate-200"
        },
        {
          label: "Delete Record",
          onClick: async () => {
            try {
              await axios.delete(`${API_PORT}/leave/${id}`);
              refreshLeaveData();
              setAlertState(prev => ({ ...prev, isOpen: false }));
            } catch (error) {
              console.error("Delete Error:", error);
              alert("Failed to delete leave record");
            }
          },
          className: "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20"
        }
      ]
    });
  };

  const handleEdit = (student) => {
    setEditingLeave(student);
  };


  const fetchShortLeave = () => {
    setLoading(true);
    setError(null);
    axios.get(`${API_PORT}/class-excused-pass`)
      .then((res) => {
        setShortLeaveStatus(res.data);
      })
      .catch(err => {
        console.error('Error fetching short leave data:', err);
        setError('Failed to load leave data. Please try again.');
        setLoading(false);
      });
  };

  const actionsTableData = useMemo(() => {
    return leaveData
      .filter(matchesFilters)
      .map(item => ({
        ...item,
        status: getLeaveStatus(item)
      }))
      .filter(data => {
        // Basic list of actionable statuses
        const statuses = ['Pending', 'Late', 'On Leave'];

        // If filterAction is set to something specific, we bypass the default actionable statuses restriction
        // to show what the user explicitly requested
        if (filterAction !== 'All') return true;

        if (!statuses.includes(data.status)) return false;

        // If searching, show all matches regardless of time
        if (searchValue) return true;

        // For individuals On Leave, only show if they are within 4 hours of their scheduled return
        if (data.status === 'On Leave') {
          if (!data.toDate || !data.toTime) return true; // Keep open-ended leaves like Room
          const toDateTime = new Date(`${data.toDate}T${data.toTime}`);
          const now = new Date();
          const diffHrs = (toDateTime - now) / (1000 * 60 * 60);

          // Only show if scheduled return is within 4 hours (or past - though past is 'Late' status)
          return diffHrs <= 4;
        }

        // Pending and Late students always show in the actions list
        return true;
      });
  }, [leaveData, searchValue, filterClass, filterAction, filterStartReturn, filterReason]);

  const refreshLeaveData = () => {
    fetchLeaveData();
  };

  const copyToClipboard = (leaves, rangeInfo) => {
    if (leaves.length === 0) {
      alert(`No records found for ${rangeInfo}`);
      return;
    }

    const text = leaves.map((l, i) => {
      const name = l.studentId?.['SHORT NAME'] || l.studentId?.['FULL NAME'] || l.name;
      const ad = l.studentId?.ADNO || l.ad;
      const className = l.studentId?.CLASS || l.classNum;
      
      const fromTimeStr = formatTimeTo12h(l.fromTime);
      const toTimeStr = formatTimeTo12h(l.toTime);
      
      const specificReason = l.disease ? ` - ${l.disease}` : (l.program ? ` - ${l.program}` : '');
      return `${i + 1}. ${name} (${ad}) - Class ${className}\n   Reason: ${l.reason}${specificReason}\n   From: ${l.fromDate} ${fromTimeStr}\n   To: ${l.toDate} ${toTimeStr}`;
    }).join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied ${leaves.length} leave records for ${rangeInfo} to clipboard!`);
    });
  };

  const handleCopyClassWiseAbsentees = () => {
    if (filteredData.length === 0) {
      alert("No students are currently on leave.");
      return;
    }

    const grouped = {};
    for (let i = 1; i <= 10; i++) {
      grouped[i] = [];
    }

    filteredData.forEach(student => {
      const classNum = student.studentId?.CLASS || student.classNum;
      if (classNum) {
        if (!grouped[classNum]) {
          grouped[classNum] = [];
        }
        grouped[classNum].push(student);
      }
    });

    let text = "*On Leave Students (Class-wise)*\n\n";
    let totalCount = 0;
    
    Object.entries(grouped)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .forEach(([classNum, list]) => {
        if (list.length > 0) {
          text += `*Class ${classNum}* (${list.length}):\n`;
          list.forEach((l, i) => {
            const name = l.studentId?.['SHORT NAME'] || l.studentId?.['FULL NAME'] || l.name;
            const ad = l.studentId?.ADNO || l.ad;
            const reason = l.reason ? ` - ${l.reason}` : '';
            text += `  ${i + 1}. ${name} (${ad})${reason}\n`;
            totalCount++;
          });
          text += "\n";
        }
      });

    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied ${totalCount} on-leave student names class-wise to clipboard!`);
    });
  };

  const handleCustomCopy = () => {
    if (!copyFromDate || !copyToDate) {
      alert("Please select both From and To dates first.");
      return;
    }
    const selectedLeaves = filterDB.filter(l => 
      l.fromDate >= copyFromDate && l.toDate <= copyToDate
    );
    copyToClipboard(selectedLeaves, `Custom Range (${copyFromDate} to ${copyToDate})`);
  };

  const handleWeekendCopy = () => {
    const now = new Date();
    const day = now.getDay();
    // Latest Thursday (4)
    const diffToThu = (day - 4 + 7) % 7;
    const thu = new Date(now);
    thu.setDate(now.getDate() - diffToThu);
    // Friday (5) after that Thursday
    const fri = new Date(thu);
    fri.setDate(thu.getDate() + 1);

    const thuStr = thu.toISOString().split('T')[0];
    const friStr = fri.toISOString().split('T')[0];

    // Filter leaves for this specific weekend (Thu Eve to Fri Eve)
    const selectedLeaves = filterDB.filter(l => 
       l.fromDate === thuStr && l.toDate === friStr
    );
    
    copyToClipboard(selectedLeaves, `Weekend (${thuStr} to ${friStr})`);
  };

  const filteredData = useMemo(() => {
    let data = leaveData;
    if (activeTab === 'actions' && (searchValue || filterClass !== 'All' || filterAction !== 'All' || filterStartReturn !== 'All' || filterReason !== 'All')) {
      data = data.filter(matchesFilters);
    }
    if (activeTab === 'onLeave') {
      return data.filter(student => {
        return (['On Leave', 'Late'].includes(student.displayStatus)) && 
               matchesFilters(student);
      });
    }
    if (activeTab === 'all') {
      return data.filter(matchesFilters);
    }
    return data;
  }, [leaveData, activeTab, searchValue, filterClass, filterAction, filterStartReturn, filterReason]);

  const filteredDataForOnleave = useMemo(() => {
    return leaveData.filter(student => {
      const classMatch = myClassOnly && teacher?.classNum ? String(student.studentId?.CLASS || student.classNum) === String(teacher.classNum) : true;
      return ['On Leave', 'Late'].includes(student.displayStatus) && classMatch;
    });
  }, [leaveData, myClassOnly, teacher?.classNum]);
  
  const activeCEPCount = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return shortLeaveStatus.filter(leave => {
      if (leave.status === 'returned') return false;
      
      const leaveDate = new Date(leave.date).toISOString().split('T')[0];
      if (leaveDate !== today) return false;

      const [fH, fM] = (leave.fromTime || '00:00').split(':').map(Number);
      const [tH, tM] = (leave.toTime || '23:59').split(':').map(Number);
      const fromMin = fH * 60 + fM;
      const toMin = tH * 60 + tM;

      return currentMinutes >= fromMin && currentMinutes <= toMin;
    }).length;
  }, [shortLeaveStatus]);

  const filterDB = useMemo(() => {
    return leaveData.filter(student => (student.teacherId?.name === teacher?.name || student.teacher === teacher?.name) && matchesFilters(student));
  }, [leaveData, teacher, searchValue, filterClass, filterAction, filterStartReturn, filterReason]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTab !== "actions") {
      setSearchValue('');
    }
  }, [activeTab]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 mt-16 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow-md max-w-sm mx-4">
          <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
          <p className="text-red-600 font-semibold text-sm mb-3">{error}</p>
          <button
            onClick={fetchLeaveData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 mt-20">
        <LeaveDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 mt-16">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; }
        `}
      </style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            {/* <div className="w-10 h-10 bg-sky-100 text-sky-600 flex items-center justify-center rounded-2xl shadow-inner flex-shrink-0">
              <Calendar size={20} />
            </div> */}
            <div className="flex items-center gap-2 ml-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Leave Status</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Dashboard</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className={`flex items-center gap-2 relative transition-all duration-300 ${activeTab !== "shortLeave" ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            ref={filterRef}
          >
            <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 py-2 gap-2 focus-within:border-sky-400 focus-within:bg-white transition-all shadow-sm">
              <Search size={15} className="text-slate-400 flex-shrink-0" />
              <input
                placeholder="Search student…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium w-32 sm:w-44"
              />
              {searchValue && (
                <button onClick={() => setSearchValue('')}>
                  <X size={14} className="text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {!myClassOnly && (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-center ${
                  showFilters || filterClass !== 'All' || filterAction !== 'All' || filterStartReturn !== 'All' || filterReason !== 'All'
                  ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-sky-200 hover:text-sky-500'
                }`}
                title="Filter Students"
              >
                <Filter size={18} />
              </button>
            )}

            {/* Filter Popup */}
            {!myClassOnly && showFilters && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-5 z-[100] animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Quick Filters</span>
                  {(filterClass !== 'All' || filterAction !== 'All' || filterStartReturn !== 'All' || filterReason !== 'All') && (
                    <button 
                      onClick={() => { setFilterClass('All'); setFilterAction('All'); setFilterStartReturn('All'); setFilterReason('All'); }}
                      className="text-[10px] font-bold text-sky-500 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => (
                        <button
                          key={c}
                          onClick={() => setFilterClass(c)}
                          className={`py-1 text-[11px] font-bold rounded-lg border transition-all ${filterClass === c
                              ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Action</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['All', 'To Start', 'To Return'].map(s => (
                        <button
                          key={s}
                          onClick={() => setFilterStartReturn(s)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${filterStartReturn === s
                              ? 'bg-sky-500 border-sky-500 text-white'
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status </label>
                    <div className="flex flex-wrap gap-1.5 font-bold">
                      {['All', 'Pending', 'On Leave', 'Late', 'Scheduled', 'Returned'].map(s => (
                        <button
                          key={s}
                          onClick={() => setFilterAction(s)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${filterAction === s
                              ? 'bg-sky-500 border-sky-500 text-white'
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {availableReasons.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Common Reasons</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setFilterReason('All')}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${filterReason === 'All'
                              ? 'bg-sky-500 border-sky-500 text-white'
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                          All Reasons
                        </button>
                        {availableReasons.map(r => (
                          <button
                            key={r}
                            onClick={() => setFilterReason(r)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${filterReason === r
                                ? 'bg-sky-500 border-sky-500 text-white'
                                : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                              }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 flex flex-wrap gap-1 mb-4">
          <TabButton
            label="Actions"
            isActive={activeTab === 'actions'}
            onClick={() => setActiveTab('actions')}
          />
          <TabButton
            label={`On Leave (${filteredDataForOnleave.length})`}
            isActive={activeTab === 'onLeave'}
            onClick={() => setActiveTab('onLeave')}
          />
          {!myClassOnly && (
            <TabButton
              label={`CEP (${activeCEPCount})`}
              isActive={activeTab === 'shortLeave'}
              onClick={() => setActiveTab('shortLeave')}
            />
          )}
          <TabButton
            label={`History (${myClassOnly ? filteredData.length : leaveData.length})`}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          {!myClassOnly && (
            <>
              <TabButton
                label={`Medical Room (${medicalRoomStatus.length})`}
                isActive={activeTab === 'medicalRoom'}
                onClick={() => setActiveTab('medicalRoom')}
              />
              <TabButton
                label="My Dashboard"
                isActive={activeTab === 'My Dashboard'}
                onClick={() => setActiveTab('My Dashboard')}
              />
            </>
          )}
        </div>

        {!myClassOnly && activeTab === 'all' && (
          <div className="grid grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Today</span>
              <span className="text-xl font-black text-slate-800 tracking-tighter">{forecast.today}</span>
              <span className="block text-[7px] font-bold text-slate-400 mt-0.5 uppercase">Absentees</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-sky-50 border border-sky-100">
              <span className="block text-[8px] font-black text-sky-500 uppercase tracking-widest mb-1">Tomorrow</span>
              <span className="text-xl font-black text-sky-600 tracking-tighter">{forecast.tomorrow}</span>
              <span className="block text-[7px] font-bold text-sky-400 mt-0.5 uppercase">Forecast</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Day After</span>
              <span className="text-xl font-black text-indigo-600 tracking-tighter">{forecast.dayAfter}</span>
              <span className="block text-[7px] font-bold text-indigo-400 mt-0.5 uppercase">Forecast</span>
            </div>
          </div>
        )}

        {["all", "onLeave"].includes(activeTab) ?
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredData.length > 0 ? (
              <>
                {activeTab === 'onLeave' &&
                  <div className="mb-4 col-span-full">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <h2 className="text-lg font-semibold text-gray-900">Class-wise Absentees</h2>
                        <button
                          onClick={handleCopyClassWiseAbsentees}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black rounded-lg transition-all shadow-md active:scale-95 border border-slate-700 uppercase tracking-wider"
                          title="Copy all on-leave students class-wise"
                        >
                          <Clipboard size={12} />
                          <span>Copy All</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {(() => {
                          const classAbsentees = {};
                          // Initialize classes 1-10 to ensure they are always displayed
                          for (let i = 1; i <= 10; i++) {
                            classAbsentees[i] = 0;
                          }

                          filteredData.forEach(student => {
                            const classNum = student.studentId?.CLASS || student.classNum;
                            if (classNum) {
                              if (!classAbsentees[classNum]) {
                                classAbsentees[classNum] = 0;
                              }
                              classAbsentees[classNum]++;
                            }
                          });

                          const sortedClasses = Object.entries(classAbsentees)
                            .map(([classNum, count]) => ({ classNum: Number(classNum), count }))
                            .sort((a, b) => a.classNum - b.classNum);

                          return sortedClasses.map(({ classNum, count }) => (
                            <div key={classNum} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer"
                              onClick={() => setSelectedClass(classNum)}
                            >
                              <div className="text-[10px] uppercase font-black text-gray-500 border-b border-gray-100 pb-1 mb-1">Class {classNum}</div>
                              <div className={`text-2xl font-black ${count > 0 ? 'text-red-600' : 'text-slate-300'}`}>{count}</div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                }

                {filteredData.map((student) => (
                  <StudentStatusCard key={student._id} student={student} />
                ))}
              </>
            ) : (
              <div className="col-span-full">
                <div className="text-center text-gray-500 mt-8 p-8 bg-white rounded-lg shadow-sm">
                  <p className="text-sm sm:text-base">
                    No leave records found.
                  </p>
                </div>
              </div>
            )}
          </div>
          : activeTab === "My Dashboard" ?
            <>
              <div className="flex flex-wrap  gap-2  p-1  bg-white rounded-lg shadow-sm  w-full sm:w-auto mb-2">
                <TabButton
                  label={`Actions(${actionsTableData.filter(student => student.teacherId?.name === teacher?.name || student.teacher === teacher?.name).length})`}
                  isActive={activeTabMyDB === 'allActions'}
                  onClick={() => setActiveTabMyDB('allActions')}
                />
                <TabButton
                  label={`History(${filterDB.length})`}
                  isActive={activeTabMyDB === 'History'}
                  onClick={() => setActiveTabMyDB('History')}
                />
                
                <div className="ml-auto flex items-center gap-1 pr-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1">
                    <input 
                      type="date"
                      value={copyFromDate}
                      onChange={(e) => setCopyFromDate(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-[95px]"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1">
                    <input 
                      type="date"
                      value={copyToDate}
                      onChange={(e) => setCopyToDate(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-[95px]"
                    />
                  </div>
                  
                  <button
                    onClick={handleCustomCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-lg hover:bg-slate-900 transition-all shadow-md active:scale-95"
                    title="Copy selected range to clipboard"
                  >
                    <Clipboard size={12} />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handleWeekendCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 text-amber-400 text-[10px] font-black rounded-lg hover:bg-slate-900 transition-all shadow-md active:scale-95 border border-amber-400/20"
                    title="Copy latest weekend list (Thu-Fri)"
                  >
                    <Clipboard size={12} />
                    <span>Weekend</span>
                  </button>
                </div>
              </div>
              {activeTabMyDB === "allActions" ?
                <LeaveStatusTable
                  classData={actionsTableData.filter(student => student.teacherId?.name === teacher?.name || student.teacher === teacher?.name)}
                  onDataUpdate={refreshLeaveData}
                  getLeaveStatus={getLeaveStatus}
                  type="MyDashboard"
                />
                :
                <div>
                  {activeTabMyDB === "History" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filterDB.map((student) => (
                        <StudentStatusCard 
                          key={student._id} 
                          student={student} 
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              }
            </>
            :
            activeTab === "shortLeave" ?
              <div>
                <ShortLeave
                  statusData={shortLeaveStatus.filter(matchesFilters)}
                  type="shortLeave"
                />
              </div>
              :
              activeTab === "medicalRoom" ?
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {medicalRoomStatus.length > 0 ? (
                    medicalRoomStatus.map((student) => (
                      <StudentStatusCard key={student._id} student={student} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                      <div className="text-slate-300 font-black uppercase tracking-widest text-sm">No students in Medical Room</div>
                    </div>
                  )}
                </div>
                :
                <div>
                  {activeTab === "actions" && (
                    <LeaveStatusTable
                      classData={actionsTableData}
                      onDataUpdate={refreshLeaveData}
                      getLeaveStatus={getLeaveStatus}
                      type="Generalactions"
                    />
                  )}
                </div>
        }
      </div>

      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Class {selectedClass} - Absent Students
              </h3>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              {filteredData
                .filter(student => (student.studentId?.CLASS || student.classNum) === selectedClass)
                .map(student => (
                  <div key={student._id} className="flex items-center justify-between py-2 px-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{student.studentId?.['SHORT NAME'] || student.name}</div>
                      <div className="text-sm text-gray-500">AD: {student.studentId?.ADNO || student.ad}</div>
                    </div>
                    <StatusBadge status={student.displayStatus} />
                  </div>
                ))
              }

              
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600 text-center">
                Total: {filteredData.filter(student => (student.studentId?.CLASS || student.classNum) === selectedClass).length} students
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLeave && (
        <EditLeaveModal 
          leave={editingLeave} 
          isOpen={!!editingLeave} 
          onClose={() => setEditingLeave(null)} 
          onUpdate={refreshLeaveData}
        />
      )}

      <CustomAlert 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        actions={alertState.actions}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default LeaveStatus;
