"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import {
  Trophy, Star, BookOpen, Medal, CheckCircle2, XCircle,
  Search, Filter, Loader2, ArrowLeft, Image as ImageIcon,
  ExternalLink, Calendar, User, ShieldAlert, Clock, RefreshCw, X, Download,
  Wallet, Award, ChevronRight, TrendingUp, Sparkles, Layers, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ADMIN_EMAIL = 'krehmankoolivayal13889@gmail.com';

const LEAGUES = [
  { name: 'Diamond', min: 750, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', gradient: 'from-sky-500 to-blue-600' },
  { name: 'Platinum', min: 500, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', gradient: 'from-slate-400 to-slate-600' },
  { name: 'Emerald', min: 250, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Gold', min: 100, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-400 to-amber-600' },
  { name: 'Bronze', min: 0, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', gradient: 'from-orange-400 to-amber-700' },
];

const getLeague = (points) => {
  return LEAGUES.find(l => points >= l.min) || LEAGUES[LEAGUES.length - 1];
};

const getNextLeague = (points) => {
  const currentIndex = LEAGUES.findIndex(l => points >= l.min);
  if (currentIndex <= 0) return null; // Already at Diamond
  return LEAGUES[currentIndex - 1];
};

const ACTIVITY_ICONS = {
  'Awards': <Trophy className="w-4 h-4 text-amber-500 shrink-0" />,
  'Publications': <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />,
  'Innovations': <Star className="w-4 h-4 text-amber-500 shrink-0" />,
  'Courses': <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />,
  'Essay': <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />,
  'Poem': <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />,
  'Story': <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />,
  'Full paper': <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />,
  'Abstract': <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />,
  '1st Place (Out)': <Medal className="w-4 h-4 text-yellow-500 shrink-0" />,
  '2nd Place (Out)': <Medal className="w-4 h-4 text-slate-400 shrink-0" />,
  '3rd Place (Out)': <Medal className="w-4 h-4 text-amber-600 shrink-0" />,
  'Paper presentation (State)': <Medal className="w-4 h-4 text-teal-500 shrink-0" />,
  'Paper presentation (National)': <Medal className="w-4 h-4 text-blue-500 shrink-0" />,
  'Paper presentation (International)': <Medal className="w-4 h-4 text-purple-500 shrink-0" />
};

export default function AdminAchievements() {
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pointsData, setPointsData] = useState([]);

  // Student Balances State
  const [studentBalances, setStudentBalances] = useState({});
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

  // UI states & Modals
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
  const [studentHistoryPoints, setStudentHistoryPoints] = useState([]);
  const [loadingStudentHistory, setLoadingStudentHistory] = useState(false);

  // Pagination / Load More (First 100 records)
  const [visibleCount, setVisibleCount] = useState(100);

  // PDF Report Date Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to 30 days ago
    return d.toISOString().split('T')[0];
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const storedTeacher = localStorage.getItem('teacher');
    if (storedTeacher) {
      const teacherData = JSON.parse(storedTeacher);
      setTeacher(teacherData);

      const teacherId = teacherData.id || teacherData._id;
      if (teacherId) {
        axios.get(`/api/teachers/${teacherId}`)
          .then(res => {
            if (res.data) {
              const updatedTeacher = {
                ...teacherData,
                ...res.data,
                id: res.data._id
              };
              setTeacher(updatedTeacher);
              localStorage.setItem('teacher', JSON.stringify(updatedTeacher));

              const roles = Array.isArray(updatedTeacher.role) ? updatedTeacher.role : [updatedTeacher.role];
              const email = (updatedTeacher.email || updatedTeacher.EMAIL || '').trim().toLowerCase();
              if (email === ADMIN_EMAIL.toLowerCase() || roles.includes('zehnuth_admin') || email === 'test@gmail.com') {
                fetchAchievementsAndBalances();
              } else {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          })
          .catch(err => {
            console.error("Error updating teacher data, falling back to local storage:", err);
            const roles = Array.isArray(teacherData.role) ? teacherData.role : [teacherData.role];
            const email = (teacherData.email || teacherData.EMAIL || '').trim().toLowerCase();
            if (email === ADMIN_EMAIL.toLowerCase() || roles.includes('zehnuth_admin') || email === 'test@gmail.com') {
              fetchAchievementsAndBalances();
            } else {
              setLoading(false);
            }
          });
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAchievementsAndBalances = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAchievements(),
      fetchBalances()
    ]);
    setRefreshing(false);
    setLoading(false);
  };

  const fetchAchievements = async () => {
    try {
      const activities = [
        'Awards',
        'Publications',
        'Innovations',
        'Courses',
        '1st Place (Out)',
        '2nd Place (Out)',
        '3rd Place (Out)',
        'Participation (Out)',
        '1st Place (In)',
        '2nd Place (In)',
        '3rd Place (In)',
        'Participation (In)',
        'Paper presentation (State)',
        'Paper presentation (National)',
        'Paper presentation (International)',
        'Keynote address',
        'Khutba',
        'Other presentations (Out)',
        'Speech',
        'Other presentations (In)',
        'Essay',
        'Poem',
        'Story',
        'Full paper',
        'Abstract'
      ].join(',');
      const res = await axios.get(`/api/zehnuth/points?activities=${activities}`);
      setPointsData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching achievements data:", err);
    }
  };

  const fetchBalances = async () => {
    setLoadingBalances(true);
    try {
      const res = await axios.get('/api/zehnuth/points?leaderboard=true');
      const leaderboardData = Array.isArray(res.data) ? res.data : [];
      const balanceMap = {};
      leaderboardData.forEach((item, index) => {
        const sid = item.student?._id || item._id;
        if (sid) {
          balanceMap[sid] = {
            totalPoints: item.totalPoints || 0,
            achievementCount: item.achievementCount || 0,
            rank: index + 1,
            mentorName: item.mentorName || null,
            student: item.student
          };
        }
      });
      setStudentBalances(balanceMap);
      setBalancesLoaded(true);
    } catch (err) {
      console.error("Error fetching student balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleOpenStudentHistory = async (student) => {
    if (!student?._id) return;
    setSelectedStudentForHistory(student);
    setLoadingStudentHistory(true);
    try {
      const res = await axios.get(`/api/zehnuth/points?studentId=${student._id}&status=approved`);
      setStudentHistoryPoints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching student point history:", err);
      setStudentHistoryPoints([]);
    } finally {
      setLoadingStudentHistory(false);
    }
  };

  const emailStr = (teacher?.email || teacher?.EMAIL || '').trim().toLowerCase();
  const isZehnuthAdmin = teacher && (
    emailStr === ADMIN_EMAIL.toLowerCase() ||
    emailStr === 'test@gmail.com' ||
    (Array.isArray(teacher.role) ? teacher.role.includes('zehnuth_admin') : teacher.role === 'zehnuth_admin')
  );

  // Get dynamic unique classes for filtering
  const classList = useMemo(() => {
    return Array.from(new Set(pointsData.map(p => p.studentId?.CLASS).filter(Boolean))).sort();
  }, [pointsData]);

  // Filter implementation
  const filteredData = useMemo(() => {
    return pointsData.filter(item => {
      if (item.status !== 'approved') return false;
      const student = item.studentId || {};
      const studentName = (student["SHORT NAME"] || student["FULL NAME"] || "").toLowerCase();
      const adNo = (student.ADNO || "").toString();
      const searchMatch = studentName.includes(searchTerm.toLowerCase()) || adNo.includes(searchTerm);
      const classMatch = classFilter === 'all' || student.CLASS === classFilter;
      const activityMatch = activityFilter === 'all' || item.activity === activityFilter;

      return searchMatch && classMatch && activityMatch;
    });
  }, [pointsData, searchTerm, classFilter, activityFilter]);

  // Reset pagination to first 100 whenever filters change
  useEffect(() => {
    setVisibleCount(100);
  }, [searchTerm, classFilter, activityFilter]);

  // Paginated records (First 100 initially, expanded via Load More)
  const displayedData = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  // Approved items and metrics
  const approvedItems = useMemo(() => pointsData.filter(p => p.status === 'approved'), [pointsData]);

  const metrics = useMemo(() => {
    const totalApprovedPoints = approvedItems.reduce((sum, p) => sum + (p.points || 0), 0);
    const uniqueStudents = new Set(approvedItems.map(p => p.studentId?._id).filter(Boolean)).size;
    const totalCompetitions = approvedItems.filter(p => ['1st Place (Out)', '2nd Place (Out)', '3rd Place (Out)'].includes(p.activity)).length;
    const totalWritings = approvedItems.filter(p => ['Essay', 'Poem', 'Story', 'Full paper', 'Abstract'].includes(p.activity)).length;

    return {
      totalApprovedPoints,
      uniqueStudents,
      totalCompetitions,
      totalWritings,
      totalRecords: approvedItems.length
    };
  }, [approvedItems]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStudentBalanceInfo = (studentId) => {
    if (!studentId) return { totalPoints: 0, rank: '-', league: getLeague(0) };
    const balance = studentBalances[studentId];
    if (balance) {
      return {
        totalPoints: balance.totalPoints,
        rank: balance.rank,
        league: getLeague(balance.totalPoints),
        achievementCount: balance.achievementCount,
        mentorName: balance.mentorName
      };
    }
    // Fallback: calculate from locally loaded approvedItems if balances endpoint not yet cached
    const localStudentPoints = approvedItems
      .filter(p => (p.studentId?._id || p.studentId) === studentId)
      .reduce((sum, p) => sum + (p.points || 0), 0);
    return {
      totalPoints: localStudentPoints,
      rank: '-',
      league: getLeague(localStudentPoints),
      achievementCount: 0,
      mentorName: null
    };
  };

  const generatePDFReport = async (startDateInput = pdfStartDate) => {
    if (!pointsData || pointsData.length === 0) {
      alert("No data available to generate report.");
      return;
    }

    const approved = pointsData.filter(p => p.status === 'approved');
    if (approved.length === 0) {
      alert("No approved data available to generate report.");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const primaryColor = [79, 70, 229]; // Indigo-600
      const secondaryColor = [241, 245, 249]; // Slate-100
      const textColor = [30, 41, 59]; // Slate-800
      const lightText = [100, 116, 139]; // Slate-500

      const drawPageHeader = (title, subtitle) => {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, 18);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(subtitle || `Generated: ${new Date().toLocaleString()}`, 14, 25);
      };

      const drawBarChart = (doc, title, data, x, y, width, height, color = primaryColor) => {
        if (!data || data.length === 0) return;

        const maxVal = Math.max(...data.map(d => d.value));
        const chartTitleY = y;

        doc.setFontSize(14);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text(title, x, chartTitleY);

        const chartTop = chartTitleY + 10;
        const chartBottom = chartTop + height;
        const chartLeft = x + 25;
        const chartRight = chartLeft + width;
        const chartHeight = height;
        const chartWidth = width;

        // Draw axes
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(chartLeft, chartBottom, chartRight, chartBottom);
        doc.line(chartLeft, chartBottom, chartLeft, chartTop);

        // Draw Y-axis labels and grid lines
        doc.setFontSize(8);
        doc.setTextColor(lightText[0], lightText[1], lightText[2]);
        doc.setFont("helvetica", "normal");

        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
          const tickVal = maxVal === 0 ? 0 : (maxVal / numTicks) * i;
          const tickY = chartBottom - (chartHeight / numTicks) * i;

          doc.text(Math.round(tickVal).toString(), chartLeft - 5, tickY + 3, { align: "right" });
          if (i > 0) {
            doc.setDrawColor(241, 245, 249);
            doc.line(chartLeft, tickY, chartRight, tickY);
          }
        }

        // Draw bars
        const barPadding = 8;
        const totalBarSpace = chartWidth / data.length;
        const barWidth = Math.min(totalBarSpace - barPadding, 25);

        data.forEach((d, i) => {
          const barHeight = maxVal === 0 ? 0 : (d.value / maxVal) * chartHeight;
          const barX = chartLeft + (totalBarSpace * i) + (totalBarSpace - barWidth) / 2;
          const barY = chartBottom - barHeight;

          doc.setFillColor(226, 232, 240);
          doc.rect(barX + 1, barY + 1, barWidth, barHeight, 'F');

          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(barX, barY, barWidth, barHeight, 'F');

          doc.setFontSize(8);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFont("helvetica", "bold");
          doc.text(d.value.toString() + (d.suffix || ""), barX + barWidth / 2, barY - 2, { align: "center" });

          doc.setFontSize(7);
          doc.setTextColor(lightText[0], lightText[1], lightText[2]);
          doc.setFont("helvetica", "bold");
          const splitLabel = doc.splitTextToSize(d.label, totalBarSpace);
          doc.text(splitLabel, barX + barWidth / 2, chartBottom + 5, { align: "center" });
        });
      };

      // --- PAGE 1: Class Participation ---
      drawPageHeader("ZEHNUTH Analytical Report", `Comprehensive Analysis | ${new Date().toLocaleDateString()}`);

      const classStats = {};
      let totalSubmissions = 0;
      approved.forEach(item => {
        const cls = item.studentId?.CLASS || 'Unknown';
        if (!classStats[cls]) classStats[cls] = { count: 0, points: 0 };
        classStats[cls].count += 1;
        classStats[cls].points += (item.points || 0);
        totalSubmissions++;
      });

      const classData = Object.keys(classStats).map(cls => ({
        label: `Class ${cls}`,
        value: Number(((classStats[cls].count / totalSubmissions) * 100).toFixed(1)),
        suffix: '%'
      })).sort((a, b) => b.value - a.value).slice(0, 8);

      drawBarChart(doc, "Class Participation", classData, 14, 45, 150, 60, [14, 165, 233]);

      const classTableData = Object.keys(classStats)
        .sort((a, b) => classStats[b].points - classStats[a].points)
        .map(cls => [
          `Class ${cls}`,
          classStats[cls].count,
          `${((classStats[cls].count / totalSubmissions) * 100).toFixed(1)}%`,
          classStats[cls].points
        ]);

      doc.setFontSize(14);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text("Class Performance Overview", 14, 135);

      autoTable(doc, {
        startY: 140,
        head: [['Class', 'Total Submissions', 'Participation %', 'Total Points Earned']],
        body: classTableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: secondaryColor },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      // --- PAGE 2: Category & Sub-Category ---
      doc.addPage();
      drawPageHeader("Activity Categories Analysis", "Distribution across domains");

      const getCategory = (activity) => {
        if (['Awards', 'Publications', 'Innovations', 'Courses'].includes(activity)) return 'Achievements';
        if (['Essay', 'Poem', 'Story', 'Full paper', 'Abstract'].includes(activity)) return 'Writings';
        if (['Paper presentation (State)', 'Paper presentation (National)', 'Paper presentation (International)', 'Keynote address', 'Khutba', 'Other presentations (Out)', 'Speech', 'Other presentations (In)'].includes(activity)) return 'Presentations';
        return 'Competitions';
      };

      const categoryCounts = {};
      const subCategoryCounts = {};

      approved.forEach(item => {
        const act = item.activity || 'Unknown';
        const cat = getCategory(act);
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        subCategoryCounts[act] = (subCategoryCounts[act] || 0) + 1;
      });

      const catData = Object.keys(categoryCounts).map(cat => ({
        label: cat,
        value: categoryCounts[cat]
      })).sort((a, b) => b.value - a.value);

      drawBarChart(doc, "Top Broad Categories", catData, 14, 45, 150, 60, [16, 185, 129]);

      const subCatData = Object.keys(subCategoryCounts).map(sub => ({
        label: sub,
        value: subCategoryCounts[sub]
      })).sort((a, b) => b.value - a.value).slice(0, 6);

      drawBarChart(doc, "Top Sub-Categories (Activities)", subCatData, 14, 145, 150, 60, [245, 158, 11]);

      // --- PAGE 3: All-Time Top Students ---
      doc.addPage();
      drawPageHeader("Top Performing Students (All-Time)", "Leaderboard & Overall Rankings");

      let fullLeaderboard = [];
      try {
        const lbRes = await axios.get('/api/zehnuth/points?leaderboard=true');
        fullLeaderboard = lbRes.data;
      } catch (err) {
        console.error("Failed to fetch full leaderboard for PDF", err);
        const studentPoints = {};
        const studentDetails = {};
        approved.forEach(item => {
          const sId = item.studentId?._id;
          if (!sId) return;
          studentPoints[sId] = (studentPoints[sId] || 0) + (item.points || 0);
          if (!studentDetails[sId]) {
            studentDetails[sId] = item.studentId;
          }
        });
        fullLeaderboard = Object.keys(studentPoints).map(sId => ({
          student: studentDetails[sId],
          totalPoints: studentPoints[sId]
        })).sort((a, b) => b.totalPoints - a.totalPoints);
      }

      const top5ForChart = fullLeaderboard.slice(0, 5).map(s => ({
        label: s.student["SHORT NAME"]?.split(' ')[0] || s.student["FULL NAME"]?.split(' ')[0] || 'Unknown',
        value: s.totalPoints
      }));

      if (top5ForChart.length > 0) {
        drawBarChart(doc, "Top 5 Students by Total Points", top5ForChart, 14, 45, 150, 60, [236, 72, 153]);
      }

      doc.setFontSize(14);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text("All-Time Top 20 Leaderboard", 14, 135);

      const tableData = fullLeaderboard.slice(0, 20).map((item, index) => [
        index + 1,
        item.student["SHORT NAME"] || item.student["FULL NAME"] || 'Unknown',
        item.student.ADNO || '-',
        item.student.CLASS || '-',
        getLeague(item.totalPoints).name,
        item.totalPoints
      ]);

      autoTable(doc, {
        startY: 140,
        head: [['Rank', 'Student Name', 'ADNO', 'Class', 'League', 'Total Points']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: secondaryColor },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      // --- PAGE 4: Latest Zehnuth Top 10 Toppers (From selected date to Today) ---
      doc.addPage();
      const startPeriodDate = startDateInput ? new Date(startDateInput) : new Date(Date.now() - 30 * 86400000);
      startPeriodDate.setHours(0, 0, 0, 0);
      const endPeriodDate = new Date();
      endPeriodDate.setHours(23, 59, 59, 999);

      const formattedStartStr = startPeriodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const formattedEndStr = endPeriodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      drawPageHeader("Latest Zehnuth Top 10 Toppers", `Period: ${formattedStartStr} - ${formattedEndStr} (Up to Today)`);

      // Fetch all approved points to calculate period toppers accurately across all categories
      let periodPointsList = [];
      try {
        const allPointsRes = await axios.get('/api/zehnuth/points?status=approved');
        const allApproved = Array.isArray(allPointsRes.data) ? allPointsRes.data : [];
        periodPointsList = allApproved.filter(p => {
          if (!p.createdAt) return false;
          const pDate = new Date(p.createdAt);
          return pDate >= startPeriodDate && pDate <= endPeriodDate;
        });
      } catch (err) {
        console.error("Failed to fetch all approved points for period, falling back to local data", err);
        periodPointsList = approved.filter(p => {
          if (!p.createdAt) return false;
          const pDate = new Date(p.createdAt);
          return pDate >= startPeriodDate && pDate <= endPeriodDate;
        });
      }

      // Group period points by student
      const periodStudentMap = {};
      periodPointsList.forEach(item => {
        const student = item.studentId;
        const sId = student?._id || student;
        if (!sId) return;

        if (!periodStudentMap[sId]) {
          periodStudentMap[sId] = {
            student: typeof student === 'object' ? student : null,
            periodPoints: 0,
            periodCount: 0
          };
        }
        periodStudentMap[sId].periodPoints += (item.points || 0);
        periodStudentMap[sId].periodCount += 1;
        if (!periodStudentMap[sId].student && typeof student === 'object') {
          periodStudentMap[sId].student = student;
        }
      });

      const periodLeaderboard = Object.keys(periodStudentMap)
        .map(sId => ({
          sId,
          student: periodStudentMap[sId].student || {},
          periodPoints: periodStudentMap[sId].periodPoints,
          periodCount: periodStudentMap[sId].periodCount,
          allTimePoints: studentBalances[sId]?.totalPoints || periodStudentMap[sId].periodPoints
        }))
        .sort((a, b) => b.periodPoints - a.periodPoints);

      const top10Period = periodLeaderboard.slice(0, 10);

      const top5PeriodForChart = top10Period.slice(0, 5).map(s => ({
        label: s.student["SHORT NAME"]?.split(' ')[0] || s.student["FULL NAME"]?.split(' ')[0] || 'Unknown',
        value: s.periodPoints,
        suffix: ' pts'
      }));

      if (top5PeriodForChart.length > 0 && top5PeriodForChart[0].value > 0) {
        drawBarChart(doc, "Top 5 Earners in Selected Period", top5PeriodForChart, 14, 45, 150, 60, [79, 70, 229]);
      } else {
        doc.setFontSize(11);
        doc.setTextColor(lightText[0], lightText[1], lightText[2]);
        doc.text("No points recorded for students in this selected date period.", 14, 55);
      }

      doc.setFontSize(14);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(`Top 10 Toppers (${formattedStartStr} - Today)`, 14, 135);

      const periodTableData = top10Period.map((item, index) => [
        index + 1,
        item.student["SHORT NAME"] || item.student["FULL NAME"] || 'Unknown',
        item.student.ADNO || '-',
        item.student.CLASS || '-',
        `+${item.periodPoints} PTS`,
        `${item.allTimePoints} PTS`,
        getLeague(item.allTimePoints).name
      ]);

      autoTable(doc, {
        startY: 140,
        head: [['Rank', 'Student Name', 'ADNO', 'Class', 'Period Points', 'All-Time Total', 'League']],
        body: periodTableData.length > 0 ? periodTableData : [['-', 'No submissions in this date range', '-', '-', '0', '0', '-']],
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: secondaryColor },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      doc.save(`Zehnuth_Analysis_Report_${startDateInput || 'Period'}_to_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("An error occurred while generating the PDF report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-3" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[11px]">Loading Dashboard & Balances...</p>
      </div>
    );
  }

  if (!teacher || !isZehnuthAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-xl mx-auto px-4 pt-28 pb-12 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-sm border border-rose-100">
            <ShieldAlert size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase italic">Access Denied</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-3 leading-relaxed">
            This administrative page is restricted to ZEHNUTH Admins only.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-8 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Go Back Home
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white pb-16">
      <Header />

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12">

        {/* Page Title & Actions Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100 shrink-0">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                ZEHNUTH <span className="bg-gradient-to-r from-indigo-500 to-blue-600 bg-clip-text text-transparent">achievements</span>
              </h1>
            </div>
            {/* <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1.5 pl-0.5">
              Manage awards, presentations, competitions, and monitor student point balances in real-time.
            </p> */}
          </div>

          {/* Action Buttons Toolbar */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">


            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              <span>PDF Report</span>
            </button>


          </div>
        </div>

        {/* Quick Analytics & Balance Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Approved Points</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1 flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  {metrics.totalApprovedPoints.toLocaleString()}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Layers size={11} /> {metrics.totalRecords} achievements logged
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Students</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1 flex items-center gap-1.5">
                  <User className="w-5 h-5 text-indigo-600" />
                  {metrics.uniqueStudents}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Wallet size={11} /> {Object.keys(studentBalances).length} balances tracked
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Competitions</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1 flex items-center gap-1.5">
                  <Medal className="w-5 h-5 text-rose-500" />
                  {metrics.totalCompetitions}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400">
              External 1st/2nd/3rd places
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Writings & Articles</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1 flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  {metrics.totalWritings}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Trophy size={20} />
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400">
              Essays, poems & papers
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-indigo-600" />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Records</h2>
            </div>
            {(searchTerm || classFilter !== 'all' || activityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setClassFilter('all');
                  setActivityFilter('all');
                }}
                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <X size={12} /> Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Student Name or AD No..."
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs font-bold text-slate-700 outline-none transition-all pl-11"
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Activity Filter */}
            <div>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all"
              >
                <option value="all">🏆 All Activities</option>
                <optgroup label="Achievements">
                  <option value="Awards">Awards</option>
                  <option value="Publications">Publications</option>
                  <option value="Innovations">Innovations</option>
                  <option value="Courses">Courses</option>
                </optgroup>
                <optgroup label="Writings">
                  <option value="Essay">Essay</option>
                  <option value="Poem">Poem</option>
                  <option value="Story">Story</option>
                  <option value="Full paper">Full paper</option>
                  <option value="Abstract">Abstract</option>
                </optgroup>
                <optgroup label="Presentations">
                  <option value="Paper presentation (State)">Paper presentation (State)</option>
                  <option value="Paper presentation (National)">Paper presentation (National)</option>
                  <option value="Paper presentation (International)">Paper presentation (International)</option>
                  <option value="Keynote address">Keynote address</option>
                  <option value="Khutba">Khutba</option>
                  <option value="Other presentations (Out)">Other presentations (Out)</option>
                  <option value="Speech">Speech</option>
                  <option value="Other presentations (In)">Other presentations (In)</option>
                </optgroup>
                <optgroup label="Competitions">
                  <option value="1st Place (Out)">1st Place (Out)</option>
                  <option value="2nd Place (Out)">2nd Place (Out)</option>
                  <option value="3rd Place (Out)">3rd Place (Out)</option>
                  <option value="Participation (Out)">Participation (Out)</option>
                  <option value="1st Place (In)">1st Place (In)</option>
                  <option value="2nd Place (In)">2nd Place (In)</option>
                  <option value="3rd Place (In)">3rd Place (In)</option>
                  <option value="Participation (In)">Participation (In)</option>
                </optgroup>
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all"
              >
                <option value="all">🏫 All Classes</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Layers size={13} className="text-indigo-500" />
              Showing {Math.min(visibleCount, filteredData.length)} of {filteredData.length} records
            </span>
            <div className="text-[10px] font-bold text-slate-400">
              {balancesLoaded ? (
                <span className="text-emerald-600 font-black flex items-center gap-1">
                  <CheckCircle2 size={12} /> Balances Active
                </span>
              ) : (
                <span className="text-slate-400 italic">Click 'Load Balance' to sync ranks</span>
              )}
            </div>
          </div>

          {filteredData.length > 0 ? (
            <>
              {/* Desktop Table View (>= lg) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-6">Class</th>
                      <th className="py-4 px-6">Activity</th>
                      <th className="py-4 px-6">Points Added</th>
                      <th className="py-4 px-6">Total Balance</th>
                      <th className="py-4 px-6">Proof</th>
                      <th className="py-4 px-6">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {displayedData.map((item) => {
                      const studentId = item.studentId?._id;
                      const balanceInfo = getStudentBalanceInfo(studentId);
                      const league = balanceInfo.league;

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-black text-slate-800 uppercase italic">
                              {item.studentId?.["SHORT NAME"] || item.studentId?.["FULL NAME"]}
                            </div>
                            <div className="text-[9px] text-slate-400 tracking-wider">
                              ADNO: {item.studentId?.ADNO}
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black">
                              Class {item.studentId?.CLASS || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {ACTIVITY_ICONS[item.activity] || <Trophy className="w-4 h-4 text-slate-400 shrink-0" />}
                              <span className="font-extrabold uppercase text-slate-800 text-[11px] truncate max-w-[200px]">
                                {item.activity}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 font-black text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl text-xs">
                              <Star size={13} fill="currentColor" />
                              <span>+{item.points}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenStudentHistory(item.studentId)}
                              className={`group/btn flex items-center gap-2 px-3 py-1.5 rounded-xl border ${league.bg} ${league.border} hover:shadow-sm transition-all active:scale-95`}
                              title="Click to view student full points breakdown"
                            >
                              <div className="text-left">
                                <div className={`text-xs font-black flex items-center gap-1 ${league.color}`}>
                                  <Wallet size={12} />
                                  <span>{balanceInfo.totalPoints} PTS</span>
                                </div>
                                <div className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                                  {league.name} • Rank #{balanceInfo.rank}
                                </div>
                              </div>
                              <ChevronRight size={12} className="text-slate-400 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          </td>
                          <td className="py-4 px-6">
                            {item.imageUrl ? (
                              <button
                                onClick={() => setSelectedImage({ url: item.imageUrl, title: `${item.studentId?.["SHORT NAME"] || 'Student'} - ${item.activity}` })}
                                className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 relative group/img flex items-center justify-center bg-slate-50 hover:border-indigo-400 transition-all active:scale-95"
                              >
                                <img src={item.imageUrl} alt="Proof" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-indigo-600/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ExternalLink size={12} />
                                </div>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-bold italic uppercase">-</span>
                            )}
                          </td>
                          <td className="py-4 px-6 max-w-[160px]">
                            {item.remarks ? (
                              <button
                                onClick={() => setSelectedRemark({ content: item.remarks, title: `${item.studentId?.["SHORT NAME"]}'s Remark` })}
                                className="text-left text-slate-500 hover:text-indigo-600 truncate block w-full outline-none text-xs"
                              >
                                {item.remarks}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-bold italic uppercase">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (< lg) */}
              <div className="lg:hidden p-3.5 sm:p-4 space-y-3.5 bg-slate-50/50">
                {displayedData.map((item) => {
                  const studentId = item.studentId?._id;
                  const balanceInfo = getStudentBalanceInfo(studentId);
                  const league = balanceInfo.league;

                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3.5"
                    >
                      {/* Top Bar: Date & League Rank */}
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {formatDate(item.createdAt)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${league.bg} ${league.border} ${league.color}`}>
                          {league.name} League • #{balanceInfo.rank}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-slate-800 text-sm sm:text-base uppercase italic leading-tight">
                            {item.studentId?.["SHORT NAME"] || item.studentId?.["FULL NAME"]}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            AD No: <span className="text-slate-600">{item.studentId?.ADNO}</span> • <span className="text-indigo-600 font-black">Class {item.studentId?.CLASS || 'N/A'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Activity & Points Box */}
                      <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3 border border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {ACTIVITY_ICONS[item.activity] || <Trophy className="w-4 h-4 text-slate-400 shrink-0" />}
                            <span className="font-black uppercase text-slate-800 text-xs sm:text-[13px] truncate">
                              {item.activity}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-1 font-black text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-xs shrink-0">
                            <Star size={12} fill="currentColor" />
                            <span>+{item.points} PTS</span>
                          </div>
                        </div>

                        {item.remarks && (
                          <div className="border-t border-slate-200/60 pt-2 text-xs text-slate-600 font-medium italic leading-relaxed">
                            "{item.remarks}"
                          </div>
                        )}
                      </div>

                      {/* Student Total Balance Bar & Quick Action */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <button
                          onClick={() => handleOpenStudentHistory(item.studentId)}
                          className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${league.bg} ${league.border} active:scale-[0.98] transition-all`}
                        >
                          <div className="flex items-center gap-2">
                            <Wallet size={14} className={league.color} />
                            <div className="text-left">
                              <p className="text-[9px] font-bold uppercase text-slate-400 leading-none">Total Points Balance</p>
                              <p className={`text-xs font-black ${league.color} mt-0.5`}>
                                {balanceInfo.totalPoints} PTS
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                            Breakdown <ChevronRight size={12} />
                          </span>
                        </button>
                      </div>

                      {/* Proof button if available */}
                      {item.imageUrl && (
                        <div className="pt-1">
                          <button
                            onClick={() => setSelectedImage({ url: item.imageUrl, title: `${item.studentId?.["SHORT NAME"] || 'Student'} - ${item.activity}` })}
                            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-100"
                          >
                            <ImageIcon size={14} /> View Evidence Proof
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More Pagination Button */}
              {visibleCount < filteredData.length && (
                <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-500">
                    Showing <span className="text-slate-900 font-black">{Math.min(visibleCount, filteredData.length)}</span> of <span className="text-slate-900 font-black">{filteredData.length}</span> records
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 100)}
                      className="flex-1 sm:flex-initial px-5 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      <span>Load More ({Math.min(100, filteredData.length - visibleCount)} More)</span>
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => setVisibleCount(filteredData.length)}
                      className="px-4 py-2.5 sm:py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                      title="Show all remaining records"
                    >
                      Load All
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 sm:p-16 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Trophy size={28} />
              </div>
              <h3 className="text-slate-700 font-black uppercase italic text-sm">No Achievements Found</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                Try adjusting your search criteria or filter dropdowns.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Lightbox / Proof Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}></div>
          <div className="relative bg-white max-w-3xl w-full rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-6 duration-300 max-h-[92vh] flex flex-col">

            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <ImageIcon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase italic truncate">Evidence File</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{selectedImage.title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedImage(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-slate-900/5">
              <img src={selectedImage.url} alt="Proof" className="max-h-[55vh] sm:max-h-[60vh] object-contain rounded-xl shadow-md border border-slate-200" />
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all"
              >
                Close
              </button>
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-2"
              >
                Open Original <ExternalLink size={12} />
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Remarks Dialog Modal */}
      {selectedRemark && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedRemark(null)}></div>
          <div className="relative bg-white max-w-md w-full rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-6 duration-300">

            <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 bg-white">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase italic">{selectedRemark.title || 'Remarks Details'}</h3>
              <button onClick={() => setSelectedRemark(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 bg-slate-50">
              <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line bg-white p-4 sm:p-5 rounded-xl border border-slate-100 italic shadow-inner">
                "{selectedRemark.content}"
              </p>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end bg-white">
              <button
                onClick={() => setSelectedRemark(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Student Balance & Points Breakdown Modal */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedStudentForHistory(null)}></div>
          <div className="relative bg-white max-w-2xl w-full rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-6 duration-300 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Wallet size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase italic leading-tight">
                    {selectedStudentForHistory["SHORT NAME"] || selectedStudentForHistory["FULL NAME"]}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    ADNO: {selectedStudentForHistory.ADNO} • Class {selectedStudentForHistory.CLASS || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Balance Overview Card */}
            {(() => {
              const balanceInfo = getStudentBalanceInfo(selectedStudentForHistory._id);
              const league = balanceInfo.league;
              const nextLeague = getNextLeague(balanceInfo.totalPoints);
              const progressPct = nextLeague
                ? Math.min(100, Math.round(((balanceInfo.totalPoints - league.min) / (nextLeague.min - league.min)) * 100))
                : 100;

              return (
                <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Balance</p>
                      <p className="text-lg sm:text-xl font-black text-amber-500 flex items-center gap-1 mt-0.5">
                        <Star size={16} fill="currentColor" />
                        {balanceInfo.totalPoints} PTS
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Current League</p>
                      <p className={`text-sm sm:text-base font-black ${league.color} mt-1`}>
                        {league.name}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Leaderboard Rank</p>
                      <p className="text-sm sm:text-base font-black text-indigo-600 mt-1">
                        #{balanceInfo.rank}
                      </p>
                    </div>
                  </div>

                  {nextLeague && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Progress to <span className="font-black text-indigo-600">{nextLeague.name}</span></span>
                        <span>{balanceInfo.totalPoints} / {nextLeague.min} PTS</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Body: Point History List */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Approved Achievement Records ({studentHistoryPoints.length})
              </h4>

              {loadingStudentHistory ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="animate-spin text-indigo-600 mx-auto w-6 h-6" />
                  <p className="text-xs font-bold uppercase tracking-wider">Fetching History...</p>
                </div>
              ) : studentHistoryPoints.length > 0 ? (
                studentHistoryPoints.map((rec) => (
                  <div key={rec._id} className="bg-white p-3.5 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {ACTIVITY_ICONS[rec.activity] || <Trophy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <p className="text-xs font-black uppercase text-slate-800 truncate">{rec.activity}</p>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                        {formatDate(rec.createdAt)} {rec.remarks ? `• "${rec.remarks}"` : ''}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1 font-black text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg text-xs shrink-0">
                      <Star size={12} fill="currentColor" />
                      +{rec.points}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  No approved points recorded yet.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end bg-white">
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PDF Report Date Selector Popup Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isGeneratingPdf && setIsPdfModalOpen(false)}
          ></div>
          <div className="relative bg-white max-w-md w-full rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-6 duration-300">

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase italic leading-tight">
                    Generate PDF Report
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Select date for Latest Top 10 Toppers
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isGeneratingPdf && setIsPdfModalOpen(false)}
                disabled={isGeneratingPdf}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-all disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 bg-slate-50/50">

              {/* Quick Presets */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                  Quick Period Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 7);
                      setPdfStartDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl text-[11px] font-black transition-all active:scale-95 text-slate-700 shadow-sm"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 14);
                      setPdfStartDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl text-[11px] font-black transition-all active:scale-95 text-slate-700 shadow-sm"
                  >
                    Last 14 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      setPdfStartDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl text-[11px] font-black transition-all active:scale-95 text-slate-700 shadow-sm"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(1); // 1st of current month
                      setPdfStartDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl text-[11px] font-black transition-all active:scale-95 text-slate-700 shadow-sm"
                  >
                    This Month
                  </button>
                </div>
              </div>

              {/* Start Date Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
                  Topper Points Starting Date
                </label>
                <input
                  type="date"
                  value={pdfStartDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPdfStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Period Summary Information Box */}
              <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-xl p-3.5 space-y-1.5 text-indigo-900">
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Calendar size={13} className="text-indigo-600 shrink-0" />
                  <span>Selected Date Window:</span>
                </div>
                <div className="text-[11px] font-bold text-slate-600 pl-4 leading-relaxed">
                  <span className="font-black text-indigo-700">
                    {pdfStartDate ? new Date(pdfStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Custom'}
                  </span>
                  {' '}→{' '}
                  <span className="font-black text-indigo-700">
                    Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                  </span>
                </div>
                <p className="text-[10px] text-indigo-600/80 pt-1 border-t border-indigo-100 font-medium leading-normal">
                  The PDF report will include full analytical breakdowns, all-time leaderboard, plus the <strong>Latest Zehnuth Top 10 Toppers</strong> based strictly on points earned in this date range.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingPdf || !pdfStartDate}
                onClick={() => generatePDFReport(pdfStartDate)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
