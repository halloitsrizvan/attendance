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

/**
 * Displays a modern, non-intrusive toast notification on the client side.
 */
export function showTestUserToast(customMessage) {
  if (typeof window === 'undefined') return;

  const existingToast = document.getElementById('test-user-view-only-toast');
  if (existingToast) {
    existingToast.classList.remove('opacity-0', 'translate-y-4');
    existingToast.classList.add('opacity-100', 'translate-y-0');
    return;
  }

  const toastContainer = document.createElement('div');
  toastContainer.id = 'test-user-view-only-toast';
  toastContainer.className =
    'fixed bottom-6 right-6 z-[9999] max-w-md bg-slate-900/95 text-white border border-amber-500/40 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3.5 transition-all duration-300 transform translate-y-0 opacity-100 font-sans';

  toastContainer.innerHTML = `
    <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <div class="flex-1">
      <p class="text-xs font-black uppercase tracking-wider text-amber-400">View-Only Mode</p>
      <p class="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">${
        customMessage || 'Action disabled for test user (test@gmail.com). You can view the entire website, but cannot modify data.'
      }</p>
    </div>
    <button id="close-test-user-toast" class="text-slate-400 hover:text-white p-1 transition-colors">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;

  document.body.appendChild(toastContainer);

  const closeBtn = document.getElementById('close-test-user-toast');
  if (closeBtn) {
    closeBtn.onclick = () => {
      toastContainer.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toastContainer.remove(), 300);
    };
  }

  setTimeout(() => {
    if (document.body.contains(toastContainer)) {
      toastContainer.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => {
        if (document.body.contains(toastContainer)) {
          toastContainer.remove();
        }
      }, 300);
    }
  }, 4500);
}

let isInterceptorInitialized = false;

/**
 * Initializes global Axios request/response interceptors to prevent mutations from test@gmail.com.
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

        // Intercept mutation methods if test user on internal requests
        const method = (config.method || 'get').toLowerCase();
        const isMutation = ['post', 'put', 'patch', 'delete'].includes(method);
        const isLoginRequest = url.includes('/teachers/login') || url.includes('/students/login');

        if (isMutation && !isLoginRequest && isTestUser(teacherEmail)) {
          showTestUserToast('Action disabled: test@gmail.com has View-Only access across the teacher panel.');
          
          return Promise.reject({
            isTestUserBlocked: true,
            message: 'Action cancelled: test@gmail.com is restricted from mutations.',
            config
          });
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.isTestUserBlocked) {
        return Promise.reject(error);
      }
      if (error?.response?.status === 403 && error?.response?.data?.isTestUserRestricted) {
        showTestUserToast(error.response.data.error || 'Action restricted for test user.');
      }
      return Promise.reject(error);
    }
  );
}
