"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_PORT } from '../../Constants';
import { 
  HeartPulse, 
  Calendar, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Clock, 
  User, 
  ChevronRight,
  Filter,
  Stethoscope,
  Home,
  Hospital
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const MedicalReport = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'home', 'hospital'
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  useEffect(() => {
    const fetchMedicalLeaves = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_PORT}/leave`);
        // Filter for medical leaves
        const medicalData = res.data.filter(l => 
          l.reason === 'Medical (Home)' || l.reason === 'Hospital'
        );
        setLeaves(medicalData);
      } catch (err) {
        console.error("Error fetching medical leaves:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalLeaves();
  }, []);

  const formatFullDateTime = (dateStr, timeStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(`${dateStr}T${timeStr || '00:00'}`);
      if (isNaN(date.getTime())) return `${dateStr} ${timeStr || ''}`;
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return `${dateStr} ${timeStr || ''}`;
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesSearch = 
        (l.studentId?.['FULL NAME'] || l.studentId?.['SHORT NAME'] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(l.studentId?.ADNO || "").includes(searchTerm);
      
      const matchesType = 
        filterType === 'all' || 
        (filterType === 'home' && l.reason === 'Medical (Home)') ||
        (filterType === 'hospital' && l.reason === 'Hospital');

      const matchesDate = 
        (!dateFilter.from || l.fromDate >= dateFilter.from) &&
        (!dateFilter.to || l.fromDate <= dateFilter.to);

      return matchesSearch && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));
  }, [leaves, searchTerm, filterType, dateFilter]);

  const handleExportExcel = () => {
    const exportData = filteredLeaves.map((l, i) => ({
      'SL': i + 1,
      'AD NO': l.studentId?.ADNO,
      'Student Name': l.studentId?.['FULL NAME'],
      'Class': l.studentId?.CLASS,
      'Leave Type': l.reason,
      'From Date': formatFullDateTime(l.fromDate, l.fromTime),
      'Returned At': l.returnedAt ? new Date(l.returnedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Ongoing',
      'Status': l.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medical Report");
    XLSX.writeFile(wb, `Medical_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text("Medical Leave Report", 14, 15);
    
    const tableData = filteredLeaves.map((l, i) => [
      i + 1,
      l.studentId?.ADNO,
      l.studentId?.['FULL NAME'],
      l.studentId?.CLASS,
      l.reason,
      formatFullDateTime(l.fromDate, l.fromTime),
      l.returnedAt ? new Date(l.returnedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Ongoing',
      l.status
    ]);

    autoTable(doc, {
      head: [['SL', 'AD NO', 'Name', 'Class', 'Type', 'From', 'Returned', 'Status']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] }
    });

    doc.save(`Medical_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 flex items-center justify-center rounded-2xl shadow-sm border border-rose-200">
              <HeartPulse size={30} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Medical Report</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Hospital & Medical Home Leaves</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <FileSpreadsheet size={18} /> Excel
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
            >
              <FileText size={18} /> PDF
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <Search size={14} className="text-sky-500" /> Search Student
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="AD NO or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-4 pr-10 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <Filter size={14} className="text-rose-500" /> Filter Type
              </label>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterType('home')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'home' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => setFilterType('hospital')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'hospital' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Hospital
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="md:col-span-1 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <Calendar size={14} className="text-amber-500" /> From
                </label>
                <input 
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  <Calendar size={14} className="text-amber-500" /> To
                </label>
                <input 
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-[2.5rem] h-48 animate-pulse shadow-sm border border-slate-100" />
              ))}
            </div>
          ) : filteredLeaves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeaves.map((leave) => (
                <div 
                  key={leave._id}
                  className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Background Decoration */}
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-500 ${leave.reason === 'Hospital' ? 'bg-sky-500' : 'bg-rose-500'}`} />
                  
                  <div className="relative space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${leave.reason === 'Hospital' ? 'bg-sky-500 shadow-sky-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                          {leave.reason === 'Hospital' ? <Hospital size={22} /> : <Home size={22} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AD NO {leave.studentId?.ADNO}</p>
                          <h3 className="text-base font-black text-slate-800 tracking-tight truncate max-w-[150px]">
                            {leave.studentId?.['SHORT NAME'] || leave.studentId?.['FULL NAME']}
                          </h3>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${leave.status === 'returned' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {leave.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/30">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">From Date</p>
                        <p className="text-xs font-bold text-slate-700">
                          {formatFullDateTime(leave.fromDate, leave.fromTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Returned At</p>
                        <p className="text-xs font-bold text-slate-700">
                          {leave.returnedAt ? new Date(leave.returnedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{leave.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class</span>
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">{leave.studentId?.CLASS}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <HeartPulse size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800">No Medical Records Found</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalReport;
