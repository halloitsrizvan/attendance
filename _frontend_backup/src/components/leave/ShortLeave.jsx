import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, FileSignature, CheckCircle, XCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import ConfirmationModal from '../common/ConfirmationModal';

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
        label: 'Returned'
      },
      'Expired': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Expired'
      },
      'On Leave': {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: Clock,
        label: 'On Leave'
      },
      'Pending': {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: Clock,
        label: 'Pending'
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

function ShortLeave({ statusData: initialStatusData, type, onDataUpdate }) {
  const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) : null;
  const [statusData, setStatusData] = useState(initialStatusData || []);
  const [processingId, setProcessingId] = useState(null);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDangerous: false,
    action: null,
    leaveData: null
  });

  // Update local state when parent data changes
  useEffect(() => {
    setStatusData(initialStatusData || []);
  }, [initialStatusData]);

  const actionButtonHandle = (leave, actionType) => {
    let title = '';
    let message = '';
    let confirmText = '';
    let isDangerous = false;

    if (actionType === 'returnToClass' || actionType === 'markReturn') {
      title = 'Confirm Return';
      message = `Are you sure you want to mark ${leave.name} as returned?`;
      confirmText = 'Mark Returned';
      isDangerous = false;
    } else if (actionType === 'medicalLeave') {
      title = 'Confirm Medical Leave';
      message = `Are you sure you want to create a medical leave without end date for ${leave.name}? This will mark the medical room leave as returned.`;
      confirmText = 'Create Medical Leave';
      isDangerous = false;
    }

    setConfirmationModal({
      isOpen: true,
      title,
      message,
      confirmText,
      isDangerous,
      action: actionType,
      leaveData: leave
    });
  };

  const handleConfirmAction = async () => {
    const { action: actionType, leaveData: leave } = confirmationModal;
    if (!leave || !actionType) return;

    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
    setProcessingId(leave._id);

    try {
      if (actionType === 'returnToClass' || actionType === 'markReturn') {
        const payload = {
          status: 'returned',
          returnedAt: new Date().toISOString(),
          markReturnedTeacher: teacher?.name || 'Unknown Teacher'
        };

        const response = await axios.put(`${API_PORT}/leave/${leave._id}`, payload);

        // Update local state immediately for instant UI feedback
        setStatusData(prevData =>
          prevData.map(item =>
            item._id === leave._id
              ? {
                ...item,
                status: 'returned',
                returnedAt: response.data.returnedAt,
                markReturnedTeacher: response.data.markReturnedTeacher
              }
              : item
          )
        );

        // Call parent's refresh function to sync data
        if (onDataUpdate) {
          onDataUpdate();
        }

      } else if (actionType === 'medicalLeave') {
        const pad = (n) => String(n).padStart(2, "0");
        const now = new Date();
        const fromTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const payload = {
          ad: leave.ad,
          name: leave.name,
          classNum: leave.classNum,
          fromDate: new Date().toISOString().split('T')[0],
          fromTime: fromTime,
          toDate: null,
          toTime: null,
          reason: 'Medical',
          teacher: teacher.name,
          status: "active"
        };

        await axios.post(`${API_PORT}/leave`, payload);

        const payload2 = {
          status: 'returned',
          returnedAt: new Date().toISOString(),
          markReturnedTeacher: teacher?.name || 'Unknown Teacher'
        };

        const response = await axios.put(`${API_PORT}/leave/${leave._id}`, payload2);

        // Update local state immediately for instant UI feedback
        setStatusData(prevData =>
          prevData.map(item =>
            item._id === leave._id
              ? {
                ...item,
                status: 'returned',
                returnedAt: response.data.returnedAt,
                markReturnedTeacher: response.data.markReturnedTeacher
              }
              : item
          )
        );
        // Refresh data after creating medical leave
        if (onDataUpdate) {
          onDataUpdate();
        }

        console.log("Medical leave created successfully");
      }
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Failed to process action. Please try again.');
    } finally {
      setProcessingId(null);
      setConfirmationModal({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        isDangerous: false,
        action: null,
        leaveData: null
      });
    }
  };

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

  // For medical room (regular leave data)
  const getMedicalRoomStatus = (leave) => {
    const now = new Date();
    const fromDateTime = new Date(`${leave.fromDate}T${leave.fromTime}`);
    const toDateTime = leave.toDate && leave.toTime ? new Date(`${leave.toDate}T${leave.toTime}`) : null;

    // Check if returned first - this takes highest priority
    if (leave.status === 'returned') return 'Completed';

    // Then check if it's in the future
    if (now < fromDateTime) return 'Pending';

    // Then check if currently active
    if (now >= fromDateTime && now <= (toDateTime || new Date(fromDateTime.getTime() + 24 * 60 * 60 * 1000))) {
      return 'On Leave';
    }

    // Otherwise it's expired/ended
    return 'Expired';
  };

  // For short leave data
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

    if (currentTime < fromTime) return 'Pending';
    if (currentTime >= fromTime && currentTime <= toTime) return 'Active';
    if (currentTime > toTime) return 'Expired';

    return 'Active';
  };

  // For medical without end date
  const getMedicalWithoutEndDateStatus = (leave) => {
    // Check if returned first - this takes highest priority
    if (leave.status === 'returned') return 'Completed';

    // Otherwise it's active
    return 'Active';
  };

  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isCurrentlyActive = (leave, status) => {
    if (type === 'medicalRoom') {
      const now = new Date();
      const fromDateTime = new Date(`${leave.fromDate}T${leave.fromTime}`);
      const toDateTime = leave.toDate && leave.toTime ? new Date(`${leave.toDate}T${leave.toTime}`) : new Date(fromDateTime.getTime() + 24 * 60 * 60 * 1000);
      return now >= fromDateTime && now <= toDateTime && status === 'On Leave';
    } else if (type === 'medicalWithoutEndDate') {
      const now = new Date();
      const fromDateTime = new Date(`${leave.fromDate}T${leave.fromTime}`);
      return now >= fromDateTime && status === 'Active';
    } else {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const fromTime = convertTimeToMinutes(leave.fromTime);
      const toTime = convertTimeToMinutes(leave.toTime);
      return currentTime >= fromTime && currentTime <= toTime && status === 'Active';
    }
  };

  if (!statusData || statusData.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8 p-8 bg-white rounded-lg shadow-sm">
        <p className="text-sm sm:text-base">
          {type === "shortLeave" ? "No short leave records found." :
            type === "medicalWithoutEndDate" ? "No medical leaves without end date found." :
              "No medical (room) leave records found."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {statusData.map((leave) => {
        // Determine status based on type
        let status;
        if (type === 'medicalRoom') {
          status = getMedicalRoomStatus(leave);
        } else if (type === 'medicalWithoutEndDate') {
          status = getMedicalWithoutEndDateStatus(leave);
        } else {
          status = getShortLeaveStatus(leave);
        }

        const isActiveNow = isCurrentlyActive(leave, status);
        const isProcessing = processingId === leave._id;

        const statusColor =
          status === 'Active' && isActiveNow ? 'bg-green-500' :
            status === 'On Leave' && isActiveNow ? 'bg-orange-500' :
              status === 'Pending' ? 'bg-blue-500' :
                status === 'Completed' ? 'bg-green-500' :
                  'bg-red-500';

        return (
          <div key={leave._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">

            <div className={`h-1 ${statusColor}`}></div>

            <div className="p-3 sm:p-4">

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

                {/* Status Badge or Action Buttons */}
                {type === "shortLeave" ? (
                  <StatusBadge status={status} />
                ) : leave.status === "returned" ? (
                  <StatusBadge status={status} />
                ) : type === "medicalWithoutEndDate" ? (
                  // For medical without end date, show Mark as Return button
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actionButtonHandle(leave, 'markReturn')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-sm sm:text-sm font-medium bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        'Return'
                      )}
                    </button>
                  </div>
                ) : (
                  // For medical room, show both buttons
                  <div className="flex items-center gap-2">
                    {teacher.name === leave.teacher && <button
                      onClick={() => actionButtonHandle(leave, 'medicalLeave')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Medical Leave
                    </button>}

                    <button
                      onClick={() => actionButtonHandle(leave, 'returnToClass')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-green-500 text-white rounded-full shadow hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        'Return to Class'
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {type === "shortLeave" ? (
                  // Single row for Short Leave
                  <>
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-100">
                      <Calendar size={10} className="text-blue-600" />
                      <span className="text-xs text-gray-900">{formatDate(leave.date)}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded border border-red-100">
                      <Clock size={10} className="text-red-600" />
                      <span className="text-xs text-gray-900">From: {formatTime(leave.fromTime)}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded border border-green-100">
                      <Clock size={10} className="text-green-600" />
                      <span className="text-xs text-gray-900">To: {formatTime(leave.toTime)}</span>
                    </div>
                  </>
                ) : (
                  // Medical Leave - Adaptive layout
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">

                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-100 whitespace-nowrap">
                        <Calendar size={10} className="text-blue-600" />
                        <span className="text-xs text-gray-900">{formatDate(leave.fromDate)}</span>
                        <span className="text-xs text-blue-600">{formatTime(leave.fromTime)}</span>
                      </div>

                      {leave.toTime && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded border border-green-100 whitespace-nowrap">
                          <Clock size={10} className="text-green-600" />
                          <span className="text-xs text-gray-900">{formatDate(leave.toDate)}</span>
                          <span className="text-xs text-green-600">{formatTime(leave.toTime)}</span>
                        </div>
                      )}
                    </div>

                    {leave.returnedAt && (
                      <div className="flex gap-1 w-fit mx-auto">
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded border border-purple-100 whitespace-nowrap">
                          <CheckCircle size={10} className="text-purple-600" />
                          <span className="text-xs text-purple-900">Returned:</span>
                          <span className="text-xs text-purple-600">{formatTime(leave.returnedAt)}</span>
                          <span className="text-xs text-purple-600">{formatDate(leave.returnedAt)}</span>
                        </div>
                      </div>
                    )}

                    {/* {!leave.toTime && !leave.returnedAt && (
              <div className="flex gap-1">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded border border-gray-100 whitespace-nowrap">
                  <Clock size={10} className="text-gray-500" />
                  <span className="text-xs text-gray-900">Not specified</span>
                </div>
              </div>
            )} */}

                  </div>

                )}
              </div>

              {/* Teacher & Reason */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-100">
                {leave.teacher && (
                  <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    <FileSignature size={12} />
                    <span className="font-medium">{leave.teacher}</span>
                  </div>
                )}

                {leave.reason && (
                  <div className="items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    <span className="truncate italic">{leave.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        isDangerous={confirmationModal.isDangerous}
      />
    </div>
  );
}

export default ShortLeave;