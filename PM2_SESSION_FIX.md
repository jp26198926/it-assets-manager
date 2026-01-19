# PM2 Production Cookie/Session Issues - Fixed

## Problem

After logging in on a production server using PM2, the session cookie was not being saved, causing the logged user to always be `null`.

## Root Causes

1. **Missing `sameSite` attribute** in cookie configuration
2. **Missing `path` attribute** in cookie configuration
3. **PM2 clustering issues** with session management
4. **Trust proxy settings** not configured

## Solutions Applied

### 1. Updated Cookie Configuration

Both `middleware.ts` and `lib/actions/auth.ts` now have proper cookie settings:

```typescript
cookieOptions: {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax" as const,  // ← ADDED
  path: "/",                  // ← ADDED
  maxAge: 60 * 60 * 24 * 7,  // 7 days
}
```

### 2. Created PM2 Ecosystem Configuration

Added `ecosystem.config.js` with proper settings for production.

## Deployment Steps

### Step 1: Set Environment Variables

Make sure your `.env` file on the production server has:

```bash
NODE_ENV=production
SESSION_SECRET=your_very_secure_secret_at_least_32_characters_long
NEXT_PUBLIC_BASE_PATH=/it-assets-manager  # Only if deploying to subdirectory
```

**IMPORTANT**: Generate a secure SESSION_SECRET:

```bash
# On your server, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Note**: If deploying to a subdirectory (e.g., `/it-assets-manager`), you MUST set `NEXT_PUBLIC_BASE_PATH` to match your `basePath` in `next.config.mjs`. This ensures cookies are set with the correct path.

### Step 2: Rebuild the Application

```bash
pnpm install
pnpm build
```

### Step 3: Deploy with PM2

```bash
# Stop existing PM2 process
pm2 stop all

# Start with ecosystem config
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Step 4: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Monitor logs
pm2 logs it-assets-manager

# Check if cookies are being set
pm2 logs it-assets-manager --lines 100 | grep -i cookie
```

## Additional Troubleshooting

### If using Nginx as reverse proxy

Add these headers to your Nginx configuration:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### If you need multiple PM2 instances

For scaling with multiple instances, you'll need a shared session store like Redis:

1. Install Redis dependencies:

```bash
pnpm add ioredis @redis/client
```

2. Update session configuration to use Redis (requires code modification)

3. Change ecosystem.config.js:

```javascript
instances: "max",  // Use all CPU cores
```

### Testing Cookie Storage

1. **Open Browser DevTools** → Application/Storage → Cookies
2. **Look for**: `ticketing_session` cookie
3. **Check attributes**:
   - Path: `/`
   - HttpOnly: ✓
   - Secure: ✓ (if using HTTPS)
   - SameSite: `Lax`

### Common Issues

**Problem**: Cookie still not saved

- Check if you're using HTTPS in production (`secure: true` requires HTTPS)
- Verify SESSION_SECRET is set and matches in all instances
- Check browser console for cookie errors

**Problem**: Session works but gets logged out randomly

- This happens with multiple PM2 instances without shared session store
- Solution: Use `instances: 1` or implement Redis session storage

**Problem**: CORS errors

- Add your domain to allowed origins
- Make sure sameSite is set to "lax" not "strict"

## Verify the Fix

1. **Login** to your application
2. **Check browser DevTools** → Application → Cookies
3. **Verify** `ticketing_session` cookie exists with proper attributes
4. **Refresh** the page - you should remain logged in
5. **Check** that user data appears in the header/profile

## PM2 Monitoring Commands

```bash
# View real-time logs
pm2 logs

# View application status
pm2 status

# Restart application
pm2 restart it-assets-manager

# Reload with zero-downtime
pm2 reload it-assets-manager

# View detailed info
pm2 show it-assets-manager

# Monitor CPU/Memory
pm2 monit
```

## Performance Notes

- Current config uses `instances: 1` to avoid session issues
- For high-traffic applications, implement Redis session store and use `instances: "max"`
- Monitor memory usage with `pm2 monit`
- Set up log rotation to prevent disk space issues

## Next Steps (Optional Improvements)

1. **Implement Redis for session storage** (for multiple instances)
2. **Set up log rotation** with PM2 or logrotate
3. **Configure PM2 monitoring** (keymetrics.io)
4. **Add health check endpoint** for load balancer
5. **Implement rate limiting** for login attempts
