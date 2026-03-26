"use client";

import React from 'react'
import Header from '@/components/Header/Header'
import dynamic from 'next/dynamic'

const TeacherManagement = dynamic(() => import('@/components/management/TeacherManagement'), { ssr: false })

export default function TeacherManagementPage() {
  return (
    <div>
        <Header/>
        <TeacherManagement/>
    </div>
  )
}
