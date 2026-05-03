"use client";

import React from 'react'
import Header from '@/components/Header/Header'
import dynamic from 'next/dynamic'
import AuthGuard from '@/components/auth/AuthGuard'

const MedicalReport = dynamic(() => import('@/components/report/MedicalReport'), { ssr: false })

export default function MedicalReportPage() {
  return (
    <AuthGuard roles={["super_admin"]}>
      <div>
          <Header/>
          <MedicalReport/>
      </div>
    </AuthGuard>
  )
}
