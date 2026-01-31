// /src/config.ts
// API Configuration and Authenticated Fetch Utility
// For now it will be localhost but when uploaded to server, just change this URL

// API Base URL
// API Base URL
// export const API_BASE_URL = "https://prospine.in/admin/server/api";
export const API_BASE_URL = "http://localhost:3000/api";  
export const FILE_BASE_URL = "http://localhost:3000"; // Base for /uploads

// Example usage: `${API_BASE_URL}/reception/test_connection`

/**
 * Get authentication headers for API requests
 * This function reads from localStorage to avoid circular imports with the store
 */

function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    const user = parsed?.state?.user;
    
    if (!user?.token) return {};
    
    return {
      'Authorization': `Bearer ${user.token}`,
      'X-Employee-ID': String(user.employee_id || ''),
      'X-Branch-ID': String(user.branch_id || ''),
    };
  } catch {
    return {};
  }
}

/**
 * Authenticated fetch wrapper
 * Automatically adds authentication headers to all API requests
 * 
 * Usage: Same as native fetch
 * authFetch('/reception/dashboard?branch_id=1')
 * authFetch(url, { method: 'POST', body: JSON.stringify(data) })
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  
  // Merge auth headers with provided headers
  const headers = new Headers(init?.headers);
  Object.entries(authHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });
  
  // Set default Content-Type for non-FormData requests
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(input, {
    ...init,
    headers,
  });
  
  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    // Clear storage and redirect to login
    localStorage.removeItem('auth-storage');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  
  // Handle 429 Too Many Requests - rate limited
  if (response.status === 429) {
    const data = await response.clone().json().catch(() => ({}));
    throw new Error(`Rate limited. Please try again in ${data.retry_after || 60} seconds.`);
  }
  
  return response;
}

/**
 * Helper to make JSON POST requests with authentication
 */
export async function authPost(
  url: string,
  data: Record<string, unknown>
): Promise<Response> {
  return authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

