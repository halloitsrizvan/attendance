"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Users, 
  Clock, 
  Search, 
  FileText, 
  Download, 
  FileSpreadsheet, 
  AlertCircle,
  Plus,
  Minus as MinusIcon,
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

const TIME_OPTIONS = [
  { id: 'Period', label: 'Period' },
  { id: 'Morning', label: 'Morning' },
  { id: 'Afternoon', label: 'Afternoon' },
  { id: 'Night', label: 'Night' },
  { id: 'Jamath', label: 'Jamath' },
  { id: 'Minus', label: 'Minus' }
];

function AdvancedReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [selectedTimes, setSelectedTimes] = useState([]); // Array of { id, multFalse, multTrue }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  // Set default dates to today on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  }, []);

  const toggleTime = (timeId) => {
    if (selectedTimes.find(t => t.id === timeId)) {
      setSelectedTimes(selectedTimes.filter(t => t.id !== timeId));
    } else {
      setSelectedTimes([...selectedTimes, { id: timeId, multFalse: '0', multTrue: '0' }]);
    }
  };

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
    if (num === 0) return '0';
    const rounded = Math.round(num * 10) / 10;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  };

  const updateMultiplier = (id, field, value) => {
    setSelectedTimes(selectedTimes.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleFetch = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date');
      return;
    }

    if (selectedTimes.length === 0) {
      setError('Please select at least one Time category');
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
    const rowData = {
      sl: student.SL,
      ad: student.ad,
      name: student.nameOfStd,
      class: student.class,
      times: {},
      subTotal: 0
    };

    selectedTimes.forEach(st => {
      let minus = 0;
      const multFalse = evaluateMultiplier(st.multFalse);
      const multTrue = evaluateMultiplier(st.multTrue);

      if (st.id === 'Minus') {
        minus = student.totalManualMinus; 
      } else if (st.id === 'Period') {
          const periodData = student.groupedAttendance['Period'];
          if (periodData && periodData.periods) {
              Object.values(periodData.periods).forEach(p => {
                  minus += (p.absentOnLeaveFalse * multFalse);
                  minus += (p.absentOnLeaveTrue * multTrue);
              });
          }
      } else {
        const att = student.groupedAttendance[st.id];
        if (att) {
          minus += (att.absentOnLeaveFalse * multFalse);
          minus += (att.absentOnLeaveTrue * multTrue);
        }
      }
      rowData.times[st.id] = minus;
      rowData.subTotal += minus;
    });

    return rowData;
  };

  const reportData = useMemo(() => {
    return data.map(calculateStudentRow);
  }, [data, selectedTimes]);

  const handleDownloadExcel = () => {
    const wsData = reportData.map(r => {
      const base = {
        'SL': r.sl,
        'AD NO': r.ad,
        'Name': r.name,
        'Class': r.class,
      };
      selectedTimes.forEach(st => {
        base[st.id] = formatNum(r.times[st.id]);
      });
      base['Sub-Total'] = formatNum(r.subTotal);
      return base;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Minus Report');
    XLSX.writeFile(wb, `Minus_Report_${classNumber}_${fromDate}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 flex items-center justify-center rounded-2xl shadow-sm border border-rose-200">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Advanced Minus Report</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure deductions and generate summary</p>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Filters */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="relative">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                  <Clock size={14} className="text-amber-500" /> Categories
                </label>
                <button
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-all"
                >
                  <span className="truncate">
                    {selectedTimes.length === 0 ? "Select Categories" : `${selectedTimes.length} selected`}
                  </span>
                  <ChevronDown className={`transition-transform duration-300 ${showTimeDropdown ? 'rotate-180' : ''}`} size={18} />
                </button>
                
                {showTimeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {TIME_OPTIONS.map(opt => {
                      const isSelected = selectedTimes.some(t => t.id === opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleTime(opt.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all mb-1 last:mb-0 ${
                            isSelected ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                          {isSelected && <Check size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Categories Configuration */}
            <div className="md:col-span-2 bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 min-h-[300px]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                <Plus size={14} className="text-emerald-500" /> Deduction Multipliers
              </h3>
              
              {selectedTimes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
                  <Clock size={48} className="mb-4" />
                  <p className="text-sm font-bold">Select categories to configure multipliers</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTimes.map(st => (
                    <div key={st.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex-1">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{st.id}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 w-full sm:w-auto items-center">
                        {st.id === 'Minus' ? (
                          <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                            Uses Direct DB Values
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 sm:flex-none min-w-[140px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">On Leave: FALSE</label>
                              <div className="relative">
                                <MinusIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={st.multFalse}
                                  onChange={e => updateMultiplier(st.id, 'multFalse', e.target.value)}
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
                                  value={st.multTrue}
                                  onChange={e => updateMultiplier(st.id, 'multTrue', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-slate-700 focus:border-emerald-400 outline-none"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <button 
                          onClick={() => toggleTime(st.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-8 flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-2xl text-sm font-bold border border-rose-100 animate-bounce">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full sm:w-auto flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest py-5 px-10 rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Search size={20} />
              )}
              Generate Analysis
            </button>

            {reportData.length > 0 && (
              <button
                onClick={handleDownloadExcel}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-widest py-5 px-8 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                    <th className="p-6 border-r border-white text-center w-16">SL</th>
                    <th className="p-6 border-r border-white w-24">AD NO</th>
                    <th className="p-6 border-r border-white min-w-[200px]">Student Name</th>
                    <th className="p-6 border-r border-white text-center w-24">Class</th>
                    
                    {selectedTimes.map(st => (
                      <th key={st.id} className="p-6 border-r border-white text-center bg-rose-50/30 text-rose-600">
                        {st.id}
                      </th>
                    ))}
                    
                    <th className="p-6 text-center bg-slate-900 text-white rounded-tr-[2.5rem]">Sub-Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {reportData.map((row, idx) => (
                    <tr key={row.ad} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 border-r border-white text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                      <td className="p-4 border-r border-white text-slate-600 font-black">{row.ad}</td>
                      <td className="p-4 border-r border-white text-slate-800 font-black group-hover:text-rose-600 transition-colors">{row.name}</td>
                      <td className="p-4 border-r border-white text-center">
                        <span className="px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-xs font-black">C-{row.class}</span>
                      </td>
                      
                      {selectedTimes.map(st => (
                        <td key={st.id} className="p-4 border-r border-white text-center font-black text-rose-500 bg-rose-50/10">
                          {formatNum(row.times[st.id])}
                        </td>
                      ))}
                      
                      <td className="p-4 text-center font-black text-lg text-slate-900 bg-slate-50/50">
                        {formatNum(row.subTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                        <td colSpan={4} className="p-6 text-right">Total Page Deductions:</td>
                        {selectedTimes.map(st => {
                            const totalForTime = reportData.reduce((sum, r) => sum + (r.times[st.id] || 0), 0);
                            return (
                                <td key={st.id} className="p-6 text-center border-l border-white/10">{formatNum(totalForTime)}</td>
                            );
                        })}
                        <td className="p-6 text-center bg-rose-600 text-white text-xl">
                            {formatNum(reportData.reduce((sum, r) => sum + r.subTotal, 0))}
                        </td>
                    </tr>
                </tfoot>
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
              <p className="text-sm text-slate-300 mt-2">Adjust dates, class and categories above.</p>
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
