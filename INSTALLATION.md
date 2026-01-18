# Installation System

The system now includes an automated installation wizard that guides you through the initial setup.

## Installation Steps

### 1. Access Installation

- Navigate to `/install` when first deploying the system
- The installation wizard will automatically check if setup is required

### 2. Installation Process

#### Step 1: Welcome

- Introduction to the installation wizard
- Click "Get Started" to begin

#### Step 2: Environment Check

- Validates required environment variables:
  - `MONGODB_URI` - Database connection string
  - `SESSION_SECRET` - Session encryption key
- Shows which variables are missing or present
- **Action Required**: Add missing variables to `.env` file before continuing

#### Step 3: Database Configuration

- **Check Local MongoDB**: Automatically detects MongoDB on localhost:27017
- **Manual Configuration**: Enter custom MongoDB URI
  - Format: `mongodb://localhost:27017/ticketing`
  - Or MongoDB Atlas: `mongodb+srv://...`
- **Test Connection**: Verifies database connectivity
- Must succeed before proceeding

#### Step 4: Admin Account

- Create the first admin user:
  - **Full Name**: Administrator's full name
  - **Username**: Default is "admin"
  - **Email**: Admin email address
  - **Password**: Secure password (min 6 characters)
- Click "Install System" to complete setup

#### Step 5: Complete

- System seeds default roles automatically
- Creates admin user with full permissions
- Redirects to login page

## Features

### Automatic Checks

- **Environment Validation**: Ensures all required env vars are set
- **Database Detection**: Finds local MongoDB if available
- **Connection Testing**: Validates MongoDB URI before setup
- **Installation Status**: Prevents duplicate installations

### Security

- Passwords are hashed using bcrypt
- Session secrets required for secure authentication
- Admin account created with full system permissions

### Default Roles Seeded

1. **Admin**: Full access to all modules
2. **Manager**: Create/update inventory, tickets, issuance
3. **Technician**: Update inventory/tickets, create/update issuance
4. **Employee**: Read-only access, can create tickets

## Environment Variables

Required in `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/ticketing
SESSION_SECRET=your-secret-key-at-least-32-characters-long
```

Optional for email notifications:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

## Post-Installation

After successful installation:

1. Login with admin credentials at `/login`
2. Configure email settings in Settings
3. Create additional users in Users module
4. Set up departments and categories
5. Begin using the system

## Troubleshooting

### Database Connection Failed

- Verify MongoDB is running
- Check URI format is correct
- Ensure network connectivity
- For MongoDB Atlas, verify IP whitelist

### Missing Environment Variables

- Add required variables to `.env` file
- Restart the application after changes
- Check for typos in variable names

### Installation Already Complete

- System automatically redirects to login
- To reinstall, clear the database users collection
- Or delete and recreate the database

## API Endpoints

Installation actions available:

- `checkEnvironmentVariables()` - Validates .env configuration
- `checkDatabaseConnection(uri)` - Tests MongoDB connectivity
- `checkLocalMongoDB()` - Detects local MongoDB instances
- `checkInstallationStatus()` - Determines if installation needed
- `seedDefaultRoles()` - Creates role definitions
- `seedDefaultUsers(adminData)` - Creates admin account
- `runInstallation(data)` - Executes complete installation
