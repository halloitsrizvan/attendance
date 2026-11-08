"use client";

import { forwardRef } from 'react';
import Link from 'next/link';
import { useNavigationRouter } from './NavigationProvider';
import { clientNavigationDestination } from '@/lib/navigation.mjs';

// Preserve normal links, modified clicks, downloads and in-page anchors.
export default forwardRef(function NavigationLink({ href, onClick, replace, scroll, ...props }, ref) {
  const router = useNavigationRouter();
  const handleClick = event => {
    onClick?.(event);
    const destination = clientNavigationDestination(href, window.location.href, {
      defaultPrevented: event.defaultPrevented, button: event.button,
      metaKey: event.metaKey, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey,
      download: props.download, target: props.target,
    });
    if (!destination) return;
    event.preventDefault();
    if (replace) router.replace(destination, { scroll });
    else router.push(destination, { scroll });
  };
  return <Link ref={ref} href={href} replace={replace} scroll={scroll} {...props} onClick={handleClick} />;
});
