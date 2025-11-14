import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, User, XCircle, RefreshCw, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';

const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`py-1.5 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        bg: 'bg-orange-100', 
        text: 'text-orange-700', 
        icon: AlertCircle,
        label: 'Late Returned'
      },
      'On Leave': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
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
      }
    };
    return configs[status] || configs['Not Arrived'];
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

const StudentStatusCard = ({ student }) => {
  const formatTime = (date, time) => {
    if (!date || !time) return '—';
    try {
      const dateTime = new Date(`${date}T${time}`);
      return dateTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return `${date} ${time}`;
    }
  };

  const formatReturnedTime = (returnedAt) => {
    if (!returnedAt) return null;
    try {
      const returnedDate = new Date(returnedAt);
      return returnedDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return null;
    }
  };

  const isArrived = student.displayStatus === 'Arrived' || student.displayStatus === 'Late Returned';
  const statusColor = isArrived 
    ? student.displayStatus === 'Late Returned' ? 'bg-orange-500' : 'bg-green-500'
    : student.displayStatus === 'On Leave' 
    ? 'bg-blue-500'
    : student.displayStatus === 'Late'
    ? 'bg-orange-500'
    : 'bg-red-500';

  const returnedTime = formatReturnedTime(student.returnedAt);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Status Indicator Bar */}
      <div className={`h-1 ${statusColor}`}></div>
      
      <div className="p-3 sm:p-4">
        {/* Header Row: AD, Name, Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${statusColor} flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0`}>
              {student.ad}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
              <p className="text-xs text-gray-500">Class {student.classNum}</p>
            </div>
          </div>
          <StatusBadge status={student.calculatedStatus === 'Late Returned' ? 'Late Returned' : student.displayStatus} />
        </div>

        {/* Time Info - Compact */}
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

        {/* Returned Time */}
        {returnedTime && (
          <div className={`flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded ${
            student.calculatedStatus === 'Late Returned' 
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

        {/* Teacher & Reason - Compact Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-100">
          {/* Teacher who created leave */}
          {student.teacher && (
            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              <User size={12} />
              <span className="font-medium">{student.teacher}</span>
            </div>
          )}
          
          {/* Action Teachers */}
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
            <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded flex-1 min-w-0">
              <span className="truncate italic">{student.reason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function LeaveStatus() {
  const [activeTab, setActiveTab] = useState('all');
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate leave status
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

    return item.status || 'Scheduled';
  };

  const getDisplayStatus = (status) => {
    const statusMap = {
      'Returned': 'Arrived',
      'Late Returned': 'Late Returned',
      'On Leave': 'On Leave',
      'Late': 'Late',
      'Pending': 'Pending',
      'Scheduled': 'Scheduled'
    };
    return statusMap[status] || 'Not Arrived';
  };

  useEffect(() => {
    fetchLeaveData();
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

  const filteredData = useMemo(() => {
    if (activeTab === 'notArrived') {
      return leaveData.filter(student => 
        ['On Leave', 'Late', 'Pending', 'Scheduled'].includes(student.displayStatus)
      );
    }
    return leaveData;
  }, [leaveData, activeTab]);

  const notArrivedCount = useMemo(() => {
    return leaveData.filter(s => 
      ['On Leave', 'Late', 'Pending', 'Scheduled'].includes(s.displayStatus)
    ).length;
  }, [leaveData]);

  const arrivedCount = useMemo(() => {
    return leaveData.filter(s => s.displayStatus === 'Arrived' || s.displayStatus === 'Late Returned').length;
  }, [leaveData]);

  const onLeaveCount = useMemo(() => {
    return leaveData.filter(s => s.displayStatus === 'On Leave').length;
  }, [leaveData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 mt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 mt-16">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; }
        `}
      </style>
      
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={24} className="text-indigo-600"/> 
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leave Status</h1>
          </div>
          <button
            onClick={fetchLeaveData}
            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Compact Stats - Mobile Optimized */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-2 border-indigo-500">
            <div className="text-xs text-gray-600 mb-1">All</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{leaveData.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-2 border-green-500">
            <div className="text-xs text-gray-600 mb-1">Arrived</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{arrivedCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-2 border-red-500">
            <div className="text-xs text-gray-600 mb-1">Not Arrived</div>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{notArrivedCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-2 border-blue-500">
            <div className="text-xs text-gray-600 mb-1">On Leave</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{onLeaveCount}</div>
          </div>
        </div> */}
        
        {/* Compact Tabs */}
        <div className="flex gap-2 mb-4 p-1 bg-white rounded-lg shadow-sm w-full sm:w-auto">
          <TabButton 
            label={`All (${leaveData.length})`}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabButton 
            label={`Not Arrived (${notArrivedCount})`}
            isActive={activeTab === 'notArrived'}
            onClick={() => setActiveTab('notArrived')}
          />
        </div>
  
        {/* Cards Grid - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((student) => (
              <StudentStatusCard key={student._id} student={student} />
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center text-gray-500 mt-8 p-8 bg-white rounded-lg shadow-sm">
                <p className="text-sm sm:text-base">
                  {activeTab === 'notArrived' 
                    ? 'All students have arrived! 🎉' 
                    : 'No leave records found.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaveStatus;
