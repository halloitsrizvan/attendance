"use client";

import { createContext, useContext, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navigation.module.css';

const NavigationContext = createContext(null);

export default function NavigationProvider({ children }) {
  const [pending, startTransition] = useTransition();
  return <NavigationContext.Provider value={startTransition}>
    {children}
    {pending && <div className={styles.feedback} role="status" aria-live="polite">
      <div className={styles.progress} aria-hidden="true" />
      <div className={styles.message}><span className={styles.spinner} aria-hidden="true" />Opening page...</div>
    </div>}
  </NavigationContext.Provider>;
}

export function useNavigationRouter() {
  const router = useRouter();
  const transition = useContext(NavigationContext);
  return useMemo(() => {
    if (!transition) return router;
    return {
      ...router,
      push: (href, options) => transition(() => router.push(href, options)),
      replace: (href, options) => transition(() => router.replace(href, options)),
      back: () => transition(() => router.back()),
      forward: () => transition(() => router.forward()),
      refresh: () => transition(() => router.refresh()),
    };
  }, [router, transition]);
}
