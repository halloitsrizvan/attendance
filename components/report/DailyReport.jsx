"use client";

import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_PORT } from '../../Constants';
import axios from 'axios';
import { Calendar, Download, FileText, Search, Clock, Users, FileSpreadsheet, AlertCircle, X, CheckCircle } from 'lucide-react';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

function DailyReport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [attendanceTime, setAttendanceTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Set default dates to today on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  }, []);

  useEffect(() => {
    const storedTeacher = getSafeLocalStorage().getItem("teacher");
    if (storedTeacher) {
      try {
        setTeacher(JSON.parse(storedTeacher));
      } catch (e) {
        console.error("Failed to parse teacher from localStorage");
      }
    }
  }, []);

  // Fetch Data
  const handleFetch = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setData([]);

      const params = new URLSearchParams({ fromDate, toDate });
      if (classNumber) params.append('class', classNumber);
      if (attendanceTime) params.append('attendanceTime', attendanceTime);

      const res = await fetch(`${API_PORT}/set-attendance/report/detailed-daily?${params.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to fetch report');
      }
      
      const j = await res.json();
      const results = j.results || [];
      const timeSlots = j.availableTimeSlots || [];
      
      if (classNumber) {
        results.sort((a, b) => a.SL - b.SL);
      } else {
        results.sort((a, b) => {
          if (a.class !== b.class) return a.class - b.class;
          return a.SL - b.SL;
        });
      }
      
      setData(results);
      setAvailableTimeSlots(timeSlots);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique dates
  const allDates = useMemo(() => {
    if (data.length === 0) return [];
    const dates = new Set();
    data.forEach(student => {
      if (student.dailyAttendance) {
        student.dailyAttendance.forEach(day => dates.add(day.date));
      }
    });
    return Array.from(dates).sort();
  }, [data]);

  // Build a per-date map of time slots that actually have data
  const timeSlotsByDate = useMemo(() => {
    const map = {};
    allDates.forEach(date => {
      const slotsWithData = [];
      availableTimeSlots.forEach(slot => {
        let hasDataForThisSlot = false;
        for (const student of data) {
          const day = student.dailyAttendance?.find(d => d.date === date);
          if (!day) continue;
          if (slot === 'Period') {
            if (day.Period && Object.keys(day.Period).length > 0) {
              hasDataForThisSlot = true;
              break;
            }
          } else {
            if (day[slot]) {
              hasDataForThisSlot = true;
              break;
            }
          }
        }
        if (hasDataForThisSlot) slotsWithData.push(slot);
      });
      map[date] = slotsWithData;
    });
    return map;
  }, [allDates, availableTimeSlots, data]);

  // Dates that actually have at least one visible slot
  const usedDates = useMemo(() => {
    return allDates.filter(d => (timeSlotsByDate[d] || []).length > 0);
  }, [allDates, timeSlotsByDate]);

  const getCellBgClass = (day, timeSlot) => {
    if (timeSlot === 'Period') {
      const values = Object.values(day?.Period || {});
      if (values.length === 0) return 'bg-slate-50 text-slate-400';
      const hasAbsent = values.some(v => v === 'A');
      const hasPresent = values.some(v => v === 'P');
      if (hasAbsent) return 'bg-rose-50 text-rose-600 font-bold';
      if (hasPresent) return 'bg-emerald-50 text-emerald-600 font-bold';
      return 'bg-slate-50 text-slate-400';
    }
    const v = day?.[timeSlot];
    if (!v) return 'bg-slate-50 text-slate-400';
    if (v === 'P') return 'bg-emerald-50 text-emerald-600 font-bold';
    if (v === 'A') return 'bg-rose-50 text-rose-600 font-bold';
    return 'bg-slate-50 text-slate-400';
  };

  const getPeriodNumbersForDate = (date) => {
    const periodNumbers = new Set();
    data.forEach(student => {
      const day = student.dailyAttendance?.find(d => d.date === date);
      if (day?.Period) {
        Object.keys(day.Period).forEach(periodNum => periodNumbers.add(periodNum));
      }
    });
    return Array.from(periodNumbers).sort((a, b) => parseInt(a) - parseInt(b));
  };
  
  const handleDownloadExcel = () => {
    const wsData = [];
    data.forEach((r, i) => {
      const base = {
        SL: i + 1,
        AD: r.ad,
        Name: r.nameOfStd,
        Class: r.class,
        Present: r.present,
        Absent: r.absent,
      };
      usedDates.forEach(date => {
        const dayData = r.dailyAttendance?.find(d => d.date === date);
        const slots = timeSlotsByDate[date] || [];
        const periodNumbers = getPeriodNumbersForDate(date);
        const hasPeriod = slots.includes('Period');
        
        slots.forEach(timeSlot => {
          if (timeSlot === 'Period' && hasPeriod) {
            periodNumbers.forEach(periodNum => {
              base[`${date}_Period_${periodNum}`] = dayData?.Period?.[periodNum] || '-';
            });
          } else if (timeSlot !== 'Period') {
            base[`${date}_${timeSlot}`] = dayData?.[timeSlot] || '-';
          }
        });
        const dayTotal = (timeSlotsByDate[date] || []).reduce((sum, ts) => {
          if (ts === 'Period') {
            return sum + Object.values(dayData?.Period || {}).filter(p => p === 'P').length;
          }
          return sum + (dayData?.[ts] === 'P' ? 1 : 0);
        }, 0);
        base[`${date}_Total`] = dayTotal;
      });
      wsData.push(base);
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `Detailed_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  const handleEntryClick = (student, day, slot, periodNum = null) => {
    const id = periodNum ? day.PeriodIds?.[periodNum] : day.SlotIds?.[slot];
    const status = periodNum ? day.Period?.[periodNum] : day?.[slot];
    
    if (!id || (status !== 'P' && status !== 'A')) return;

    setSelectedEntry({
      studentName: student.nameOfStd,
      ad: student.ad,
      class: student.class,
      date: day.date,
      slot,
      periodNum,
      status: status === 'P' ? 'Present' : 'Absent',
      id
    });
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedEntry || updating) return;

    try {
      setUpdating(true);
      const res = await axios.patch(`${API_PORT}/set-attendance`, {
        updates: [{ _id: selectedEntry.id, status: newStatus }]
      });

      if (res.status === 200) {
        // Update local state
        setData(prevData => prevData.map(student => {
          if (student.ad === selectedEntry.ad) {
            return {
              ...student,
              dailyAttendance: student.dailyAttendance.map(day => {
                if (day.date === selectedEntry.date) {
                  const newDay = { ...day };
                  const shortStatus = newStatus === 'Present' ? 'P' : 'A';
                  
                  if (selectedEntry.slot === 'Period') {
                    newDay.Period = { ...newDay.Period, [selectedEntry.periodNum]: shortStatus };
                  } else {
                    newDay[selectedEntry.slot] = shortStatus;
                  }

                  // Recalculate student totals if necessary, or just let it be (re-fetching is cleaner but heavier)
                  // Actually the 'present' and 'absent' totals at student level also need update
                  return newDay;
                }
                return day;
              }),
              // Recalculate student level totals
              present: newStatus === 'Present' 
                ? (selectedEntry.status === 'Absent' ? student.present + 1 : student.present)
                : (selectedEntry.status === 'Present' ? student.present - 1 : student.present),
              absent: newStatus === 'Absent'
                ? (selectedEntry.status === 'Present' ? student.absent + 1 : student.absent)
                : (selectedEntry.status === 'Absent' ? student.absent - 1 : student.absent)
            };
          }
          return student;
        }));
        
        setIsModalOpen(false);
        setSelectedEntry(null);
      }
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to update status: " + (e.response?.data?.error || e.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    let expectedCols = 6; // SL, AD, Name, Class, P, A
    usedDates.forEach(d => {
      const slots = timeSlotsByDate[d] || [];
      const hasPeriod = slots.includes('Period');
      expectedCols += slots.length + (hasPeriod ? getPeriodNumbersForDate(d).length - 1 : 0) + 1; // +1 for Tot
    });

    const format = expectedCols > 18 ? [210, Math.max(297, expectedCols * 18)] : 'a4';
    const doc = new jsPDF({ orientation: 'landscape', format });
    
    doc.setFontSize(14);
    doc.text(`Detailed Attendance Report (${fromDate} - ${toDate})`, 14, 15);

    const headers = ['SL', 'AD', 'Name', 'Class'];
    usedDates.forEach(date => {
      const slots = timeSlotsByDate[date] || [];
      const periodNumbers = getPeriodNumbersForDate(date);
      const hasPeriod = slots.includes('Period');
      
      const dateObj = new Date(date);
      const shortDate = `${dateObj.getDate().toString().padStart(2, '0')} ${dateObj.toLocaleString('en-US', { month: 'short' })}`;

      slots.forEach(timeSlot => {
        if (timeSlot === 'Period' && hasPeriod) {
          periodNumbers.forEach(periodNum => headers.push(`${shortDate}\nP${periodNum}`));
        } else if (timeSlot !== 'Period') {
          headers.push(`${shortDate}\n${timeSlot.substring(0, 3)}`);
        }
      });
      headers.push(`${shortDate}\nTot`);
    });
    headers.push('P', 'A');

    const rows = data.map((r, i) => {
      const row = [i + 1, r.ad, r.nameOfStd, r.class];
      usedDates.forEach(date => {
        const dayData = r.dailyAttendance?.find(d => d.date === date);
        let dayTotal = 0;
        const slots = timeSlotsByDate[date] || [];
        const periodNumbers = getPeriodNumbersForDate(date);
        const hasPeriod = slots.includes('Period');
        
        slots.forEach(timeSlot => {
          if (timeSlot === 'Period' && hasPeriod) {
            periodNumbers.forEach(periodNum => {
              row.push(dayData?.Period?.[periodNum] || '-');
            });
            dayTotal += Object.values(dayData?.Period || {}).filter(p => p === 'P').length;
          } else if (timeSlot !== 'Period') {
            row.push(dayData?.[timeSlot] || '-');
            dayTotal += (dayData?.[timeSlot] === 'P' ? 1 : 0);
          }
        });
        row.push(dayTotal);
      });
      row.push(r.present, r.absent);
      return row;
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      styles: { fontSize: 6, cellPadding: 1, halign: 'center', minCellHeight: 10 },
      headStyles: { fillColor: [14, 165, 233], valign: 'middle' }, // sky-500
    });

    doc.save(`Detailed_Report_${fromDate}_to_${toDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 flex items-center justify-center rounded-2xl shadow-inner">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Report</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Generate comprehensive daily records</p>
          </div>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* From Date */}
            <div className="col-span-2 sm:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                <Calendar size={14} className="text-sky-500" /> From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* To Date */}
            <div className="col-span-2 sm:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                <Calendar size={14} className="text-sky-500" /> To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Class (Optional) */}
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                <Users size={14} className="text-emerald-500" /> Class <span className="text-slate-300 font-normal lowercase tracking-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="All Classes"
                value={classNumber}
                onChange={e => setClassNumber(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-emerald-400 focus:bg-white outline-none transition-all placeholder:text-slate-300 placeholder:font-medium"
              />
            </div>

            {/* Attendance Time (Optional) */}
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                <Clock size={14} className="text-amber-500" /> Time <span className="text-slate-300 font-normal lowercase tracking-normal">(Optional)</span>
              </label>
              <select
                value={attendanceTime}
                onChange={e => setAttendanceTime(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">All Times</option>
                <option value="Morning">Morning</option>
                <option value="Noon">Noon</option>
                <option value="Night">Night</option>
                <option value="Period">Period</option>
                <option value="Jamath">Jamath</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-xl text-sm font-bold">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            <button
              onClick={handleFetch}
              disabled={loading || !fromDate || !toDate}
              className="w-full sm:w-auto flex-1 bg-sky-500 hover:bg-sky-400 text-white font-black text-sm uppercase tracking-widest py-4 px-8 rounded-2xl shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Search size={18} /> Generate Report
            </button>

            <div className="flex gap-4 w-full sm:w-auto">
              {data.length > 0 && (
                <>
                  <button
                    onClick={handleDownloadExcel}
                    className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-widest py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet size={18} /> Excel
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 sm:flex-none bg-rose-500 hover:bg-rose-400 text-white font-black text-sm uppercase tracking-widest py-4 px-6 rounded-2xl shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/50 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> PDF
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Results Table & Loading State */}
        {loading ? (
          <div className="bg-white shadow-sm border border-slate-100 rounded-[2rem] overflow-hidden p-6 sm:p-8">
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-12 bg-slate-100/50 rounded-xl w-full mb-4"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-12 bg-slate-50 rounded-xl w-12 shrink-0"></div>
                  <div className="h-12 bg-slate-50 rounded-xl w-20 shrink-0"></div>
                  <div className="h-12 bg-slate-50 rounded-xl flex-1"></div>
                  <div className="h-12 bg-slate-50 rounded-xl w-16 shrink-0"></div>
                  <div className="h-12 bg-slate-50 rounded-xl w-full hidden sm:block"></div>
                </div>
              ))}
            </div>
          </div>
        ) : data.length > 0 ? (
          <div className="bg-white shadow-sm border border-slate-100 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto p-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="p-4 border-b-2 border-r-2 border-white rounded-tl-xl text-center">SL</th>
                    <th className="p-4 border-b-2 border-r-2 border-white">AD</th>
                    <th className="p-4 border-b-2 border-r-2 border-white min-w-[150px]">Name</th>
                    <th className="p-4 border-b-2 border-r-2 border-white text-center">Class</th>
                    
                    {usedDates.map(date => {
                      const slots = timeSlotsByDate[date] || [];
                      const periodNumbers = getPeriodNumbersForDate(date);
                      const hasPeriod = slots.includes('Period');
                      const totalCols = slots.length + (hasPeriod ? periodNumbers.length - 1 : 0) + 1;
                      
                      const dateObj = new Date(date);
                      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <th key={date} className="p-4 border-b-2 border-r-2 border-white text-center text-sky-600 bg-sky-50" colSpan={totalCols}>
                          {displayDate}
                        </th>
                      );
                    })}
                    
                    <th className="p-4 border-b-2 border-r-2 border-white text-center text-emerald-600 bg-emerald-50">Tot P</th>
                    <th className="p-4 border-b-2 border-white rounded-tr-xl text-center text-rose-600 bg-rose-50">Tot A</th>
                  </tr>
                  
                  {usedDates.length > 0 && (
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th colSpan={4} className="border-r-2 border-white bg-slate-50"></th>
                      {usedDates.map(date => {
                        const slots = timeSlotsByDate[date] || [];
                        const periodNumbers = getPeriodNumbersForDate(date);
                        const hasPeriod = slots.includes('Period');
                        
                        return (
                          <React.Fragment key={`${date}-sub`}>
                            {slots.map(timeSlot => {
                              if (timeSlot === 'Period' && hasPeriod) {
                                return (
                                  <React.Fragment key={timeSlot}>
                                    {periodNumbers.map(periodNum => (
                                      <th key={`${timeSlot}-${periodNum}`} className="p-2 border-r-2 border-white text-center">
                                        P{periodNum}
                                      </th>
                                    ))}
                                  </React.Fragment>
                                );
                              } else {
                                return (
                                  <th key={timeSlot} className="p-2 border-r-2 border-white text-center">
                                    {timeSlot.substring(0, 3)}
                                  </th>
                                );
                              }
                            })}
                            <th className="p-2 border-r-2 border-white text-center bg-sky-50 text-sky-600">Sum</th>
                          </React.Fragment>
                        );
                      })}
                      <th colSpan={2} className="bg-slate-50"></th>
                    </tr>
                  )}
                </thead>
                <tbody className="text-sm font-medium">
                  {data.map((r, i) => (
                    <tr key={`${r.ad}-${r.class}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 border-r-2 border-white text-center text-slate-400 font-bold text-xs">{i + 1}</td>
                      <td className="p-3 border-r-2 border-white text-slate-600 font-bold">{r.ad}</td>
                      <td className="p-3 border-r-2 border-white text-slate-800 font-bold">{r.nameOfStd}</td>
                      <td className="p-3 border-r-2 border-white text-center text-slate-600 font-bold bg-slate-50/50 rounded-lg">{r.class}</td>
                      
                      {usedDates.map(date => {
                        const day = r.dailyAttendance?.find(d => d.date === date);
                        let total = 0;
                        const slots = timeSlotsByDate[date] || [];
                        const periodNumbers = getPeriodNumbersForDate(date);
                        const hasPeriod = slots.includes('Period');
                        
                        slots.forEach(timeSlot => {
                          if (timeSlot === 'Period') {
                            total += Object.values(day?.Period || {}).filter(p => p === 'P').length;
                          } else {
                            total += (day?.[timeSlot] === 'P' ? 1 : 0);
                          }
                        });
                        
                        return (
                          <React.Fragment key={`${date}-data`}>
                            {slots.map(timeSlot => {
                              if (timeSlot === 'Period' && hasPeriod) {
                                return (
                                  <React.Fragment key={timeSlot}>
                                    {periodNumbers.map(periodNum => {
                                      const periodValue = day?.Period?.[periodNum] || '-';
                                      let bg = 'bg-slate-50 text-slate-400';
                                      if (periodValue === 'P') bg = 'bg-emerald-50 text-emerald-600 font-bold';
                                      if (periodValue === 'A') bg = 'bg-rose-50 text-rose-600 font-bold';
                                      
                                      return (
                                        <td 
                                          key={`${timeSlot}-${periodNum}`} 
                                          onClick={() => handleEntryClick(r, day, timeSlot, periodNum)}
                                          className={`p-2 border-r-2 border-white border-y-2 text-center text-xs ${bg} cursor-pointer hover:opacity-80 transition-opacity`}
                                        >
                                          {periodValue}
                                        </td>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              } else if (timeSlot !== 'Period') {
                                return (
                                  <td 
                                    key={timeSlot} 
                                    onClick={() => handleEntryClick(r, day, timeSlot)}
                                    className={`p-2 border-r-2 border-white border-y-2 text-center text-xs ${getCellBgClass(day, timeSlot)} cursor-pointer hover:opacity-80 transition-opacity`}
                                  >
                                    {day?.[timeSlot] || '-'}
                                  </td>
                                );
                              }
                              return null;
                            })}
                            <td className="p-2 border-r-2 border-white border-y-2 text-center font-bold text-sky-600 bg-sky-50/50">{total}</td>
                          </React.Fragment>
                        );
                      })}
                      
                      <td className="p-3 border-r-2 border-white text-center font-black text-emerald-600 bg-emerald-50/50 rounded-lg">{r.present}</td>
                      <td className="p-3 text-center font-black text-rose-600 bg-rose-50/50 rounded-lg">{r.absent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 border-dashed">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <p className="text-slate-400 font-bold tracking-wide">No records found for selected criteria.</p>
            <p className="text-sm text-slate-400 mt-2">Try adjusting dates or removing class filters.</p>
          </div>
        )}

      </div>

      {/* Detail Popup Modal */}
      {isModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !updating && setIsModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className={`p-6 flex items-center justify-between ${selectedEntry.status === 'Present' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedEntry.status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {selectedEntry.status === 'Present' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Attendance Detail</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedEntry.status === 'Present' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Currently {selectedEntry.status}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 rounded-2xl flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student Name</label>
                  <p className="font-bold text-slate-800">{selectedEntry.studentName}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">AD NO</label>
                  <p className="font-bold text-slate-800 uppercase">{selectedEntry.ad}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Class</label>
                  <p className="font-bold text-slate-800 uppercase">{selectedEntry.class}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date</label>
                  <p className="font-bold text-slate-800">{new Date(selectedEntry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Time Slot</label>
                  <p className="font-bold text-slate-800 uppercase">{selectedEntry.slot} {selectedEntry.periodNum ? `(P${selectedEntry.periodNum})` : ''}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 text-center">Change Attendance Status To</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={updating || selectedEntry.status === 'Present'}
                    onClick={() => handleStatusUpdate('Present')}
                    className={`p-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedEntry.status === 'Present' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                      : 'border-slate-100 bg-white text-slate-400 hover:border-emerald-400 hover:text-emerald-500'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedEntry.status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      P
                    </div>
                    Present
                  </button>
                  <button
                    disabled={updating || selectedEntry.status === 'Absent'}
                    onClick={() => handleStatusUpdate('Absent')}
                    className={`p-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedEntry.status === 'Absent' 
                      ? 'border-rose-500 bg-rose-50 text-rose-600' 
                      : 'border-slate-100 bg-white text-slate-400 hover:border-rose-400 hover:text-rose-500'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedEntry.status === 'Absent' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      A
                    </div>
                    Absent
                  </button>
                </div>
              </div>

            </div>

            {updating && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-sky-600 uppercase tracking-widest">Updating...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyReport;
