# Deployment Guide - Subdirectory Setup

Deploy the IT Assets Manager under `http://[server-ip]/it-assets-manager`

## Prerequisites

- Ubuntu Server with Apache installed
- Node.js 20.x or higher
- MongoDB installed and running
- Existing Apache sites (will not be affected)

## Step 1: Install Dependencies on Server

```bash
# Update system
sudo apt update

# Install Node.js 20.x if not installed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MongoDB if not installed
# (Follow MongoDB installation steps from main deployment guide)
```

## Step 2: Upload Your Application

```bash
# Create application directory
sudo mkdir -p /var/www/it-assets-manager
sudo chown -R $USER:$USER /var/www/it-assets-manager

# Upload files to server
# Option 1: Using SCP
scp -r /path/to/ticketing/* user@server:/var/www/it-assets-manager/

# Option 2: Using rsync
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /path/to/ticketing/ user@server:/var/www/it-assets-manager/

# Option 3: Using Git
cd /var/www/it-assets-manager
git clone <your-repo-url> .
```

## Step 3: Configure Environment

```bash
cd /var/www/it-assets-manager

# Create .env file
nano .env
```

**Add to .env:**

```env
MONGODB_URI=mongodb://localhost:27017/it_assets_manager_production
SESSION_SECRET=your-generated-secret-key-here
NODE_ENV=production

# Optional: Email settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@company.com
```

**Generate SESSION_SECRET:**

```bash
openssl rand -base64 32
```

## Step 4: Build Application

```bash
cd /var/www/it-assets-manager

# Install dependencies
npm install --production

# Build for production
npm run build
```

## Step 5: Start with PM2

```bash
# Start application
pm2 start npm --name "it-assets-manager" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs

# Check status
pm2 status
pm2 logs it-assets-manager
```

## Step 6: Configure Apache

```bash
# Enable required Apache modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod headers
sudo a2enmod rewrite

# Find your main Apache site config
# Usually one of these:
ls /etc/apache2/sites-enabled/

# Edit your main site configuration
# Example: 000-default.conf or your-site.conf
sudo nano /etc/apache2/sites-enabled/000-default.conf
```

**Add this INSIDE your existing `<VirtualHost *:80>` block:**

```apache
    # IT Assets Manager - Subdirectory /it-assets-manager
    <Location /it-assets-manager>
        ProxyPass http://localhost:3000/it-assets-manager
        ProxyPassReverse http://localhost:3000/it-assets-manager

        # WebSocket support
        RewriteEngine on
        RewriteCond %{HTTP:Upgrade} websocket [NC]
        RewriteCond %{HTTP:Connection} upgrade [NC]
        RewriteRule ^/it-assets-manager/(.*) ws://localhost:3000/it-assets-manager/$1 [P,L]

        # Headers
        RequestHeader set X-Forwarded-Proto "http"
        RequestHeader set X-Forwarded-Prefix "/it-assets-manager"

        # Timeout for file uploads
        ProxyTimeout 300
    </Location>

    # Increase upload size
    LimitRequestBody 52428800
```

**Full example Apache config:**

```apache
<VirtualHost *:80>
    ServerAdmin admin@company.local
    ServerName company.local
    DocumentRoot /var/www/html

    # Your existing site configuration
    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # IT Assets Manager - NEW
    <Location /it-assets-manager>
        ProxyPass http://localhost:3000/it-assets-manager
        ProxyPassReverse http://localhost:3000/it-assets-manager

        RewriteEngine on
        RewriteCond %{HTTP:Upgrade} websocket [NC]
        RewriteCond %{HTTP:Connection} upgrade [NC]
        RewriteRule ^/it-assets-manager/(.*) ws://localhost:3000/it-assets-manager/$1 [P,L]

        RequestHeader set X-Forwarded-Proto "http"
        RequestHeader set X-Forwarded-Prefix "/it-assets-manager"
        ProxyTimeout 300
    </Location>

    LimitRequestBody 52428800

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

**Test and restart Apache:**

```bash
# Test configuration
sudo apache2ctl configtest

# If OK, restart Apache
sudo systemctl restart apache2

# Check Apache status
sudo systemctl status apache2
```

## Step 7: Test the Application

```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs it-assets-manager --lines 50

