"use client";

import React from 'react'

function StudentsLoad() {
  const dummyRows = Array.from({ length: 10 }); // show 10 skeleton rows

  return (
    <div>
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
      <table className="w-full border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="hidden sm:table-cell px-6 py-4 text-left"><div className="h-3 w-4 bg-slate-200 rounded"></div></th>
            <th className="hidden sm:table-cell px-6 py-4 text-left"><div className="h-3 w-8 bg-slate-200 rounded"></div></th>
            <th className="px-6 py-4 text-left"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
            <th className="px-6 py-4 text-center"><div className="h-3 w-16 bg-slate-200 mx-auto rounded"></div></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {dummyRows.map((_, idx) => (
            <tr key={idx}>
              <td className="hidden sm:table-cell px-6 py-4">
                <div className="h-4 w-6 bg-slate-100 rounded"></div>
              </td>
              <td className="hidden sm:table-cell px-6 py-4">
                <div className="h-4 w-12 bg-slate-100 rounded"></div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-100 rounded"></div>
                  <div className="h-2 w-20 bg-slate-50 rounded sm:hidden"></div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="h-8 w-24 bg-slate-100 rounded-2xl mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

export default StudentsLoad
