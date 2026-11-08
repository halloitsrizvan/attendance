"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from './NavigationLink';
import { useNavigationRouter } from './NavigationProvider';
import { dockPosition } from '@/lib/dockGesture.mjs';
import styles from './SlidingDock.module.css';

export default function SlidingDock({ items, activeIndex = -1, label = 'Quick navigation', mobileOnly = false }) {
  const router = useNavigationRouter();
  const pathname = usePathname();
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [preview, setPreview] = useState(null);
  const [pressed, setPressed] = useState(false);
  useEffect(() => { setPreview(null); setPressed(false); gesture.current = null; }, [pathname]);

  const point = event => dockPosition(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect(), items.length);
  const start = event => {
    if (!event.isPrimary || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const hit = point(event);
    if (!hit) return;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPreview({ index: hit.index, position: hit.index });
    setPressed(true);
  };
  const move = event => {
    if (gesture.current?.id !== event.pointerId) return;
    const hit = point(event);
    setPreview(hit);
  };
  const cancel = () => { gesture.current = null; setPressed(false); setPreview(null); };
  const finish = event => {
    if (gesture.current?.id !== event.pointerId) return;
    const hit = point(event);
    gesture.current = null;
    setPressed(false);
    suppressClick.current = true;
    if (!hit) { setPreview(null); return; }
    setPreview({ index: hit.index, position: hit.index });
    const href = items[hit.index].href;
    if (pathname !== href) router.push(href);
    else setPreview(null);
  };
  const index = preview?.index ?? activeIndex;
  const position = preview?.position ?? activeIndex;

  return <nav aria-label={label} className={`${styles.dock} ${pressed ? styles.pressed : ''} ${mobileOnly ? styles.mobileOnly : ''}`}
    style={{ '--tabs': items.length, '--position': Math.max(0, position) }}
    onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel}
    onLostPointerCapture={() => { if (gesture.current) cancel(); }}
    onContextMenu={event => { if (gesture.current) event.preventDefault(); }}
    onClickCapture={event => { if (event.detail !== 0 && suppressClick.current) { suppressClick.current = false; event.preventDefault(); event.stopPropagation(); } }}>
    {position >= 0 && <span className={styles.thumb} aria-hidden="true" />}
    {items.map(({ href, icon: Icon, label: text }, i) => <Link key={href} href={href} prefetch={false} draggable={false}
      aria-current={i === activeIndex ? 'page' : undefined} className={i === index ? styles.highlighted : ''}>
      <Icon size={18} strokeWidth={1.7} /><span>{text}</span>
    </Link>)}
  </nav>;
}
