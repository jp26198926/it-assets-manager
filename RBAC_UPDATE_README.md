# IT Asset Manager - RBAC & Neomorphic/Glass Design Update

## Changes Summary

### 1. Design System Updates (Neomorphism & Glassmorphism)

#### Global Styles (`app/globals.css`)

- **Updated color palette** with subtle blue tints for depth
- **Added CSS custom properties** for neomorphic and glassmorphic effects:
  - `--glass-bg`, `--glass-border` - Glassmorphic backgrounds
  - `--neo-shadow-light`, `--neo-shadow-dark` - Neomorphic shadows
  - `--neo-inset-light`, `--neo-inset-dark` - Inset shadow effects
- **New utility classes**:
  - `.neo-raised` - Raised neomorphic effect
  - `.neo-pressed` - Pressed/inset neomorphic effect
  - `.neo-flat` - Flat neomorphic shadow
  - `.glass` - Basic glassmorphic effect with backdrop blur
  - `.glass-strong` - Strong glassmorphic effect
  - `.neo-hover` - Enhanced hover state
  - `.glass-hover` - Glass hover transition

#### Component Updates

- **Card** (`components/ui/card.tsx`) - Added neo-raised and glass-hover effects
- **Button** (`components/ui/button.tsx`) - Applied neomorphic shadows to all variants
- **Dialog** (`components/ui/dialog.tsx`) - Glassmorphic overlay and content
- **Input** (`components/ui/input.tsx`) - Glass effect with enhanced focus states
- **Sidebar** (`components/layout/sidebar.tsx`) - Neomorphic navigation items

### 2. Role-Based Access Control (RBAC)

#### User Model (`lib/models/User.ts`)

```typescript
type UserRole = "admin" | "manager" | "employee";

interface User {
  username: string;
  email: string;
  password: string; // hashed with bcryptjs
  role: UserRole;
  name: string;
  employeeId?: string;
  department?: string;
  isActive: boolean;
  // ... timestamps
}
```

#### Role Permissions

- **Admin**: Full CRUD access to all resources
- **Manager**: Create, read, update access (no delete) for most resources
- **Employee**: Read-only access with ability to create tickets

#### Authentication System

**Files Created:**

- `lib/actions/auth.ts` - Server actions for login/logout
- `lib/utils/rbac.ts` - Permission checking utilities
- `middleware.ts` - Route protection middleware
- `hooks/use-auth.ts` - Client-side auth hook
- `components/auth/protected-route.tsx` - Route protection component

**Session Management:**

- Uses `iron-session` for secure, encrypted sessions
- Session stored in HTTP-only cookies
- 7-day session expiry

### 3. New Components

#### Login Page (`app/login/page.tsx`)

- Glassmorphic design
- Demo credentials display
- Automatic redirect after login

#### User Menu (`components/layout/user-menu.tsx`)

- Avatar with user initials
- Role badge display
- Profile access
- Logout functionality

#### Protected Route Component

- Client-side role verification
- Automatic redirect to login
- Permission-based access control

### 4. Demo Users

Run the seed script to create demo users:

```bash
npm run seed:users
```

**Demo Accounts:**

- **Admin**

  - Username: `admin`
  - Email: `admin@ticketing.com`
  - Password: `admin123`
  - Full system access

- **Manager**

  - Username: `manager`
  - Email: `manager@ticketing.com`
  - Password: `manager123`
  - Can create/update most resources

- **Employee**
  - Username: `employee`
  - Email: `employee@ticketing.com`
  - Password: `employee123`
  - Read-only with ticket creation

## Setup Instructions

### 1. Environment Variables

Update `.env` file:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
SESSION_SECRET=your_32_character_secret_key_here_change_this_in_production
```

**Important:** Change `SESSION_SECRET` to a secure random string in production!

### 2. Install Dependencies

Already installed:

- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types
- `iron-session` - Session management
- `tsx` - TypeScript execution (global)

### 3. Seed Demo Users

```bash
npm run seed:users
```

This will:

- Connect to MongoDB Atlas
- Clear existing users (optional)
- Create 3 demo users with different roles
- Display login credentials

### 4. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` - you'll be redirected to `/login`

## Usage Examples

### Checking Permissions in Server Components

```typescript
import { requireRole } from "@/lib/actions/auth";

export default async function AdminPage() {
  await requireRole(["admin"]); // Throws if not admin

  // Page content for admins only
}
```

### Using Protected Route Component

```typescript
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ManagerPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      {/* Content only accessible to admin and manager */}
    </ProtectedRoute>
  );
}
```

### Client-Side Permission Checks

```typescript
"use client";

import { useAuth } from "@/hooks/use-auth";

export function MyComponent() {
  const { user, permissions, loading } = useAuth();

  if (loading) return <Spinner />;

  return (
    <>
      {permissions?.canCreateInventory && <Button>Add Item</Button>}
      {permissions?.canManageUsers && <Button>Manage Users</Button>}
    </>
  );
}
```

## Security Notes

1. **Session Secret**: Must be at least 32 characters in production
2. **Password Hashing**: Uses bcryptjs with 10 rounds
3. **HTTP-Only Cookies**: Session cookies not accessible via JavaScript
4. **Middleware Protection**: All routes except `/login` require authentication
5. **Server-Side Validation**: Always verify permissions on the server

## File Structure

```
lib/
├── models/
│   └── User.ts           # User model and permissions
├── actions/
│   └── auth.ts           # Authentication actions
└── utils/
    └── rbac.ts           # Permission utilities

components/
├── auth/
│   └── protected-route.tsx
└── layout/
    └── user-menu.tsx

app/
├── login/
│   └── page.tsx          # Login page
└── page.tsx              # Updated dashboard

scripts/
└── seed-users.ts         # User seeding script

middleware.ts             # Route protection
hooks/
└── use-auth.ts           # Auth hook
```

## Design Tokens

### Neomorphic Shadows

```css
--neo-shadow-light: oklch(0.35 0.015 250 / 0.8)
--neo-shadow-dark: oklch(0.08 0.005 250 / 0.9)
```

### Glassmorphism

```css
--glass-bg: oklch(0.2 0.008 250 / 0.4)
backdrop-filter: blur(12px) saturate(180%)
```

### Primary Colors

- Background: `oklch(0.15 0.01 250)`
- Card: `oklch(0.18 0.008 250)`
- Primary: `oklch(0.68 0.18 240)` (Blue accent)

## Next Steps

1. **Update MongoDB Connection**: Replace the placeholder connection string in `.env`
2. **Generate Secure Session Secret**: Use a cryptographically secure random string
3. **Seed Database**: Run `npm run seed:users`
4. **Test Login**: Try logging in with each role
5. **Add Permission Checks**: Update pages/components to respect user roles
6. **Customize Permissions**: Modify `ROLE_PERMISSIONS` in `lib/models/User.ts` as needed

## Troubleshooting

### "Unauthorized" errors

- Check if session secret is set in `.env`
- Verify user exists in database
- Clear browser cookies and try again

### Styling issues

- Ensure Tailwind is processing the new utility classes
- Check that `globals.css` is imported in layout
- Verify browser supports backdrop-filter

### Session not persisting

- Check `SESSION_SECRET` environment variable
- Verify cookies are enabled in browser
- Check if running on HTTPS in production
