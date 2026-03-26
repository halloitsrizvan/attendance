"use client";

import React, { useState, useEffect } from 'react';

export default function BulkStudents({ studentList = [], onAddStudent, onBack }) {
  const [classFilter, setClassFilter] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Extract unique classes from student list
  const classes = [...new Set(studentList.map(s => s.CLASS))].sort((a, b) => a - b);

  useEffect(() => {
    if (classFilter) {
      setFilteredStudents(studentList.filter(s => String(s.CLASS) === String(classFilter)));
    } else {
      setFilteredStudents(studentList.slice(0, 50)); // Show first 50 if no filter
    }
  }, [classFilter, studentList]);

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-sky-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Bulk Select</h2>
            <div className="flex items-center bg-slate-100 rounded-2xl px-4 py-1.5 border border-slate-200">
              <label htmlFor="classSelector" className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Class</label>
              <select 
                id="classSelector"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-transparent font-bold text-sky-600 focus:outline-none text-sm"
              >
                <option value="">All</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="px-5 py-2 bg-sky-100 text-sky-700 font-bold rounded-xl hover:bg-sky-200 transition-all text-sm"
          >
            Regular Form
          </button>
        </div>

        <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-slate-50/50">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-16">Sl</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-24">Ad</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Name</th>
                  <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.ADNO} className="hover:bg-sky-50 transition-colors group">
                      <td className="px-5 py-4 text-sm font-bold text-slate-400">{student.SL}</td>
                      <td className="px-5 py-4 text-sm font-mono text-slate-500 group-hover:text-sky-600">{student.ADNO}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 group-hover:text-sky-900 leading-none mb-1">
                            {student["SHORT NAME"] || student["FULL NAME"] || student.name || "Unknown"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                            {student["FULL NAME"] || student["SHORT NAME"] || "---"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => onAddStudent(student)}
                          className="px-4 py-1.5 bg-sky-500 text-white text-[10px] font-black uppercase rounded-full shadow-lg shadow-sky-500/20 hover:bg-sky-600 active:scale-95 transition-all"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <span className="text-4xl mb-2">🔭</span>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No students found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4 px-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>{filteredStudents.length} Students listed</span>
          <span className="text-sky-500">Academic Sky System</span>
        </div>
      </div>
    </div>
  );
}

