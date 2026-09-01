"use client";

import React from 'react';
import Header from '@/components/Header/Header';
import AuthGuard from '@/components/auth/AuthGuard';
import MedicalReport from '@/components/report/MedicalReport';

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
