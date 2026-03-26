import React from 'react'

function StudentsLoad() {
  const dummyRows = Array.from({ length: 10 }); // show 10 skeleton rows

  return (
    <div>
      <table className="table-auto border-collapse border border-gray-300 w-full">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">SL</th>
            <th className="border border-gray-300 px-4 py-2">Ad</th>
            <th className="border border-gray-300 px-4 py-2">Name</th>
            <th className="border border-gray-300 px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {dummyRows.map((_, idx) => (
            <tr key={idx} className="animate-pulse">
              <td className="border border-gray-300 px-4 py-2">
                <div className="h-4 w-6 bg-gray-300 rounded"></div>
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <div className="h-4 w-12 bg-gray-300 rounded"></div>
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <div className="h-6 w-20 bg-gray-300 rounded-full mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default StudentsLoad
