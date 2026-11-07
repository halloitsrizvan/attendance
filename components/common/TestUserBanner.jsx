"use client";

import { useEffect } from 'react';
import { setupAxiosTestUserInterceptors } from '@/utils/testUserUtils';

export default function TestUserBanner() {
  useEffect(() => {
    setupAxiosTestUserInterceptors();
  }, []);

  return null;
}
