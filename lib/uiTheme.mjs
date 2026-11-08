// Presentation boundaries only. Authorization remains in the existing guards/APIs.
export const ADMIN_UI_ROUTES = [
  '/report', '/attendance-report', '/students-management', '/teachers-management',
  '/minus-report', '/medical-report', '/admin-complaints', '/settings',
  '/leave-docs', '/medical-docs', '/program-docs', '/edit-class-page',
  '/zehnuth/admin-achievements', '/class-reports/admin-review',
  '/students-portal/controls',
];

export function usesCollegeTheme(pathname = '/') {
  return !ADMIN_UI_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export function showsTeacherDock(pathname = '/') {
  return usesCollegeTheme(pathname) && pathname !== '/' &&
    !['/attendance', '/leave-form', '/login', '/signup', '/student', '/students-login', '/students-portal'].some(route => pathname === route || pathname.startsWith(`${route}/`));
}
