# Desktop App Security Implementation

## Overview

This document describes the security measures implemented for the ProSpine Desktop Application API.

## Security Features Implemented

### 1. Rate Limiting

**Location:** `desktop/server/common/security.php`

- **Standard Endpoints:** 100 requests per minute per IP/user
- **Sensitive Endpoints (login):** 5 requests per minute per IP (prevents brute force attacks)
- Rate limit data is stored in `desktop/server/tmp/rate_limits/`
- Returns HTTP 429 with `Retry-After` header when exceeded
- Headers returned:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when window resets

### 2. Token-Based Authentication

**Location:** `desktop/server/common/security.php`

- Database-backed API tokens stored in `api_tokens` table
- Tokens are 64-character random hex strings
- Default token validity: 24 hours
- Tokens include:
  - `employee_id` reference
  - `created_at` timestamp
  - `expires_at` timestamp
  - `last_used_at` tracking
  - `is_revoked` flag for logout
  - IP and User-Agent logging

**Token Flow:**

1. User logs in via `/auth/login.php`
2. Server generates token and stores in database
3. Token is returned to frontend
4. Frontend stores token in localStorage (via Zustand persist)
5. All subsequent API calls include `Authorization: Bearer <token>` header
6. Server validates token on each request

### 3. CORS Configuration

**Location:** `desktop/server/common/security.php`

Allowed Origins:

- `http://localhost:3000` (Vite dev)
- `http://localhost:5173` (Vite dev alternate)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- `http://localhost`
- `http://127.0.0.1`
- `tauri://localhost` (Tauri desktop app)
- `https://tauri.localhost` (Tauri secure)
- `https://prospine.in` (Production)
- `https://www.prospine.in` (Production www)

Requests from unlisted origins will receive HTTP 403.

## Files Updated

### Backend (PHP)

All API endpoints now use the security middleware:

1. **Security Middleware:** `desktop/server/common/security.php` (NEW)
2. **Auth:**
   - `desktop/server/api/auth/login.php` - Strict rate limiting, token generation
3. **Reception APIs:**
   - `desktop/server/api/reception/dashboard.php`
   - `desktop/server/api/reception/patients.php`
   - `desktop/server/api/reception/inquiry.php`
   - `desktop/server/api/reception/inquiry_submit.php`
   - `desktop/server/api/reception/registration.php`
   - `desktop/server/api/reception/registration_submit.php`
   - `desktop/server/api/reception/form_options.php`
   - `desktop/server/api/reception/schedule.php`
   - `desktop/server/api/reception/notifications.php`
   - `desktop/server/api/reception/search_patients.php`
   - `desktop/server/api/reception/chat.php`

### Frontend (TypeScript)

1. **Config:** `desktop/frontend/src/config.ts` - Added `authFetch` wrapper
2. **Components Updated:**
   - `desktop/frontend/src/reception/Dashboard.tsx`
   - `desktop/frontend/src/reception/Patients.tsx`

### Database Changes Required

Run this SQL to create the tokens table:

```sql
CREATE TABLE IF NOT EXISTS api_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP NULL,
    is_revoked TINYINT(1) DEFAULT 0,
    user_agent VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_employee_expires (employee_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Note: The table is auto-created on first login if it doesn't exist.

## Usage in Frontend

### Using authFetch (Recommended)

```typescript
import { API_BASE_URL, authFetch } from "../config";

// GET request
const response = await authFetch(
  `${API_BASE_URL}/reception/dashboard.php?branch_id=1`
);
const data = await response.json();

// POST request
const response = await authFetch(`${API_BASE_URL}/reception/patients.php`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "fetch", branch_id: 1 }),
});
```

### Authentication Headers Added Automatically

- `Authorization: Bearer <token>`
- `X-Employee-ID: <employee_id>`
- `X-Branch-ID: <branch_id>`

### Auto-Redirect on Session Expiry

If a 401 response is received, the user is automatically logged out and redirected to `/login`.

## Testing the Security

### Test Rate Limiting

```bash
# Make 6 rapid login attempts - 6th should be blocked
for i in {1..6}; do
  curl -X POST http://localhost/admin/desktop/server/api/auth/login.php \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}' \
    -w "\n"
done
```

### Test Authentication Required

```bash
# Without token - should return 401
curl http://localhost/admin/desktop/server/api/reception/dashboard.php?branch_id=1

# With valid token
curl http://localhost/admin/desktop/server/api/reception/dashboard.php?branch_id=1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test CORS

```bash
# From allowed origin - should work
curl http://localhost/admin/desktop/server/api/reception/dashboard.php?branch_id=1 \
  -H "Origin: http://localhost:5173" \
  -H "Authorization: Bearer YOUR_TOKEN"

# From disallowed origin - should return 403
curl http://localhost/admin/desktop/server/api/reception/dashboard.php?branch_id=1 \
  -H "Origin: http://evil.com"
```

## Remaining Work

The following frontend files should also be updated to use `authFetch`:

- `desktop/frontend/src/reception/Registration.tsx`
- `desktop/frontend/src/reception/Inquiry.tsx`
- `desktop/frontend/src/reception/Schedule.tsx`
- `desktop/frontend/src/reception/CancelledRegistrations.tsx`
- `desktop/frontend/src/components/Chat/ChatModal.tsx`
- Any other components making API calls

## Security Best Practices Applied

1. ✅ Rate limiting prevents DoS and brute force attacks
2. ✅ Token-based authentication validates user sessions
3. ✅ CORS restricts API access to allowed origins
4. ✅ Tokens expire after 24 hours
5. ✅ Tokens can be revoked (logout)
6. ✅ Security events are logged to `desktop/server/logs/`
7. ✅ Error messages don't expose sensitive information in production
8. ✅ IP addresses and user agents are logged for audit trails
