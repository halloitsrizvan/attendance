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
  MinusIcon,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Filter,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function AdvancedReport() {
  const [fromDate, setFromDate] = useState('2026-08-30');
  const [toDate, setToDate] = useState('');
  const [classNumber, setClassNumber] = useState('');

  // Discrepancy Modal States
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [fetchingDiscrepancies, setFetchingDiscrepancies] = useState(false);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [selectedDiscrepancyIds, setSelectedDiscrepancyIds] = useState(new Set());
  const [discrepancySearch, setDiscrepancySearch] = useState('');
  const [discrepancyClassFilter, setDiscrepancyClassFilter] = useState('');
  const [fixingDiscrepancies, setFixingDiscrepancies] = useState(false);
  const [discrepancyMessage, setDiscrepancyMessage] = useState(null);

  // Multipliers
  const [multipliers, setMultipliers] = useState({
    Morning: { true: '1', false: '1', late: '0', active: true },
    Afternoon: { true: '1', false: '1', late: '0', active: true },
    Night: { true: '1', false: '1', late: '0', active: true },
    Period: { true: '1', false: '1', late: '0', active: true },
    Jamath: { true: '1', false: '1', late: '0', active: true },
    Quiraath: { true: '1', false: '1', late: '0', active: true },
    Minus: { active: true },
    Weekend: { true: '1/6', false: '1/6', late: '0', active: true }
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
  setToDate(new Date().toISOString().split("T")[0]);
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
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      return !isNaN(num) && !isNaN(den) && den !== 0 ? num / den : 0;
    }
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  };

  const format12Hour = (timeStr) => {
    if (!timeStr) return '';
    const str = String(timeStr).trim();
    if (str.toLowerCase().includes('am') || str.toLowerCase().includes('pm')) return str;
    const parts = str.split(':');
    if (parts.length < 2) return str;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');
    if (isNaN(hours)) return str;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Handler to fetch unregistered leaves discrepancies
  const handleFetchDiscrepancies = async () => {
    setFetchingDiscrepancies(true);
    setDiscrepancyMessage(null);
    try {
      const res = await axios.get('/api/report/unregistered-leaves');
      const items = res.data?.discrepancies || [];
      setDiscrepancies(items);
      setSelectedDiscrepancyIds(new Set(items.map(d => d.attendanceId)));
      setShowDiscrepancyModal(true);
    } catch (err) {
      console.error("Failed to fetch unregistered leaves:", err);
      alert(err.response?.data?.error || "Failed to fetch unregistered leaves discrepancy data");
    } finally {
      setFetchingDiscrepancies(false);
    }
  };

  const handleFixSelected = async (idsToFix) => {
    const targetIds = Array.isArray(idsToFix) ? idsToFix : Array.from(selectedDiscrepancyIds);
    if (!targetIds.length) return;

    setFixingDiscrepancies(true);
    setDiscrepancyMessage(null);
    try {
      const res = await axios.patch('/api/report/unregistered-leaves', {
        attendanceIds: targetIds
      });

      setDiscrepancyMessage({
        type: 'success',
        text: res.data?.message || `Successfully marked ${targetIds.length} attendance(s) as on-leave!`
      });

      // Remove fixed items from current discrepancies list
      const fixedSet = new Set(targetIds);
      setDiscrepancies(prev => prev.filter(d => !fixedSet.has(d.attendanceId)));
      setSelectedDiscrepancyIds(prev => {
        const next = new Set(prev);
        targetIds.forEach(id => next.delete(id));
        return next;
      });
    } catch (err) {
      console.error("Failed to fix attendance records:", err);
      setDiscrepancyMessage({
        type: 'error',
        text: err.response?.data?.error || "Failed to update attendance records"
      });
    } finally {
      setFixingDiscrepancies(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDiscrepancyIds.size === filteredDiscrepancies.length) {
      setSelectedDiscrepancyIds(new Set());
    } else {
      setSelectedDiscrepancyIds(new Set(filteredDiscrepancies.map(d => d.attendanceId)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedDiscrepancyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredDiscrepancies = useMemo(() => {
    return discrepancies.filter(d => {
      const query = discrepancySearch.toLowerCase();
      const matchesSearch = !discrepancySearch || 
        d.student?.name?.toLowerCase().includes(query) ||
        String(d.student?.ADNO || '').toLowerCase().includes(query) ||
        String(d.matchedLeave?.reason || '').toLowerCase().includes(query) ||
        String(d.sessionType || '').toLowerCase().includes(query);

      const matchesClass = !discrepancyClassFilter || 
        String(d.student?.class || '') === String(discrepancyClassFilter);

      return matchesSearch && matchesClass;
    });
  }, [discrepancies, discrepancySearch, discrepancyClassFilter]);

  const uniqueClassesInDiscrepancies = useMemo(() => {
    const set = new Set();
    discrepancies.forEach(d => {
      if (d.student?.class) set.add(d.student.class);
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [discrepancies]);

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
          const mLate = evaluateMultiplier(multipliers[t].late || '0');
          const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : mTrue;
          const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : mFalse;
          const wkLate = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].late || '0') : mLate;

          // Regular weekday absences
          leave_MAN += (d.absentOnLeaveTrue || 0) * mTrue;
          leave_MAN += (d.absentOnLeaveFalse || 0) * mTrue;
          punishment_MAN += (d.absentOnLeaveFalse || 0) * mFalse;
          punishment_MAN += (d.lateAbsentOnLeaveTrue || 0) * mLate;

          // Weekend absences
          leave_MAN += (d.weekendAbsentOnLeaveTrue || 0) * wkTrue;
          leave_MAN += (d.weekendAbsentOnLeaveFalse || 0) * wkTrue;
          punishment_MAN += (d.weekendAbsentOnLeaveFalse || 0) * wkFalse;
          punishment_MAN += (d.weekendLateAbsentOnLeaveTrue || 0) * wkLate;

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
        const pLate = evaluateMultiplier(multipliers['Period'].late || '0');
        const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : pTrue;
        const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : pFalse;
        const wkLate = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].late || '0') : pLate;

        Object.values(periodData.periods).forEach(p => {
          // Regular weekday absences
          absence_PJ += (p.absentOnLeaveTrue || 0) * pTrue;
          absence_PJ += (p.absentOnLeaveFalse || 0) * pTrue;
          punishment_PJQ += (p.absentOnLeaveFalse || 0) * pFalse;
          punishment_PJQ += (p.lateAbsentOnLeaveTrue || 0) * pLate;

          // Weekend absences
          absence_PJ += (p.weekendAbsentOnLeaveTrue || 0) * wkTrue;
          absence_PJ += (p.weekendAbsentOnLeaveFalse || 0) * wkTrue;
          punishment_PJQ += (p.weekendAbsentOnLeaveFalse || 0) * wkFalse;
          punishment_PJQ += (p.weekendLateAbsentOnLeaveTrue || 0) * wkLate;

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
        const jLate = evaluateMultiplier(multipliers['Jamath'].late || '0');
        const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : jTrue;
        const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : jFalse;
        const wkLate = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].late || '0') : jLate;

        // Regular weekday absences
        absence_PJ += (jamathData.absentOnLeaveTrue || 0) * jTrue;
        absence_PJ += (jamathData.absentOnLeaveFalse || 0) * jTrue;
        punishment_PJQ += (jamathData.absentOnLeaveFalse || 0) * jFalse;
        punishment_PJQ += (jamathData.lateAbsentOnLeaveTrue || 0) * jLate;

        // Weekend absences
        absence_PJ += (jamathData.weekendAbsentOnLeaveTrue || 0) * wkTrue;
        absence_PJ += (jamathData.weekendAbsentOnLeaveFalse || 0) * wkTrue;
        punishment_PJQ += (jamathData.weekendAbsentOnLeaveFalse || 0) * wkFalse;
        punishment_PJQ += (jamathData.weekendLateAbsentOnLeaveTrue || 0) * wkLate;

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
        const qLate = evaluateMultiplier(multipliers['Quiraath'].late || '0');
        const wkTrue = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].true) : qTrue;
        const wkFalse = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].false) : qFalse;
        const wkLate = multipliers['Weekend']?.active ? evaluateMultiplier(multipliers['Weekend'].late || '0') : qLate;

        // Regular weekday absences
        absence_PJ += (quiraathData.absentOnLeaveTrue || 0) * qTrue;
        absence_PJ += (quiraathData.absentOnLeaveFalse || 0) * qTrue;
        punishment_PJQ += (quiraathData.absentOnLeaveFalse || 0) * qFalse;
        punishment_PJQ += (quiraathData.lateAbsentOnLeaveTrue || 0) * qLate;

        // Weekend absences
        absence_PJ += (quiraathData.weekendAbsentOnLeaveTrue || 0) * wkTrue;
        absence_PJ += (quiraathData.weekendAbsentOnLeaveFalse || 0) * wkTrue;
        punishment_PJQ += (quiraathData.weekendAbsentOnLeaveFalse || 0) * wkFalse;
        punishment_PJQ += (quiraathData.weekendLateAbsentOnLeaveTrue || 0) * wkLate;

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
    const netAbsence = totalAbsence - documentedLeaveMinus;
    // NEW FORMULA
    const overBy = Math.max(0, netAbsence - permitted);
    
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
  netAbsence,
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
      [`Absence ${manHeader.sub}`.trim() + '*']: formatExcelNum(r.leave),
      [`Unapproved Absence Deduction ${manHeader.sub}`.trim() + '*']: formatExcelNum(r.punishment_MAN),
      [`Unapproved Absence Deduction ${pjqHeader.sub}`.trim() + '*']: formatExcelNum(r.punishment_PJQ),
      'Minus*': formatExcelNum(r.minus),
      'Total Absence': formatExcelNum(r.totalAbsence),
      'Medical Leave': formatExcelNum(r.medicalLeave),
      'Other Documented Leave': formatExcelNum(r.ogeaLeave),
      'Documented Leave': formatExcelNum(r.documentedLeave),
      'Total Absence - Documented Leave': formatExcelNum(r.netAbsence),
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
      `Absence\n${manHeader.sub}`.trim() + '*',
      `Unapproved Ded.\n${manHeader.sub}`.trim() + '*',
      `Unapproved Ded.\n${pjqHeader.sub}`.trim() + '*',
      'Minus*',
      'Total Abs.',
      'Doc. Med.',
      'Other Doc.',
      'Total Doc.',
      'Net Abs.',
      'Permitted',
      'Over By'
    ];

    const tableData = reportData.map((r, idx) => [
      idx + 1,
      r.adno,
      r.name,
      r.class,
      formatNum(r.leave),
      formatNum(r.punishment_MAN),
      formatNum(r.punishment_PJQ),
      formatNum(r.minus),
      formatNum(r.totalAbsence),
      formatNum(r.medicalLeave),
      formatNum(r.ogeaLeave),
      formatNum(r.documentedLeave),
      formatNum(r.netAbsence),
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

          {/* Top Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleFetchDiscrepancies}
              disabled={fetchingDiscrepancies}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              title="Fetch all onLeave:false attendances marked while student was on approved leave"
            >
              <RefreshCw size={16} className={fetchingDiscrepancies ? "animate-spin" : ""} />
              <span>{fetchingDiscrepancies ? "Fetching..." : "Fetch"}</span>
            </button>
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
                      if (!tpl?.multipliers) return;
                      setMultipliers(prev => {
                        const next = { ...prev };
                        Object.keys(tpl.multipliers).forEach(k => {
                          if (k === 'Minus') {
                            next.Minus = { ...tpl.multipliers.Minus };
                          } else if (tpl.multipliers[k]) {
                            next[k] = {
                              true: tpl.multipliers[k].true ?? '0',
                              false: tpl.multipliers[k].false ?? '0',
                              late: tpl.multipliers[k].late ?? '0',
                              active: tpl.multipliers[k].active ?? true
                            };
                          }
                        });
                        return next;
                      });
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors active:scale-95 cursor-pointer"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <div className="min-w-[750px]">
                <div className="grid grid-cols-[160px_1fr_1.2fr_1.2fr] gap-4 mb-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  <div>Time / Session</div>
                  <div>Absence Minus Count</div>
                  <div>Additional Minus for Unapproved Absence</div>
                  <div>Additional Minus for Late</div>
                </div>
                <div className="space-y-3">
                  {['Morning', 'Afternoon', 'Night', 'Period', 'Jamath', 'Quiraath', 'Minus', 'Weekend'].map(time => {
                    if (time === 'Minus') {
                      return (
                        <div key={time} className={`grid grid-cols-[160px_1fr_1.2fr_1.2fr] gap-4 items-center transition-opacity ${!multipliers[time]?.active ? 'opacity-50 grayscale' : ''}`}>
                          <label className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider px-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={multipliers[time]?.active || false}
                              onChange={e => handleMultiplierChange(time, 'active', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                             Minus
                          </label>
                          <div className="col-span-3 text-xs text-slate-400 font-bold italic px-3 py-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            Include manually logged minus points.
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={time} className={`grid grid-cols-[160px_1fr_1.2fr_1.2fr] gap-4 items-center transition-opacity ${!multipliers[time]?.active ? 'opacity-50 grayscale' : ''}`}>
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
                            value={multipliers[time]?.true ?? ''}
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
                            value={multipliers[time]?.false ?? ''}
                            onChange={e => handleMultiplierChange(time, 'false', e.target.value)}
                            className={`w-full border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-700 focus:border-rose-400 outline-none transition-colors ${!multipliers[time]?.active ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
                          />
                        </div>
                        <div className="relative">
                          <MinusIcon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${!multipliers[time]?.active ? 'text-slate-400' : 'text-amber-500'}`} />
                          <input
                            type="text"
                            placeholder="0"
                            disabled={!multipliers[time]?.active}
                            value={multipliers[time]?.late ?? ''}
                            onChange={e => handleMultiplierChange(time, 'late', e.target.value)}
                            className={`w-full border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 outline-none transition-colors ${!multipliers[time]?.active ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}
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
                      {manHeader.main}{manHeader.sub ? <><br />{manHeader.sub}*</> : '*'}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-purple-50/50 text-purple-600">
                      Unapproved Absence<br />Deduction{manHeader.sub ? <><br />{manHeader.sub}*</> : '*'}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-purple-50/50 text-purple-600">
                      Unapproved Absence<br />Deduction{pjqHeader.sub ? <><br />{pjqHeader.sub}*</> : '*'}
                    </th>
                    <th className="p-4 border-r border-white text-center bg-rose-50/50 text-rose-600">Minus*</th>
                    <th className="p-4 border-r border-white text-center bg-slate-100 text-slate-800">Total Absence</th>
                    <th className="p-4 border-r border-white text-center bg-emerald-50/50 text-emerald-600">Documented<br />Medical Leave</th>
                    <th className="p-4 border-r border-white text-center bg-indigo-50/50 text-indigo-600">Other<br />Documented Leave</th>
                    <th className="p-4 border-r border-white text-center bg-teal-50/50 text-teal-600">Total<br />Documented</th>
                    <th className="p-4 border-r border-white text-center bg-slate-100 text-slate-800">Total Absence -<br />Documented Leave</th>
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
                      <td className="p-3 border-r border-white text-center font-semibold text-purple-600 bg-purple-50/20">{formatNum(row.punishment_MAN)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-purple-600 bg-purple-50/20">{formatNum(row.punishment_PJQ)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-rose-600 bg-rose-50/20">{formatNum(row.minus)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-slate-800 bg-slate-50">{formatNum(row.totalAbsence)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-emerald-600 bg-emerald-50/20">{formatNum(row.medicalLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-indigo-600 bg-indigo-50/20">{formatNum(row.ogeaLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-teal-600 bg-teal-50/20">{formatNum(row.documentedLeave)}</td>
                      <td className="p-3 border-r border-white text-center font-semibold text-slate-800 bg-slate-50">{formatNum(row.netAbsence)}</td>
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

      {/* Discrepancies Popup Modal */}
      {showDiscrepancyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight">Unregistered Leave Discrepancies</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {discrepancies.length} Discrepanc{discrepancies.length === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Attendances marked with <span className="text-rose-400 font-semibold">onLeave: false</span> while the student was on approved leave in this current semester.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiscrepancyModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification / Feedback Banner */}
            {discrepancyMessage && (
              <div className={`p-4 text-xs font-bold flex items-center justify-between ${
                discrepancyMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' 
                  : 'bg-rose-50 text-rose-800 border-b border-rose-100'
              }`}>
                <div className="flex items-center gap-2">
                  {discrepancyMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{discrepancyMessage.text}</span>
                </div>
                <button 
                  onClick={() => setDiscrepancyMessage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Filters and Actions Bar */}
            <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student, ADNO, reason..."
                    value={discrepancySearch}
                    onChange={e => setDiscrepancySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>

                {uniqueClassesInDiscrepancies.length > 0 && (
                  <select
                    value={discrepancyClassFilter}
                    onChange={e => setDiscrepancyClassFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 shadow-sm"
                  >
                    <option value="">All Classes</option>
                    {uniqueClassesInDiscrepancies.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleFetchDiscrepancies}
                  disabled={fetchingDiscrepancies}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Reload discrepancies"
                >
                  <RefreshCw size={13} className={fetchingDiscrepancies ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>

              {filteredDiscrepancies.length > 0 && (
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={toggleSelectAll}
                    className="px-3 py-2 bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    {selectedDiscrepancyIds.size === filteredDiscrepancies.length ? "Deselect All" : "Select All"}
                  </button>

                  <button
                    onClick={() => handleFixSelected()}
                    disabled={selectedDiscrepancyIds.size === 0 || fixingDiscrepancies}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck size={15} />
                    <span>
                      {fixingDiscrepancies 
                        ? "Fixing..." 
                        : `Mark ${selectedDiscrepancyIds.size} as On-Leave`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Content / Discrepancy Records List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredDiscrepancies.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-base font-black text-slate-800">
                    {discrepancies.length === 0 ? "All Clear! No Discrepancies Found" : "No Discrepancies Match Search"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {discrepancies.length === 0
                      ? "All attendance records with standard absence correctly reflect whether students were on approved leave."
                      : "Try clearing your search query or class filter to view other discrepancy records."}
                  </p>
                </div>
              ) : (
                filteredDiscrepancies.map((item) => {
                  const isSelected = selectedDiscrepancyIds.has(item.attendanceId);
                  const isShortLeave = item.matchedLeave?.type === 'ClassExcusedPass';

                  return (
                    <div
                      key={item.attendanceId}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-amber-50/40 border-amber-300 shadow-sm' 
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Checkbox and Student Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.attendanceId)}
                            className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-800 text-sm">{item.student?.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                AD: {item.student?.ADNO}
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200">
                                Class {item.student?.class}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                isShortLeave 
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                {isShortLeave ? 'Class Excused Pass' : 'Standard Leave'}
                              </span>
                            </div>

                            {/* Details Comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                              {/* Attendance Session Info */}
                              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                                  <Clock size={13} /> Marked Absence Record
                                </div>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="font-black text-slate-800 text-xs">
                                    {item.attendanceDate} • <span className="text-indigo-600">{item.sessionType}</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                    {item.sessionRange || (item.fromTime && item.toTime ? `${format12Hour(item.fromTime)} – ${format12Hour(item.toTime)}` : '')}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5 border-t border-slate-100">
                                  <span>By: <strong className="text-slate-700 font-semibold">{item.teacherName}</strong></span>
                                  {item.recordedAt && (
                                    <span className="text-slate-400 text-[10px]">Taken at {item.recordedAt}</span>
                                  )}
                                </div>
                              </div>

                              {/* Approved Leave Info */}
                              <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                                <div className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                                  <ShieldCheck size={13} /> Active Approved Leave
                                </div>
                                <div className="font-black text-slate-800 text-xs truncate">
                                  <span className="text-slate-500 font-normal">Reason: </span>
                                  <span className="text-amber-950 font-bold">{item.matchedLeave?.reason || 'Leave'}</span>
                                  {item.matchedLeave?.disease && <span className="text-slate-500 font-medium"> ({item.matchedLeave.disease})</span>}
                                  {item.matchedLeave?.program && <span className="text-slate-500 font-medium"> ({item.matchedLeave.program})</span>}
                                </div>
                                <div className="text-[11px] text-slate-600 flex items-center justify-between pt-0.5 border-t border-amber-100/60 flex-wrap gap-1">
                                  <span>
                                    {item.matchedLeave?.fromDate} ({item.matchedLeave?.fromTimeFormatted || format12Hour(item.matchedLeave?.fromTime)}) → {item.matchedLeave?.toDate} ({item.matchedLeave?.toTimeFormatted || format12Hour(item.matchedLeave?.toTime)})
                                  </span>
                                  {item.matchedLeave?.returnedAt && (
                                    <span className="text-emerald-700 font-black text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      Returned: {new Date(item.matchedLeave.returnedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Row Action */}
                        <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                          <button
                            onClick={() => handleFixSelected([item.attendanceId])}
                            disabled={fixingDiscrepancies}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black rounded-xl transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            title="Mark this specific attendance record as onLeave: true"
                          >
                            <Check size={13} />
                            <span>Fix</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-700">{filteredDiscrepancies.length}</span> of <span className="font-bold text-slate-700">{discrepancies.length}</span> total discrepancies
              </div>
              <button
                onClick={() => setShowDiscrepancyModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
