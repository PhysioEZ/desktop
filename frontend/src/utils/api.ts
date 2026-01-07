/**
 * API Utility for Desktop Application
 * 
 * This module provides a secure fetch wrapper that:
 * 1. Automatically adds authentication headers
 * 2. Handles token refresh/expiration
 * 3. Provides consistent error handling
 */

import { useAuthStore } from '../store/useAuthStore';

export const API_BASE_URL = "http://localhost/admin/desktop/server/api";

// Types
interface ApiResponse<T = unknown> {
  status?: 'success' | 'error';
  success?: boolean;
  message?: string;
  data?: T;
  code?: string;
  [key: string]: unknown;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Get authentication headers for API requests
 */
function getAuthHeaders(): Record<string, string> {
  const user = useAuthStore.getState().user;
  
  if (!user?.token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${user.token}`,
    'X-Employee-ID': String(user.employee_id),
    'X-Branch-ID': String(user.branch_id),
  };
}

/**
 * Handle authentication errors (401)
 */
function handleAuthError(): void {
  const { logout } = useAuthStore.getState();
  
  // Clear the session
  logout();
  
  // Redirect to login
  window.location.href = '/login';
}

/**
 * Secure fetch wrapper with authentication
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  // Build headers
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(!skipAuth ? getAuthHeaders() : {}),
    ...(headers as Record<string, string>),
  };

  // Build full URL
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: finalHeaders,
    });

    // Handle rate limiting
    if (response.status === 429) {
      const data = await response.json();
      const retryAfter = data.retry_after || response.headers.get('Retry-After') || 60;
      throw new Error(`Rate limited. Please try again in ${retryAfter} seconds.`);
    }

    // Handle authentication errors
    if (response.status === 401) {
      handleAuthError();
      throw new Error('Session expired. Please login again.');
    }

    // Handle CORS/forbidden errors
    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission for this action.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  // Build query string
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return apiFetch<T>(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: Record<string, unknown>,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body?: Record<string, unknown>,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: 'DELETE',
    ...options,
  });
}

/**
 * Upload file with authentication
 * Note: Does not set Content-Type header (let browser set it for FormData)
 */
export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  // Build headers (without Content-Type for FormData)
  const finalHeaders: Record<string, string> = {
    ...(!skipAuth ? getAuthHeaders() : {}),
    ...(headers as Record<string, string>),
  };

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: finalHeaders,
      ...restOptions,
    });

    if (response.status === 401) {
      handleAuthError();
      throw new Error('Session expired. Please login again.');
    }

    if (response.status === 429) {
      const data = await response.json();
      throw new Error(`Rate limited. Please try again in ${data.retry_after || 60} seconds.`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}
