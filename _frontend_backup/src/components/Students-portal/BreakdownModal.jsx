import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import BreakdownCard from './BreakdownCard';
import axios from 'axios';
import { API_PORT } from '../../Constants';

function BreakdownModal({ show, onClose, type ,attendanceData,studentData}) {
  const [attendanceBreakdown, setAttendanceBreakdown] = useState([]);
  useEffect(() => {
    if (!show || !studentData) return; // prevent early calls

    const filterAttendance = () => {
      try {
        // Create categories
        const categories = ["Night", "Period", "Noon", "Morning", "Jamath", "More"];

        const breakdown = categories.map(cat => {
          const catData = attendanceData.filter(item => item.attendanceTime === cat);
          const total = catData.length;
          const present = catData.filter(item => item.status === "Present").length;
          const absent = total - present;
          return { time: cat, present, absent, total };
        });

        setAttendanceBreakdown(breakdown);
      } catch (err) {
        console.error(err);
      }
    };

    filterAttendance();
  }, [show, studentData]);

  if (!show) return null;

  const headerText =
    type === 'present' ? 'Total Present Breakdown' : 'Total Absent Breakdown';
  const color = type === 'present' ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className={`w-full max-w-lg ${color} rounded-2xl shadow-2xl p-6 relative transform transition-transform duration-300 scale-100`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{headerText}</h3>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {attendanceBreakdown.map((item, index) => (
            <BreakdownCard
              key={index}
              time={item.time}
              present={item.present}
              total={item.total}
              absent={item.absent}
              type={type}
            />
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Attendance counts are recorded per session type.
        </p>
      </div>
    </div>
  );
}

export default BreakdownModal;
