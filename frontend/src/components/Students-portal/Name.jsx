import React, { useEffect, useState ,useMemo} from 'react'
import { Menu, User, X, CheckCircle, XCircle, Clock, Calendar, TrendingUp, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import axios from 'axios'
import MetricCard from './MetricCard'
import { API_PORT } from '../../Constants'
import BreakdownModal from './BreakdownModal';
import { useNavigate } from 'react-router-dom';
import StudentDashboardLoad from './StudentDashboardLoad';
 
function Name() {
    const [student,setStudent] = useState([])
    const [attendance,setAttendance]  =useState([])
    const [loading, setLoading] = useState(true)
    const [attLoading, setAttLoading] = useState(true)
    const navigate = useNavigate()
    const studentData = localStorage.getItem("students") ? JSON.parse(localStorage.getItem("students")) : 'Stundets Panel';
    const std = student.find(s => s.ADNO === studentData.ad);


    
    
    useEffect(()=>{
        axios.get(`${API_PORT}/students`).then((res)=>{
            setStudent(res.data)
            setLoading(false)
        }).catch((err)=>{
            console.log(err);
            setLoading(false)
        })

        axios.get(`${API_PORT}/set-attendance`).then((res)=>{
            setAttendance(res.data)
            setAttLoading(false)
        }).catch((er)=>{
            console.log(er);
            setAttLoading(false)
        })
    }, [])

    const handleLogout = ()=>{
      localStorage.removeItem('token')
      localStorage.removeItem('students')
      navigate('/students-login')
    }

    // Filter attendance for current student
    const studentAttendance = attendance.filter(att => att.ad === std?.ADNO);

    // Calculate real attendance metrics from filtered data
    const attendanceMetrics = useMemo(() => {
      const present = studentAttendance.filter(att => att.status === 'Present').length;
      const absent = studentAttendance.filter(att => att.status === 'Absent').length;
      const totalClasses = present + absent;
      
      return {
        present,
        absent,
        totalClasses: totalClasses || 0,
      };
    }, [studentAttendance]);

    const averagePercentage = useMemo(() => {
      if (attendanceMetrics.totalClasses === 0) return 0;
      const avg = (attendanceMetrics.present / attendanceMetrics.totalClasses) * 100;
      return avg.toFixed(1);
    }, [attendanceMetrics]);

      const [showModal, setShowModal] = useState(false);
      const [modalType, setModalType] = useState('present'); 
      const handleMetricClick = (type) => {



        setModalType(type);
        setShowModal(true);
      };
      const closeModal = () => {
        setShowModal(false);
      };

      
      

    
  if (loading) {
    return (
      <StudentDashboardLoad/>
    );
  }

  if (!student || student.length === 0) {
    return (
      <div className="flex-grow p-4 md:p-6 max-w-4xl w-full mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border-t-4 border-red-500">
          <div className="text-center">
            <p className="text-lg text-gray-600">No student data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex justify-between items-center px-6 py-3 bg-white shadow-md sticky top-0 z-10">
  {/* Left Section - Menu */}
  <div className="flex items-center gap-3">
    <Menu className="w-6 h-6 text-gray-700 cursor-pointer" />
    <h1 className="text-xl font-bold text-gray-800">Students Portal</h1>
  </div>

  {/* Right Section - Profile & Logout */}
  <div className="flex items-center gap-5">
    <button
      onClick={handleLogout}
      className="text-red-600 hover:text-red-600 font-medium transition"
    >
      Logout
    </button>

    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-105 transition">
      <User className="w-5 h-5" />
    </div>
  </div>
</header>

    <main className='flex-grow p-4 md:p-6 max-w-4xl w-full mx-auto'>
          <section className="bg-white p-6 rounded-2xl shadow-xl mb-8 border-t-4 border-blue-500 transition-all duration-500 hover:shadow-2xl">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4 shrink-0">
            {std && std["FULL NAME"] ? std["FULL NAME"].substring(0, 2).toUpperCase() : "NA"}
            </div>
            <div className="flex flex-col">
              <p className="text-xl font-bold text-gray-800">Name: {std && std["FULL NAME"] ? std["SHORT NAME"] : "N/A"}</p>
              <p className="text-sm text-gray-600">AD: {std && std.ADNO ? std.ADNO : "N/A"}</p>
              <p className="text-sm text-gray-600">Class: {std && std.CLASS ? std.CLASS : "N/A"}</p>
            </div>
          </div>
        </section>


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
            subText="Overall "
            color="blue"
            icon={TrendingUp}
            onClick={() => { /* Average doesn't trigger modal, but can be informational */ }}
          />
        </section>

        <section className="bg-white p-4 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2"> Attendance History</h2>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            {attLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading attendance data...</span>
              </div>
            ) : studentAttendance.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No attendance records found for this student</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="p-3">Date</th>
                    <th className="p-3">Time</th>
                    {/* <th className="p-3">Teacher</th> */}
                    <th className="p-3">Status</th>
                    <th className="p-3 hidden sm:table-cell">Recorded Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentAttendance.map((log, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-3 text-sm font-medium text-gray-800">
                        {log.attendanceDate 
                          ? (typeof log.attendanceDate === 'string' 
                              ? new Date(log.attendanceDate).toLocaleDateString() 
                              : new Date(log.attendanceDate).toLocaleDateString())
                          : 'N/A'}
                      </td>
                        <td className="p-3 text-sm text-gray-600">{log.attendanceTime} 
                          {log.attendanceTime === "Period" && (<span className="text-gray-500 text-xs"> ({log.period ||log.teacher})</span>)}</td>
                      {/* <td className="p-3 text-sm text-gray-600">{log.teacher}</td> */}
                      <td className="p-3 text-sm font-semibold">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 rounded-full ${
                          log.status === 'Present'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-500 hidden sm:table-cell">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <BreakdownModal 
        show={showModal} 
        onClose={closeModal} 
        type={modalType} 
      />
    </main>
    </div>
  )
}

export default Name