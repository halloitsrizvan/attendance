import axios from 'axios';
import { createRequestCache } from '@/lib/requestCache.mjs';

const cache = createRequestCache();
let installed = false;
let currentIdentity = null;
export const clearApiCache = () => cache.clear();

// Only these JSON reads are cached. Reports, login, uploads and arbitrary URLs bypass it.
function lifetime(path) {
    if (path === '/api/classes' || path === '/api/settings') return 60000;
    if (/^\/api\/teachers\/[^/]+$/.test(path) && !/\/(login|signup)$/.test(path)) return 30000;
    if (path === '/api/students') return 30000;
    if (['/api/set-attendance', '/api/leave', '/api/minus', '/api/complaints', '/api/class-leave-docs', '/api/students/profile', '/api/zehnuth/points', '/api/zehnuth/mentor-mentee', '/api/zehnuth/leaderboard'].includes(path)) return 10000;
    return 0;
}
export function setupApiCache() {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    const transport = axios.getAdapter(axios.defaults.adapter);
    axios.defaults.adapter = async config => {
        const url = new URL(axios.getUri(config), window.location.origin);
        if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) return transport(config);
        const method = (config.method || 'get').toLowerCase();
        if (!['get', 'head', 'options'].includes(method)) {
            clearApiCache();
            try { return await transport(config); }
            finally {
                clearApiCache();
                // Notify other open tabs without persisting any response data.
                try { localStorage.setItem('api-cache-invalidated', String(Date.now()) + Math.random()); } catch { /* Storage can be disabled. */ }
            }
        }
        const ttl = lifetime(url.pathname);
        if (method !== 'get' || !ttl || config.cache === false || config.signal || config.cancelToken || (config.responseType && config.responseType !== 'json')) return transport(config);
        const authorization = config.headers?.get?.('Authorization') || config.headers?.Authorization || config.headers?.authorization || '';
        const identity = authorization || localStorage.getItem('token') || localStorage.getItem('studentToken') || 'anonymous';
        if (currentIdentity !== identity) { clearApiCache(); currentIdentity = identity; }
        const key = JSON.stringify([identity, url.href, config.headers?.get?.('x-user-email') || '']);
        const response = await cache.read(key, ttl, async () => {
            const result = await transport(config);
            // Axios transforms the cached raw response independently for each caller.
            return { data: result.data, status: result.status, statusText: result.statusText, headers: result.headers?.toJSON?.() || result.headers };
        });
        return { ...response, config, request: null };
    };
    window.addEventListener('focus', clearApiCache);
    window.addEventListener('storage', clearApiCache);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) clearApiCache(); });
}
