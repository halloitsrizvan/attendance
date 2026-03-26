"use client";

import React from 'react'

function AllClassLoad() {
  const classDummy = [
    { class: 1 }, { class: 2 }, { class: 3 }, { class: 4 }, { class: 5 },
    { class: 6 }, { class: 7 }, { class: 8 }, { class: 9 }, { class: 10 }
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-6">
      {classDummy.map((_, index) => (
        <div
          key={index}
          className="relative h-28 p-4 rounded-2xl border-2 border-slate-50 bg-white animate-pulse flex flex-col items-center justify-center text-center space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 mb-1"></div>
          <div className="space-y-1 w-full">
            <div className="h-3 w-12 bg-slate-100 mx-auto rounded"></div>
            <div className="h-2 w-8 bg-slate-50 mx-auto rounded"></div>
          </div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-100"></div>
        </div>
      ))}
    </div>
  )
}

export default AllClassLoad
