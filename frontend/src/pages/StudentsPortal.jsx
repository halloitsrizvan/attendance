import React, { useState, useMemo, useEffect } from 'react';
import { Menu, User, X, CheckCircle, XCircle, Clock, Calendar, TrendingUp, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../Constants';
// --- Mock Data ---

const studentInfo = {
  name: "Muah",
  ad: "223",
  class: "2",
};

const attendanceMetrics = {
  present: 88,
  absent: 11,
  totalClasses: 99,
};

const attendanceBreakdown = [
  { time: "Night", present: 88, total: 99 },
  { time: "Period", present: 88, total: 99 },
  { time: "Noon", present: 88, total: 99 },
  { time: "Morning", present: 88, total: 99 },
  { time: "Jamath", present: 88, total: 99 },
  { time: "More", present: 88, total: 99 },
];

const mockAttendanceLog = [
  { date: "2025-10-21", time: "09:00", custom: "Maths Lec 1", status: "Present", recorded: "09:05" },
  { date: "2025-10-21", time: "11:00", custom: "Physics Lab", status: "Present", recorded: "11:02" },
  { date: "2025-10-20", time: "14:00", custom: "Chemistry Lec 2", status: "Absent", recorded: "N/A" },
  { date: "2025-10-19", time: "09:00", custom: "Maths Lec 1", status: "Present", recorded: "09:04" },
  { date: "2025-10-19", time: "14:00", custom: "Chemistry Lec 2", status: "Present", recorded: "14:01" },
  { date: "2025-10-18", time: "11:00", custom: "Physics Lab", status: "Absent", recorded: "N/A" },
  { date: "2025-10-17", time: "09:00", custom: "Maths Lec 1", status: "Present", recorded: "09:03" },
];

// --- Sub-Components ---

/**
 * Sidebar Link Component
 */
const SidebarLink = ({ icon: Icon, title, isLogout = false, onClick }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`flex items-center p-3 rounded-lg font-medium transition-colors hover:bg-blue-50/70 ${
            isLogout ? 'text-red-500 hover:text-red-600' : 'text-gray-700 hover:text-blue-600'
        }`}
    >
        <Icon className="w-5 h-5 mr-3" />
        {title}
    </a>
);

/**
 * Attendance Metric Card component (Present, Absent, Average)
 */
