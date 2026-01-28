# Session Data Storage Examples

## Overview

Session data is stored in **TWO** database tables:

1. **`sessions` table** - Custom table for tracking session metadata and status
2. **`user_sessions` table** - Created by `connect-pg-simple` to store actual session data

---

## 1. Custom `sessions` Table

This table stores session metadata including status (login/logout), IP address, user agent, and expiration.

### Example Record (After Login)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sid": "sess:abc123xyz789def456",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "expires_at": "2026-01-29T11:50:14.000Z",
  "created_at": "2026-01-28T11:50:14.000Z",
  "updated_at": "2026-01-28T11:50:14.000Z",
  "logged_out_at": null
}
```

### Example Record (After Logout)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sid": "sess:abc123xyz789def456",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "logged_out",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "expires_at": "2026-01-29T11:50:14.000Z",
  "created_at": "2026-01-28T11:50:14.000Z",
  "updated_at": "2026-01-28T12:30:45.000Z",
  "logged_out_at": "2026-01-28T12:30:45.000Z"
}
```

### SQL Query Example

```sql
SELECT * FROM sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND status = 'active';
```

---

## 2. `user_sessions` Table (connect-pg-simple)

This table is automatically created by `connect-pg-simple` and stores the actual session data as JSON.

### Table Structure

- `sid` (VARCHAR) - Session ID (primary key)
- `sess` (JSON) - Session data stored as JSON
- `expire` (TIMESTAMP) - Session expiration time

### Example Record (After Login)

```json
{
  "sid": "sess:abc123xyz789def456",
  "sess": {
    "cookie": {
      "originalMaxAge": 86400000,
      "expires": "2026-01-29T11:50:14.000Z",
      "secure": false,
      "httpOnly": true,
      "sameSite": "lax"
    },
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "rajat.verma@example.com",
    "role": "user",
    "status": "login"
  },
  "expire": "2026-01-29T11:50:14.000Z"
}
```

### Example Record (After Logout)

When a user logs out, the session is destroyed, so the record is typically deleted from `user_sessions` table. However, if you want to keep a record, it would look like:

```json
{
  "sid": "sess:abc123xyz789def456",
  "sess": {
    "cookie": {
      "originalMaxAge": 86400000,
      "expires": "2026-01-29T11:50:14.000Z",
      "secure": false,
      "httpOnly": true,
      "sameSite": "lax"
    },
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "rajat.verma@example.com",
    "role": "user",
    "status": "logout"
  },
  "expire": "2026-01-29T11:50:14.000Z"
}
```

### SQL Query Example

```sql
SELECT sid, sess->>'userId' as user_id, sess->>'status' as status, expire 
FROM user_sessions 
WHERE sess->>'userId' = '550e8400-e29b-41d4-a716-446655440000';
```

---

## How Data Flows

### On Login:

1. **Express creates session** → Stores in `user_sessions` table with `sid`
2. **Auth service calls `sessionService.createSession()`** → Creates record in `sessions` table
3. **Session data is set** → `req.session.userId`, `req.session.email`, `req.session.role`, `req.session.status = 'login'`

### On Logout:

1. **Auth service calls `sessionService.updateSessionStatus()`** → Updates `sessions` table: `status = 'logged_out'`, sets `loggedOutAt`
2. **Session is destroyed** → Record removed from `user_sessions` table (or status updated if kept)

---

## Real-World Example

Let's say user "Rajat Verma" logs in:

**Step 1: User logs in with:**
- Email: `rajat.verma@example.com`
- IP: `192.168.1.100`
- User Agent: `Mozilla/5.0...`

**Step 2: Data stored in `sessions` table:**
```sql
INSERT INTO sessions (sid, user_id, status, ip_address, user_agent, expires_at)
VALUES (
  'sess:abc123xyz789def456',
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  '192.168.1.100',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  '2026-01-29T11:50:14.000Z'
);
```

**Step 3: Data stored in `user_sessions` table (by connect-pg-simple):**
```sql
INSERT INTO user_sessions (sid, sess, expire)
VALUES (
  'sess:abc123xyz789def456',
  '{"cookie":{"originalMaxAge":86400000,"expires":"2026-01-29T11:50:14.000Z","secure":false,"httpOnly":true,"sameSite":"lax"},"userId":"550e8400-e29b-41d4-a716-446655440000","email":"rajat.verma@example.com","role":"user","status":"login"}',
  '2026-01-29T11:50:14.000Z'
);
```

**Step 4: User logs out - `sessions` table updated:**
```sql
UPDATE sessions 
SET status = 'logged_out', 
    updated_at = NOW(), 
    logged_out_at = NOW()
WHERE sid = 'sess:abc123xyz789def456';
```

**Step 5: `user_sessions` record is deleted (by connect-pg-simple):**
```sql
DELETE FROM user_sessions WHERE sid = 'sess:abc123xyz789def456';
```

---

## Querying Active Sessions

### Get all active sessions for a user:

```sql
SELECT s.*, u.email, u.user_name
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND s.status = 'active'
  AND s.expires_at > NOW();
```

### Get session with user details:

```sql
SELECT 
  s.id,
  s.sid,
  s.status,
  s.ip_address,
  s.user_agent,
  s.created_at,
  s.logged_out_at,
  u.email,
  u.user_name,
  u.first_name,
  u.last_name
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.sid = 'sess:abc123xyz789def456';
```
