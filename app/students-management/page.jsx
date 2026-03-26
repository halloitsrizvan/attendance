"use client";

import React from 'react'
import Header from '@/components/Header/Header'
import dynamic from 'next/dynamic'

const StudentManagement = dynamic(() => import('@/components/management/StudentManagement'), { ssr: false })

export default function StudentManagementPage() {
  return (
    <div>
        <Header/>
        <StudentManagement/>
    </div>
  )
}
