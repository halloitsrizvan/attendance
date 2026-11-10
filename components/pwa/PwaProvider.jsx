"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, WifiOff } from 'lucide-react';
import styles from './Pwa.module.css';

export default function PwaProvider() {
    const pathname = usePathname();
    const showInstall = ['/', '/login', '/students-login', '/students-portal'].includes(pathname);
    const isStudent = pathname === '/students-login' || pathname?.startsWith('/students-portal');
    useEffect(() => {
        const href = isStudent ? '/manifest-student.json' : '/manifest.json';
        let link = document.querySelector('link[rel="manifest"]');
        if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link); }
        if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    }, [isStudent]);
    const [prompt, setPrompt] = useState(null);
    const [ios, setIos] = useState(false);
    const [dismissed, setDismissed] = useState(true);
    const [offline, setOffline] = useState(false);
    const [installing, setInstalling] = useState(false);
    useEffect(() => {
        let standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
        let hidden = false;
        try { hidden = Date.now() - Number(localStorage.getItem('pwa-install-dismissed') || 0) < 7 * 86400000; } catch {}
        setDismissed(standalone || hidden);
        setIos(!standalone && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)));
        const beforeInstall = event => { event.preventDefault(); setPrompt(event); };
        const installed = () => { setPrompt(null); setDismissed(true); };
        const connection = () => setOffline(!navigator.onLine);
        connection();
        window.addEventListener('beforeinstallprompt', beforeInstall);
        window.addEventListener('appinstalled', installed);
        window.addEventListener('online', connection);
        window.addEventListener('offline', connection);
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator && window.isSecureContext) {
            navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(error => console.error('Service worker registration failed:', error));
        }
        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstall);
            window.removeEventListener('appinstalled', installed);
            window.removeEventListener('online', connection);
            window.removeEventListener('offline', connection);
        };
    }, []);
    function dismiss() {
        setDismissed(true);
        try { localStorage.setItem('pwa-install-dismissed', String(Date.now())); } catch {}
    }
    async function install() {
        if (!prompt || installing) return;
        setInstalling(true);
        try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === 'accepted') setDismissed(true);
            else dismiss();
        } catch { /* The browser can withdraw installation eligibility. */ }
        finally { setPrompt(null); setInstalling(false); }
    }
    return <>
        {offline && <div className={styles.offline} role="status"><WifiOff size={15} />You're offline. Reconnect before saving changes.</div>}
        {showInstall && !dismissed && (prompt || ios) && <aside className={styles.install} aria-label="Install Darul Irfan app">
            <span className={styles.icon}><Download size={20} /></span><div><strong>Darul Irfan on your home screen</strong><p>{ios ? 'Tap Share, then Add to Home Screen.' : 'Open your portal like an app.'}</p></div>
            {prompt && <button onClick={install} disabled={installing} className={styles.installButton}>{installing ? 'Opening...' : 'Install'}</button>}
            <button onClick={dismiss} className={styles.close} aria-label="Dismiss installation suggestion"><X size={18} /></button>
        </aside>}
    </>;
}
