"use client";

import React, { Suspense } from 'react'
import Header from '@/components/Header/Header'
import Hajar from '@/components/attendance/Hajar'

function Attendance() {
  return (
    <div>
        <Header/>
        <Suspense fallback={<div>Loading attendance page...</div>}>
            <Hajar/>
        </Suspense>
    </div>
  )
}

export default Attendance
