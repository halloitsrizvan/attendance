import React, { useEffect, useState, useMemo, act } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, User, XCircle, RefreshCw, ChevronRight, FileSignature } from 'lucide-react';import axios from 'axios';
import { API_PORT } from '../../Constants';
import LeaveStatusTable from './LeaveStatusTable';
import ShortLeave from './ShortLeave';
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
        hour12: true,
        weekday: 'short',
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
    ? student.displayStatus === 'Late Returned' ? 'bg-green-500' : 'bg-green-500'
    : student.displayStatus === 'On Leave' 
    ? 'bg-red-500'
    : student.displayStatus === 'Late'
    ? 'bg-orange-500':student.displayStatus==='Scheduled'? " bg-yellow-500"
    : student.displayStatus==='Pending'? "bg-blue-500"
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
              <FileSignature size={12} />
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
  const [activeTab, setActiveTab] = useState('actions');
  const [activeTabActions, setActiveTabActions] = useState('General');
  const [activeTabMyDB, setActiveTabMyDB] = useState('allActions');
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) :  null;

  const [shortLeaveStatus,setShortLeaveStatus] = useState([])
  //Medeical room 
  const medicalRoomStatus = useMemo(() => {
    return leaveData.filter(student => student.reason === 'Medical (Room)' && !student.returnedAt);
  }, [leaveData]);
  const medicalRoomStatusDB = useMemo(() => {
    return leaveData.filter(student => student.reason === 'Medical (Room)' && !student.returnedAt && student.teacher===teacher?.name);
  }, [leaveData]);


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
    fetchShortLeave()
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

  
  const fetchShortLeave = () => {
    setLoading(true);
    setError(null);
    axios.get(`${API_PORT}/class-excused-pass`)
      .then((res) => {
        setShortLeaveStatus(res.data)
      })
      .catch(err => {
        console.error('Error fetching leave data:', err);
        setError('Failed to load leave data. Please try again.');
        setLoading(false);
      });
  };

  // In your main component, add these computed values
const getLeaveStatusForTable = (item) => {
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
    return 'Pending';
  }

  // Leave running normally
  if (now >= fromDateTime && now <= toDateTime && item.status === 'active') return 'On Leave';

  // Leave ended but student not returned
  if (now > toDateTime && item.status !== 'returned') return 'Late';

  return item.status;
};

// Get data for actions table
const actionsTableData = useMemo(() => {

  return leaveData
    .map(item => ({
      ...item,
      status: getLeaveStatusForTable(item)
    }))
    .filter(data => {
        const endDateTime = new Date(`${data.toDate}T${data.toTime}`);
        const now = new Date();
        const diffHours = (endDateTime - now) / (1000 * 60 * 60);

        const isPendingOrLate =
          ['Pending', 'Late'].includes(data.status) &&
          data.reason !== 'Medical (Room)';

        // NEW: Show On Leave only if 4 hours are left before end time
        const isFourHourOnLeave =
          data.status === 'On Leave' &&
          diffHours <= 4 &&  // Less than or equal 4 hours remaining
          diffHours > 0;     // End time not passed

        return (isPendingOrLate || isFourHourOnLeave) && data.toDate;
      });

}, [leaveData]);

