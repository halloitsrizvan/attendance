import React from 'react'

function TestAtt() {
  const st = [
    { name: 'hhad', ad: 32, roll: 1 },
    { name: 'ssshad', ad: 34322, roll: 2 },
    { name: 'hhasAad', ad: 3432, roll: 3 },
    { name: 'hhSASad', ad: 3222, roll: 4 },
    { name: 'hhXSAad', ad: 3422, roll: 5 },
  ]

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <form>
        {/* Responsive grid layout */}
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-6 gap-6">
          {st.map((std, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-2xl p-4 flex flex-col items-center justify-center hover:shadow-xl transition-all duration-300"
            >
              {/* Roll circle */}
              <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg mb-3">
                {std.roll}
              </div>

              {/* Details */}
              <h2 className="text-lg font-semibold text-gray-800">{std.name}</h2>
              <p className="text-sm text-gray-500">Ad No: {std.ad}</p>
            </div>
          ))}
        </div>
      </form>
    </div>
  )
}

export default TestAtt
