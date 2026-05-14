"use client";

import React from 'react'
import Header from '@/components/Header/Header'
import LeaveStatus from '@/components/leave/LeaveStatus'

function MyClassLeave() {
  return (
    <div>
        <Header/>
        <LeaveStatus myClassOnly={true} />
    </div>
  )
}

export default MyClassLeave
