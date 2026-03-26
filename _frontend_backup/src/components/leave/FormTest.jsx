import React, { useState, useEffect } from 'react';
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
      'Late Returned': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
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

const ClassCard = ({ classInfo, onReturn, getLeaveStatus, classData, setClassData }) => {
  const { _id, classNum, ad, name, remainingTime, status, returnedAt, toDate, toTime } = classInfo;

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
    if (status === 'Scheduled') {
      return calculateTimeToStart(classInfo.fromDate, classInfo.fromTime);
    }

    if ((status === 'Returned' || status === 'Late Returned') && returnedAt) {
      const toDateTime = new Date(`${toDate}T${toTime}`);
      const returnedAtDate = new Date(returnedAt);

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
      
      return "—";
    }

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

      const response = await axios.put(`${API_PORT}/leave/${leaveId}`, {
        status: newStatus
      });

      setClassData(prevData =>
        prevData.map(item => {
          if (item._id === leaveId) {
            const updatedItem = {
              ...item,
              status: newStatus,
              returnedAt: response.data.returnedAt
            };

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
        className: 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200',
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
        className: 'bg-blue-100 text-blue-400 cursor-not-allowed border border-blue-200',
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
        className: 'bg-green-100 text-green-600 cursor-not-allowed border border-green-200',
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
  const ButtonIcon = buttonState.icon;
  const isLateStatus = ['Late', 'Late Returned'].includes(status);
  const timeTitle = status === 'Scheduled' ? 'Starts In' : 
                   status === 'Pending' ? 'Starts In' :
                   ['Late', 'Late Returned'].includes(status) ? 'Late By' : 
                   'Remaining Time';

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <User size={20} className="text-white" />
            </div>
            <div className="text-white">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                  Class {classNum}
                </span>
                <span className="text-sm font-light opacity-90">AD {ad}</span>
              </div>
              <h2 className="text-xl font-bold">{name}</h2>
            </div>
          </div>
          
          <button 
            className={`flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 ${buttonState.className}`}
            disabled={buttonState.disabled}
            onClick={() => handleReturn(_id)}
          >
            <ButtonIcon size={16} />
            {buttonState.text}
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TimeDisplay 
            title={timeTitle}
            value={getDisplayTime()}
            icon={Clock}
            isLate={isLateStatus}
          />
          
          <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Status</span>
            </div>
            <StatusPill status={status} />
          </div>

          <TimeDisplay 
            title="Returned At"
            value={formatReturnedTime(returnedAt)}
            icon={Calendar}
          />
        </div>
      </div>
    </div>
  );
};

function FormTest() {
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

    if (item.status === 'returned') {
      if (item.returnedAt && new Date(item.returnedAt) > toDateTime) {
        return 'Late Returned';
      }
      return 'Returned';
    }

    if (now < fromDateTime) return 'Scheduled';

    if (now >= fromDateTime && item.status === 'Scheduled') {
      return 'Pending';
    }

    if (now >= fromDateTime && now <= toDateTime && item.status === 'active') return 'On Leave';

    if (now > toDateTime && item.status !== 'returned') return 'Late';

    return item.status;
  };

  const handleReturn = async (leaveId) => {
    try {
      const leave = classData.find((item) => item._id === leaveId);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Management</h1>
          <p className="text-gray-600">Track and manage student leave requests</p>
        </div>

        <div className="space-y-6">
          {classData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No leave records found</p>
              <p className="text-gray-400 text-sm mt-1">All leave requests will appear here</p>
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FormTest;