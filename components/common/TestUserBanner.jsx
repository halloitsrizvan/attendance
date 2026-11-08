"use client";

import { useEffect } from 'react';
import { setupAxiosTestUserInterceptors } from '@/utils/testUserUtils';
import { setupApiCache } from '@/utils/apiCache';

// Install before child page effects issue their requests.
if (typeof window !== 'undefined') {
  setupAxiosTestUserInterceptors();
  setupApiCache();
}

export default function TestUserBanner() {
  useEffect(() => {
    setupAxiosTestUserInterceptors();
  }, []);

  return null;
}
