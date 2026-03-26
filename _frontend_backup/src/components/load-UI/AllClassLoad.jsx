import React from 'react'

function AllClassLoad() {
  const classDummy = [
    { class: 1 }, { class: 2 }, { class: 3 }, { class: 4 }, { class: 5 },
    { class: 6 }, { class: 7 }, { class: 8 }, { class: 9 }, { class: 10 }
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {classDummy.map((cls, index) => (
        <div
          key={index}
          className="rounded-lg shadow-lg p-4 text-center bg-gray-200 animate-pulse"
        >
          <div className="mb-3">
            <div className="h-3 w-10 mx-auto mb-2 rounded bg-gray-300"></div>
            <div className="h-10 w-16 mx-auto rounded bg-gray-300"></div>
          </div>
          <div className="h-3 w-24 mx-auto rounded bg-gray-300"></div>
        </div>
      ))}
    </div>
  )
}

export default AllClassLoad
