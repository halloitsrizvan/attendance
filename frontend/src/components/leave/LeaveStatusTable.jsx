import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {ArrowUpRight} from 'lucide-react'
import { API_PORT } from '../../Constants';

const StatusPill = ({ status }) => {
  const baseStyle = "px-3 py-1 text-xs font-medium rounded-full inline-block";
  
  if (status === "Inactive") {
    return (
      <span className={`${baseStyle} bg-yellow-100 text-yellow-800`}>
        {status}
      </span>
    );
  }
  
  if (status === "On Leave") {
    return (
      <span className={`${baseStyle} bg-green-100 text-green-800`}>
        {status}
      </span>
    );
  }

  if (status === "Late") {
    return (
      <span className={`${baseStyle} bg-red-100 text-red-800`}>
        {status}
      </span>
    );
  }

  if (status === "Returned") {
    return (
      <span className={`${baseStyle} bg-gray-100 text-gray-800`}>
        {status}
      </span>
    );
  }

  if (status === "Late Returned") {
    return (
      <span className={`${baseStyle} bg-orange-100 text-orange-800`}>
        {status}
      </span>
    );
  }

  return (
    <span className={`${baseStyle} bg-gray-100 text-gray-800`}>
      {status}
    </span>
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

        // When leave not started yet
        if (status === 'Inactive') {
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
      const diffHours = (endDateTime - now) / (1000 * 60 * 60); // ms → hours
      
  if (status === 'Inactive') {
    return { disabled: true, text: 'Inactive', className: 'bg-gray-300 text-gray-600 cursor-not-allowed' };
  }

  if (status === 'Pending') {
    return { disabled: false, text: 'Start Leave', className: 'text-emerald-600 hover:bg-gray-50 bg-white' };
  }

   if (status === 'On Leave' && diffHours > 4 && diffHours > 0) {
    return { disabled: true, text: 'On Leave', className: 'bg-blue-200 text-blue-700 cursor-not-allowed' };
  }

  if (status === 'On Leave' || status === 'Late') {
    return { disabled: false, text: 'Mark as Returned', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
  }

  if (status === 'Returned' || status === 'Late Returned') {
    return { disabled: true, text: 'Returned ✓', className: 'bg-green-100 text-green-700 cursor-not-allowed' };
  }

  //  FIX: fallback (handles status === "active")
  return { disabled: false, text: 'Mark as Returned', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
};



  const buttonState = getButtonState();

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden w-full">
      {/* --- Card Header (Green) --- */}
      <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="text-xs font-light">Class. {classNum}</div>
            <div className="text-xs font-light">AD. {ad}</div>
          </div>
          <h2 className="text-lg font-bold">{name}</h2>
        </div>
        <button 
          className={`text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 ${buttonState.className}`}
          disabled={buttonState.disabled}
          onClick={() => handleReturn(_id)}
        >
          {buttonState.text}
        </button>
      </div>

      {/* --- Card Body (Light Green) --- */}
      <div className="bg-emerald-50 p-4 grid grid-cols-3 gap-4 text-center">
        <InfoColumn title={status} value={getDisplayTime()} />
        <InfoColumn title="Status"> 
          <StatusPill status={status} />
        </InfoColumn>
        <InfoColumn title="Returned At" value={formatReturnedTime(returnedAt)} />
      </div>
    </div>
  );
};
// "Remaining/Late Time"
const InfoColumn = ({ title, value, children }) => {
  return (
    <div className="flex flex-col items-center justify-start">
      <h3 className={`text-xs font-medium mb-1 ${["Late Returned", "Late"].includes(title) ? 'text-red-500':'text-gray-500'}`} >{ ["Late Returned", "Late"].includes(title) ? "Late By" : title === "Status" ? "Status" :title ==="Returned At"?"Returned At":title==="Pending"? "Starts in": "Remaining Time" }</h3>
      {children ? (
        children
      ) : (
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      )}
    </div>
  );
};

function LeaveStatusTable() {
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
    if (now < fromDateTime) return 'Inactive';

    // Time has come, but leave not started yet
    if (now >= fromDateTime && item.status === 'inactive') {
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
                />

          ))}
            </>
         
        )}
      </div>
    </div>
  );
}

export default LeaveStatusTable;