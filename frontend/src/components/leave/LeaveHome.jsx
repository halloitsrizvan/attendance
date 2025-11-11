import React, { useEffect, useState } from 'react'
import { Menu, User, ArrowUpRight, X, Home, LayoutDashboard, Calendar, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import LeaveStatusTable from './LeaveStatusTable';

const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) : null;

// Leave Status Table Component
const LeaveStatus = () => {
    const navigate = useNavigate();
    const [leaveData, setLeaveData] = useState([]);

    useEffect(() => {
        fetchLeaveData();
    }, []);

    const fetchLeaveData = () => {
        axios.get(`${API_PORT}/leave`).then((res) => {
            setLeaveData(res.data);
        }).catch(err => {
            console.error('Error fetching leave data:', err);
        });
    };

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

   const getLeaveStatus = (item) => {
    const now = new Date();
    const fromDateTime = new Date(`${item.fromDate}T${item.fromTime}`);
    const toDateTime = new Date(`${item.toDate}T${item.toTime}`);

    // If student has returned
    if (item.status === 'returned') {
        if (item.returnedAt) {
            const returnedAt = new Date(item.returnedAt);
            if (returnedAt > toDateTime) {
                return 'Late Returned';
            }
        }
        return 'Returned';
    }

    if (now < fromDateTime) return 'Inactive';
    if (now >= fromDateTime && now <= toDateTime) return 'On Leave';
    if (now > toDateTime) return 'Late';

    return 'Inactive';
};

    // For updating leave status to returned
    const handleReturn = async (leaveId) => {
        try {
            const response = await axios.put(`${API_PORT}/leave/${leaveId}`, {
                status: 'returned'
            });
            
            // Update local state
            setLeaveData(prevData => 
                prevData.map(item => 
                    item._id === leaveId 
                        ? { ...item, status: 'returned', returnedAt: response.data.returnedAt }
                        : item
                )
            );
            
        } catch (error) {
            console.error('Error updating leave status:', error);
            alert('Failed to mark as returned. Please try again.');
        }
    };

    // For getting leaves by status
    const fetchLeavesByStatus = async (status) => {
        try {
            const response = await axios.get(`${API_PORT}/leave/status/${status}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching leaves by status:', error);
        }
    };

    const formatReturnedTime = (returnedAt) => {
        if (!returnedAt) return "—";
        
        const returnedDate = new Date(returnedAt);
        return returnedDate.toLocaleDateString() + ', ' + returnedDate.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const handleStatusClick = () => {
        navigate('/status');
    };

    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            
        

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Leave Status</h2>
                <div className="flex items-center space-x-3">
                    <span className="bg-pink-100 text-pink-700 text-sm font-bold px-3 py-1 rounded-full">
                        {leaveData.filter(item => getLeaveStatus(item) === 'On Leave').length} On Leave
                    </span>
                    <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" onClick={handleStatusClick}>
                        <ArrowUpRight size={20} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600">Class</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">AD</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Remaining/Late Time</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Returned At</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveData.map((item, index) => {
                            const status = getLeaveStatus(item);
                            const remainingTime = calculateRemainingTime(item.toDate, item.toTime);
                            
                            return (
                                <tr key={index} className={`border-b border-gray-100 ${index % 2 === 1 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100 transition-colors`}>
                                    <td className="p-4 text-sm font-medium text-gray-800">{item.classNum}</td>
                                    <td className="p-4 text-sm text-gray-600">{item.ad}</td>
                                    <td className="p-4 text-sm font-medium text-gray-800">{item.name}</td>
                                    <td className="p-4 text-sm text-gray-600">
                                    {status === 'Returned' && item.returnedAt ? 
                                        (() => {
                                            const toDateTime = new Date(`${item.toDate}T${item.toTime}`);
                                            const returnedAt = new Date(item.returnedAt);
                                            
                                            // If student returned after the end time, calculate how late they were
                                            if (returnedAt > toDateTime) {
                                                const lateMs = returnedAt - toDateTime;
                                                const lateDays = Math.floor(lateMs / (1000 * 60 * 60 * 24));
                                                const lateHours = Math.floor((lateMs / (1000 * 60 * 60)) % 24);
                                                const lateMinutes = Math.floor((lateMs / (1000 * 60)) % 60);
                                                
                                                let lateResult = "Late by ";
                                                if (lateDays > 0) lateResult += `${lateDays}d `;
                                                if (lateHours > 0) lateResult += `${lateHours}h `;
                                                if (lateMinutes > 0) lateResult += `${lateMinutes}m`;
                                                
                                                return lateResult.trim() || "Late by 0m";
                                            } else {
                                                return "—";
                                            }
                                        })()
                                        : status === 'Late' ? `Late by ${remainingTime}` 
                                        : remainingTime
                                    }
                                </td>
                                    <td className="p-4 text-sm font-medium">
                                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        status === 'Returned'
                                            ? 'bg-gray-100 text-gray-700'
                                            : status === 'On Leave'
                                            ? 'bg-green-100 text-green-700'
                                            : status === 'Late'
                                            ? 'bg-red-100 text-red-700'
                                            : status === 'Late Returned'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {status}
                                    </span>

                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {item.returnedAt ? formatReturnedTime(item.returnedAt) : "—"}
                                    </td>
                                    <td className='p-4 text-sm font-medium'>
                                        {status === 'Inactive' ? (
                                            <button 
                                                disabled
                                                className='px-3 py-2 rounded-full text-xs font-semibold text-gray-400 bg-gray-200 cursor-not-allowed'
                                            >
                                               Mark as returned
                                            </button>
                                        ) : status !== 'Returned' ? (
                                            <button 
                                                onClick={() => handleReturn(item._id)}
                                                className='px-3 py-2 rounded-full text-xs font-semibold text-gray-50 bg-blue-700 hover:bg-blue-800 transition-colors'
                                            >
                                               Mark as returned
                                            </button>
                                        ) : (
                                            <span className='px-3 py-2 rounded-full text-xs font-semibold text-gray-600 bg-gray-200'>
                                                Returned
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function LeaveHome() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate()
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
     const teacher = localStorage.getItem("teacher")
    ? JSON.parse(localStorage.getItem("teacher"))
    : null;

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-inter mt-16">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                    body { font-family: 'Inter', sans-serif; }
                `}
            </style>

               

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

                 { teacher.role ===("HOD"||"HOS"||"class_teacher"||"super_admin")&&
                    <div className="flex items-center justify-between p-5 border border-gray-200 bg-blue-600 rounded-lg mb-2 cursor-pointer" onClick={()=>navigate('/leave-form')}>
                <h2 className="text-xl font-semibold text-gray-50">Apply Leave</h2>
                <div className="flex items-center space-x-3">
                    
                    <button className="p-2 rounded-lg text-gray-50 hover:bg-gray-100 transition-colors">
                        <ArrowUpRight size={25} />
                    </button>
                </div>
                </div>}

               
                    {/* <LeaveStatus/> */}
                <LeaveStatusTable />
            </div>
        </div>
    );
}

export default LeaveHome;