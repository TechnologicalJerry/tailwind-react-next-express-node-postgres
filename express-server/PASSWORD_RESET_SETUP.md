# Password Reset Feature Setup Guide

## Overview

The password reset feature allows users to reset their passwords via email using Gmail SMTP. The system generates secure tokens, sends them via email, and validates them when users reset their passwords.

## Gmail SMTP Setup

### Step 1: Enable 2-Step Verification
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **App**: Choose "Mail"
3. Select **Device**: Choose "Other (Custom name)" and enter "Express Server"
4. Click **Generate**
5. Copy the 16-character app password (you'll use this as `SMTP_PASS`)

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FRONTEND_URL=http://localhost:3000
```

**Important Notes:**
- `SMTP_USER`: Your Gmail address
- `SMTP_PASS`: The 16-character app password (not your regular Gmail password)
- `FRONTEND_URL`: The URL where your frontend reset password page is hosted

## Database Migration

After adding the password reset fields to the users schema, run:

```bash
npm run db:generate
npm run db:push
```

This will add the following fields to the `users` table:
- `password_reset_token` (VARCHAR)
- `password_reset_expires` (TIMESTAMP)

## API Endpoints

### 1. Forgot Password
**POST** `/api/auth/forgot-password`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "data": {
    "message": "If an account with that email exists, a password reset link has been sent."
  }
}
```

**Security Note:** The API always returns success message even if the email doesn't exist to prevent email enumeration attacks.

### 2. Reset Password
**POST** `/api/auth/reset-password`

Request body:
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePassword123",
  "confirmPassword": "NewSecurePassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password.",
  "data": {
    "message": "Password has been reset successfully. You can now login with your new password."
  }
}
```

## Password Reset Flow

1. **User requests password reset**
   - User submits email via `/api/auth/forgot-password`
   - System generates a secure random token (64 characters)
   - Token is hashed and stored in database with 1-hour expiration
   - Email is sent with reset link containing the plain token

2. **User clicks reset link**
   - Frontend extracts token from URL query parameter
   - User enters new password and confirms it
   - Frontend calls `/api/auth/reset-password` with token and new password

3. **System validates and resets**
   - Token is hashed and compared with stored hash
   - Expiration is checked
   - If valid, password is updated and token is cleared
   - User can now login with new password

## Email Template

The password reset email includes:
- Personalized greeting with user's name
- Reset button linking to frontend reset page
- Plain text link as fallback
- Expiration notice (1 hour)
- Security notice about ignoring if not requested

## Security Features

1. **Token Security**
   - Tokens are randomly generated (32 bytes = 64 hex characters)
   - Tokens are hashed before storage (SHA-256)
   - Tokens expire after 1 hour
   - Tokens are cleared after successful reset

2. **Email Enumeration Prevention**
   - API always returns success message regardless of email existence
   - Prevents attackers from discovering valid email addresses

3. **Rate Limiting**
   - Both endpoints use `authRateLimiter` to prevent abuse
   - Limits number of requests per IP address

## Testing

### Test Email Connection
You can test the SMTP connection by adding this to your server startup:

```typescript
import { emailService } from './services/email.service';

// Test SMTP connection on startup
emailService.verifyConnection();
```

### Test Password Reset Flow

1. **Request Reset:**
   ```bash
   curl -X POST http://localhost:5050/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
   ```

2. **Check Email:**
   - Check the inbox for the reset email
   - Extract the token from the reset link

3. **Reset Password:**
   ```bash
   curl -X POST http://localhost:5050/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "token": "extracted-token-from-email",
       "password": "NewPassword123",
       "confirmPassword": "NewPassword123"
     }'
   ```

## Troubleshooting

### Email Not Sending

1. **Check App Password:**
   - Ensure you're using the app password, not your regular Gmail password
   - Verify the app password is correct (16 characters, no spaces)

2. **Check 2-Step Verification:**
   - App passwords only work with 2-Step Verification enabled
   - Verify 2-Step Verification is active on your Google account

3. **Check SMTP Settings:**
   - Verify `SMTP_HOST` is `smtp.gmail.com`
   - Verify `SMTP_PORT` is `587`
   - Verify `SMTP_USER` is your full Gmail address

4. **Check Firewall/Network:**
   - Ensure port 587 is not blocked
   - Some networks block SMTP ports

### Token Invalid/Expired

- Tokens expire after 1 hour
- Each token can only be used once
- If expired, user must request a new reset link

### Frontend Integration

The reset link format is:
```
{FRONTEND_URL}/reset-password?token={reset-token}
```

Example:
```
http://localhost:3000/reset-password?token=abc123def456...
```

Your frontend should:
1. Extract the token from the URL query parameter
2. Display a password reset form
3. Call `/api/auth/reset-password` with the token and new password
4. Redirect to login page on success

## Files Modified/Created

- `src/db/schema/users.ts` - Added password reset fields
- `src/config/env.ts` - Added SMTP configuration
- `src/services/email.service.ts` - Email sending service
- `src/utils/resetToken.ts` - Token generation and validation
- `src/services/auth.service.ts` - Forgot/reset password logic
- `src/controllers/auth.controller.ts` - Password reset controllers
- `src/routes/auth.routes.ts` - Password reset routes
- `src/validators/auth.validator.ts` - Password reset validators
- `.env.example` - Added SMTP configuration example
- `postman_collection.json` - Added password reset endpoints
