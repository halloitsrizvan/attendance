// Client-side expiry checks improve navigation only; APIs still verify signatures.
export function teacherSessionIsCurrent(token, now = Date.now()) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const roles = Array.isArray(payload.role) ? payload.role : [payload.role];
    return typeof payload.id === 'string' && roles.length > 0 &&
      roles.every(role => typeof role === 'string' && role.length > 0 && role !== 'student') &&
      (payload.exp === undefined || (Number.isFinite(payload.exp) && payload.exp * 1000 > now));
  } catch { return false; }
}

export function teacherReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\u0000-\u0020\\]/.test(value) || value.split(/[?#]/)[0] === '/login') return '/';
  return value;
}

export function teacherSignInPath(returnTo, reason = 'session-expired') {
  return `/login?${new URLSearchParams({ reason, next: teacherReturnPath(returnTo) })}`;
}
