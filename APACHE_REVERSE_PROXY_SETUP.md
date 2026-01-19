# Apache Reverse Proxy Setup for IT Assets Manager

## The Issue with Apache + PM2

When using Apache as a reverse proxy:

- User accesses: `http://server/it-assets-manager` (or HTTPS)
- Apache forwards to: `http://localhost:3000`
- **Problem**: App sets `secure: true` cookies, but receives HTTP connections
- **Result**: Cookies are rejected by the browser!

## Solution

### 1. Apache Virtual Host Configuration

Add this to your Apache configuration (e.g., `/etc/apache2/sites-available/000-default.conf`):

```apache
<VirtualHost *:80>
    # Or *:443 for HTTPS
    ServerName your-server.com

    # Enable required modules
    # Run: sudo a2enmod proxy proxy_http headers rewrite

    # Proxy configuration for IT Assets Manager
    <Location /it-assets-manager>
        ProxyPass http://localhost:3000/it-assets-manager
        ProxyPassReverse http://localhost:3000/it-assets-manager

        # Forward headers for proper request handling
        ProxyPreserveHost On
        RequestHeader set X-Forwarded-Proto "http"
        RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s

        # Cookie path rewriting (if needed)
        ProxyPassReverseCookiePath /it-assets-manager /it-assets-manager
    </Location>

    # Optional: Redirect root to subdirectory
    # RedirectMatch ^/$ /it-assets-manager/
</VirtualHost>
```

**For HTTPS (Recommended)**:

```apache
<VirtualHost *:443>
    ServerName your-server.com

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    <Location /it-assets-manager>
        ProxyPass http://localhost:3000/it-assets-manager
        ProxyPassReverse http://localhost:3000/it-assets-manager

        ProxyPreserveHost On
        RequestHeader set X-Forwarded-Proto "https"
        RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s

        ProxyPassReverseCookiePath /it-assets-manager /it-assets-manager
    </Location>
</VirtualHost>
```

### 2. Enable Required Apache Modules

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod ssl  # If using HTTPS

# Restart Apache
sudo systemctl restart apache2
```

### 3. PM2 Environment Configuration

Your `ecosystem.config.js` is already configured with:

```javascript
env: {
  NODE_ENV: "production",
  PORT: 3000,
  NEXT_PUBLIC_BASE_PATH: "/it-assets-manager",
  COOKIE_SECURE: "false",  // Set to false for HTTP proxy
}
```

**Important**:

- Set `COOKIE_SECURE: "false"` if Apache handles HTTPS but forwards HTTP to app
- Set `COOKIE_SECURE: "true"` only if app receives HTTPS directly (not through proxy)

### 4. Deployment Steps

```bash
# 1. Stop PM2
pm2 stop all

# 2. Rebuild the application
pnpm build

# 3. Start with PM2
pm2 start ecosystem.config.js

# 4. Save PM2 configuration
pm2 save

# 5. Check Apache configuration
sudo apachectl configtest

# 6. Restart Apache
sudo systemctl restart apache2
```

### 5. Verify Setup

1. **Access your app**: `http://your-server/it-assets-manager`
2. **Login** with credentials
3. **Open Browser DevTools** → Application → Cookies
4. **Check for `ticketing_session` cookie**:
   - Name: `ticketing_session`
   - Path: `/it-assets-manager`
   - HttpOnly: ✓
   - Secure: ✗ (if using HTTP) or ✓ (if using HTTPS with proper setup)
   - SameSite: `Lax`

5. **Check PM2 logs**:

```bash
pm2 logs it-assets-manager
```

Look for successful login messages, not "Logged User null"

## Troubleshooting

### Issue: Still getting "Logged User null"

**Check 1: Cookie Path**

```bash
# In browser console, check cookies:
document.cookie
```

Should show `ticketing_session=...`

**Check 2: Environment Variables**

```bash
pm2 show it-assets-manager
```

Verify:

- `NEXT_PUBLIC_BASE_PATH: /it-assets-manager`
- `COOKIE_SECURE: false`

**Check 3: Apache Headers**

```apache
# Add to Apache config for debugging:
LogLevel proxy:trace1
```

Then check Apache logs:

```bash
sudo tail -f /var/log/apache2/error.log
```

**Check 4: Session Secret**
Ensure `SESSION_SECRET` is set in your environment:

```bash
# Add to .env file or PM2 config
SESSION_SECRET=your-secure-secret-here
```

### Issue: 502 Bad Gateway

Apache can't reach the app:

```bash
# Check if app is running
pm2 status

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Restart PM2
pm2 restart it-assets-manager
```

### Issue: Cookies work but logout doesn't

This is likely a different issue. Check:

```bash
# Monitor PM2 logs during logout
pm2 logs --lines 50
```

### Issue: Works on localhost but not through Apache

Check Apache proxy configuration:

```bash
# Test Apache config
sudo apachectl configtest

# Check if proxy modules are enabled
apache2ctl -M | grep proxy
```

## Alternative: Using ProxyPass with Trailing Slashes

If issues persist, try this Apache config:

```apache
<Location /it-assets-manager/>
    ProxyPass http://localhost:3000/it-assets-manager/
    ProxyPassReverse http://localhost:3000/it-assets-manager/
    ProxyPreserveHost On
</Location>

# Also handle without trailing slash
RedirectMatch ^/it-assets-manager$ /it-assets-manager/
```

## Security Recommendations

1. **Use HTTPS in production**:
   - Get free SSL cert: `sudo certbot --apache`
   - Set `COOKIE_SECURE: "true"` after HTTPS is working

2. **Generate strong SESSION_SECRET**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Restrict access to sensitive files**:

```apache
<Directory /path/to/app>
    Require all denied
</Directory>
```

4. **Enable Apache security headers**:

```apache
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
```

## Quick Reference Commands

```bash
# PM2
pm2 restart it-assets-manager
pm2 logs it-assets-manager
pm2 show it-assets-manager

# Apache
sudo systemctl restart apache2
sudo systemctl status apache2
sudo apachectl configtest
sudo tail -f /var/log/apache2/error.log

# Check port
sudo netstat -tlnp | grep 3000
curl http://localhost:3000/it-assets-manager
```
