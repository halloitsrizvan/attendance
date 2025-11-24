import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Clock, Calendar, User, ArrowUpRight, CheckCircle, PlayCircle, RotateCcw ,Edit} from 'lucide-react';
import { API_PORT } from '../../Constants';

const StatusPill = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'Scheduled': { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      'Pending': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      'On Leave': { bg: 'bg-blue-100', text: 'text-blue-700', icon: PlayCircle },
      'Late': { bg: 'bg-red-100', text: 'text-red-700', icon: Clock },
      'Returned': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      'Late Returned': { bg: 'bg-orange-100', text: 'text-orange-700', icon: RotateCcw }
    };
    return configs[status] || configs['Scheduled'];
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      <Icon size={10} />
      <span>{status}</span>
    </span>
  );
};

const ClassCard = ({ classInfo, onReturn, getLeaveStatus, classData, setClassData, teacher }) => {
  const { _id, classNum, ad, name, remainingTime, status, returnedAt, toDate, toTime, fromTime, fromDate } = classInfo;
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateRemainingTime = (toDate, toTime) => {
    if (!toDate || !toTime) return "—";

    const endDateTime = new Date(`${toDate}T${toTime}`);
    const now = new Date();
    const diffMs = endDateTime - now;

    if (diffMs <= 0) {
      const expiredMs = now - endDateTime;
      const expiredDays = Math.floor(expiredMs / (1000 * 60 * 60 * 24));
      const expiredHours = Math.floor((expiredMs / (1000 * 60 * 60)) % 24);
      const expiredMinutes = Math.floor((expiredMs / (1000 * 60)) % 60);

      let result = "";
      if (expiredDays > 0) result += `${expiredDays}d `;
      if (expiredHours > 0) result += `${expiredHours}h `;
      if (expiredMinutes > 0) result += `${expiredMinutes}m`;
      
      return result.trim() || "0m";
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

    let result = "";
    if (diffDays > 0) result += `${diffDays}d `;
    if (diffHours > 0) result += `${diffHours}h `;
    if (diffMinutes > 0) result += `${diffMinutes}m`;
    
    return result.trim() || "Less than a minute";
  };

  const calculateTimeToStart = (fromDate, fromTime) => {
    if (!fromDate || !fromTime) return "—";

    const startDateTime = new Date(`${fromDate}T${fromTime}`);
    const now = new Date();
    const diffMs = startDateTime - now;

    if (diffMs <= 0) return "0m";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

    let result = "";
    if (diffDays > 0) result += `${diffDays}d `;
    if (diffHours > 0) result += `${diffHours}h `;
    if (diffMinutes > 0) result += `${diffMinutes}m`;

    return result.trim() || "Less than a minute";
  };

  const getDisplayTime = () => {
    // When leave not started yet
    if (status === 'Scheduled') {
      return calculateTimeToStart(classInfo.fromDate, classInfo.fromTime);
    }

    // When returned
    if ((status === 'Returned' || status === 'Late Returned') && returnedAt) {
      const toDateTime = new Date(`${toDate}T${toTime}`);
      const returnedAtDate = new Date(returnedAt);

      // Calculate late time
      if (returnedAtDate > toDateTime) {
        const lateMs = returnedAtDate - toDateTime;
        const lateDays = Math.floor(lateMs / (1000 * 60 * 60 * 24));
        const lateHours = Math.floor((lateMs / (1000 * 60 * 60)) % 24);
        const lateMinutes = Math.floor((lateMs / (1000 * 60)) % 60);

        let lateResult = "";
        if (lateDays > 0) lateResult += `${lateDays}d `;
        if (lateHours > 0) lateResult += `${lateHours}h `;
        if (lateMinutes > 0) lateResult += `${lateMinutes}m`;

        return lateResult.trim() || "0m";
      } 
      
      // Returned within time
      return "—";
    }

    // Running leave or late
    return calculateRemainingTime(toDate, toTime);
  };

  const formatReturnedTime = (returnedAt) => {
    if (!returnedAt) return "—";
    
    const returnedDate = new Date(returnedAt);
    return returnedDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return "—";
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleReturn = async () => {
    try {
      setIsProcessing(true);
      const leaveId=_id;
      const leave = classData.find((item) => item._id === leaveId);
      
      // Add null check for leave
      if (!leave) {
        console.error('Leave not found with ID:', leaveId);
        alert('Leave record not found. Please refresh the page.');
        return;
      }

      // Map frontend status to backend status
      let newStatus;
      if (leave.status === 'Pending') {
        newStatus = 'active'; // Start leave
      } else if (leave.status === 'On Leave' || leave.status === 'Late') {
        newStatus = 'returned'; // Mark return
      } else {
        console.error('Invalid status transition:', leave.status);
        return;
      }

      const payload = { status: newStatus };

      // Add teacher information
      if (teacher?.name) {
        if (newStatus === 'active') {
          payload.leaveStartTeacher = teacher.name;
          try {
            await axios.patch(`${API_PORT}/students/on-leave/${leave.ad}`, { onLeave: true });
          } catch (error) {
            console.error('Error updating student onLeave status:', error);
          }
        } else if (newStatus === 'returned') {
          payload.markReturnedTeacher = teacher.name;
          try {
            await axios.patch(`${API_PORT}/students/on-leave/${leave.ad}`, { onLeave: false });
          } catch (error) {
            console.error('Error updating student onLeave status:', error);
          }
        }
      }

      console.log('Updating leave with payload:', payload);

      const response = await axios.put(`${API_PORT}/leave/${leaveId}`, payload);

      // Update local state with the response data
      setClassData(prevData =>
        prevData.map(item => {
          if (item._id === leaveId) {
            return {
              ...item,
              status: newStatus,
              returnedAt: newStatus === 'returned' ? (response.data.returnedAt || new Date().toISOString()) : item.returnedAt,
              leaveStartTeacher: response.data.leaveStartTeacher || payload.leaveStartTeacher || item.leaveStartTeacher,
              markReturnedTeacher: response.data.markReturnedTeacher || payload.markReturnedTeacher || item.markReturnedTeacher
            };
          }
          return item;
        })
      );

      // Call parent's refresh function to sync data
      if (onReturn) {
        onReturn();
      }

    } catch (error) {
      console.error('Error updating leave status:', error);
      console.log('Error details:', error.response?.data);
      alert('Failed to update leave status. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonState = () => {
    // const endDateTime = new Date(`${classInfo.toDate}T${classInfo.toTime}`);
    // const now = new Date();
    // const diffHours = (endDateTime - now) / (1000 * 60 * 60);
    
    if (status === 'Scheduled') {
      return { 
        disabled: true, 
        text: 'Scheduled', 
        className: 'bg-gray-100 text-gray-500 cursor-not-allowed',
        icon: Clock
      };
    }

    if (status === 'Pending') {
      return { 
        disabled: false, 
        text: 'Start', 
        className: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
        icon: PlayCircle
      };
    }

    // if (status === 'On Leave' && diffHours > 4 && diffHours > 0) {
    //   return { 
    //     disabled: true, 
    //     text: 'On Leave', 
    //     className: 'bg-blue-100 text-blue-600 cursor-not-allowed',
    //     icon: Clock
    //   };
    // }

    if (status === 'On Leave' || status === 'Late') {
      return { 
        disabled: false, 
        text: 'Return', 
        className: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm',
        icon: CheckCircle
      };
    }

    if (status === 'Returned' || status === 'Late Returned') {
      return { 
        disabled: true, 
        text: 'Returned', 
        className: 'bg-green-100 text-green-600 cursor-not-allowed',
        icon: CheckCircle
      };
    }

    return { 
      disabled: false, 
      text: 'Return', 
      className: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm',
      icon: CheckCircle
    };
  };

  const buttonState = getButtonState();
  const actionDescription = buttonState.text.toLowerCase();

  const handleActionWithConfirm = async () => {
    setIsProcessing(true);
    try {
      await handleReturn();
      setShowConfirm(false);
    } catch (error) { 
      console.error('Error processing action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Compact Card Design */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Header - Student Info & Action Button */}
        <div className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {ad}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">C{classNum}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>From: {formatDateTime(fromDate, fromTime)}</span>
                <span>To: {formatDateTime(toDate, toTime)}</span>
              </div>
            </div>
          </div>
          
          <button 
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors duration-200 flex-shrink-0 ${buttonState.className}`}
            disabled={buttonState.disabled || isProcessing}
            onClick={() => !buttonState.disabled && setShowConfirm(true)}
          >
            <buttonState.icon size={14}/>
            <span className=" sm:inline">{buttonState.text}</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-3 pb-3 flex items-center justify-between gap-2">
          <StatusPill status={status} />
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>
              {status === "Scheduled" ? "Starts in" : 
               status === "Returned" || status === "Late Returned" ? "Returned" : 
               "Remaining"} {getDisplayTime()}
            </span>
            {returnedAt && (
              <span className="text-green-600">At: {formatReturnedTime(returnedAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xs w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Confirm {buttonState.text}</h3>
              <button
                onClick={() => !isProcessing && setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {actionDescription} for <span className="font-semibold">{name}</span>?
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-2 py-1.5 mb-3">
              <Calendar size={12} className="text-gray-400" />
              {actionDescription === "start" ?
                <span>From: {formatDateTime(fromDate, fromTime)}</span> :
                <span>To: {formatDateTime(toDate, toTime)}</span>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-semibold transition-colors ${isProcessing ? 'bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                onClick={handleActionWithConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                    Wait
                  </>
                ) : (
                  <>
                    <CheckCircle size={12} />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function LeaveStatusTable({ classData: initialClassData, onDataUpdate, getLeaveStatus }) {
  const teacher = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem("teacher");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse teacher from localStorage:', error);
      return null;
    }
  }, []);

  const [classData, setClassData] = useState(initialClassData || []);

  // Update local state when parent data changes
  useEffect(() => {
    setClassData(initialClassData || []);
  }, [initialClassData]);

  const handleReturn = async (leaveId) => {
    try {
      const leave = classData.find((item) => item._id === leaveId);
      const newStatus = leave.status === 'Pending' ? 'active' : 'returned';

      const response = await axios.put(`${API_PORT}/leave/${leaveId}`, {
        status: newStatus
      });

      // Update local state immediately
      setClassData(prevData =>
        prevData.map(item =>
          item._id === leaveId
            ? { ...item, status: newStatus, returnedAt: response.data.returnedAt }
            : item
        )
      );

      // Refresh parent data to sync with server
      if (onDataUpdate) {
        onDataUpdate();
      }

    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  // If no data is passed as prop
  if (!initialClassData) {
    return (
      <div className="min-h-64 bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-64 bg-gray-50 p-3 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-3">
        {classData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No pending actions found.</p>
          </div>
        ) : (
          classData.map((item) => (
            <ClassCard 
              key={item._id} 
              classInfo={item} 
              onReturn={handleReturn}
              classData={classData}
              setClassData={setClassData}
              getLeaveStatus={getLeaveStatus}
              teacher={teacher}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default LeaveStatusTable;