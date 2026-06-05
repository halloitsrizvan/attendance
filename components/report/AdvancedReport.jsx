"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Calendar,
  Users,
  Search,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Settings,
  MinusIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';

function AdvancedReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [classNumber, setClassNumber] = useState('');
  
  // Multipliers
  const [manMultiplierTrue, setManMultiplierTrue] = useState('1');
  const [manMultiplierFalse, setManMultiplierFalse] = useState('1');
  const [pjMultiplierTrue, setPjMultiplierTrue] = useState('1');
  const [pjMultiplierFalse, setPjMultiplierFalse] = useState('1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);

  // Set default dates to today on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  }, []);

  const evaluateMultiplier = (val) => {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return 0;
    const trimmed = val.trim();
    if (!trimmed) return 0;
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && den) return num / den;
      }
    }
    return parseFloat(trimmed) || 0;
  };

  const formatNum = (num) => {
    if (!num && num !== 0) return '0';
    const rounded = Math.round(num * 10) / 10;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  };

  const handleFetch = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ fromDate, toDate, class: classNumber });
      const res = await axios.get(`/api/report/minus-advanced?${params.toString()}`);
      setData(res.data.results || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentRow = (student) => {
    let leave_MAN = 0;
    let absence_PJ = 0;

    const manTrueMult = evaluateMultiplier(manMultiplierTrue);
    const manFalseMult = evaluateMultiplier(manMultiplierFalse);
    const pjTrueMult = evaluateMultiplier(pjMultiplierTrue);
    const pjFalseMult = evaluateMultiplier(pjMultiplierFalse);

    // Morning, Afternoon, Night
    ['Morning', 'Afternoon', 'Night'].forEach(t => {
        const d = student.groupedAttendance[t];
        if (d) {
            leave_MAN += (d.absentOnLeaveFalse || 0) * manFalseMult + (d.absentOnLeaveTrue || 0) * manTrueMult;
        }
    });

    // Period
    const periodData = student.groupedAttendance['Period'];
    if (periodData && periodData.periods) {
        Object.values(periodData.periods).forEach(p => {
            absence_PJ += (p.absentOnLeaveFalse || 0) * pjFalseMult + (p.absentOnLeaveTrue || 0) * pjTrueMult;
        });
    }

    // Jamath
    const jamathData = student.groupedAttendance['Jamath'];
    if (jamathData) {
        absence_PJ += (jamathData.absentOnLeaveFalse || 0) * pjFalseMult + (jamathData.absentOnLeaveTrue || 0) * pjTrueMult;
    }

    const c = parseInt(student.class, 10);
    let permitted = 0;
    if (!isNaN(c)) {
        if (c >= 1 && c <= 5) permitted = 6;
        else if (c === 6 || c === 7) permitted = 7;
        else if (c >= 8 && c <= 10) permitted = 8;
    }

    const minus = student.totalManualMinus || 0;
    const totalAbsence = leave_MAN + absence_PJ + minus;
    const overBy = Math.max(0, totalAbsence - permitted);

    return {
      sl: student.SL,
      adno: student.ad,
      name: student.nameOfStd,
      class: student.class,
      permitted,
      leave: leave_MAN,
      absence: absence_PJ,
      minus,
      totalAbsence,
      medicalLeave: student.totalMedicalLeave || 0,
      documentedLeave: student.totalDocumentedLeave || 0,
      zehnuthPoints: student.totalZehnuthPoints || 0,
      overBy
    };
  };

  // Re-calculate data if multipliers change even without fetching
  const reportData = useMemo(() => {
    return data.map(calculateStudentRow);
  }, [data, manMultiplierTrue, manMultiplierFalse, pjMultiplierTrue, pjMultiplierFalse]);

  const handleDownloadExcel = () => {
    const formatExcelNum = (num) => {
      if (!num && num !== 0) return 0;
      return Math.round(num * 100) / 100;
    };

    const wsData = reportData.map(r => ({
      'SL': r.sl,
      'AD NO': r.adno,
      'Name': r.name,
      'Class': r.class,
      'Total Permitted Leave': formatExcelNum(r.permitted),
      'Leave (M+A+N)': formatExcelNum(r.leave),
      'Absence (P+J)': formatExcelNum(r.absence),
      'Minus': formatExcelNum(r.minus),
      'Total Absence': formatExcelNum(r.totalAbsence),
      'Medical Leave': formatExcelNum(r.medicalLeave),
      'Documented Leave': formatExcelNum(r.documentedLeave),
      'Zehnuth Points': formatExcelNum(r.zehnuthPoints),
      'Over By': formatExcelNum(r.overBy)
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deduction Report');
    XLSX.writeFile(wb, `Deduction_Report_${classNumber || 'All'}_${fromDate}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-8 mt-16 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 flex items-center justify-center rounded-2xl shadow-sm border border-rose-200">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Deduction Report</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Generate final deduction summary</p>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
          
          {/* Main Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                <Calendar size={14} className="text-rose-500" /> From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-rose-400 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                <Calendar size={14} className="text-rose-500" /> To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-rose-400 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                <Users size={14} className="text-sky-500" /> Enter Class Number <span className="text-slate-300 font-normal lowercase tracking-normal">(Optional)</span>
              </label>
              <input
                type="number"
                placeholder="Enter Class Number"
                value={classNumber}
                onChange={e => setClassNumber(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Multiplier Configuration */}
          <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                <Settings size={14} className="text-emerald-500" /> Deduction Multipliers
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* M+A+N Multipliers */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Leave (M+A+N)</span>
                      </div>
                      <div className="flex flex-wrap gap-4 w-full sm:w-auto items-center">
                          <div className="flex-1 sm:flex-none min-w-[140px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Absent without permission</label>
                              <div className="relative">
                                  <MinusIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                                  <input
                                      type="text"
                                      placeholder="0"
                                      value={manMultiplierFalse}
                                      onChange={e => setManMultiplierFalse(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-slate-700 focus:border-rose-400 outline-none"
                                  />
                              </div>
                          </div>
                          <div className="flex-1 sm:flex-none min-w-[140px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">On Leave</label>
                              <div className="relative">
                                  <MinusIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                  <input
                                      type="text"
                                      placeholder="0"
                                      value={manMultiplierTrue}
                                      onChange={e => setManMultiplierTrue(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-slate-700 focus:border-emerald-400 outline-none"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* P+J Multipliers */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <span className="text-xs font-black text-orange-600 uppercase tracking-wider">Absence (P+J)</span>
                      </div>
                      <div className="flex flex-wrap gap-4 w-full sm:w-auto items-center">
                          <div className="flex-1 sm:flex-none min-w-[140px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">On Leave: FALSE</label>
                              <div className="relative">
                                  <MinusIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                                  <input
                                      type="text"
                                      placeholder="0"
                                      value={pjMultiplierFalse}
                                      onChange={e => setPjMultiplierFalse(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-slate-700 focus:border-rose-400 outline-none"
                                  />
                              </div>
                          </div>
                          <div className="flex-1 sm:flex-none min-w-[140px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">On Leave: TRUE</label>
                              <div className="relative">
                                  <MinusIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                  <input
                                      type="text"
                                      placeholder="0"
                                      value={pjMultiplierTrue}
                                      onChange={e => setPjMultiplierTrue(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-slate-700 focus:border-emerald-400 outline-none"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>


          {error && (
            <div className="mt-8 flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-2xl text-sm font-bold border border-rose-100 animate-bounce">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full sm:w-auto flex-1 md:flex-none md:w-64 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest py-4 px-8 rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Search size={20} />
              )}
              Generate
            </button>

            {reportData.length > 0 && (
              <button
                onClick={handleDownloadExcel}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-widest py-4 px-8 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={20} /> Export Excel
              </button>
            )}
          </div>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-14 bg-slate-100 rounded-2xl w-full"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 bg-slate-50 rounded-xl w-16"></div>
                  <div className="h-12 bg-slate-50 rounded-xl flex-1"></div>
                  <div className="h-12 bg-slate-50 rounded-xl w-32"></div>
                </div>
              ))}
            </div>
          </div>
        ) : reportData.length > 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                    <th className="p-4 border-r border-white text-center">SL</th>
                    <th className="p-4 border-r border-white">AD NO</th>
                    <th className="p-4 border-r border-white min-w-[150px]">Student Name</th>
                    <th className="p-4 border-r border-white text-center">Class</th>
                    <th className="p-4 border-r border-white text-center bg-blue-50/50 text-blue-600">Total Permitted<br/>Leave</th>
                    <th className="p-4 border-r border-white text-center bg-amber-50/50 text-amber-600">Leave<br/>(M+A+N)</th>
                    <th className="p-4 border-r border-white text-center bg-orange-50/50 text-orange-600">Absence<br/>(P+J)</th>
                    <th className="p-4 border-r border-white text-center bg-rose-50/50 text-rose-600">Minus</th>
                    <th className="p-4 border-r border-white text-center bg-slate-100 text-slate-800">Total Absence</th>
                    <th className="p-4 border-r border-white text-center bg-emerald-50/50 text-emerald-600">Medical Leave</th>
                    <th className="p-4 border-r border-white text-center bg-teal-50/50 text-teal-600">Documented<br/>Leave</th>
                    <th className="p-4 border-r border-white text-center bg-purple-50/50 text-purple-600">Zehnuth<br/>Points</th>
                    <th className="p-4 text-center bg-red-100 text-red-600">Over By</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {reportData.map((row, idx) => (
                    <tr key={row.adno} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="p-3 border-r border-white text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                      <td className="p-3 border-r border-white text-slate-600 font-black">{row.adno}</td>
                      <td className="p-3 border-r border-white text-slate-800 font-black truncate max-w-[200px]" title={row.name}>{row.name}</td>
                      <td className="p-3 border-r border-white text-center">
                        <span className="px-2 py-1 bg-sky-50 text-sky-600 rounded-lg text-xs font-black">C-{row.class}</span>
                      </td>
                      <td className="p-3 border-r border-white text-center font-black text-blue-600 bg-blue-50/20">{row.permitted}</td>
                      <td className="p-3 border-r border-white text-center font-black text-amber-600 bg-amber-50/20">{formatNum(row.leave)}</td>
                      <td className="p-3 border-r border-white text-center font-black text-orange-600 bg-orange-50/20">{formatNum(row.absence)}</td>
                      <td className="p-3 border-r border-white text-center font-black text-rose-600 bg-rose-50/20">{formatNum(row.minus)}</td>
                      <td className="p-3 border-r border-white text-center font-black text-slate-800 bg-slate-50">{formatNum(row.totalAbsence)}</td>
                      <td className="p-3 border-r border-white text-center font-black text-emerald-600 bg-emerald-50/20">{formatNum(row.medicalLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-black text-teal-600 bg-teal-50/20">{formatNum(row.documentedLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-black text-purple-600 bg-purple-50/20">{formatNum(row.zehnuthPoints)}</td>
                      <td className={`p-3 text-center font-black ${row.overBy > 0 ? 'text-red-600 bg-red-50/50' : 'text-slate-300'}`}>
                        {row.overBy > 0 ? formatNum(row.overBy) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest">Select criteria to generate report</p>
            </div>
          )
        )}
      </div>

      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default AdvancedReport;
