import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';

const studentStatusData = [
  { id: 1, roll: '232', name: 'Rohan Sharma', class: '07', section: 'A', from: '2025-11-05, 08:00 AM', to: '2025-11-05, 04:00 PM', status: 'Arrived', reason: '' },
  { id: 2, roll: '233', name: 'Priya Patel', class: '08', section: 'B', from: '2025-11-05, 08:00 AM', to: '', status: 'Not Arrived', reason: 'Sick Leave' },
  { id: 3, roll: '234', name: 'Amit Singh', class: '07', section: 'B', from: '2025-11-05, 08:15 AM', to: '2025-11-05, 04:00 PM', status: 'Arrived', reason: '' },
  { id: 4, roll: '235', name: 'Sneha Reddy', class: '08', section: 'A', from: '2025-11-05, 08:00 AM', to: '', status: 'Not Arrived', reason: 'Family Function' },
  { id: 5, roll: '236', name: 'Karan Verma', class: '07', section: 'A', from: '2025-11-05, 08:05 AM', to: '2025-11-05, 04:00 PM', status: 'Arrived', reason: '' },
  { id: 6, roll: '237', name: 'Meera Das', class: '08', section: 'B', from: '2025-11-05, 08:20 AM', to: '2025-11-05, 04:00 PM', status: 'Arrived', reason: 'Late' },
];


const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    // Tailwind classes for styling: active state uses indigo background, default is light gray
    className={`py-2 px-5 font-medium rounded-full transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    {label}
  </button>
);


const StudentStatusCard = ({ student }) => {

  const isArrived = student.status === 'Arrived';
  // Dynamic colors based on status
  const statusColor = isArrived ? 'text-green-600' : 'text-red-600';
  const rollColor = isArrived ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start space-x-4">
        
        <div 
          className={`w-14 h-14 rounded-full flex-shrink-0 ${rollColor} flex items-center justify-center text-xl font-bold`}
          title={`Roll No: ${student.roll}`}
        >
          {student.roll}
        </div>
        
      
        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
         
          <div>
            <span className="text-gray-500 block">Name of Student:</span>
            <span className="font-semibold text-gray-800">{student.name}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Status:</span>
            <span className={`font-bold ${statusColor}`}>{student.status}</span>
          </div>
          
         
          <div>
            <span className="text-gray-500 block">Class / Section:</span>
            <span className="font-semibold text-gray-800">{student.class} / {student.section}</span>
          </div>
          <div>
            <span className="text-gray-500 block">From Time:</span>
            <span className="font-semibold text-gray-800">{student.from}</span>
          </div>
          
          {/* To Time */}
          <div>
            <span className="text-gray-500 block">To Time:</span>
            <span className="font-semibold text-gray-800">{student.to || 'End of Day'}</span>
          </div>
          
          {/* Reason (Conditional Display) */}
          {student.reason && (
            <div className="col-span-1 sm:col-span-2 mt-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-500 block">Reason:</span>
              <span className="font-semibold text-gray-800 italic">{student.reason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
function LeaveStatus() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'notArrived'
  
    // Filter students based on the active tab
    const filteredData = studentStatusData.filter(student => {
      if (activeTab === 'notArrived') {
        return student.status === 'Not Arrived';
      }
      return true;
    });
    
    const notArrivedCount = studentStatusData.filter(s => s.status === 'Not Arrived').length;
    const [studentData,setStudentData] = useState([])
    useEffect(()=>{
      axios.get(`${API_PORT}/leave`).then((res)=>{
        setStudentData(res.data)
      })
    })
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 mt-16">
        {/* Font Setup for standalone use */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; }
          `}
        </style>
        
        <div className="max-w-7xl mx-auto">
          <h1 className="flex items-center text-3xl font-extrabold text-gray-900 mb-6">
              <Calendar size={32} className="mr-3 text-indigo-600"/> 
              Leave Status
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-3 mb-8 p-1 bg-white rounded-full shadow-inner w-fit">
            <TabButton 
              label={`All Status (${studentStatusData.length})`}
              isActive={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            />
            <TabButton 
              label={`Not Arrived (${notArrivedCount})`}
              isActive={activeTab === 'notArrived'}
              onClick={() => setActiveTab('notArrived')}
            />
          </div>
  
          {/* Status Cards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {studentData.length > 0 ? (
              studentData.map(student => (
                <StudentStatusCard key={student.id} student={studentData} />
              ))
            ) : (
              <p className="text-center text-xl text-gray-500 col-span-2 mt-10 p-10 bg-white rounded-xl shadow-md">
                All students have arrived! 🎉
              </p>
            )}
          </div>
        </div>
      </div>
    );
}

export default LeaveStatus