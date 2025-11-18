import React from 'react';
import { Clock, ChevronRight, FileSignature, CheckCircle, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'Active': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        icon: Clock,
        label: 'Active'
      },
      'Completed': { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        icon: CheckCircle,
        label: 'Completed'
      },
      'Expired': { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        icon: XCircle,
        label: 'Expired'
      }
    };
    return configs[status] || configs['Active'];
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

function ShortLeave({ statusData }) {
  const formatTime = (timeString) => {
    if (!timeString) return '—';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        weekday: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getShortLeaveStatus = (leave) => {
    const now = new Date();
    const today = new Date().toDateString();
    const leaveDate = new Date(leave.date).toDateString();
    
    // If it's not today's leave, mark as expired
    if (leaveDate !== today) {
      return 'Expired';
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const fromTime = convertTimeToMinutes(leave.fromTime);
    const toTime = convertTimeToMinutes(leave.toTime);

    if (currentTime < fromTime) return 'Active';
    if (currentTime >= fromTime && currentTime <= toTime) return 'Active';
    if (currentTime > toTime) return 'Expired';

    return 'Active';
  };

  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isCurrentlyActive = (leave) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const fromTime = convertTimeToMinutes(leave.fromTime);
    const toTime = convertTimeToMinutes(leave.toTime);
    
    return currentTime >= fromTime && currentTime <= toTime;
  };

  if (!statusData || statusData.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8 p-8 bg-white rounded-lg shadow-sm">
        <p className="text-sm sm:text-base">No short leave records found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {statusData.map((leave) => {
        const status = getShortLeaveStatus(leave);
        const isActiveNow = isCurrentlyActive(leave);
        
        const statusColor = status === 'Active' && isActiveNow 
          ? 'bg-green-500' 
          : status === 'Active' 
          ? 'bg-blue-500'
          : 'bg-red-500';

        return (
          <div key={leave._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Status Indicator Bar */}
            <div className={`h-1 ${statusColor}`}></div>
            
            <div className="p-3 sm:p-4">
              {/* Header Row: AD, Name, Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${statusColor} flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0`}>
                    {leave.ad}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{leave.name}</h3>
                    <p className="text-xs text-gray-500">Class {leave.classNum}</p>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>



              {/* Time Info - Compact */}
              <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
                 <div className="col-span-2 flex items-center gap-1.5 text-gray-600 bg-blue-50 px-2 py-1 rounded">
                    <span className="font-medium">Date:</span>
                  <span className="truncate">{formatDate(leave.date)}</span>
                </div>
                <div className="col-span-1 flex items-center gap-1.5 text-gray-600 bg-red-50 px-2 py-1 rounded">
                  <span className="font-medium">From:</span>
                  <span className="truncate">{formatTime(leave.fromTime)}</span>
                </div>
                <div className="col-span-1 flex items-center gap-1.5 text-gray-600 bg-green-50 px-2 py-1 rounded">
                  <span className="font-medium">To:</span>
                  <span className="truncate">{formatTime(leave.toTime)}</span>
                </div>
               
              </div>


      
              <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-100">
              
                {leave.teacher && (
                  <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    <FileSignature size={12} />
                    <span className="font-medium">{leave.teacher}</span>
                  </div>
                )}
                
                {leave.reason && (
                  <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded  ">
                    <span className="truncate italic">{leave.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ShortLeave;