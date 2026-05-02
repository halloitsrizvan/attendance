"use client";

import React from 'react'
import Header from '@/components/Header/Header'
import dynamic from 'next/dynamic'
const DailyReport = dynamic(() => import('@/components/report/DailyReport'), { ssr: false })

export default function ReportPage() {
  return (
    <div>
        <Header/>
        <DailyReport/>
    </div>
  )
}
