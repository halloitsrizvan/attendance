import React, { useMemo, useState } from 'react'
import { API_PORT } from '../../Constants'

function Report() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [classNumber, setClassNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState([])
  const [attendanceTime, setAttendanceTime] = useState('')

  const years = useMemo(() => {
    const y = now.getFullYear()
    return [y - 1, y, y + 1]
  }, [now])

  const handleFetch = async () => {
    try {
      setLoading(true)
      setError('')
      setData([])
      const params = new URLSearchParams({ month, year })
      if (classNumber) params.append('class', classNumber)
      if (attendanceTime) params.append('attendanceTime', attendanceTime)
      const res = await fetch(`http://localhost:4000/set-attendance/report/monthly?${params.toString()}`)
    
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to fetch report')
      }
      const j = await res.json()
      setData(j.results || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
    const handleDownload = () => {
    if (!data.length) return;
    const header = ['AD', 'Name', 'Class', 'Present', 'Absent'];
    const rows = data.map(r =>
      [r.ad, r.nameOfStd, r.class, r.present, r.absent].join(',')
    );
    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${month}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-20 px-4 max-w-6xl mx-auto">
      <div className="bg-white shadow rounded p-4 mb-4">
        <h2 className="text-xl font-semibold mb-3">Monthly Attendance Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month</label>
            <select value={month} onChange={e=>setMonth(e.target.value)} className="w-full border rounded px-3 py-2">
              {Array.from({length:12}).map((_,i)=>{
                const m = String(i+1).padStart(2,'0')
                return <option key={m} value={m}>{m}</option>
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <select value={year} onChange={e=>setYear(e.target.value)} className="w-full border rounded px-3 py-2">
              {years.map(y=> (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Class (optional)</label>
            <input value={classNumber} onChange={e=>setClassNumber(e.target.value)} placeholder="e.g. 6" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Attendance Time</label>
            <select value={attendanceTime} onChange={e=>setAttendanceTime(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">All</option>
              <option value="Night">Night</option>
              <option value="Period">Period</option>
              <option value="Noon">Noon</option>
              <option value="Morning">Morning</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleFetch} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2">Generate</button>
          </div>
        </div>
        {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
      </div>

      <div className="bg-white shadow rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Summary</h3>
          <div className="flex gap-2 items-center">
            {loading && <span className="text-sm text-gray-500">Loading...</span>}
            <button
              onClick={handleDownload}
              disabled={!data.length}
              className="bg-green-600 hover:bg-green-700 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              Download Report
            </button>
          </div>
        </div>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>
        {data.length === 0 && !loading ? (
          <div className="text-gray-500 text-sm">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border">AD</th>
                  <th className="text-left p-2 border">Name</th>
                  <th className="text-left p-2 border">Class</th>
                  <th className="text-left p-2 border">Present</th>
                  <th className="text-left p-2 border">Absent</th>
                 
                </tr>
              </thead>
              <tbody>
                {data.map(r => (
                  <tr key={`${r.ad}-${r.class}`} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border">{r.ad}</td>
                    <td className="p-2 border">{r.nameOfStd}</td>
                    <td className="p-2 border">{r.class}</td>
                    <td className="p-2 border">{r.present}</td>
                    <td className="p-2 border">{r.absent}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
               
            
          </div>
          
        )}
      </div>
    
  )
}

export default Report