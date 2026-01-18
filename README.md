# IT Assets Manager

A comprehensive IT asset management and ticketing system built with Next.js, MongoDB, and TypeScript.

## Features

### Asset Management

- **Inventory Tracking**: Track all IT assets with unique barcodes (IT2600001 format)
- **QR Code Generation**: Print QR codes with customizable colors for easy asset identification
- **Item Receiving**: Streamlined process for receiving and cataloging new items
- **Asset Issuance**: Track item assignments to employees with return dates
- **Repair Management**: Monitor items under repair with status tracking
- **Categories & Departments**: Organize assets by category and department

### Ticketing System

- **Multi-channel Ticket Creation**: Employees, guests, and admins can create tickets
- **Priority & Status Management**: Configure ticket priorities and statuses
- **Assignment & Escalation**: Assign tickets to technicians with role-based access
- **Email Notifications**: Automated notifications for ticket updates
- **Activity Tracking**: Comprehensive audit trail for all ticket activities
- **Guest Portal**: Public ticket submission without login required

### Knowledge Base

- **Rich Text Editor**: TipTap-powered documentation with formatting support
- **Category Organization**: Organize articles by categories
- **Search & Browse**: Find solutions quickly with search functionality
- **Public Access**: Knowledge base accessible to all users

### User Management

- **Role-Based Access Control (RBAC)**: Admin, Manager, Technician, Employee roles
- **Department Integration**: Link employees to departments
- **Secure Authentication**: Session-based auth with encrypted cookies
- **User Profiles**: Manage user information and permissions

### Reporting

- **Dashboard Analytics**: Real-time charts and statistics
- **Ticket Trends**: Analyze ticket volume and patterns
- **Inventory Reports**: Asset status, repair tracking, issuance history
- **Customizable Filters**: Filter reports by date range, category, status

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB
- **Authentication**: iron-session
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: TipTap editor
- **Charts**: Recharts
- **QR Codes**: qrcode library
- **Email**: Nodemailer / SMTP or API-based

## Prerequisites

- Node.js 20.x or higher
- MongoDB 7.0 or higher
- pnpm (recommended) or npm

## Installation

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/jp26198926/it-assets-manager.git
   cd it-assets-manager
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   ```env
   MONGODB_URI=mongodb://localhost:27017/it_assets_manager
   SESSION_SECRET=your-random-secret-key-here
   NODE_ENV=development
   ```

4. **Start MongoDB**

   ```bash
   # If using local MongoDB
   sudo systemctl start mongod

   # Or use MongoDB Atlas connection string
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Access the application**

   Open http://localhost:3000 in your browser

   The installation wizard will guide you through:
   - Environment variable validation
   - Database connection setup
   - Admin account creation
   - Default roles seeding

### Production Deployment

See [DEPLOYMENT_SUBDIRECTORY.md](DEPLOYMENT_SUBDIRECTORY.md) for detailed production deployment instructions.

**Quick deployment steps:**

1. **Build the application**

   ```bash
   pnpm install --production
   pnpm build
   ```

2. **Configure production environment**

   ```bash
   # Set production MongoDB URI and secrets in .env
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-server:27017/it_assets_manager
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

3. **Start with PM2**

   ```bash
   pm2 start npm --name "it-assets-manager" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure reverse proxy** (Apache/Nginx)

   See deployment guide for Apache or Nginx configuration examples.

## Project Structure

```
it-assets-manager/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── tickets/           # Ticket management pages
│   ├── inventory/         # Inventory pages
│   ├── employees/         # Employee management
│   ├── knowledgebase/     # KB articles
│   ├── reports/           # Analytics & reports
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── tickets/          # Ticket-related components
│   ├── inventory/        # Inventory components
│   └── ...
├── lib/                   # Utilities and configurations
│   ├── actions/          # Server actions
│   ├── models/           # MongoDB models
│   ├── utils/            # Helper functions
│   └── mongodb.ts        # Database connection
├── hooks/                 # Custom React hooks
├── public/               # Static assets
│   └── uploads/          # User-uploaded files
├── scripts/              # Database scripts
└── styles/               # Global styles
```

## Default Roles & Permissions

| Role           | Permissions                                                 |
| -------------- | ----------------------------------------------------------- |
| **Admin**      | Full system access, user management, settings configuration |
| **Manager**    | Inventory management, ticket oversight, reports access      |
| **Technician** | Ticket assignment, inventory updates, repair management     |
| **Employee**   | Create tickets, view assigned items, knowledge base access  |

## Key Features Documentation

### Barcode Generation

Inventory items are assigned unique barcodes in the format `IT[YY][00001]`:

- `IT` = Prefix
- `YY` = Current year (e.g., 26 for 2026)
- `00001` = Sequential number per year

### QR Code Printing

When receiving new items, generate and print QR codes with:

- 7 color options (Black, White, Red, Blue, Green, Orange, Purple)
- Includes barcode text and item name
- Optimized for label printers

### Email Notifications

Configurable SMTP or API-based email for:

- Ticket creation confirmations
- Status update notifications
- Assignment alerts
- Comment notifications

### Installation Wizard

First-time setup includes:

1. Environment variable check
2. Database connection validation
3. Local MongoDB auto-detection
4. SESSION_SECRET generation
5. Default roles seeding
6. Admin account creation

## Scripts

```bash
# Development
pnpm dev              # Start dev server

# Production
pnpm build           # Build for production
pnpm start           # Start production server

# Database
pnpm seed-roles      # Seed default roles
pnpm seed-users      # Create default users

# Type checking
pnpm lint            # Run ESLint
```

## API Documentation

### Installation Status

```bash
GET /api/install-status
# Returns: { installed: boolean }
```

### Theme Toggle

```bash
GET /api/theme
POST /api/theme { theme: 'light' | 'dark' | 'system' }
```

### File Upload

```bash
POST /api/upload
# Max size: 50MB
# Supports: images, documents, archives
```

## Environment Variables

| Variable              | Required | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `MONGODB_URI`         | Yes      | MongoDB connection string            |
| `SESSION_SECRET`      | Yes      | Random secret for session encryption |
| `NODE_ENV`            | No       | Environment (development/production) |
| `NEXT_PUBLIC_APP_URL` | No       | Public app URL for email links       |

## Troubleshooting

### Installation Issues

**Problem**: Installation wizard not appearing

- **Solution**: Delete all users in MongoDB and restart the app

**Problem**: Database connection failed

- **Solution**: Check MongoDB is running: `sudo systemctl status mongod`

### Development Issues

**Problem**: Port 3000 already in use

- **Solution**: Kill the process or use a different port
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

**Problem**: Module not found errors

- **Solution**: Clear cache and reinstall
  ```bash
  rm -rf node_modules .next
  pnpm install
  ```

### Production Issues

**Problem**: 404 on subdirectory deployment

- **Solution**: Ensure `basePath` in `next.config.mjs` matches Apache/Nginx location

**Problem**: File uploads not working

- **Solution**: Check `public/uploads/` directory permissions
  ```bash
  chmod 755 public/uploads
  ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

- GitHub Issues: https://github.com/jp26198926/it-assets-manager/issues
- Documentation: See `/docs` folder for detailed guides

## Changelog

### Version 1.0.0 (January 2026)

- Initial release
- Complete asset management system
- Ticketing with email notifications
- Knowledge base module
- Role-based access control
- Installation wizard
- Subdirectory deployment support
- QR code generation with color options

---

**Built with ❤️ using Next.js and MongoDB**
