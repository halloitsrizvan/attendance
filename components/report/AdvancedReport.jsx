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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    Quiraath: { true: '1', false: '1', active: true },
    Minus: { active: true },
    Weekend: { true: '1/6', false: '1/6', active: true }
  });

  const [savedTemplates, setSavedTemplates] = useState([]);

  const handleMultiplierChange = (time, type, value) => {
    setMultipliers(prev => ({
      ...prev,
      [time]: {
        ...prev[time],
        [type]: value
      }
    }));
  };


  const manHeader = useMemo(() => {
    const active = [];
    if (multipliers['Morning']?.active) active.push('M');
    if (multipliers['Afternoon']?.active) active.push('A');
    if (multipliers['Night']?.active) active.push('N');
    return {
      main: 'Absence',
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

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get('/api/settings');
        if (res.data && res.data.deduction_templates) {
          setSavedTemplates(res.data.deduction_templates);
        }
      } catch (e) {
        console.error("Failed to load saved templates", e);
      }
    };
    fetchTemplates();
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
    if (Number.isInteger(num)) return num.toString();

    const integerPart = Math.floor(num);
    const decimalPart = num - integerPart;

    let bestDen = 1;
    let bestNum = 0;
    let minDiff = 1;

    for (let d = 2; d <= 12; d++) {
      const n = Math.round(decimalPart * d);
      const diff = Math.abs(decimalPart - n / d);
      if (diff < minDiff) {
        minDiff = diff;
        bestDen = d;
        bestNum = n;
      }
    }

    if (minDiff < 0.01) {
      if (bestNum === 0) {
        return integerPart.toString();
      }
      if (bestNum === bestDen) {
        return (integerPart + 1).toString();
      }

      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      const divisor = gcd(bestNum, bestDen);
      const finalNum = bestNum / divisor;
      const finalDen = bestDen / divisor;

      if (integerPart === 0) {
        return `${finalNum}/${finalDen}`;
      } else {
        return `${integerPart} ${finalNum}/${finalDen}`;
      }
    }

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
    let punishment_MAN = 0;
    let punishment_PJQ = 0;
    let documentedMedicalLeaveMinus = 0;
    let documentedOgeaLeaveMinus = 0;
    let documentedLeaveMinus = 0;

    // Morning, Afternoon, Night
    ['Morning', 'Afternoon', 'Night'].forEach(t => {
      if (multipliers[t]?.active) {
        const d = student.groupedAttendance[t];
        if (d) {
          const mTrue = evaluateMultiplier(multipliers[t].true);
          const mFalse = evaluateMultiplier(multipliers[t].false);
          const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : mTrue;
          const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : mFalse;

          // Regular weekday absences
          leave_MAN += (d.absentOnLeaveTrue || 0) * mTrue;
          leave_MAN += (d.absentOnLeaveFalse || 0) * mTrue;
          punishment_MAN += (d.absentOnLeaveFalse || 0) * mFalse;

          // Weekend absences
          leave_MAN += (d.weekendAbsentOnLeaveTrue || 0) * wkTrue;
          leave_MAN += (d.weekendAbsentOnLeaveFalse || 0) * wkTrue;
          punishment_MAN += (d.weekendAbsentOnLeaveFalse || 0) * wkFalse;

          // Documented Medical Leave minuses
          documentedMedicalLeaveMinus += (d.documentedMedicalAbsentOnLeaveTrue || 0) * mTrue;
          documentedMedicalLeaveMinus += (d.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

          // Documented OGEA Leave minuses
          documentedOgeaLeaveMinus += (d.documentedOgeaAbsentOnLeaveTrue || 0) * mTrue;
          documentedOgeaLeaveMinus += (d.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

          // Documented Leave minuses
          documentedLeaveMinus += (d.documentedAbsentOnLeaveTrue || 0) * mTrue;
          documentedLeaveMinus += (d.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
        }
      }
    });

    // Period
    if (multipliers['Period']?.active) {
      const periodData = student.groupedAttendance['Period'];
      if (periodData && periodData.periods) {
        const pTrue = evaluateMultiplier(multipliers['Period'].true);
        const pFalse = evaluateMultiplier(multipliers['Period'].false);
        const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : pTrue;
        const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : pFalse;

        Object.values(periodData.periods).forEach(p => {
          // Regular weekday absences
          absence_PJ += (p.absentOnLeaveTrue || 0) * pTrue;
          absence_PJ += (p.absentOnLeaveFalse || 0) * pTrue;
          punishment_PJQ += (p.absentOnLeaveFalse || 0) * pFalse;

          // Weekend absences
          absence_PJ += (p.weekendAbsentOnLeaveTrue || 0) * wkTrue;
          absence_PJ += (p.weekendAbsentOnLeaveFalse || 0) * wkTrue;
          punishment_PJQ += (p.weekendAbsentOnLeaveFalse || 0) * wkFalse;

          // Documented Medical Leave minuses
          documentedMedicalLeaveMinus += (p.documentedMedicalAbsentOnLeaveTrue || 0) * pTrue;
          documentedMedicalLeaveMinus += (p.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

          // Documented OGEA Leave minuses
          documentedOgeaLeaveMinus += (p.documentedOgeaAbsentOnLeaveTrue || 0) * pTrue;
          documentedOgeaLeaveMinus += (p.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

          // Documented Leave minuses
          documentedLeaveMinus += (p.documentedAbsentOnLeaveTrue || 0) * pTrue;
          documentedLeaveMinus += (p.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
        });
      }
    }

    // Jamath
    if (multipliers['Jamath']?.active) {
      const jamathData = student.groupedAttendance['Jamath'];
      if (jamathData) {
        const jTrue = evaluateMultiplier(multipliers['Jamath'].true);
        const jFalse = evaluateMultiplier(multipliers['Jamath'].false);
        const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : jTrue;
        const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : jFalse;

        // Regular weekday absences
        absence_PJ += (jamathData.absentOnLeaveTrue || 0) * jTrue;
        absence_PJ += (jamathData.absentOnLeaveFalse || 0) * jTrue;
        punishment_PJQ += (jamathData.absentOnLeaveFalse || 0) * jFalse;

        // Weekend absences
        absence_PJ += (jamathData.weekendAbsentOnLeaveTrue || 0) * wkTrue;
        absence_PJ += (jamathData.weekendAbsentOnLeaveFalse || 0) * wkTrue;
        punishment_PJQ += (jamathData.weekendAbsentOnLeaveFalse || 0) * wkFalse;

        // Documented Medical Leave minuses
        documentedMedicalLeaveMinus += (jamathData.documentedMedicalAbsentOnLeaveTrue || 0) * jTrue;
        documentedMedicalLeaveMinus += (jamathData.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

        // Documented OGEA Leave minuses
        documentedOgeaLeaveMinus += (jamathData.documentedOgeaAbsentOnLeaveTrue || 0) * jTrue;
        documentedOgeaLeaveMinus += (jamathData.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

        // Documented Leave minuses
        documentedLeaveMinus += (jamathData.documentedAbsentOnLeaveTrue || 0) * jTrue;
        documentedLeaveMinus += (jamathData.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
      }
    }

    // Quiraath
    if (multipliers['Quiraath']?.active) {
      const quiraathData = student.groupedAttendance['Quiraath'];
      if (quiraathData) {
        const qTrue = evaluateMultiplier(multipliers['Quiraath'].true);
        const qFalse = evaluateMultiplier(multipliers['Quiraath'].false);
        const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : qTrue;
        const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : qFalse;

        // Regular weekday absences
        absence_PJ += (quiraathData.absentOnLeaveTrue || 0) * qTrue;
        absence_PJ += (quiraathData.absentOnLeaveFalse || 0) * qTrue;
        punishment_PJQ += (quiraathData.absentOnLeaveFalse || 0) * qFalse;

        // Weekend absences
        absence_PJ += (quiraathData.weekendAbsentOnLeaveTrue || 0) * wkTrue;
        absence_PJ += (quiraathData.weekendAbsentOnLeaveFalse || 0) * wkTrue;
        punishment_PJQ += (quiraathData.weekendAbsentOnLeaveFalse || 0) * wkFalse;

        // Documented Medical Leave minuses
        documentedMedicalLeaveMinus += (quiraathData.documentedMedicalAbsentOnLeaveTrue || 0) * qTrue;
        documentedMedicalLeaveMinus += (quiraathData.weekendDocumentedMedicalAbsentOnLeaveTrue || 0) * wkTrue;

        // Documented OGEA Leave minuses
        documentedOgeaLeaveMinus += (quiraathData.documentedOgeaAbsentOnLeaveTrue || 0) * qTrue;
        documentedOgeaLeaveMinus += (quiraathData.weekendDocumentedOgeaAbsentOnLeaveTrue || 0) * wkTrue;

        // Documented Leave minuses
        documentedLeaveMinus += (quiraathData.documentedAbsentOnLeaveTrue || 0) * qTrue;
        documentedLeaveMinus += (quiraathData.weekendDocumentedAbsentOnLeaveTrue || 0) * wkTrue;
      }
    }

    const c = parseInt(student.class, 10);
    let permitted = 0;
    if (!isNaN(c)) {
      if (c >= 1 && c <= 5) permitted = 6;
      else if (c === 6 || c === 7) permitted = 7;
      else if (c >= 8 && c <= 10) permitted = 8;
    }

    const minus = multipliers['Minus']?.active ? (student.totalManualMinus || 0) : 0;
    const totalAbsence = leave_MAN + punishment_MAN + punishment_PJQ + minus;
    const overBy = Math.max(0, totalAbsence - permitted);

    return {
      sl: student.SL,
      adno: student.ad,
      name: student.nameOfStd,
      class: student.class,
      permitted,
      leave: leave_MAN,
      absence: absence_PJ,
      punishment_MAN,
      punishment_PJQ,
      minus,
      totalAbsence,
      medicalLeave: documentedMedicalLeaveMinus,
      ogeaLeave: documentedOgeaLeaveMinus,
      documentedLeave: documentedLeaveMinus,
      zehnuthPoints: student.totalZehnuthPoints || 0,
      overBy,
      srfAmount: overBy * 100
    };
  };

  // Re-calculate data if multipliers change even without fetching
  const reportData = useMemo(() => {
    let mappedData = data.map(calculateStudentRow);
    
    if (!classNumber) {
      mappedData.sort((a, b) => {
        const classA = parseInt(a.class, 10) || 0;
        const classB = parseInt(b.class, 10) || 0;
        if (classA !== classB) {
          return classA - classB;
        }
        return (a.sl || 0) - (b.sl || 0);
      });
    } else {
      mappedData.sort((a, b) => (a.sl || 0) - (b.sl || 0));
    }
    
    return mappedData;
  }, [data, multipliers, classNumber]);

  const handleDownloadExcel = () => {
    const formatExcelNum = (num) => {
      return formatNum(num);
    };

    const wsData = reportData.map(r => ({
      'SL': r.sl,
      'AD NO': r.adno,
      'Name': r.name,
      'Class': r.class,
      [`Absence ${manHeader.sub}`.trim()]: formatExcelNum(r.leave),
      [`Absence ${pjqHeader.sub}`.trim()]: formatExcelNum(r.absence),
      [`Unapproved Absence Deduction ${manHeader.sub}`.trim()]: formatExcelNum(r.punishment_MAN),
      [`Unapproved Absence Deduction ${pjqHeader.sub}`.trim()]: formatExcelNum(r.punishment_PJQ),
      'Minus': formatExcelNum(r.minus),
      'Total Absence': formatExcelNum(r.totalAbsence),
      'Medical Leave': formatExcelNum(r.medicalLeave),
      'Other Documented Leave': formatExcelNum(r.ogeaLeave),
      'Documented Leave': formatExcelNum(r.documentedLeave),
      'Total Permitted Leave': formatExcelNum(r.permitted),
      'Over By': formatExcelNum(r.overBy),
      // 'SRF Amount': r.srfAmount > 0 ? r.srfAmount.toFixed(1) : '0'
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deduction Report');
    XLSX.writeFile(wb, `Deduction_Report_${classNumber || 'All'}_${fromDate}.xlsx`);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
    
    // Header title
    doc.setFontSize(16);
    doc.text("Deduction Report", 14, 15);
    
    // Header subtitle
    doc.setFontSize(9);
    doc.text(`Class: ${classNumber || 'All'}  |  Date Range: ${fromDate} to ${toDate}`, 14, 21);
    
    const headers = [
      'SL',
      'AD NO',
      'Name',
      'Class',
      `Absence\n${manHeader.sub}`.trim(),
      `Absence\n${pjqHeader.sub}`.trim(),
      `Unapproved Ded.\n${manHeader.sub}`.trim(),
      `Unapproved Ded.\n${pjqHeader.sub}`.trim(),
      'Minus',
      'Total Abs.',
      'Doc. Med.',
      'Other Doc.',
      'Total Doc.',
      'Permitted',
      'Over By'
    ];

    const tableData = reportData.map((r, idx) => [
      idx + 1,
      r.adno,
      r.name,
      r.class,
      formatNum(r.leave),
      formatNum(r.absence),
      formatNum(r.punishment_MAN),
      formatNum(r.punishment_PJQ),
      formatNum(r.minus),
      formatNum(r.totalAbsence),
      formatNum(r.medicalLeave),
      formatNum(r.ogeaLeave),
      formatNum(r.documentedLeave),
      formatNum(r.permitted),
      r.overBy > 0 ? formatNum(r.overBy) : '-'
    ]);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 26,
      styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
      columnStyles: {
        2: { halign: 'left', cellWidth: 'auto' }, // Student Name column left aligned
      },
      headStyles: { fillColor: [15, 23, 42] } // dark slate theme matching report table
    });

    doc.save(`Deduction_Report_${classNumber || 'All'}_${fromDate}.pdf`);
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
                {savedTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMultipliers(prev => ({
                        ...prev,
                        ...tpl.multipliers
                      }));
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors active:scale-95"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[200px_1fr_1.5fr] gap-6 mb-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  <div>Time / Session</div>
                  <div>Absence Minus Count</div>
                  <div>Additional Minus for Unapproved Absence</div>
                </div>
                <div className="space-y-3">
                  {['Morning', 'Afternoon', 'Night', 'Period', 'Jamath', 'Quiraath', 'Minus', 'Weekend'].map(time => {
                    if (time === 'Minus') {
                      return (
                        <div key={time} className={`grid grid-cols-[200px_1fr_1.5fr] gap-6 items-center transition-opacity ${!multipliers[time]?.active ? 'opacity-50 grayscale' : ''}`}>
                          <label className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider px-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={multipliers[time]?.active || false}
                              onChange={e => handleMultiplierChange(time, 'active', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                             Minus
                          </label>
                          <div className="col-span-2 text-xs text-slate-400 font-bold italic px-3 py-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            Include manually logged minus points.
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={time} className={`grid grid-cols-[200px_1fr_1.5fr] gap-6 items-center transition-opacity ${!multipliers[time]?.active ? 'opacity-50 grayscale' : ''}`}>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider px-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={multipliers[time]?.active || false}
                            onChange={e => handleMultiplierChange(time, 'active', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                          {time === 'Weekend' ? 'Weekend Days' : time}
                        </label>
                        <div className="relative">
                          <MinusIcon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${!multipliers[time]?.active ? 'text-slate-400' : 'text-emerald-500'}`} />
                          <input
                            type="text"
                            placeholder="0"
                            disabled={!multipliers[time]?.active}
                            value={multipliers[time]?.true || ''}
                            onChange={e => handleMultiplierChange(time, 'true', e.target.value)}
                            className={`w-full border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-700 focus:border-emerald-400 outline-none transition-colors ${!multipliers[time]?.active ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                          />
                        </div>
                        <div className="relative">
                          <MinusIcon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${!multipliers[time]?.active ? 'text-slate-400' : 'text-rose-500'}`} />
                          <input
                            type="text"
                            placeholder="0"
                            disabled={!multipliers[time]?.active}
                            value={multipliers[time]?.false || ''}
                            onChange={e => handleMultiplierChange(time, 'false', e.target.value)}
                            className={`w-full border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-700 focus:border-rose-400 outline-none transition-colors ${!multipliers[time]?.active ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
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
              className="w-full sm:w-auto flex-1 md:flex-none md:w-64 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest py-4 px-8 rounded-2xl  transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Search size={20} />
              )}
              Generate
            </button>

            {reportData.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={handleDownloadExcel}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-widest py-4 px-8 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet size={20} /> Export Excel
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-white font-black text-sm uppercase tracking-widest py-4 px-8 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileText size={20} /> Export PDF
                </button>
              </div>
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
                    <th className="p-4 border-r border-white text-center bg-amber-50/50 text-amber-600">
                      {manHeader.main}{manHeader.sub && <><br />{manHeader.sub}</>}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-orange-50/50 text-orange-600">
                      {pjqHeader.main}{pjqHeader.sub && <><br />{pjqHeader.sub}</>}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-purple-50/50 text-purple-600">
                      Unapproved Absence<br />Deduction{manHeader.sub && <><br />{manHeader.sub}</>}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-purple-50/50 text-purple-600">
                      Unapproved Absence<br />Deduction{pjqHeader.sub && <><br />{pjqHeader.sub}</>}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-rose-50/50 text-rose-600">Minus</th>
                    <th className="p-4 border-r border-white text-center bg-slate-100 text-slate-800">Total Absence</th>
                    <th className="p-4 border-r border-white text-center bg-emerald-50/50 text-emerald-600">Documented<br />Medical Leave</th>
                    <th className="p-4 border-r border-white text-center bg-indigo-50/50 text-indigo-600">Other<br />Documented Leave</th>
                    <th className="p-4 border-r border-white text-center bg-teal-50/50 text-teal-600">Total<br />Documented</th>
                    <th className="p-4 border-r border-white text-center bg-blue-50/50 text-blue-600">Total Permitted<br />Leave</th>
                    <th className="p-4 border-r border-white text-center bg-red-100 text-red-600">Over By</th>
                    {/* <th className="p-4 text-center bg-red-200 text-red-700">SRF Amount</th> */}
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {reportData.map((row, idx) => (
                    <tr key={row.adno} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="p-3 border-r border-white text-center text-slate-400 font-semibold text-xs">{idx + 1}</td>
                      <td className="p-3 border-r border-white text-slate-600 font-bold">{row.adno}</td>
                      <td className="p-3 border-r border-white text-slate-800 font-bold truncate max-w-[200px]" title={row.name}>{row.name}</td>
                      <td className="p-3 border-r border-white text-center">
                        <span className="px-2 py-1 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold">{row.class}</span>
                      </td>
                      <td className="p-3 border-r border-white text-center font-semibold text-amber-600 bg-amber-50/20">{formatNum(row.leave)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-orange-600 bg-orange-50/20">{formatNum(row.absence)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-purple-600 bg-purple-50/20">{formatNum(row.punishment_MAN)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-purple-600 bg-purple-50/20">{formatNum(row.punishment_PJQ)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-rose-600 bg-rose-50/20">{formatNum(row.minus)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-slate-800 bg-slate-50">{formatNum(row.totalAbsence)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-emerald-600 bg-emerald-50/20">{formatNum(row.medicalLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-indigo-600 bg-indigo-50/20">{formatNum(row.ogeaLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-teal-600 bg-teal-50/20">{formatNum(row.documentedLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-blue-600 bg-blue-50/20">{row.permitted}</td>
                      <td className={`p-3 border-r border-white text-center font-semibold ${row.overBy > 0 ? 'text-red-600 bg-red-50/50' : 'text-slate-300'}`}>
                        {row.overBy > 0 ? formatNum(row.overBy) : '-'}
                      </td>
                      {/* <td className={`p-3 text-center font-semibold ${row.srfAmount > 0 ? 'text-red-600 bg-red-50/50' : 'text-slate-300'}`}>
                        {row.srfAmount > 0 ? row.srfAmount.toFixed(1) : '-'}
                      </td> */}
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
