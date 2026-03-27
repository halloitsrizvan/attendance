"use client";

import React, { useEffect, useState } from 'react'
import { useRouter } from "next/navigation";

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

function Header() {
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [teacher, setTeacher] = useState(null);

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
              <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium" onClick={()=>{navigate.push('/')}}>Home</a>
              <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium"  onClick={()=>{navigate.push('/class-wise')}}>Status</a>
              <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium"  onClick={()=>{navigate.push('/edit-attendance-classes')}}>Edit</a>
          
              { teacher?.role && ["class_teacher","super_admin","HOD","HOS","Principal"].includes(teacher?.role) && (
                <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium"  onClick={()=>{navigate.push('/leave-form')}}>Leave</a>
              )}
              <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium"  onClick={()=>{navigate.push('/leave-dashboard')}}>Leave Dashboard</a> 
              { teacher?.role === "super_admin" && (
                <>
                  <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium" onClick={()=>{navigate.push('/students-management')}}>Students</a>
                  <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium" onClick={()=>{navigate.push('/teachers-management')}}>Teachers</a>
                  <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium"  onClick={()=>{navigate.push('/report')}}>Report</a>
                  <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium" onClick={()=>{navigate.push('/minus-report')}}>Minus Report</a>
                  <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium" onClick={()=>{navigate.push('/settings')}}>Settings</a>
                </>
              )}
              
            
              <a href="#" className="text-white/90 hover:text-white transition-colors duration-200 font-medium"  onClick={()=>{handleLogout()}}>Logout</a>
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
            <nav className="flex flex-col space-y-2">
                <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200" onClick={()=>{navigate.push('/'); setIsMenuOpen(false)}}>Home</a>
                <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"  onClick={()=>{navigate.push('/class-wise'); setIsMenuOpen(false)}}>Status</a>
                <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"  onClick={()=>{navigate.push('/edit-attendance-classes'); setIsMenuOpen(false)}}>Edit</a>
                
                { teacher?.role && ["class_teacher","super_admin","HOD","HOS","Principal"].includes(teacher?.role) && (
                  <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"  onClick={()=>{navigate.push('/leave-form'); setIsMenuOpen(false)}}>Leave</a>
                )}
                <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"  onClick={()=>{navigate.push('/leave-dashboard'); setIsMenuOpen(false)}}>Leave Dashboard</a>
               
                { teacher?.role === "super_admin" && (
                  <>
                    <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200" onClick={()=>{navigate.push('/students-management'); setIsMenuOpen(false)}}>Students</a>
                    <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200" onClick={()=>{navigate.push('/teachers-management'); setIsMenuOpen(false)}}>Teachers</a>
                    <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"  onClick={()=>{navigate.push('/report'); setIsMenuOpen(false)}}>Report</a>
                    <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200" onClick={()=>{navigate.push('/minus-report'); setIsMenuOpen(false)}}>Minus Report</a>
                    <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200" onClick={()=>{navigate.push('/settings'); setIsMenuOpen(false)}}>Settings</a>
                  </>
                )}
                
                
                {teacher && <a href="#" className="block px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 mt-4 border-t pt-4"  onClick={()=>{handleLogout()}}>Logout</a>}
            </nav>
        </div>
      </div>

    </>
  )
}

export default Header
