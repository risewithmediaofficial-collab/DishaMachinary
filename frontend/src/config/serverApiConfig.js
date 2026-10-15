const backendServer = import.meta.env.VITE_BACKEND_SERVER;

export const API_BASE_URL =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE === 'remote'
    ? (backendServer ? `${backendServer.replace(/\/+$/, '')}/api/` : '/api/')
    : 'http://localhost:8888/api/';

export const BASE_URL =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE === 'remote'
    ? (backendServer ? `${backendServer.replace(/\/+$/, '')}/` : '/')
    : 'http://localhost:8888/';

export const WEBSITE_URL = import.meta.env.PROD
  ? (typeof window !== 'undefined' ? `${window.location.origin}/` : '/')
  : 'http://localhost:3000/';

export const DOWNLOAD_BASE_URL =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE === 'remote'
    ? (backendServer ? `${backendServer.replace(/\/+$/, '')}/download/` : '/download/')
    : 'http://localhost:8888/download/';

export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL ||
  (import.meta.env.PROD ? '/' : 'http://localhost:8888/');

