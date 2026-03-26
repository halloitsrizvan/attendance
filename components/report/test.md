import React, { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { API_PORT } from '../../Constants'

function DailyReport() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [classNumber, setClassNumber] = useState('')
  const [attendanceTime, setAttendanceTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState([])
  const [uniqueDates, setUniqueDates] = useState([])

  const years = useMemo(() => {
    const y = now.getFullYear()
    return [y - 1, y, y + 1]
  }, [now])

  const handleFetch = async () => {
    try {
      setLoading(true)
      setError('')
      setData([])
      setUniqueDates([])

      const params = new URLSearchParams({ month, year })
      if (classNumber) params.append('class', classNumber)
      if (attendanceTime) params.append('attendanceTime', attendanceTime)

      // Use the actual API URL from your environment (API_PORT)
      const apiUrl = `${API_PORT || ''}/set-attendance/report/monthly?${params.toString()}`;
      
      const res = await fetch(apiUrl)
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to fetch report')
      }
      const j = await res.json()

      // --- Collect all unique dates across all attendances ---
      const allDates = new Set()
      j.results.forEach(std => {
        // Iterate over the new 'attendances' array
        if (Array.isArray(std.attendances)) {
          std.attendances.forEach(a => allDates.add(a.date)) 
        }
      })
      const sortedDates = Array.from(allDates).sort()
      setUniqueDates(sortedDates)

      // --- Map actual status for each date ---
      const formatted = j.results.map(std => {
        const statusMap = {}
        
        // 1. IMPORTANT CHANGE: Default all possible dates to null (Unmarked/No Record)
        sortedDates.forEach(d => {
          statusMap[d] = null 
        })
        
        // 2. Overwrite the status for dates where an attendance record exists
        if (Array.isArray(std.attendances)) {
          std.attendances.forEach(attendance => {
            // Get the first letter of the status (P, A, L)
            const statusInitial = attendance.status ? attendance.status.charAt(0) : 'P';
            statusMap[attendance.date] = statusInitial;
          })
        }

        // 3. Calculate totals based on the complete statusMap (excluding nulls from the count)
        const allStatuses = Object.values(statusMap);
        const totalP = allStatuses.filter(s => s === 'P').length
        const totalA = allStatuses.filter(s => s === 'A').length
        
        return { ...std, statusMap, totalP, totalA } 
      })

      if(!classNumber){
        formatted.sort((a, b) => a.class - b.class)
      }else{
        formatted.sort((a, b) => a.SL - b.SL)
      }
      
      

      
      
      setData(formatted)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to determine cell background color based on status
  const getStatusColor = (status) => {
    switch(status) {
      case 'P': return 'bg-green-100 text-green-700 font-extrabold';
      case 'A': return 'bg-red-100 text-red-700 font-extrabold';
      
      case null: return 'bg-gray-200 text-gray-500 italic'; // New style for null/unmarked
      default: return 'bg-white text-gray-700';
    }
  }


        const handleDownloadExcel = () => {
        const wsData = data.map((r, i) => {
        const row = {
        SL: i + 1,
        AD: r.ad,
        Name: r.nameOfStd,
        Class: r.class,
        }
        uniqueDates.forEach(date => {
        row[date] = r.statusMap[date] || '-'
        })
        row['Total P'] = r.totalP
        row['Total A'] = r.totalA
        return row
        })


        const ws = XLSX.utils.json_to_sheet(wsData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
        XLSX.writeFile(wb, `Monthly_Report_${month}_${year}.xlsx`)
        }


        const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' })
        doc.setFontSize(14)
        doc.text(`Monthly Attendance Report - ${month}/${year}`, 14, 15)


        const tableData = data.map((r, i) => {
        const row = [i + 1, r.ad, r.nameOfStd, r.class]
        uniqueDates.forEach(date => row.push(r.statusMap[date] || '-'))
        row.push(r.totalP, r.totalA)
        return row
        })


        const tableHeaders = ['SL', 'AD', 'Name', 'Class', ...uniqueDates.map(d => d.split('-')[2]), 'Total P', 'Total A']


        autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 25,
        styles: { fontSize: 7, halign: 'center' },
        headStyles: { fillColor: [79, 70, 229] }
        });


        doc.save(`Monthly_Report_${month}_${year}.pdf`)
        }

  return (
   <div className=" px-4 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen" style={{marginTop: '5rem'}}>
      <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 border border-indigo-100">
        <h2 className="text-3xl font-extrabold text-indigo-700 mb-4">Monthly Attendance Report</h2>
        {/* Responsive Control Grid: 2 columns on mobile, 3 on tablet, 6 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          
          {/* Inputs */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
            <select value={month} onChange={e=>setMonth(e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 transition duration-150 ease-in-out">
              {Array.from({length:12}).map((_,i)=>{
                const m = String(i+1).padStart(2,'0')
                return <option key={m} value={m}>{m}</option>
              })}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
            <select value={year} onChange={e=>setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 transition duration-150 ease-in-out">
              {years.map(y=> (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Class (optional)</label>
            <input 
              value={classNumber} 
              onChange={e=>setClassNumber(e.target.value)} 
              placeholder="e.g. 7" 
              className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 transition duration-150 ease-in-out" 
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Time Slot</label>
            <select value={attendanceTime} onChange={e=>setAttendanceTime(e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 transition duration-150 ease-in-out">
              <option value="">All</option>
              <option value="Night">Night</option>
              <option value="Period">Period</option>
              <option value="Noon">Noon</option>
              <option value="Morning">Morning</option>
            </select>
          </div>
          
          {/* Generate Button: Spans 2 columns on mobile, 1 on desktop */}
          <div className="flex items-end col-span-2 sm:col-span-3 md:col-span-1"> 
            <button 
              onClick={handleFetch} 
              disabled={loading}
              className={`w-full font-semibold rounded-lg shadow-md transition duration-150 ease-in-out ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-[1.01]'
              } px-4 py-2.5`}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
          
          {/* Download Buttons: Spans 2 columns on mobile, 1 on desktop */}
          <div className="flex items-end space-x-2 col-span-2 sm:col-span-3 md:col-span-1">
            <button onClick={handleDownloadExcel} disabled={!data.length} className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-4 py-2 w-full transition duration-150 ease-in-out">Excel</button>
            <button onClick={handleDownloadPDF} disabled={!data.length} className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2 w-full transition duration-150 ease-in-out">PDF</button>
          </div>
        </div>
        {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg mt-4 text-sm font-medium">{error}</div>}
      </div>

      <div className="bg-white shadow-xl rounded-2xl p-6 overflow-x-auto border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-500 font-medium">Loading report data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-gray-500 text-center py-8 text-lg font-medium">
            No attendance records found for the selected criteria.
          </div>
        ) : (
          <div>
            <div className="mb-4 text-sm text-gray-600 flex space-x-4">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-400 mr-2"></span>P: Present</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-400 mr-2"></span>A: Absent </span>
                
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400 mr-2"></span>Empty: No Record</span>
            </div>
            {/* Table with fixed height and horizontal scroll (overflow-x-auto) on parent */}
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm border-separate border-spacing-0">
              <thead className="bg-indigo-50 sticky top-0 z-20">
                <tr>
                  {/* Sticky Left Column: SL */}
                  <th className="text-left p-3 border-y border-l border-indigo-200 font-bold text-gray-700 w-12 sticky left-0 z-20 bg-indigo-50">SL</th>
                  
                  {/* Non-sticky Columns: AD and Name */}
                  <th className="text-left p-3 border-y border-indigo-200 font-bold text-gray-700 w-12">AD</th>
                  <th className="text-left p-3 border-y border-indigo-200 font-bold text-gray-700 w-32">Name</th>
                  
                  {/* Non-sticky column */}
                  <th className="text-center p-3 border-y border-indigo-200 font-bold text-gray-700 w-16">Class</th>
                  
                  {/* Date Columns (Vertical Headers for Space Saving) */}
                  {uniqueDates.map(date => (
                    <th 
                      key={date} 
                      className="text-center p-3 border border-indigo-200 font-bold text-gray-700 min-w-[30px]"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', verticalAlign: 'bottom' }}
                      title={date}
                    >
                      {date.split('-')[2]}
                    </th>
                  ))}
                  
                  {/* Non-sticky Right Columns: Totals */}
                  <th className="text-left p-3 border-y border-indigo-200 font-bold text-gray-700 bg-green-200 w-16">Total P</th>
                  <th className="text-left p-3 border-y border-r border-indigo-200 font-bold text-gray-700 bg-red-200 w-16">Total A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((r, index) => {
                    const rowBg = index % 2 === 0 ? 'bg-white hover:bg-gray-100' : 'bg-gray-50 hover:bg-gray-100';
                    return (
                      <tr key={`${r.ad}-${r.class}`} className={`transition duration-100 ${rowBg}`}>
                        {/* Sticky Left Column: SL */}
                        <td className={`p-3 border-l border-b text-gray-800 w-12 sticky left-0 z-10 ${rowBg}`}>{index + 1}</td>
                        
                        {/* Non-sticky Columns: AD and Name */}
                        <td className={`p-3 border border-b text-gray-800 w-12 ${rowBg}`}>{r.ad}</td>
                        <td className={`p-3 border-b font-medium text-gray-900 whitespace-nowrap w-32 ${rowBg}`}>{r.nameOfStd}</td>
                        
                        {/* Non-sticky column */}
                        <td className="p-3 border-b text-center text-gray-700 w-16">{r.class}</td>
                        
                        {/* Date Columns */}
                        {uniqueDates.map(date => {
                          const status = r.statusMap[date]; // status can now be 'P', 'A', 'L', or null
                          return (
                            <td key={date} className={`text-center border-b border-r p-1 ${getStatusColor(status)}`}>
                              {status || '—'} {/* Display '—' for null status */}
                            </td>
                          )
                        })}
                        
                        {/* Non-sticky Right Columns: Totals */}
                        <td className="p-3 border-b font-bold text-green-700 bg-green-50 w-16">{r.totalP}</td>
                        <td className="p-3 border-b border-r font-bold text-red-700 bg-red-50 w-16">{r.totalA}</td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyReport
