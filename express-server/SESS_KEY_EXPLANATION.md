# Understanding the `sess` Key in `user_sessions` Table

## What is `sess`?

The `sess` column is a **JSON/JSONB column** in the `user_sessions` table that stores all session data as a JSON object. This is automatically created and managed by `connect-pg-simple`.

---

## Structure of `sess` Object

The `sess` object contains two main parts:

### 1. **Cookie Configuration** (automatically added by express-session)
### 2. **Custom Session Data** (data you store via `req.session.*`)

---

## Complete `sess` Object Example

### After Login:

```json
{
  "cookie": {
    "originalMaxAge": 86400000,
    "expires": "2026-01-29T11:50:14.000Z",
    "secure": false,
    "httpOnly": true,
    "sameSite": "lax",
    "path": "/"
  },
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "rajat.verma@example.com",
  "role": "user",
  "status": "login"
}
```

### After Logout (if session still exists):

```json
{
  "cookie": {
    "originalMaxAge": 86400000,
    "expires": "2026-01-29T11:50:14.000Z",
    "secure": false,
    "httpOnly": true,
    "sameSite": "lax",
    "path": "/"
  },
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "rajat.verma@example.com",
  "role": "user",
  "status": "logout"
}
```

---

## Breakdown of Each Property

### 1. `cookie` Object (Automatic)
This is automatically added by `express-session` based on your session configuration:

```json
{
  "originalMaxAge": 86400000,        // From SESSION_MAX_AGE (24 hours in milliseconds)
  "expires": "2026-01-29T11:50:14Z", // Calculated expiration timestamp
  "secure": false,                   // From sessionConfig.cookie.secure (false in dev, true in prod)
  "httpOnly": true,                  // From sessionConfig.cookie.httpOnly
  "sameSite": "lax",                 // From sessionConfig.cookie.sameSite
  "path": "/"                        // Cookie path (default: "/")
}
```

### 2. Custom Session Data (Your Data)
These are the values you set in your code via `req.session.*`:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",  // Set via: req.session.userId = user.id
  "email": "rajat.verma@example.com",                  // Set via: req.session.email = user.email
  "role": "user",                                      // Set via: req.session.role = user.role
  "status": "login"                                    // Set via: req.session.status = 'login'
}
```

---

## Where These Values Come From

### In `src/services/auth.service.ts` (Login):

```typescript
// Create session if session exists in request
if (req.session) {
  const sessionId = req.sessionID;
  await sessionService.createSession(sessionId, user.id, req);
  
  // Store user info in session - THIS DATA GOES INTO 'sess' OBJECT
  req.session.userId = user.id;      // → sess.userId
  req.session.email = user.email;    // → sess.email
  req.session.role = user.role;      // → sess.role
  req.session.status = 'login';      // → sess.status
}
```

### In `src/config/session.ts` (Cookie Config):

```typescript
cookie: {
  secure: env.NODE_ENV === 'production',  // → sess.cookie.secure
  httpOnly: true,                        // → sess.cookie.httpOnly
  maxAge: env.SESSION_MAX_AGE,          // → sess.cookie.originalMaxAge
  sameSite: 'lax',                      // → sess.cookie.sameSite
}
```

---

## How to Access `sess` Data

### In Your Code (Express):

```typescript
// Access session data in any route/middleware
app.get('/profile', (req, res) => {
  const userId = req.session.userId;    // From sess.userId
  const email = req.session.email;       // From sess.email
  const role = req.session.role;         // From sess.role
  const status = req.session.status;      // From sess.status
  
  res.json({ userId, email, role, status });
});
```

### In Database (PostgreSQL):

```sql
-- Get all session data
SELECT sid, sess FROM user_sessions;

-- Get specific field from sess
SELECT 
  sid,
  sess->>'userId' as user_id,
  sess->>'email' as email,
  sess->>'role' as role,
  sess->>'status' as status,
  sess->'cookie'->>'expires' as expires
FROM user_sessions;

-- Find sessions by user ID
SELECT * FROM user_sessions 
WHERE sess->>'userId' = '550e8400-e29b-41d4-a716-446655440000';

-- Find active login sessions
SELECT * FROM user_sessions 
WHERE sess->>'status' = 'login';
```

---

## Visual Representation

```
user_sessions Table
┌─────────────────────┬─────────────────────────────────────────────────────────────┬─────────────────────┐
│ sid                 │ sess (JSON)                                                  │ expire              │
├─────────────────────┼─────────────────────────────────────────────────────────────┼─────────────────────┤
│ sess:abc123xyz789   │ {                                                           │ 2026-01-29 11:50:14 │
│                     │   "cookie": {                                               │                     │
│                     │     "originalMaxAge": 86400000,                             │                     │
│                     │     "expires": "2026-01-29T11:50:14Z",                       │                     │
│                     │     "secure": false,                                         │                     │
│                     │     "httpOnly": true,                                        │                     │
│                     │     "sameSite": "lax"                                        │                     │
│                     │   },                                                         │                     │
│                     │   "userId": "550e8400-e29b-41d4-a716-446655440000",         │                     │
│                     │   "email": "rajat.verma@example.com",                       │                     │
│                     │   "role": "user",                                            │                     │
│                     │   "status": "login"                                          │                     │
│                     │ }                                                            │                     │
└─────────────────────┴─────────────────────────────────────────────────────────────┴─────────────────────┘
```

---

## Adding More Data to `sess`

You can add any data you want to the session:

```typescript
// In any route or middleware
req.session.lastLogin = new Date().toISOString();
req.session.loginCount = 5;
req.session.preferences = {
  theme: 'dark',
  language: 'en'
};

// This will be stored in sess as:
// {
//   "cookie": {...},
//   "userId": "...",
//   "email": "...",
//   "role": "...",
//   "status": "login",
//   "lastLogin": "2026-01-28T11:50:14.000Z",
//   "loginCount": 5,
//   "preferences": {
//     "theme": "dark",
//     "language": "en"
//   }
// }
```

---

## Important Notes

1. **`sess` is automatically serialized/deserialized** - You don't need to manually convert to JSON
2. **Cookie data is automatic** - The `cookie` object is always present and managed by express-session
3. **Only store serializable data** - Don't store functions, circular references, or non-serializable objects
4. **Size limit** - Be mindful of session size (default cookie size limit is 4KB, but database storage can be larger)
5. **Security** - Never store sensitive data like passwords in sessions

---

## Summary

- **`sess`** = JSON object containing all session data
- **`sess.cookie`** = Automatic cookie configuration (from sessionConfig)
- **`sess.userId`, `sess.email`, `sess.role`, `sess.status`** = Your custom data (set via `req.session.*`)
- **Access in code**: `req.session.propertyName`
- **Access in DB**: `sess->>'propertyName'` (PostgreSQL JSON operators)
