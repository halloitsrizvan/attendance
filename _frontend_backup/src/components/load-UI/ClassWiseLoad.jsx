import React from "react";

function ClassWiseLoad() {
  const dummyClasses = Array.from({ length: 10 }); // show 10 loading cards

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {dummyClasses.map((_, index) => (
        <div
          key={index}
          className="bg-gray-200 rounded-2xl shadow-md p-6 text-center animate-pulse"
        >
          {/* Class Number */}
          <div className="mb-4">
            <div className="h-3 w-12 mx-auto mb-2 bg-gray-300 rounded"></div>
            <div className="h-10 w-16 mx-auto bg-gray-300 rounded"></div>
          </div>

          {/* Stats */}
          <div className="space-y-3 text-sm">
            <div className="h-4 w-32 mx-auto bg-gray-300 rounded"></div>
            <div className="h-4 w-28 mx-auto bg-gray-300 rounded"></div>
            <div className="h-4 w-24 mx-auto bg-gray-300 rounded"></div>
            <div className="h-4 w-28 mx-auto bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ClassWiseLoad;
