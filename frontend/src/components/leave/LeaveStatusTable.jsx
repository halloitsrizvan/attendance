import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Clock, Calendar, User, ArrowUpRight, CheckCircle, PlayCircle, RotateCcw } from 'lucide-react';
import { API_PORT } from '../../Constants';

const StatusPill = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'Scheduled': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      'Pending': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
      'On Leave': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      'Late': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      'Returned': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      'Late Returned': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-orange-200' }
    };
    return configs[status] || configs['Scheduled'];
  };

  const config = getStatusConfig(status);
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {status === 'Returned' && <CheckCircle size={12} />}
      {status === 'Pending' && <Clock size={12} />}
      {status === 'On Leave' && <PlayCircle size={12} />}
      {status === 'Late Returned' && <RotateCcw size={12} />}
      {status}
    </span>
  );
};
const TimeDisplay = ({ title, value, icon: Icon, isLate = false }) => {
  return (
    <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={isLate ? 'text-red-500' : 'text-gray-500'} />
        <span className={`text-xs font-medium ${isLate ? 'text-red-600' : 'text-gray-600'}`}>
          {title}
        </span>
      </div>
      <span className={`text-sm font-semibold ${isLate ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
};
const ClassCard = ({ classInfo, onReturn, getLeaveStatus, classData, setClassData, teacher }) => {
  const { _id, classNum, ad, name, remainingTime, status, returnedAt, toDate, toTime,fromTime,fromDate } = classInfo;
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
    return returnedDate.toLocaleDateString() + ', ' + returnedDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleReturn = async (leaveId) => {

  try {
    const leave = classData.find((item) => item._id === leaveId);

    const newStatus = leave.status === 'Pending' ? 'active' : 'returned';

    const payload = { status: newStatus };

    if (newStatus === 'active' && teacher?.name) {
      payload.leaveStartTeacher = teacher.name;
      
      axios.patch(`${API_PORT}/students/on-leave/${ad}`, {onLeave: true})
        .then(() => {
          console.log("Student on leave updated successfully!");
        })
        .catch((err) => {
          console.log("Error updating student on leave", err);
          alert("Error updating student on leave. Please try again.");
        });
    }

    if (newStatus === 'returned' && teacher?.name) {
      payload.markReturnedTeacher = teacher.name;

      axios.patch(`${API_PORT}/students/on-leave/${ad}`, {onLeave: false})
        .then(() => {
          console.log("Student on leave updated successfully!");
        })
        .catch((err) => {
          console.log("Error updating student on leave to false", err);
          alert("Error updating student on leave to false. Please try again.");
        });
    }

    const response = await axios.put(`${API_PORT}/leave/${leaveId}`, payload);

    setClassData(prevData =>
      prevData.map(item => {
        if (item._id === leaveId) {
          const updatedItem = {
            ...item,
            status: newStatus,
            returnedAt: response.data.returnedAt,
            leaveStartTeacher: response.data.leaveStartTeacher ?? item.leaveStartTeacher,
            markReturnedTeacher: response.data.markReturnedTeacher ?? item.markReturnedTeacher
          };

          // Compute display status instantly (no refresh needed)
          return {
            ...updatedItem,
            status: getLeaveStatus(updatedItem)
          };
        }
        return item;
      })
    );

  } catch (error) {
    console.error('Error updating leave status:', error);
    alert('Failed. Try again.');
  }
};


 const getButtonState = () => {
    const endDateTime = new Date(`${classInfo.toDate}T${classInfo.toTime}`);
    const now = new Date();
    const diffHours = (endDateTime - now) / (1000 * 60 * 60);
    
    if (status === 'Scheduled') {
      return { 
        disabled: true, 
        text: 'Scheduled', 
        className: ' text-gray-50 cursor-not-allowed border border-gray-200',
        icon: Clock
      };
    }

    if (status === 'Pending') {
      return { 
        disabled: false, 
        text: 'Start Leave', 
        className: 'bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 shadow-sm',
        icon: PlayCircle
      };
    }

    if (status === 'On Leave' && diffHours > 4 && diffHours > 0) {
      return { 
        disabled: true, 
        text: 'On Leave', 
        className: 'text-blue-100 cursor-not-allowed border border-blue-200',
        icon: Clock
      };
    }

    if (status === 'On Leave' || status === 'Late') {
      return { 
        disabled: false, 
        text: 'Mark Returned', 
        className: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
        icon: CheckCircle
      };
    }

    if (status === 'Returned' || status === 'Late Returned') {
      return { 
        disabled: true, 
        text: 'Returned', 
        className: 'text-green-100 cursor-not-allowed border border-green-200',
        icon: CheckCircle
      };
    }

    return { 
      disabled: false, 
      text: 'Mark Returned', 
      className: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
      icon: CheckCircle
    };
  };
  const buttonState = getButtonState();
  const actionDescription = buttonState.text.toLowerCase();

  const handleActionWithConfirm = async () => {
    setIsProcessing(true);
    try {
      await handleReturn(_id);
      setShowConfirm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
    <div className="bg-white shadow-md rounded-xl overflow-hidden w-full">
      {/* --- Card Header (Green) --- */}
      <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="text-xs font-light bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">Class {classNum}</div>
            <div className="text-xs font-light px-2 ">AD {ad}</div>
          </div>
          <h2 className="text-base font-semibold">{name}</h2>
        </div>
        <button 
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 ${buttonState.className}`}
          disabled={buttonState.disabled}
          onClick={() => setShowConfirm(true)}
        >
          <buttonState.icon size={16}/>
          
          {buttonState.text}
        </button>
      </div>

      {/* --- Card Body (Light Green) --- */}
      <div className="bg-emerald-100 p-4 grid grid-cols-3 gap-4 text-center">
        <InfoColumn title={status} value={getDisplayTime()} />
        <InfoColumn title="Status"> 
          <StatusPill status={status} />
        </InfoColumn>
        <InfoColumn title="Returned At" value={formatReturnedTime(returnedAt)} />
      </div>
    </div>
    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
            <button
              onClick={() => !isProcessing && setShowConfirm(false)}
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="Close confirmation dialog"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            You are about to {actionDescription} for <span className="font-semibold text-gray-900">{name}</span>. This will update the leave status.
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2">
              <Calendar size={14} className="text-gray-400" />
             {actionDescription === "start leave" ?
              <span>From Date & Time: {fromDate} {new Date(`${fromDate}T${fromTime}`).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
              } </span>:actionDescription === "mark returned" ?
              <span>To Date & Time: {toDate} {new Date(`${toDate}T${toTime}`).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
              } </span>:null}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold transition-colors disabled:opacity-70 disabled:cursor-wait ${isProcessing ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                onClick={handleActionWithConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
                    Processing
                  </span>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
// "Remaining/Late Time"
const InfoColumn = ({ title, value, children }) => {
  const isLate = ["Late Returned", "Late"].includes(title);
  
  // Get the same styling as StatusPill
  const getValueStyle = () => {
    if (isLate) {
      return "bg-red-100 text-red-700 border-red-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };
// ${isLate ? 'text-red-500' : 'text-gray-500'}
  return (
    <div className="flex flex-col items-center justify-start ">
      
      <h3 className={`text-xs font-medium mb-1  text-gray-500`}> 
        {isLate ? "Late By" : 
         title === "Status" ? "Status" :
         title === "Returned At" ? "Returned At" :
         title === "Scheduled" ? "Starts in" : "Remaining Time"}
      </h3>
      {children ? (
        children
      ) : (
        <span className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-xl border ${getValueStyle()}`}>
          {value}
        </span>
      )}
    </div>
  );
};

function LeaveStatusTable() {
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
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = () => {
    setLoading(true);
    axios.get(`${API_PORT}/leave`)
      .then((res) => {
        const processedData = res.data.map(item => ({
          ...item,
          status: getLeaveStatus(item)
        }));
        setClassData(processedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leave data:', err);
        setLoading(false);
      });
  };

    const getLeaveStatus = (item) => {
    const now = new Date();
    const fromDateTime = new Date(`${item.fromDate}T${item.fromTime}`);
    const toDateTime = new Date(`${item.toDate}T${item.toTime}`);

    // Returned logic
    if (item.status === 'returned') {
        if (item.returnedAt && new Date(item.returnedAt) > toDateTime) {
        return 'Late Returned';
        }
        return 'Returned';
    }

    // Before leave start
    if (now < fromDateTime) return 'Scheduled';

    // Time has come, but leave not started yet
    if (now >= fromDateTime && item.status === 'Scheduled') {
        return 'Pending';  // <- Start Leave stage
    }

    // Leave running normally
    if (now >= fromDateTime && now <= toDateTime && item.status === 'active') return 'On Leave';

    // Leave ended but student not returned
    if (now > toDateTime && item.status !== 'returned') return 'Late';

    return item.status;
    };


        const handleReturn = async (leaveId) => {
        try {
            // Find the record from state
            const leave = classData.find((item) => item._id === leaveId);

            // Decide next status based on current one
            const newStatus = leave.status === 'Pending' ? 'active' : 'returned';

            const response = await axios.put(`${API_PORT}/leave/${leaveId}`, {
            status: newStatus
            });

            setClassData(prevData =>
            prevData.map(item =>
                item._id === leaveId
                ? { ...item, status: newStatus, returnedAt: response.data.returnedAt }
                : item
            )
            );

        } catch (error) {
            console.error('Error updating leave status:', error);
            alert('Failed. Try again.');
        }
        };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">
        {classData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No leave records found.</p>
          </div>
        ) : (
            <>
              

            { classData.map((item) => (
            <ClassCard 
                key={item._id} 
                classInfo={item} 
                onReturn={handleReturn}
                classData={classData}
                setClassData={setClassData}
                getLeaveStatus={getLeaveStatus}
                teacher={teacher}
                />

          ))}
            </>
         
        )}
      </div>
    </div>
  );
}

export default LeaveStatusTable;

