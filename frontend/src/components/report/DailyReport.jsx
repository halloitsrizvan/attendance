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
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])

  const years = useMemo(() => {
    const y = now.getFullYear()
    return [y - 1, y, y + 1]
  }, [now])

  //  FETCH DATA
  const handleFetch = async () => {
    try {
      setLoading(true)
      setError('')
      setData([])

      const params = new URLSearchParams({ month, year })
      if (classNumber) params.append('class', classNumber)
      if (attendanceTime) params.append('attendanceTime', attendanceTime)

      const res = await fetch(`${API_PORT}/set-attendance/report/detailed-daily?${params.toString()}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to fetch report')
      }
      const j = await res.json()
      const results = j.results || []
      const timeSlots = j.availableTimeSlots || []
      if(classNumber){
        results.sort((a, b) => a.SL - b.SL)
      }else{
        results.sort((a, b) => {
          // First sort by class, then by SL within each class
          if (a.class !== b.class) {
            return a.class - b.class
          }
          return a.SL - b.SL
        })
      }
      setData(results)
      setAvailableTimeSlots(timeSlots)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // 🟩 Get all unique dates
  const getAllDates = () => {
    if (data.length === 0) return []
    const dates = new Set()
    data.forEach(student => {
      if (student.dailyAttendance) {
        student.dailyAttendance.forEach(day => {
          dates.add(day.date)
        })
      }
    })
    return Array.from(dates).sort()
  }
  const allDates = getAllDates()
  console.log(allDates);
  
  // 🟪 Build a per-date map of time slots that actually have data
  const timeSlotsByDate = useMemo(() => {
    const map = {}
    allDates.forEach(date => {
      const slotsWithData = []
      availableTimeSlots.forEach(slot => {
        let hasDataForThisSlot = false
        for (const student of data) {
          const day = student.dailyAttendance?.find(d => d.date === date)
          if (!day) continue
          if (slot === 'Period') {
            if (day.Period && Object.keys(day.Period).length > 0) {
              hasDataForThisSlot = true
              break
            }
          } else {
            if (day[slot]) {
              hasDataForThisSlot = true
              break
            }
          }
        }
        if (hasDataForThisSlot) slotsWithData.push(slot)
      })
      map[date] = slotsWithData
    })
    return map
  }, [allDates, availableTimeSlots, data])

  // Dates that actually have at least one visible slot
  const usedDates = useMemo(() => {
    return allDates.filter(d => (timeSlotsByDate[d] || []).length > 0)
  }, [allDates, timeSlotsByDate])

  // 🟫 Decide cell background color based on status
  const getCellBgClass = (day, timeSlot) => {
    if (timeSlot === 'Period') {
      const values = Object.values(day?.Period || {})
      if (values.length === 0) return 'bg-gray-100'
      const hasAbsent = values.some(v => v === 'A')
      const hasPresent = values.some(v => v === 'P')
      if (hasAbsent) return 'bg-red-100'
      if (hasPresent) return 'bg-green-100'
      return 'bg-gray-100'
    }
    const v = day?.[timeSlot]
    if (!v) return 'bg-gray-100'
    if (v === 'P') return 'bg-green-100'
    if (v === 'A') return 'bg-red-100'
    return 'bg-gray-100'
  }

  // 🟪 Get all unique period numbers for a specific date
  const getPeriodNumbersForDate = (date) => {
    const periodNumbers = new Set()
    data.forEach(student => {
      const day = student.dailyAttendance?.find(d => d.date === date)
      if (day?.Period) {
        Object.keys(day.Period).forEach(periodNum => {
          periodNumbers.add(periodNum)
        })
      }
    })
    return Array.from(periodNumbers).sort((a, b) => parseInt(a) - parseInt(b))
  }
  
  // 🟨 Excel Download
  const handleDownloadExcel = () => {
    const wsData = []
    data.forEach((r, i) => {
      const base = {
        SL: i + 1,
        AD: r.ad,
        Name: r.nameOfStd,
        Class: r.class,
        Present: r.present,
        Absent: r.absent,
      }
      usedDates.forEach(date => {
        const dayData = r.dailyAttendance?.find(d => d.date === date)
        const slots = timeSlotsByDate[date] || []
        const periodNumbers = getPeriodNumbersForDate(date)
        const hasPeriod = slots.includes('Period')
        
        slots.forEach(timeSlot => {
          if (timeSlot === 'Period' && hasPeriod) {
            // Add individual period columns
            periodNumbers.forEach(periodNum => {
              base[`${date}_Period_${periodNum}`] = dayData?.Period?.[periodNum] || '-'
            })
          } else if (timeSlot !== 'Period') {
            base[`${date}_${timeSlot}`] = dayData?.[timeSlot] || '-'
          }
        })
        // Add a per-day total column (sum of shown slots)
        const dayTotal = (timeSlotsByDate[date] || []).reduce((sum, ts) => {
          if (ts === 'Period') {
            return sum + Object.values(dayData?.Period || {}).filter(p => p === 'P').length
          }
          return sum + (dayData?.[ts] === 'P' ? 1 : 0)
        }, 0)
        base[`${date}_Total`] = dayTotal
      })
      wsData.push(base)
    })
    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
    XLSX.writeFile(wb, `Detailed_Monthly_Report_${month}_${year}.xlsx`)
  }

  // 🟥 PDF Download
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text(`Detailed Monthly Attendance Report - ${month}/${year}`, 14, 15)

    const headers = ['SL', 'AD', 'Name', 'Class']
    usedDates.forEach(date => {
      const slots = timeSlotsByDate[date] || []
      const periodNumbers = getPeriodNumbersForDate(date)
      const hasPeriod = slots.includes('Period')
      
      slots.forEach(timeSlot => {
        if (timeSlot === 'Period' && hasPeriod) {
          periodNumbers.forEach(periodNum => {
            headers.push(`${date} Period ${periodNum}`)
          })
        } else if (timeSlot !== 'Period') {
          headers.push(`${date} ${timeSlot}`)
        }
      })
      headers.push(`${date} Total`)
    })
    headers.push('Present', 'Absent')

    const rows = data.map((r, i) => {
      const row = [i + 1, r.ad, r.nameOfStd, r.class]
      usedDates.forEach(date => {
        const dayData = r.dailyAttendance?.find(d => d.date === date)
        let dayTotal = 0
        const slots = timeSlotsByDate[date] || []
        const periodNumbers = getPeriodNumbersForDate(date)
        const hasPeriod = slots.includes('Period')
        
        slots.forEach(timeSlot => {
          if (timeSlot === 'Period' && hasPeriod) {
            periodNumbers.forEach(periodNum => {
              const value = dayData?.Period?.[periodNum] || '-'
              row.push(value)
            })
            dayTotal += Object.values(dayData?.Period || {}).filter(p => p === 'P').length
          } else if (timeSlot !== 'Period') {
            const value = dayData?.[timeSlot] || '-'
            row.push(value)
            dayTotal += (dayData?.[timeSlot] === 'P' ? 1 : 0)
          }
        })
        row.push(dayTotal)
      })
      row.push(r.present, r.absent)
      return row
    })

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      styles: { fontSize: 7, halign: 'center' },
      headStyles: { fillColor: [79, 70, 229] },
    })

    doc.save(`Detailed_Monthly_Report_${month}_${year}.pdf`)
  }

  return (
    <div className="px-4 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen" style={{ marginTop: '5rem' }}>
      {/* Controls */}
      <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 border border-indigo-100">
        <h2 className="text-3xl font-extrabold text-indigo-700 mb-4">Detailed Monthly Attendance Report</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 shadow-sm"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const m = String(i + 1).padStart(2, '0')
                return (
                  <option key={m} value={m}>
                    {m}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 shadow-sm"
            >
              {years.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
            <input
              value={classNumber}
              onChange={e => setClassNumber(e.target.value)}
              placeholder="e.g. 7"
              className="w-full border rounded-lg px-4 py-2 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Attendance Time</label>
            <select
              value={attendanceTime}
              onChange={e => setAttendanceTime(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 shadow-sm"
            >
              <option value="">All</option>
              <option value="Night">Night</option>
              <option value="Period">Period</option>
              <option value="Noon">Noon</option>
              <option value="Morning">Morning</option>
            </select>
          </div>
          <div className="flex items-end col-span-2 sm:col-span-3 md:col-span-1">
            <button
              onClick={handleFetch}
              disabled={loading}
              className={`w-full font-semibold rounded-lg shadow-md ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } px-4 py-2.5`}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
          <div className="flex items-end space-x-2 col-span-2 sm:col-span-3 md:col-span-1">
            <button
              onClick={handleDownloadExcel}
              disabled={!data.length}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-4 py-2 w-full"
            >
              Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={!data.length}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2 w-full"
            >
              PDF
            </button>
          </div>
        </div>
        {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg mt-4 text-sm">{error}</div>}
      </div>

      {/* Table */}
      <div className="bg-white shadow-xl rounded-2xl p-6 overflow-x-auto border border-gray-200">
        {loading ? (
          <div className="flex justify-center py-10 text-gray-600 font-medium">Loading report data...</div>
        ) : data.length === 0 ? (
          <div className="text-gray-500 text-center py-10 text-lg font-medium">
            No attendance records found for the selected criteria.
          </div>
        ) : (
          <table className="min-w-full border text-xs sm:text-sm">
            <thead className="bg-indigo-50 sticky top-0 z-20">
              <tr>
                <th className="p-2 border font-bold text-gray-700">SL</th>
                <th className="p-2 border font-bold text-gray-700">AD</th>
                <th className="p-2 border font-bold text-gray-700">Name</th>
                <th className="p-2 border font-bold text-gray-700">Class</th>
                {usedDates.map(date => {
                  const slots = timeSlotsByDate[date] || []
                  const periodNumbers = getPeriodNumbersForDate(date)
                  const hasPeriod = slots.includes('Period')
                  const totalCols = slots.length + (hasPeriod ? periodNumbers.length - 1 : 0) + 1 // +1 for Total column
                  return (
                    <th key={date} className="text-center border font-bold text-gray-700" colSpan={totalCols}>
                      {date}
                    </th>
                  )
                })}
                <th className="p-2 border font-bold text-gray-700 bg-green-100">Total P</th>
                <th className="p-2 border font-bold text-gray-700 bg-red-100">Total A</th>
              </tr>
              <tr>
                <th colSpan={4}></th>
                {usedDates.map(date => {
                  const slots = timeSlotsByDate[date] || []
                  const periodNumbers = getPeriodNumbersForDate(date)
                  const hasPeriod = slots.includes('Period')
                  
                  return (
                    <React.Fragment key={date}>
                      {slots.map(timeSlot => {
                        if (timeSlot === 'Period' && hasPeriod) {
                          return (
                            <React.Fragment key={timeSlot}>
                              {periodNumbers.map(periodNum => (
                                <th key={`${timeSlot}-${periodNum}`} className="p-1 border text-xs">
                                  {periodNum}
                                </th>
                              ))}
                            </React.Fragment>
                          )
                        } else {
                          return (
                            <th key={timeSlot} className="p-1 border">{timeSlot}</th>
                          )
                        }
                      })}
                      <th className="p-1 border">Total</th>
                    </React.Fragment>
                  )
                })}
                <th colSpan={2}></th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={`${r.ad}-${r.class}`} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">{r.ad}</td>
                  <td className="p-2 border">{r.nameOfStd}</td>
                  <td className="p-2 border">{r.class}</td>
                  {usedDates.map(date => {
                    const day = r.dailyAttendance?.find(d => d.date === date)
                    let total = 0
                    const slots = timeSlotsByDate[date] || []
                    const periodNumbers = getPeriodNumbersForDate(date)
                    const hasPeriod = slots.includes('Period')
                    
                    // Calculate total based on slots used for this date
                    slots.forEach(timeSlot => {
                      if (timeSlot === 'Period') {
                        total += Object.values(day?.Period || {}).filter(p => p === 'P').length
                      } else {
                        total += (day?.[timeSlot] === 'P' ? 1 : 0)
                      }
                    })
                    
                    return (
                      <React.Fragment key={date}>
                        {slots.map(timeSlot => {
                          if (timeSlot === 'Period' && hasPeriod) {
                            return (
                              <React.Fragment key={timeSlot}>
                                {periodNumbers.map(periodNum => {
                                  const periodValue = day?.Period?.[periodNum] || '-'
                                  const bgClass = periodValue === 'P' ? 'bg-green-100' : 
                                                 periodValue === 'A' ? 'bg-red-100' : 'bg-gray-100'
                                  return (
                                    <td key={`${timeSlot}-${periodNum}`} className={`p-1 border text-center ${bgClass}`}>
                                      {periodValue}
                                    </td>
                                  )
                                })}
                              </React.Fragment>
                            )
                          } else if (timeSlot !== 'Period') {
                            return (
                              <td key={timeSlot} className={`p-1 border text-center ${getCellBgClass(day, timeSlot)}`}>
                                {day?.[timeSlot] || '-'}
                              </td>
                            )
                          }
                          return null
                        })}
                        <td className="p-1 border text-center font-semibold">{total}</td>
                      </React.Fragment>
                    )
                  })}
                  <td className="p-2 border font-bold text-green-700">{r.present}</td>
                  <td className="p-2 border font-bold text-red-700">{r.absent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default DailyReport