# Access in browser
http://[your-server-ip]/it-assets-manager
```

## Important Notes

### URL Structure

All URLs will include `/it-assets-manager`:

- Login: `http://server-ip/it-assets-manager/login`
- Dashboard: `http://server-ip/it-assets-manager/dashboard`
- Tickets: `http://server-ip/it-assets-manager/tickets`

### Installation Wizard

First visit: `http://server-ip/it-assets-manager/install`

### File Uploads

The config supports up to 50MB file uploads

### Existing Apps

Your existing Apache sites will NOT be affected. The IT Assets Manager only responds to `/it-assets-manager` path.

## Troubleshooting

### App not accessible

**Check PM2:**

```bash
pm2 status
pm2 logs it-assets-manager
```

**Check if app is running on port 3000:**

```bash
sudo netstat -tlnp | grep 3000
curl http://localhost:3000/it-assets-manager
```

### Apache proxy not working

**Check Apache modules:**

```bash
apache2ctl -M | grep proxy
```

Should show:

- proxy_module
- proxy_http_module
- proxy_wstunnel_module

**Check Apache logs:**

```bash
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/access.log
```

### 404 errors on static files

Make sure `basePath` and `assetPrefix` are set in `next.config.mjs`:

```javascript
basePath: '/it-assets-manager',
assetPrefix: '/it-assets-manager',
```

Rebuild if needed:

```bash
cd /var/www/it-assets-manager
npm run build
pm2 restart it-assets-manager
```

### Database connection issues

**Check MongoDB:**

```bash
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ping')"
```

**Check MONGODB_URI in .env:**

```bash
cd /var/www/ticketing
cat .env | grep MONGODB_URI
```

## Updates & Maintenance

### Deploy updates

```bash
cd /var/www/it-assets-manager

# Pull changes (if using git)
git pull

# Install new dependencies
npm install --production

# Rebuild
npm run build

# Restart
pm2 restart it-assets-manager

# Check logs
pm2 logs it-assets-manager --lines 50
```

### View logs

```bash
# PM2 logs
pm2 logs it-assets-manager

# Apache access log
sudo tail -f /var/log/apache2/access.log | grep it-assets-manager

# Apache error log
sudo tail -f /var/log/apache2/error.log
```

### Backup database

```bash
# Manual backup
mongodump --db it_assets_manager_production --out /backups/it-assets-manager/$(date +%Y%m%d)

# Automated backup (cron)
crontab -e
# Add: 0 2 * * * mongodump --db it_assets_manager_production --out /backups/it-assets-manager/$(date +\%Y\%m\%d)
```

## Security Checklist

✅ MongoDB secured (authentication enabled)  
✅ SESSION_SECRET is random and strong  
✅ Firewall configured (UFW)  
✅ Regular backups scheduled  
✅ Apache ServerTokens and ServerSignature disabled  
✅ File upload size limited  
✅ SSL certificate installed (optional but recommended)

## SSL Setup (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-apache

# Get SSL certificate
sudo certbot --apache -d your-domain.com

# Auto-renewal is setup automatically
sudo certbot renew --dry-run
```

After SSL, access via: `https://your-domain.com/it-assets-manager`

## Performance Optimization

### PM2 Cluster Mode

```bash
# Stop current instance
pm2 delete it-assets-manager

# Start in cluster mode (use all CPU cores)
pm2 start npm --name "it-assets-manager" -i max -- start

# Save
pm2 save
```

### Enable Apache caching

Add to Apache config:

```apache
<Location /it-assets-manager/_next/static>
    Header set Cache-Control "public, max-age=31536000, immutable"
</Location>
```

## Complete Deployment Checklist

- [ ] Node.js 20.x installed
- [ ] MongoDB installed and running
- [ ] PM2 installed globally
- [ ] Application files uploaded to `/var/www/it-assets-manager`
- [ ] `.env` file configured
- [ ] `npm run build` completed successfully
- [ ] PM2 running the app on port 3000
- [ ] Apache modules enabled
- [ ] Apache config updated with `/it-assets-manager` location
- [ ] Apache restarted successfully
- [ ] Can access `http://server-ip/it-assets-manager`
- [ ] Installation wizard completed
- [ ] Admin account created
- [ ] Email settings configured (optional)
- [ ] Backups scheduled

Your IT Assets Manager is now running at: **http://[server-ip]/it-assets-manager**
