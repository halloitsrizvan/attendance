"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Clock, Calendar, User, ArrowUpRight, CheckCircle, PlayCircle, RotateCcw, Edit, ChevronRight, X, Trash2 } from 'lucide-react'; import { API_PORT } from '../../Constants';

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

const EditLeaveModal = ({ classInfo, onSave, onClose, isOpen, onDelete }) => {
  const [formData, setFormData] = useState({
    fromDate: '',
    fromTime: '',
    toDate: '',
    toTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMedical = (reason) => reason === 'Medical' || reason === 'Medical (Home)' || reason === 'Medical (Room)' || reason === 'Room';

  // Initialize form data when modal opens or classInfo changes
  useEffect(() => {
    if (isOpen && classInfo) {
      setFormData({
        fromDate: classInfo.fromDate || '',
        fromTime: classInfo.fromTime || '',
        toDate: classInfo.toDate || '',
        toTime: classInfo.toTime || ''
      });
    }
  }, [isOpen, classInfo]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fromDate || !formData.fromTime || !formData.toDate || !formData.toTime) {
      alert('Please fill in all date and time fields');
      return;
    }

    const fromDateTime = new Date(`${formData.fromDate}T${formData.fromTime}`);
    const toDateTime = new Date(`${formData.toDate}T${formData.toTime}`);

    if (toDateTime <= fromDateTime) {
      alert('End date/time must be after start date/time');
      return;
    }

    setIsSubmitting(true);
    try {
      // Make API call to update leave
      const response = await axios.put(`${API_PORT}/leave/${classInfo._id}`, formData);

      // Call the onSave callback with the updated data
      await onSave(classInfo._id, formData);

      onClose();
    } catch (error) {
      console.error('Error updating leave:', error);

      // More detailed error message
      if (error.response?.data?.error) {
        alert(`Failed to update leave: ${error.response.data.error}`);
      } else {
        alert('Failed to update leave. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!classInfo._id) {
      alert('Cannot delete: Leave ID not found');
      return;
    }

    setIsDeleting(true);
    try {
      // Make API call to delete leave
      await axios.delete(`${API_PORT}/leave/${classInfo._id}`);

      // Call the onDelete callback
      if (onDelete) {
        await onDelete(classInfo._id);
      }

      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting leave:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">Edit Leave</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-1"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>

          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {classInfo.ad}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{classInfo.studentId?.['SHORT NAME'] || classInfo.studentId?.['FULL NAME'] || classInfo.name}</h4>
                <p className="text-xs text-gray-600">Class: {classInfo.studentId?.CLASS || classInfo.classNum} | AD: {classInfo.studentId?.ADNO || classInfo.ad}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From Date & Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={formData.fromDate}
                    onChange={(e) => handleInputChange('fromDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.fromTime}
                    onChange={(e) => handleInputChange('fromTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* To Date & Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={formData.toDate}
                    onChange={(e) => handleInputChange('toDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={formData.toTime}
                    onChange={(e) => handleInputChange('toTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Current Dates Display */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-amber-800 mb-1">Current Schedule</h4>
              <div className="text-xs text-amber-700 space-y-1">
                <p>From: {classInfo.fromDate} at {classInfo.fromTime}</p>
                <p>To: {classInfo.toDate} at {classInfo.toTime}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Update Leave
                    </>
                  )}
                </button>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                className="w-full border border-red-300 text-red-600 text-sm font-medium py-2.5 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 size={16} />
                Delete Leave
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xs w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Confirm Delete</h3>
              <button
                onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <p className="text-sm text-gray-600 text-center mb-2">
                Are you sure you want to delete this leave?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-800 text-center">
                  {classInfo.studentId?.['SHORT NAME'] || classInfo.name} - Class {classInfo.studentId?.CLASS || classInfo.classNum}
                </p>
                <p className="text-xs text-red-700 text-center mt-1">
                  {classInfo.fromDate} to {classInfo.toDate}
                </p>
              </div>
              <p className="text-xs text-red-600 text-center mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-semibold transition-colors ${isDeleting ? 'bg-red-400' : 'bg-red-500 hover:bg-red-600'
                  }`}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    Delete
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

const ClassCard = ({ classInfo, onReturn, getLeaveStatus, classData, setClassData, teacher, type, isSelected, onSelect, selectedIds }) => {
  const { _id, studentId, teacherId, remainingTime, status, returnedAt, toDate, toTime, fromTime, fromDate, reason } = classInfo;
  const ad = studentId?.ADNO || classInfo.ad;
  const name = studentId?.['SHORT NAME'] || studentId?.['FULL NAME'] || classInfo.name;
  const classNum = studentId?.CLASS || classInfo.classNum;
  const teacherName = teacherId?.name || classInfo.teacher;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRoomTransitionConfirm, setShowRoomTransitionConfirm] = useState(false);
  const [showDeleteQuickConfirm, setShowDeleteQuickConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const canBeSelected = status === 'Pending' || status === 'On Leave' || status === 'Late';

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

  const getRelativeDate = (dateInput) => {
    if (!dateInput) return '';
    try {
      const datePart = typeof dateInput === 'string' && dateInput.includes('T') 
        ? dateInput.split('T')[0] 
        : dateInput;
      
      const date = new Date(datePart);
      const today = new Date();
      
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

  const formatReturnedTime = (returnedAt) => {
    if (!returnedAt) return "—";
    const relDate = getRelativeDate(returnedAt);
    const returnedDate = new Date(returnedAt);
    const timeStr = returnedDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${relDate}, ${timeStr}`;
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return "—";
    const relDate = getRelativeDate(date);
    const dateTime = new Date(`${date}T${time}`);
    const timeStr = dateTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${relDate}, ${timeStr}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return getRelativeDate(dateString);
  };

  const hasAccessToStudent = () => {
    if (!teacher) return false;
    // Admins have access to everyone
    if (['super_admin', 'HOD', 'HOS'].includes(teacher.role)) return true;

    // Check if teacher is the one who created the leave
    const currentTeacherId = teacher.id || teacher._id;
    if (teacherId?._id === currentTeacherId || classInfo.teacher === teacher.name) return true;

    // Check if teacher's assigned class matches the student's class
    if (teacher.class && String(teacher.class) === String(classNum)) return true;

    return false;
  };

  const handleRoomToMedicalTransition = async () => {
    try {
      setIsProcessing(true);
      const now = new Date();
      const currentTeacherId = teacher?.id || teacher?._id;

      // 1. Mark current Room record as returned
      const returnPayload = {
        status: 'returned',
        markReturnedTeacher: teacher?.name || 'Unknown',
        returnedAt: now.toISOString()
      };

      await axios.put(`${API_PORT}/leave/${_id}`, returnPayload);

      // Briefly update student (optional but safe)
      await axios.patch(`${API_PORT}/students/on-leave/${ad}`, { onLeave: false });

      // 2. Create new Medical record
      const sid = (studentId && typeof studentId === 'object') ? studentId._id : studentId;
      const newLeavePayload = {
        studentId: sid,
        teacherId: currentTeacherId,
        fromDate: now.toISOString().split('T')[0],
        fromTime: now.toTimeString().split(' ')[0].substring(0, 5),
        reason: 'Medical (Home)',
        status: 'active',
        leaveStartTeacher: teacher?.name || 'Unknown',
        academicYearId: classInfo.academicYearId || undefined
      };

      await axios.post(`${API_PORT}/leave`, newLeavePayload);

      await axios.patch(`${API_PORT}/students/on-leave/${ad}`, { onLeave: true });
      setShowRoomTransitionConfirm(false);
      // alert("Student moved from Room to Medical Leave successfully!");
      if (onReturn) onReturn();

    } catch (err) {
      console.error('Transition Error:', err);
      alert("Failed to transition student to Medical Leave. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async () => {
    try {
      setIsProcessing(true);
      const leaveId = _id;
      const leave = classData.find((item) => item._id === leaveId);

      if (!leave) {
        console.error('Leave not found with ID:', leaveId);
        alert('Leave record not found. Please refresh the page.');
        return;
      }

      let newStatus;
      if (leave.status === 'Pending') {
        newStatus = 'active';
      } else if (leave.status === 'On Leave' || leave.status === 'Late') {
        newStatus = 'returned';
      } else {
        console.error('Invalid status transition:', leave.status);
        return;
      }

      const payload = { status: newStatus };

      if (teacher?.name) {
        if (newStatus === 'active') {
          payload.leaveStartTeacher = teacher.name;
          try {
            await axios.patch(`${API_PORT}/students/on-leave/${leave.studentId?.ADNO || leave.ad}`, { onLeave: true });
          } catch (error) {
            console.error('Error updating student onLeave status:', error);
          }
        } else if (newStatus === 'returned') {
          payload.markReturnedTeacher = teacher.name;
          payload.returnedAt = new Date().toISOString();
          try {
            await axios.patch(`${API_PORT}/students/on-leave/${leave.studentId?.ADNO || leave.ad}`, { onLeave: false });
          } catch (error) {
            console.error('Error updating student onLeave status:', error);
          }
        }
      }

      console.log('Updating leave with payload:', payload);

      const response = await axios.put(`${API_PORT}/leave/${leaveId}`, payload);

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

  const handleEditSave = async (leaveId, updatedData) => {
    try {
      const response = await axios.put(`${API_PORT}/leave/${leaveId}`, updatedData);

      // Update local state
      setClassData(prevData =>
        prevData.map(item => {
          if (item._id === leaveId) {
            return {
              ...item,
              ...updatedData,
              updatedAt: response.data.updatedAt
            };
          }
          return item;
        })
      );

      // Refresh parent data if needed
      if (onReturn) {
        onReturn();
      }

      return response.data;
    } catch (error) {
      console.error('Error updating leave:', error);
      throw error;
    }
  };

  const getButtonState = () => {
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

  const handleDelete = async (leaveId) => {
    try {
      await axios.delete(`${API_PORT}/leave/${leaveId}`);

      // Update local state by removing the deleted leave
      setClassData(prevData => prevData.filter(item => item._id !== leaveId));

      // Refresh parent data if needed
      if (onReturn) {
        onReturn();
      }

      return true;
    } catch (error) {
      // console.error('Error deleting leave:', error);
      throw error;
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setIsProcessing(true);
    try {
      await axios.put(`${API_PORT}/leave/${classInfo._id}`, {
        status: newStatus
      });
      onDataUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'On Leave': return 'bg-orange-500';
      case 'Late': return 'bg-red-500';
      case 'Pending': return 'bg-blue-500';
      case 'Returned':
      case 'Late Returned': return 'bg-green-500';
      case 'Scheduled': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const statusColor = getStatusStyle(status);

  return (
    <>
      {/* Compact Card Design */}
      <div
        onClick={() => canBeSelected && onSelect(_id)}
        className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/10' : 'border-gray-200'
          }`}
      >
        {/* Status Indicator Bar */}
        <div className={`h-1 ${statusColor}`}></div>
        {/* Header - Student Info & Action Button */}
        <div className="p-3 flex items-center justify-between gap-2 relative">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 flex flex-col items-center">
              {canBeSelected && (isSelected || selectedIds.length > 0) && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelect(_id); }}
                  className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center mb-4 animate-in zoom-in-50 duration-200 ${isSelected
                    ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                    : 'border-slate-300 hover:border-blue-400 bg-white'
                    }`}
                >
                  {isSelected && <CheckCircle size={12} strokeWidth={3} />}
                </button>
              )}
              <div className={`w-10 h-10 ${statusColor} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                <span>{ad}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{name}</h3>
                {/* {type === "MyDashboard" && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{ad}</span>
                )} */}
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">C:{classNum}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>From: {formatDateTime(fromDate, fromTime)}</span>
              </div>

              {toDate && toTime && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>To: {formatDateTime(toDate, toTime)}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                {(teacherName) && (
                  <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">
                    <span>{teacherName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-medium italic">
                  <span>{reason}</span>
                </div>
              </div>
            </div>
          </div>
          {/* <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>From: {formatDateTime(fromDate, fromTime)}</span>
                <span>To: {formatDateTime(toDate, toTime)}</span>
              </div> */}
          {/* Action Buttons */}
          {reason === 'Room' && status === 'On Leave' ? (
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {hasAccessToStudent() && (
                <button
                  className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-sm shadow-orange-500/20 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); setShowRoomTransitionConfirm(true); }}
                  disabled={isProcessing}
                >
                  leave
                </button>
              )}
              <button
                className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-sm shadow-blue-500/20 active:scale-95"
                disabled={isProcessing}
                onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
              >
                <CheckCircle size={12} />
                Return
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-shrink-0 min-w-[120px]">
              {type !== "Generalactions" && (
                <div className="flex gap-2 w-full">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2 rounded-lg transition-colors duration-200 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
                    onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
                    title="Edit Leave"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setShowDeleteQuickConfirm(true); }}
                    title="Quick Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <button
                className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors duration-200 ${buttonState.className}`}
                disabled={buttonState.disabled || isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!buttonState.disabled) setShowConfirm(true);
                }}
              >
                <buttonState.icon size={14} />
                <span className="sm:inline"> {buttonState.text}</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="px-3 pb-3 flex items-center justify-between gap-2">
          <StatusPill status={status} />
          <span className='text-xs text-gray-800'>
            {/* {formatDate(fromDate)} - {formatDate(toDate)} */}
          </span>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>
              {status === "Scheduled" ? "Starts in" :
                status === "Returned" || status === "Late Returned" ? "Returned" : status === "Late" ? "Late by" :
                  "Remaining"} {getDisplayTime()}
            </span>
            {returnedAt && (
              <span className="text-green-600">At: {formatReturnedTime(returnedAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditLeaveModal
        classInfo={classInfo}
        onSave={handleEditSave}
        onDelete={handleDelete}
        onClose={() => setShowEdit(false)}
        isOpen={showEdit}
      />

      {/* Room Transition Confirmation Modal */}
      {showRoomTransitionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                <PlayCircle size={32} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Move to Medical Leave?</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium px-4 leading-relaxed">
                  Are you sure you want to move <strong>{name}</strong> to full Medical Leave?
                  This will finish the Room session and start a new Home Leave record.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRoomTransitionConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoomToMedicalTransition}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : 'Confirm Move'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Delete Confirmation Modal */}
      {showDeleteQuickConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xs w-full p-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Delete Leave?</h3>
            <p className="text-xs text-gray-500 mb-4">Are you sure you want to delete leave for <span className="font-bold text-gray-700">{name}</span>?</p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all"
                onClick={() => setShowDeleteQuickConfirm(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all shadow-md shadow-red-500/20"
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    await handleDelete(_id);
                    setShowDeleteQuickConfirm(false);
                  } catch (e) {
                    alert("Delete failed");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? "Wait..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {actionDescription} leave for <span className="font-semibold">{name}</span>?
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

function LeaveStatusTable({ classData: initialClassData1, onDataUpdate, getLeaveStatus, type }) {
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

  const initialClassData = initialClassData1;

  const [classData, setClassData] = useState(initialClassData || []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showStatusMismatch, setShowStatusMismatch] = useState(false);

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;

    const leavesToProcess = classData.filter(l => selectedIds.includes(l._id));
    
    // Check if all selected have the same logical action
    const isAllStart = leavesToProcess.every(l => l.status === 'Pending');
    const isAllReturn = leavesToProcess.every(l => l.status === 'On Leave' || l.status === 'Late');

    if (!isAllStart && !isAllReturn) {
      setShowStatusMismatch(true);
      return;
    }

    setShowBulkConfirm(true);
  };

  const executeBulkAction = async () => {
    const leavesToProcess = classData.filter(l => selectedIds.includes(l._id));
    const isAllStart = leavesToProcess.every(l => l.status === 'Pending');

    setIsBulkProcessing(true);
    try {
      const promises = selectedIds.map(async (id) => {
        const leave = classData.find(l => l._id === id);
        const newStatus = isAllStart ? 'active' : 'returned';
        const payload = {
          status: newStatus,
          timestamp: new Date().toISOString()
        };

        if (teacher?.name) {
          if (newStatus === 'active') {
            payload.leaveStartTeacher = teacher.name;
          } else {
            payload.markReturnedTeacher = teacher.name;
            payload.returnedAt = new Date().toISOString();
          }
        }

        // Update Leave record
        await axios.put(`${API_PORT}/leave/${id}`, payload);

        // Update Student status
        const studentAd = leave.studentId?.ADNO || leave.ad;
        await axios.patch(`${API_PORT}/students/on-leave/${studentAd}`, { onLeave: newStatus === 'active' });
      });

      await Promise.all(promises);

      setSelectedIds([]);
      setShowBulkConfirm(false);
      if (onDataUpdate) onDataUpdate();
      // For success, we can use a Toast eventually, but for now we'll close the modal
    } catch (error) {
      console.error("Bulk action failed:", error);
      alert("Something went wrong during bulk processing.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const matchingLeaves = classData.filter(l => l.status === 'Pending' || l.status === 'On Leave' || l.status === 'Late');
  const allSelected = matchingLeaves.length > 0 && selectedIds.length === matchingLeaves.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(matchingLeaves.map(l => l._id));
    }
  };


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

      setClassData(prevData =>
        prevData.map(item =>
          item._id === leaveId
            ? { ...item, status: newStatus, returnedAt: response.data.returnedAt }
            : item
        )
      );

      if (onDataUpdate) {
        onDataUpdate();
      }

    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

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
        {/* Selection Header Row - Only shows during active selection */}
        {selectedIds.length > 0 && matchingLeaves.length > 0 && (
          <div className="px-3 pb-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={toggleSelectAll}
              className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${allSelected
                  ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                  : 'border-slate-300 hover:border-blue-400 bg-white'
                }`}
            >
              {allSelected && <CheckCircle size={12} strokeWidth={3} />}
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select All</span>
          </div>
        )}

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
              type={type}
              isSelected={selectedIds.includes(item._id)}
              onSelect={handleSelect}
              selectedIds={selectedIds}
            />
          ))
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
                {selectedIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold">Students Selected</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-[10px] text-slate-400 hover:text-white transition-colors text-left"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <button
              onClick={handleBulkAction}
              disabled={isBulkProcessing}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isBulkProcessing ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : <CheckCircle size={14} />}
              Process Bulk
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-blue-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Bulk Leave Processing</h3>
                <p className="text-sm text-slate-500 leading-relaxed px-6">
                  You are about to process <strong>{selectedIds.length} students</strong>. All selected students will be moved to their next leave status simultaneously.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 overflow-hidden">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  <span>Selected List</span>
                  <span>{selectedIds.length} Total</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {classData.filter(l => selectedIds.includes(l._id)).map(student => (
                    <div key={student._id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-700 truncate">{student.studentId?.['SHORT NAME'] || student.name}</span>
                      <span className="text-[10px] font-black text-slate-400">#{student.ad}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowBulkConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  disabled={isBulkProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkAction}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95"
                  disabled={isBulkProcessing}
                >
                  {isBulkProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : 'Confirm Bulk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Mismatch Error Modal */}
      {showStatusMismatch && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                <PlayCircle size={40} className="text-amber-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Status Mismatch</h3>
                <p className="text-sm text-slate-500 leading-relaxed px-4">
                  Please select students with the <strong>same status</strong>. You cannot mix "Start Leave" and "Return" actions in a single bulk process.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowStatusMismatch(false)}
                  className="w-full px-4 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveStatusTable;
