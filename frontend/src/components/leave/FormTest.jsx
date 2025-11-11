import React, { useEffect, useState } from 'react'
import { Menu, User, ArrowUpRight, X, Home, LayoutDashboard, Calendar, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import LeaveStatusTable from './LeaveStatusTable';

const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) : null;


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

                 { teacher.role ===("super_admin"||"HOS"||"HOD"||"class_teacher")&&
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