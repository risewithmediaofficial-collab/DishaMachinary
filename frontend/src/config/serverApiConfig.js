const rawBackend = (import.meta.env.VITE_BACKEND_SERVER || '').trim();
const isPlaceholder =
  !rawBackend ||
  rawBackend.includes('your_backend_url_server') ||
  rawBackend.includes('your_url_backend_server') ||
  rawBackend === '/';

export const API_BASE_URL =
  import.meta.env.PROD
    ? (!isPlaceholder ? `${rawBackend.replace(/\/+$/, '')}/api/` : '/api/')
    : (import.meta.env.VITE_DEV_REMOTE === 'remote' && !isPlaceholder
        ? `${rawBackend.replace(/\/+$/, '')}/api/`
        : 'http://localhost:8888/api/');

export const BASE_URL =
  import.meta.env.PROD
    ? (!isPlaceholder ? `${rawBackend.replace(/\/+$/, '')}/` : '/')
    : (import.meta.env.VITE_DEV_REMOTE === 'remote' && !isPlaceholder
        ? `${rawBackend.replace(/\/+$/, '')}/`
        : 'http://localhost:8888/');

export const WEBSITE_URL = import.meta.env.PROD
  ? (typeof window !== 'undefined' ? `${window.location.origin}/` : '/')
  : 'http://localhost:3000/';

export const DOWNLOAD_BASE_URL =
  import.meta.env.PROD
    ? (!isPlaceholder ? `${rawBackend.replace(/\/+$/, '')}/download/` : '/download/')
    : (import.meta.env.VITE_DEV_REMOTE === 'remote' && !isPlaceholder
        ? `${rawBackend.replace(/\/+$/, '')}/download/`
        : 'http://localhost:8888/download/');

export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL =
  import.meta.env.PROD
    ? (!isPlaceholder && import.meta.env.VITE_FILE_BASE_URL ? import.meta.env.VITE_FILE_BASE_URL : '/')
    : (import.meta.env.VITE_FILE_BASE_URL || 'http://localhost:8888/');


