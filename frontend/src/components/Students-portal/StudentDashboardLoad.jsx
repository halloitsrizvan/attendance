import React from 'react';

function StudentDashboardLoad() {
  return (
    <div className="flex-grow p-4 md:p-6 max-w-4xl w-full mx-auto">
      
      {/* Profile Card Skeleton */}
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border-t-4 border-blue-500 animate-pulse">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full mr-4 shrink-0"></div>
          <div className="flex flex-col">
            <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-gray-200 rounded-xl shadow-lg animate-pulse"
          ></div>
        ))}
      </div>

      {/* Attendance Table Skeleton */}
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 animate-pulse">
        <div className="h-6 bg-gray-300 w-40 mb-4 rounded"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/5"></div>
              <div className="h-4 bg-gray-300 rounded w-1/6"></div>
              <div className="h-4 bg-gray-300 rounded w-1/6 hidden sm:block"></div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default StudentDashboardLoad;
