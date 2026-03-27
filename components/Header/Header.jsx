"use client";

import React, { useEffect, useState } from 'react'
import { useRouter } from "next/navigation";

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

function Header() {
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [teacher, setTeacher] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null); // 'attendance', 'leave', 'admin' or null
    
    const toggleDropdown = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };


    useEffect(() => {
        setMounted(true);
        const storedTeacher = getSafeLocalStorage().getItem("teacher");
        if (storedTeacher) {
            try {
                setTeacher(JSON.parse(storedTeacher));
            } catch (e) {
                console.error("Invalid teacher data in localStorage");
            }
        }
    }, []);

    const navigate = useRouter()
    
    if (!mounted) return null;

    const username = teacher ? teacher.name : 'Teacher';
    const userInitial = username 
    ? username.slice(0, 2).toUpperCase() 
    : '?';

    const handleLogout = () => {
      getSafeLocalStorage().removeItem('token')
      getSafeLocalStorage().removeItem('teacher')
      navigate.push('/login')
    }

  return (
    <>
      <header className="header-gradient shadow-lg fixed top-0 left-0 w-full z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center">
              <div className="md:hidden mr-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white hover:text-sky-100 focus:outline-none"
                  aria-label="Toggle menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

              <div className="flex-shrink-0 hidden md:block">
                <a href="#" className="text-2xl font-bold text-white tracking-tight">
                Darul Irfan
                </a>
              </div>
            </div>

            <nav className="hidden md:flex md:items-center md:space-x-8">
              {/* Attendance Dropdown */}
              <div className="relative group">
                <button 
                  className="text-white hover:text-sky-100 transition-colors duration-200 font-semibold text-lg flex items-center gap-1 px-2 py-1"
                >
                  Attendance
                  <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-0 pt-3 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                  <div className="bg-white shadow-2xl py-3 border border-slate-100 rounded-xl">
                    <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/')}}>Take Attendance</a>
                    <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/class-wise')}}>Attendance Status</a>
                    <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/edit-attendance-classes')}}>Edit Attendance</a>
                  </div>
                </div>
              </div>

              {/* Leave Dropdown */}
              <div className="relative group">
                <button 
                  className="text-white hover:text-sky-100 transition-colors duration-200 font-semibold text-lg flex items-center gap-1 px-2 py-1"
                >
                  Apply Leave
                  <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-0 pt-3 w-60 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                  <div className="bg-white shadow-2xl py-3 border border-slate-100 rounded-xl">
                    { teacher?.role && ["class_teacher","super_admin","HOD","HOS","Principal"].includes(teacher?.role) && (
                      <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/leave-form')}}>Apply Leave</a>
                    )}
                    <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/leave-dashboard')}}>Leave Dashboard</a>
                    {teacher?.role === "class_teacher" && (
                      <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/leave-recovery')}}>Recovery</a>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Admin Dropdown */}
              { teacher?.role === "super_admin" && (
                <div className="relative group">
                  <button 
                    className="text-white hover:text-sky-100 transition-colors duration-200 font-semibold text-lg flex items-center gap-1 px-2 py-1"
                  >
                    Admin Panel
                    <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full right-0 mt-0 pt-3 w-64 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <div className="bg-white shadow-2xl py-3 border border-slate-100 rounded-xl">
                      <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/students-management')}}>Students</a>
                      <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/teachers-management')}}>Teachers</a>
                      <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/report')}}>Attendance Report</a>
                      <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/minus-report')}}>Minus Report</a>
                      <a href="#" className="block px-5 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium text-base" onClick={()=>{navigate.push('/settings')}}>Settings</a>
                    </div>
                  </div>
                </div>
              )}
            
              <a href="#" className="text-white hover:text-sky-100 transition-colors duration-200 font-semibold text-lg ml-4"  onClick={()=>{handleLogout()}}>Logout</a>
            </nav>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{username}</p>
                <p className="text-xs text-sky-100 opacity-90">{teacher?.role === "class_teacher" ? "Class Teacher" : (teacher?.role || "")} {teacher?.role === "class_teacher" && (teacher?.classNum)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold border border-white/30 shadow-inner">
                {userInitial}
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 md:hidden transition-all duration-300"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-out md:hidden ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
            <h2 className="text-2xl font-bold text-sky-600 mb-6 flex items-center gap-2" onClick={()=>setIsMenuOpen(false)}>
              <div className="w-2 h-8 bg-sky-500 rounded-full"></div>
              Menu
            </h2>
            <nav className="flex flex-col">
                {/* Attendance Group */}
                <div className="border-t border-slate-100 first:border-t-0">
                  <button 
                    className="w-full flex items-center justify-between px-4 py-5 font-bold text-slate-800 hover:bg-sky-50 transition-colors"
                    onClick={() => toggleDropdown('mb-attendance')}
                  >
                    <span className="text-lg">Attendance</span>
                    <svg className={`w-6 h-6 transition-transform duration-200 text-slate-400 ${openDropdown === 'mb-attendance' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === 'mb-attendance' && (
                    <div className="bg-slate-50/50 pb-3">
                      <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/'); setIsMenuOpen(false)}}>Take Attendance</a>
                      <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/class-wise'); setIsMenuOpen(false)}}>Attendance Status</a>
                      <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/edit-attendance-classes'); setIsMenuOpen(false)}}>Edit Attendance</a>
                    </div>
                  )}
                </div>

                {/* Leave Group */}
                <div className="border-t border-slate-100">
                  <button 
                    className="w-full flex items-center justify-between px-4 py-5 font-bold text-slate-800 hover:bg-sky-50 transition-colors"
                    onClick={() => toggleDropdown('mb-leave')}
                  >
                    <span className="text-lg">Apply Leave</span>
                    <svg className={`w-6 h-6 transition-transform duration-200 text-slate-400 ${openDropdown === 'mb-leave' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === 'mb-leave' && (
                    <div className="bg-slate-50/50 pb-3">
                      { teacher?.role && ["class_teacher","super_admin","HOD","HOS","Principal"].includes(teacher?.role) && (
                        <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/leave-form'); setIsMenuOpen(false)}}>Apply Leave</a>
                      )}
                      <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/leave-dashboard'); setIsMenuOpen(false)}}>Leave Dashboard</a>
                      {teacher?.role === "class_teacher" && (
                        <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/leave-recovery'); setIsMenuOpen(false)}}>Recovery</a>
                      )}
                    </div>
                  )}
                </div>

                {/* Admin Panel Group */}
                { teacher?.role === "super_admin" && (
                  <div className="border-t border-slate-100">
                    <button 
                      className="w-full flex items-center justify-between px-4 py-5 font-bold text-slate-800 hover:bg-sky-50 transition-colors"
                      onClick={() => toggleDropdown('mb-admin')}
                    >
                      <span className="text-lg">Admin Panel</span>
                      <svg className={`w-6 h-6 transition-transform duration-200 text-slate-400 ${openDropdown === 'mb-admin' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openDropdown === 'mb-admin' && (
                      <div className="bg-slate-50/50 pb-3">
                        <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/students-management'); setIsMenuOpen(false)}}>Students</a>
                        <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/teachers-management'); setIsMenuOpen(false)}}>Teachers</a>
                        <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/report'); setIsMenuOpen(false)}}>Attendance Report</a>
                        <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/minus-report'); setIsMenuOpen(false)}}>Minus Report</a>
                        <a href="#" className="block px-8 py-3 text-lg font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-100/50 transition-colors border-t border-slate-100" onClick={()=>{navigate.push('/settings'); setIsMenuOpen(false)}}>Settings</a>
                      </div>
                    )}
                  </div>
                )}
                
                {teacher && <a href="#" className="block px-4 py-5 text-xl font-bold text-red-600 hover:bg-red-50 transition-all duration-200 mt-4 border-t border-slate-200"  onClick={()=>{handleLogout()}}>Logout</a>}
            </nav>
        </div>
      </div>

    </>
  )
}

export default Header