const MetricCard = ({ title, value, subText, color, icon: Icon, onClick }) => (
  <div
    className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer
      ${color === 'green' ? 'bg-green-500/90 hover:bg-green-600/95' :
        color === 'red' ? 'bg-red-500/90 hover:bg-red-600/95' :
        'bg-blue-500/90 hover:bg-blue-600/95'}
      text-white`}
    onClick={onClick}
  >
    <Icon className="w-8 h-8 mb-2" />
    <div className="text-4xl font-extrabold">{value}</div>
    <div className="text-sm font-semibold mt-1 opacity-90">{title}</div>
    {subText && <div className="text-xs mt-1 opacity-80">{subText}</div>}
  </div>
);

/**
 * Breakdown Modal Card (e.g., Night, Period)
 */
const BreakdownCard = ({ time, present, total }) => (
  <div className="flex flex-col items-center p-4 rounded-xl shadow-md bg-white text-gray-800 transition-all duration-200 hover:shadow-xl">
    <div className="text-4xl font-extrabold">
      <span className="text-green-600">{present}</span>/
      <span className="text-gray-400">{total}</span>
    </div>
    <div className="text-sm font-medium mt-2">{time}</div>
  </div>
);

/**
 * Modal Component for Attendance Breakdown
 */
const BreakdownModal = ({ show, onClose, type }) => {
  if (!show) return null;

  const headerText = type === 'present' ? 'Total Present Breakdown' : 'Total Absent Breakdown';
  const color = type === 'present' ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className={`w-full max-w-lg ${color} rounded-2xl shadow-2xl p-6 relative transform transition-transform duration-300 scale-100`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{headerText}</h3>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {attendanceBreakdown.map((item, index) => (
            <BreakdownCard key={index} {...item} />
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Attendance counts are recorded per session type.
        </p>
      </div>
    </div>
  );
};


/**
 * Main Application Component
 */
const StudentsPortal = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('present'); // 'present' or 'absent'
  const [activeTab, setActiveTab] = useState('time'); // 'time' or 'month'
  const [isMenuOpen, setIsMenuOpen] = useState(false); // NEW: State for sidebar menu
  const [students,setStudents] = useState([])
  useEffect(()=>{
    axios.get(`${API_PORT}/students`).then((res)=>{
      setStudents(res.data)
    })
  })
  const handleMetricClick = (type) => {



    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };
  
  const closeMenu = () => {
      setIsMenuOpen(false);
  };

  const handleLinkClick = (title) => {
    console.log(`${title} clicked`);
    closeMenu(); // Close menu after clicking a link (optional, but good practice)
    // Add logic here to navigate or change content based on the link clicked
  };

  // Calculate Average dynamically
  const averagePercentage = useMemo(() => {
    const avg = (attendanceMetrics.present / attendanceMetrics.totalClasses) * 100;
    return avg.toFixed(1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white shadow-md sticky top-0 z-10">
        {/* Toggle Menu */}
        <Menu 
            className="w-6 h-6 text-gray-700 cursor-pointer hover:text-blue-600" 
            onClick={() => setIsMenuOpen(true)} // Open menu
        />
        <h1 className="text-xl font-bold text-gray-800">Student Attendance Portal</h1>
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg cursor-pointer">
          <User className="w-6 h-6" />
        </div>
      </header>
      
      {/* NEW: Overlay for closing the menu */}
      {isMenuOpen && (
          <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
              onClick={closeMenu}
              aria-hidden="true"
          />
      )}

      {/* NEW: Sliding Sidebar (Navigation Drawer) */}
      <nav
          className={`fixed top-0 left-0 w-64 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 p-6 flex flex-col ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full' // Controls the slide
          }`}
      >
          {/* Sidebar Header/Close Button */}
          <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-xl font-bold text-blue-600">Student Menu</h2>
              <button
                  onClick={closeMenu}
                  className="p-2 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close navigation menu"
              >
                  <X className="w-6 h-6" />
              </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
              <SidebarLink icon={User} title="My Profile" onClick={() => handleLinkClick('My Profile')} />
              <SidebarLink icon={Clock} title="Attendance Log" onClick={() => handleLinkClick('Attendance Log')} />
              <SidebarLink icon={TrendingUp} title="Performance" onClick={() => handleLinkClick('Performance')} />
              <SidebarLink icon={Calendar} title="Class Schedule" onClick={() => handleLinkClick('Class Schedule')} />
              <SidebarLink icon={CheckCircle} title="Enrollment Status" onClick={() => handleLinkClick('Enrollment Status')} />
          </div>

          {/* Footer Link (Logout) */}
          <div className="mt-auto pt-6 border-t">
              <SidebarLink icon={LogOut} title="Logout" isLogout={true} onClick={() => handleLinkClick('Logout')} />
          </div>
      </nav>

      <main className="flex-grow p-4 md:p-6 max-w-4xl w-full mx-auto">

        {/* Student Info Card */}
        <section className="bg-white p-6 rounded-2xl shadow-xl mb-8 border-t-4 border-blue-500 transition-all duration-500 hover:shadow-2xl">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4 shrink-0">
              {studentInfo.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-gray-800">Name: {studentInfo.name}</p>
              <p className="text-sm text-gray-600">AD: {studentInfo.ad}</p>
              <p className="text-sm text-gray-600">Class: {studentInfo.class}</p>
            </div>
          </div>
        </section>

        {/* Metric Cards Grid */}
        <section className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
          <MetricCard
            title="Total Present"
            value={attendanceMetrics.present}
            subText={`/${attendanceMetrics.totalClasses} Classes`}
            color="green"
            icon={CheckCircle}
            onClick={() => handleMetricClick('present')}
          />
          <MetricCard
            title="Total Absent"
            value={attendanceMetrics.absent}
            subText={`/${attendanceMetrics.totalClasses} Classes`}
            color="red"
            icon={XCircle}
            onClick={() => handleMetricClick('absent')}
          />
          <MetricCard
            title="Average"
            value={`${averagePercentage}%`}
            subText="Overall Attendance"
            color="blue"
            icon={TrendingUp}
            onClick={() => { /* Average doesn't trigger modal, but can be informational */ }}
          />
        </section>

        {/* Total Attendance Log */}
        <section className="bg-white p-4 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Total Attendance Log</h2>

          {/* Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'time'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('time')}
            >
              <Clock className="w-4 h-4 inline mr-1" /> Time
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'month'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('month')}
            >
              <Calendar className="w-4 h-4 inline mr-1" /> Month
            </button>
          </div>
          
          {/* Mock Date Picker/Filter (for the log, not explicitly requested but good UI practice) */}
          <div className='flex items-center justify-between p-2 mb-4 bg-gray-100 rounded-lg'>
             <ChevronLeft className='w-5 h-5 cursor-pointer text-gray-600 hover:text-blue-600'/>
             <span className='font-medium text-gray-700 text-sm'>
                {activeTab === 'time' ? 'Current Week: Oct 15 - Oct 21' : 'October 2025'}
             </span>
             <ChevronRight className='w-5 h-5 cursor-pointer text-gray-600 hover:text-blue-600'/>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Custom</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 hidden sm:table-cell">Recorded Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockAttendanceLog.map((log, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-3 text-sm font-medium text-gray-800">{log.date}</td>
                    <td className="p-3 text-sm text-gray-600">{log.time}</td>
                    <td className="p-3 text-sm text-gray-600">{log.custom}</td>
                    <td className="p-3 text-sm font-semibold">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 rounded-full ${
                        log.status === 'Present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500 hidden sm:table-cell">{log.recorded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      
      {/* Attendance Breakdown Modal */}
      <BreakdownModal 
        show={showModal} 
        onClose={closeModal} 
        type={modalType} 
      />
    </div>
  );
};

export default StudentsPortal;
