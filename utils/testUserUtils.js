import axios from 'axios';

export const TEST_USER_EMAIL = 'test@gmail.com';

/**
 * Checks if the current or provided user/email is the test user.
 */
export function isTestUser(userOrEmail) {
  if (typeof window === 'undefined') return false;

  let email = null;
  if (typeof userOrEmail === 'string') {
    email = userOrEmail;
  } else if (userOrEmail && typeof userOrEmail === 'object') {
    email = userOrEmail.email || userOrEmail.EMAIL;
  }

  if (!email) {
    try {
      const stored = localStorage.getItem('teacher');
      if (stored) {
        const parsed = JSON.parse(stored);
        email = parsed?.email || parsed?.EMAIL;
      }
    } catch (e) {
      // Ignore
    }
  }

  return Boolean(email && email.trim().toLowerCase() === TEST_USER_EMAIL);
}

let isInterceptorInitialized = false;

/**
 * Initializes Axios authentication headers for internal requests.
 */
export function setupAxiosTestUserInterceptors() {
  if (typeof window === 'undefined' || isInterceptorInitialized) return;
  isInterceptorInitialized = true;

  axios.interceptors.request.use(
    (config) => {
      const url = config.url || '';
      const isCloudinary = url.includes('cloudinary.com');
      const isInternal = !url.startsWith('http://') && !url.startsWith('https://') 
        || (typeof window !== 'undefined' && url.startsWith(window.location.origin));

      // 1. If it's Cloudinary, strip any auth headers to prevent CORS issues
      if (isCloudinary) {
        if (config.headers) {
          if (typeof config.headers.delete === 'function') {
            config.headers.delete('Authorization');
            config.headers.delete('authorization');
            config.headers.delete('x-user-email');
            config.headers.delete('X-User-Email');
          } else {
            delete config.headers.Authorization;
            delete config.headers.authorization;
            delete config.headers['x-user-email'];
            delete config.headers['X-User-Email'];
          }
        }
        return config;
      }

      // 2. Attach default token and user email if present ONLY for internal requests
      if (isInternal) {
        const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
        const teacherStr = localStorage.getItem('teacher');
        let teacherEmail = null;

        if (teacherStr) {
          try {
            const parsed = JSON.parse(teacherStr);
            teacherEmail = parsed?.email || parsed?.EMAIL;
          } catch (e) {
            // Ignore
          }
        }

        const hasAuth = config.headers?.Authorization || config.headers?.authorization
          || (typeof config.headers?.has === 'function' && config.headers.has('Authorization'));

        if (token && !hasAuth) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (teacherEmail && !config.headers['x-user-email']) {
          config.headers['x-user-email'] = teacherEmail;
        }


      }

      return config;
    },
    (error) => Promise.reject(error)
  );

}
