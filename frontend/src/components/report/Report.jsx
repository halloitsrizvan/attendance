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
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])

  const years = useMemo(() => {
    const y = now.getFullYear()
    return [y - 1, y, y + 1]
  }, [now])

 const handleFetch = async () => {
  try {
    setLoading(true);
    setError('');
    setData([]);
    const params = new URLSearchParams({ month, year });
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

    // Sort by 'ad' in ascending order
    results.sort((a, b) => a.ad - b.ad);

    setData(results);
    setAvailableTimeSlots(timeSlots);
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};

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

  // Get all unique dates from the data
  const getAllDates = () => {
    if (data.length === 0) return [];
    const dates = new Set();
    data.forEach(student => {
      if (student.dailyAttendance) {
        student.dailyAttendance.forEach(day => {
          dates.add(day.date);
        });
      }
    });
    return Array.from(dates).sort();
  };

  const allDates = getAllDates();

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto">
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
          <h3 className="text-lg font-semibold">Detailed Daily Report</h3>
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
        
        {data.length === 0 && !loading ? (
          <div className="text-gray-500 text-sm">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border">SL</th>
                  <th className="text-left p-2 border">AD</th>
                  <th className="text-left p-2 border">Name</th>
                  <th className="text-left p-2 border">Class</th>
                  {allDates.map(date => (
                    <React.Fragment key={date}>
                      <th className="text-center p-2 border" colSpan={availableTimeSlots.length + 1}>
                        {date}
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="text-left p-2 border">Total Present</th>
                  <th className="text-left p-2 border">Total Absent</th>
                </tr>
                <tr>
                  <th className="text-left p-2 border"></th>
                  <th className="text-left p-2 border"></th>
                  <th className="text-left p-2 border"></th>
                  <th className="text-left p-2 border"></th>
                  {allDates.map(date => (
                    <React.Fragment key={date}>
                      {availableTimeSlots.map(timeSlot => (
                        <th key={timeSlot} className="text-center p-2 border">{timeSlot}</th>
                      ))}
                      <th className="text-center p-2 border">Total</th>
                    </React.Fragment>
                  ))}
                  <th className="text-left p-2 border"></th>
                  <th className="text-left p-2 border"></th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => (
                  <tr key={`${r.ad}-${r.class}`} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border">{r.SL}</td>
                    <td className="p-2 border">{r.ad}</td>
                    <td className="p-2 border">{r.nameOfStd}</td>
                    <td className="p-2 border">{r.class}</td>
                    {allDates.map(date => {
                      const dayData = r.dailyAttendance?.find(d => d.date === date);
                      if (!dayData) {
                        return (
                          <React.Fragment key={date}>
                            <td className="p-2 border text-center">-</td>
                            <td className="p-2 border text-center">-</td>
                            <td className="p-2 border text-center">-</td>
                            <td className="p-2 border text-center">-</td>
                            <td className="p-2 border text-center">-</td>
                            <td className="p-2 border text-center font-semibold">0</td>
                          </React.Fragment>
                        );
                      }
                      
                      const dayTotal = (dayData.Night === 'P' ? 1 : 0) + 
                                      (dayData.Noon === 'P' ? 1 : 0) + 
                                      (dayData.Morning === 'P' ? 1 : 0) + 
                                      (dayData.Jamath === 'P' ? 1 : 0) +
                                      Object.values(dayData.Period || {}).filter(p => p === 'P').length;
                      
                      return (
                        <React.Fragment key={date}>
                          <td className="p-2 border text-center">{dayData.Night || '-'}</td>
                          <td className="p-2 border text-center">
                            {Object.keys(dayData.Period || {}).length > 0 ? (
                              <div className="flex flex-col">
                                {Object.entries(dayData.Period).map(([period, status]) => (
                                  <span key={period} className="text-xs">
                                    {period}: {status || '-'}
                                  </span>
                                ))}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-2 border text-center">{dayData.Noon || '-'}</td>
                          <td className="p-2 border text-center">{dayData.Morning || '-'}</td>
                          <td className="p-2 border text-center">{dayData.Jamath || '-'}</td>
                          <td className="p-2 border text-center font-semibold">{dayTotal}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-2 border font-semibold">{r.present}</td>
                    <td className="p-2 border font-semibold">{r.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Report