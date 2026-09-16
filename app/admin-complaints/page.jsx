"use client";

import React from 'react';
import Header from '@/components/Header/Header';
import AuthGuard from '@/components/auth/AuthGuard';
import dynamic from 'next/dynamic';

const AdminComplaints = dynamic(() => import('@/components/management/AdminComplaints'), { ssr: false });

export default function AdminComplaintsPage() {
  return (
    <AuthGuard roles={["super_admin"]}>
      <div>
        <Header />
        <AdminComplaints />
      </div>
    </AuthGuard>
  );
}