// Refresh function to pass
const refreshLeaveData = () => {
  fetchLeaveData();
};

  const filteredData = useMemo(() => {
    if (activeTab === 'onLeave') {
      return leaveData.filter(student => 
        ['On Leave', 'Late'].includes(student.displayStatus)
      );
    }
    
    return leaveData;
  }, [leaveData, activeTab]);

  const notArrivedCount = useMemo(() => {
    return filteredData.filter(student=>student.status==="active").length;
  }, [leaveData]);

 const filterDB=leaveData.filter(student=>student.teacher===teacher?.name);
 

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
        <div className="flex flex-wrap  gap-2 mb-4 p-1 rounded-lg  w-full sm:w-auto border-2 border-indigo-200">
        <TabButton 
            label={`Actions`}
            isActive={activeTab === 'actions'}
            onClick={() => setActiveTab('actions')}
          />
          <TabButton 
            label={`On leave (${notArrivedCount})`}
            isActive={activeTab === 'onLeave'}
            onClick={() => setActiveTab('onLeave')}
          />
          
           <TabButton 
            label={`Class Excused Pass (${shortLeaveStatus.length})`}
            isActive={activeTab === 'shortLeave'}
            onClick={() => setActiveTab('shortLeave')}
          />
          <TabButton 
            label={`History (${leaveData.length})`}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabButton 
            label={`My Dashboard `}
            isActive={activeTab === 'My Dashboard'}
            onClick={() => setActiveTab('My Dashboard')}
          />
        </div>
  
        {/* Cards Grid - Mobile First */}
       
        { ["all","onLeave"].includes(activeTab)?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredData.length > 0 ? (
            <>
            {activeTab === 'onLeave' && 
          <div className="mb-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                
                <h2 className="text-lg font-semibold text-gray-900">Class-wise Absentees</h2>
              </div>
              
              <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {(() => {
                  // Calculate absentees by class
                  const classAbsentees = {};
                  
                  filteredData.forEach(student => {
                    const classNum = student.classNum;
                    if (!classAbsentees[classNum]) {
                      classAbsentees[classNum] = 0;
                    }
                    classAbsentees[classNum]++;
                  });
                  
                  // Convert to array and sort by class number
                  const sortedClasses = Object.entries(classAbsentees)
                    .map(([classNum, count]) => ({ classNum, count }))
                    .sort((a, b) => a.classNum - b.classNum);

                    console.log(classAbsentees);
                    // const totalLeave=filteredData.filter(student=>student.status==="active")
                    // console.log(totalLeave.length);
                    
                    
                  
                  return sortedClasses.map(({ classNum, count }) => (
                    <div key={classNum} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer"
                    onClick={()=> setSelectedClass(Number(classNum))}
                    >
                      <div className="text-xs text-gray-600 border-b">Class {classNum}</div>
                      <div className="text-2xl font-bold text-red-700">{count}</div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Total Absentees Summary */}
              {/* <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  
                    <span className="font-semibold text-gray-700">Total Absentees:</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{filteredData.length}</span>
                </div>
              </div> */}
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
                  {activeTab === 'notArrived' 
                    ? 'All students have arrived! 🎉' 
                    : 'No leave records found.'}
                </p>
              </div>
            </div>
          )}
        </div>
        :activeTab==="My Dashboard"?
        <>
          <div className="flex flex-wrap  gap-2  p-1  bg-white rounded-lg shadow-sm  w-full sm:w-auto mb-2">
                <TabButton 
                    label={`Actions`}
                    isActive={activeTabMyDB === 'allActions'}
                    onClick={() => setActiveTabMyDB('allActions')}
                  />
                <TabButton 
                    label={`Medical Room(${medicalRoomStatusDB.length})`}
                    isActive={activeTabMyDB === 'Medical Room'}
                    onClick={() => setActiveTabMyDB('Medical Room')}
                  />
                <TabButton 
                    label={`Medical without endDate(${leaveData.filter(student=>student.reason==="Medical" && !student.toDate&& !student.returnedAt&& student.teacher===teacher?.name).length})`}
                    isActive={activeTabMyDB === 'MWED'}
                    onClick={() => setActiveTabMyDB('MWED')}
                  />
                  <TabButton 
                    label={`History(${filterDB.length})`}
                    isActive={activeTabMyDB === 'History'}
                    onClick={() => setActiveTabMyDB('History')}
                  />  
           </div>
          {activeTabMyDB==="allActions"?
          <LeaveStatusTable 
              classData={leaveData}
              onDataUpdate={refreshLeaveData}
              getLeaveStatus={getLeaveStatusForTable}
              type="MyDashboard"
            />
            :activeTabMyDB==="Medical Room"?
            <div>
              <ShortLeave
              statusData={medicalRoomStatusDB}
              type="medicalRoom"
              
              />
            </div>
            :activeTabMyDB==="MWED"?
            <div>
            <ShortLeave
            statusData={leaveData.filter(student=>student.reason==="Medical" && !student.toDate && !student.returnedAt&& student.teacher===teacher?.name)}
            type="medicalWithoutEndDate"
            
            />
          </div>
            :
            <div>
              {filterDB.map((student) => (
              <StudentStatusCard key={student._id} student={student} />
            ))}
            </div>
            }
        </>
        :
        activeTab==="shortLeave"?
        <div>
            <div>
              <ShortLeave
                statusData={shortLeaveStatus}
                type="shortLeave"
                
                />
            </div>
        </div>
        
        :
        
       
        <div>
           {activeTab==="actions" &&
        <>
             <div className="flex flex-wrap  gap-2  p-1  bg-white rounded-lg shadow-sm  w-full sm:w-auto mb-2">
                <TabButton 
                    label={`General`}
                    isActive={activeTabActions === 'General'}
                    onClick={() => setActiveTabActions('General')}
                  />
                  <TabButton 
                    label={`Medical Room(${medicalRoomStatus.length})`}
                    isActive={activeTabActions === 'Medical (room)'}
                    onClick={() => setActiveTabActions('Medical (room)')}
                  />
                  <TabButton 
                    label={`Medical without endDate(${leaveData.filter(student=>student.reason==="Medical" && !student.toDate).length})`}
                    isActive={activeTabActions === 'Medical (without end date)'}
                    onClick={() => setActiveTabActions('Medical (without end date)')}
                  />
                </div>
                {activeTabActions==="Medical (room)"?
                <div>
                  <ShortLeave
                  statusData={medicalRoomStatus}
                  type="medicalRoom"
                  
                  />
                </div>:
                activeTabActions==="General"?
                  <LeaveStatusTable 
                      classData={actionsTableData}
                      onDataUpdate={refreshLeaveData}
                      getLeaveStatus={getLeaveStatusForTable}
                      type="Generalactions"
                    />
                :activeTabActions==="Medical (without end date)"?
                <div>
                  <ShortLeave
                  statusData={leaveData.filter(student=>student.reason==="Medical" && !student.toDate && !student.returnedAt)}
                  type="medicalWithoutEndDate"
                  
                  />
                </div>
                :
                ""}
                </>
              } 

        

         
        </div>
        
        }
      </div>
      {/* Class Students Popup */}
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
          .filter(student => student.classNum === selectedClass)
          .map(student => (
            <div key={student._id} className="flex items-center justify-between py-2 px-3 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{student.name}</div>
                <div className="text-sm text-gray-500">AD: {student.ad}</div>
              </div>
              <StatusBadge status={student.displayStatus} />
            </div>
          ))
        }
        
        {filteredData.filter(student => student.classNum === selectedClass).length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No students found in Class {selectedClass}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600 text-center">
          Total: {filteredData.filter(student => student.classNum === selectedClass).length} students
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default LeaveStatus;
