import React, { useState } from 'react';

// --- Mock Data ---
// We'll use this to populate the initial list, based on your image.
const initialStudents = [
  { id: 1, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 2, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 3, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 4, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 5, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 6, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 7, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 8, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 9, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 10, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 11, sl: '01', ad: 267, name: 'Rizvan' },
  { id: 12, sl: '01', ad: 267, name: 'Rizvan' },
];

// --- Student Table Component ---
// Renders the complete table with header and rows
function StudentTable({ students }) {
     const handleAdd = () => {
  };
  return (
    <div className="bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-500 shadow-inner">
      <table className="w-full border-collapse">
        <thead className="bg-gray-300">
          <tr>
            <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/6">Sl</th>
            <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/6">Ad</th>
            <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/2">Name</th>
            <th 
              className="p-3 text-center font-bold text-gray-800 border-b-2 border-gray-500 w-1/6"
            >
              <span 
                className="w-8 h-8 flex items-center justify-center bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                +
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
             <tr className="bg-white border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                <td className="p-3 text-center text-gray-700 border-r border-gray-300 w-1/6">{student.sl}</td>
                <td className="p-3 text-center text-gray-700 border-r border-gray-300 w-1/6">{student.ad}</td>
                <td className="p-3 text-left text-gray-900 border-r border-gray-300 w-1/2">{student.name}</td>
                <td className="p-3 text-center w-1/6">
                    <button
                    onClick={handleAdd()}
                    className="bg-green-500 text-white font-bold px-4 py-1 rounded-full shadow-md hover:bg-green-600 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                    Add
                    </button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Main App Component ---
// This is the root component that brings everything together
export default function BulkStudents() {
  const [classValue, setClassValue] = useState('');
  const [students, setStudents] = useState(initialStudents);
  const handleAdd = () => {
  };
  return (
    // Main container, centers the content
    <div className="min-h-screen sm:p-8 flex justify-center items-start font-sans">
      {/* Card that holds the UI */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-lg w-full max-w-md backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center space-x-2">
            <label htmlFor="classInput" className="text-gray-700 font-medium text-lg">
            Class
            </label>
            <select 
            value={classValue}
            onChange={(e) => setClassValue(e.target.value)}
            className='bg-white border border-gray-400 rounded-md px-3 py-1.5 w-18 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500'>
                <option value="">1</option>
            </select>
        </div>
        <button className="bg-purple-600 text-white font-semibold px-5 py-2 rounded-lg shadow-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75">
            Regular
        </button>
        </div>

        <div className="bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-500 shadow-inner">
            <table className="w-full border-collapse">
                <thead className="bg-gray-300">
                <tr>
                    <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/6">Sl</th>
                    <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/6">Ad</th>
                    <th className="p-3 text-left font-bold text-gray-800 border-b-2 border-gray-500 border-r border-gray-400 w-1/2">Name</th>
                    <th 
                    className="p-3 text-center font-bold text-gray-800 border-b-2 border-gray-500 w-1/6"
                    >
                    <span 
                        className="w-8 h-8 flex items-center justify-center bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        +
                    </span>
                    </th>
                </tr>
                </thead>
                <tbody>
                {students.map((student) => (
                    <tr className="bg-white border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                        <td className="p-3 text-center text-gray-700 border-r border-gray-300 w-1/6">{student.sl}</td>
                        <td className="p-3 text-center text-gray-700 border-r border-gray-300 w-1/6">{student.ad}</td>
                        <td className="p-3 text-left text-gray-900 border-r border-gray-300 w-1/2">{student.name}</td>
                        <td className="p-3 text-center w-1/6">
                            <button
                            onClick={handleAdd()}
                            className="bg-green-500 text-white font-bold px-4 py-1 rounded-full shadow-md hover:bg-green-600 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                            Add
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
      </div>
    </div>
  );
}