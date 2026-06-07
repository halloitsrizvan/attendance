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
  const [multipliers, setMultipliers] = useState({
    Morning: { true: '1', false: '1', active: true },
    Afternoon: { true: '1', false: '1', active: true },
    Night: { true: '1', false: '1', active: true },
    Period: { true: '1', false: '1', active: true },
    Jamath: { true: '1', false: '1', active: true },
    Quiraath: { true: '1', false: '1', active: true }
  });

  const handleMultiplierChange = (time, type, value) => {
    setMultipliers(prev => ({
      ...prev,
      [time]: {
        ...prev[time],
        [type]: value
      }
    }));
  };

  const applyTemplate = (type) => {
    if (type === 'normal') {
      setMultipliers({
        Morning: { true: '1/3', false: '2/3', active: true },
        Afternoon: { true: '1/3', false: '2/3', active: true },
        Night: { true: '1/3', false: '2/3', active: true },
        Period: { true: '1/3', false: '2/3', active: true },
        Jamath: { true: '1/3', false: '2/3', active: true },
        Quiraath: { true: '1/3', false: '2/3', active: true }
      });
    }
  };

  const manHeader = useMemo(() => {
    const active = [];
    if (multipliers['Morning']?.active) active.push('M');
    if (multipliers['Afternoon']?.active) active.push('A');
    if (multipliers['Night']?.active) active.push('N');
    return {
      main: 'Leave',
      sub: active.length > 0 ? `(${active.join('+')})` : ''
    };
  }, [multipliers]);

  const pjqHeader = useMemo(() => {
    const active = [];
    if (multipliers['Period']?.active) active.push('P');
    if (multipliers['Jamath']?.active) active.push('J');
    if (multipliers['Quiraath']?.active) active.push('Q');
    return {
      main: 'Absence',
      sub: active.length > 0 ? `(${active.join('+')})` : ''
    };
  }, [multipliers]);

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

    // Morning, Afternoon, Night
    ['Morning', 'Afternoon', 'Night'].forEach(t => {
      if (multipliers[t]?.active) {
        const d = student.groupedAttendance[t];
        if (d) {
          const mFalse = evaluateMultiplier(multipliers[t].false);
          const mTrue = evaluateMultiplier(multipliers[t].true);
          leave_MAN += (d.absentOnLeaveFalse || 0) * mFalse + (d.absentOnLeaveTrue || 0) * mTrue;
        }
      }
    });

    // Period
    if (multipliers['Period']?.active) {
      const periodData = student.groupedAttendance['Period'];
      if (periodData && periodData.periods) {
        const pFalse = evaluateMultiplier(multipliers['Period'].false);
        const pTrue = evaluateMultiplier(multipliers['Period'].true);
        Object.values(periodData.periods).forEach(p => {
          absence_PJ += (p.absentOnLeaveFalse || 0) * pFalse + (p.absentOnLeaveTrue || 0) * pTrue;
        });
      }
    }

    // Jamath
    if (multipliers['Jamath']?.active) {
      const jamathData = student.groupedAttendance['Jamath'];
      if (jamathData) {
        const jFalse = evaluateMultiplier(multipliers['Jamath'].false);
        const jTrue = evaluateMultiplier(multipliers['Jamath'].true);
        absence_PJ += (jamathData.absentOnLeaveFalse || 0) * jFalse + (jamathData.absentOnLeaveTrue || 0) * jTrue;
      }
    }

    // Quiraath
    if (multipliers['Quiraath']?.active) {
      const quiraathData = student.groupedAttendance['Quiraath'];
      if (quiraathData) {
        const qFalse = evaluateMultiplier(multipliers['Quiraath'].false);
        const qTrue = evaluateMultiplier(multipliers['Quiraath'].true);
        absence_PJ += (quiraathData.absentOnLeaveFalse || 0) * qFalse + (quiraathData.absentOnLeaveTrue || 0) * qTrue;
      }
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
  }, [data, multipliers]);

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
      [`Leave ${manHeader.sub}`.trim()]: formatExcelNum(r.leave),
      [`Absence ${pjqHeader.sub}`.trim()]: formatExcelNum(r.absence),
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Settings size={14} className="text-emerald-500" /> Deduction Multipliers
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Templates:</span>
                <button
                  onClick={() => applyTemplate('normal')}
                  className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95"
                >
                  Normal (1/3, 2/3)
                </button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 mb-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  <div>Time / Session</div>
                  <div>Absent without permission </div>
                  <div>On Leave </div>
                </div>
                <div className="space-y-3">
                  {['Morning', 'Afternoon', 'Night', 'Period', 'Jamath', 'Quiraath'].map(time => (
                    <div key={time} className={`grid grid-cols-[150px_1fr_1fr] gap-4 items-center transition-opacity ${!multipliers[time]?.active ? 'opacity-50 grayscale' : ''}`}>
                      <label className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider px-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={multipliers[time]?.active || false}
                          onChange={e => handleMultiplierChange(time, 'active', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        {time}
                      </label>
                      <div className="relative">
                        <MinusIcon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${!multipliers[time]?.active ? 'text-slate-400' : 'text-rose-500'}`} />
                        <input
                          type="text"
                          placeholder="0"
                          disabled={!multipliers[time]?.active}
                          value={multipliers[time]?.false || ''}
                          onChange={e => handleMultiplierChange(time, 'false', e.target.value)}
                          className={`w-full border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-slate-700 focus:border-rose-400 outline-none transition-colors ${!multipliers[time]?.active ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                        />
                      </div>
                      <div className="relative">
                        <MinusIcon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${!multipliers[time]?.active ? 'text-slate-400' : 'text-emerald-500'}`} />
                        <input
                          type="text"
                          placeholder="0"
                          disabled={!multipliers[time]?.active}
                          value={multipliers[time]?.true || ''}
                          onChange={e => handleMultiplierChange(time, 'true', e.target.value)}
                          className={`w-full border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-slate-700 focus:border-emerald-400 outline-none transition-colors ${!multipliers[time]?.active ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                        />
                      </div>
                    </div>
                  ))}
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
                    <th className="p-4 border-r border-white text-center bg-blue-50/50 text-blue-600">Total Permitted<br />Leave</th>
                    <th className="p-4 border-r border-white text-center bg-amber-50/50 text-amber-600">
                      {manHeader.main}{manHeader.sub && <><br />{manHeader.sub}</>}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-orange-50/50 text-orange-600">
                      {pjqHeader.main}{pjqHeader.sub && <><br />{pjqHeader.sub}</>}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-rose-50/50 text-rose-600">Minus</th>
                    <th className="p-4 border-r border-white text-center bg-slate-100 text-slate-800">Total Absence</th>
                    <th className="p-4 border-r border-white text-center bg-emerald-50/50 text-emerald-600">Medical Leave</th>
                    <th className="p-4 border-r border-white text-center bg-teal-50/50 text-teal-600">Documented<br />Leave</th>
                    <th className="p-4 border-r border-white text-center bg-purple-50/50 text-purple-600">Zehnuth<br />Points</th>
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
