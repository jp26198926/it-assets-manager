# Quick Reference - RBAC & Design Updates

## 🎨 Design System

### Neomorphic Classes

```html
<!-- Raised effect (cards, panels) -->
<div class="neo-raised">Content</div>

<!-- Pressed/inset effect (active states) -->
<div class="neo-pressed">Content</div>

<!-- Flat shadow (buttons, smaller elements) -->
<button class="neo-flat">Button</button>

<!-- Enhanced hover -->
<div class="neo-raised neo-hover">Hover me</div>
```

### Glassmorphic Classes

```html
<!-- Basic glass effect -->
<div class="glass">Content</div>

<!-- Strong glass effect (modals, overlays) -->
<div class="glass-strong">Content</div>

<!-- Glass hover transition -->
<div class="glass glass-hover">Hover me</div>
```

## 🔐 Authentication

### Demo Credentials

```
Admin:    admin    / admin123
Manager:  manager  / manager123
Employee: employee / employee123
```

### Server-Side Auth

```typescript
import { getCurrentUser, requireRole } from "@/lib/actions/auth";

// Get current user (returns null if not logged in)
const user = await getCurrentUser();

// Require authentication (throws if not logged in)
const user = await requireAuth();

// Require specific role (throws if unauthorized)
const user = await requireRole(["admin", "manager"]);
```

### Client-Side Auth Hook

```typescript
"use client";
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, permissions, loading } = useAuth();

  return (
    <>
      {permissions?.canCreateInventory && <AddButton />}
      {permissions?.canManageUsers && <AdminPanel />}
    </>
  );
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

## 👥 User Roles

### Admin

- ✅ Full CRUD on all resources
- ✅ User management
- ✅ System configuration
- ✅ All reports

### Manager

- ✅ Create, read, update inventory
- ✅ Create, read, update tickets
- ✅ Manage issuance
- ❌ Cannot delete resources
- ❌ Cannot manage users

### Employee

- ✅ View inventory
- ✅ Create & view tickets
- ✅ View issuance
- ❌ Cannot create/update/delete resources
- ❌ Cannot access admin features

## 🛠️ Common Tasks

### Seed Users

```bash
npm run seed:users
```

### Start Dev Server

```bash
npm run dev
# Visit http://localhost:3000
```

### Check Permissions

```typescript
import { hasPermission } from "@/lib/models/User";

const canEdit = hasPermission("manager", "inventory", "update"); // true
const canDelete = hasPermission("manager", "inventory", "delete"); // false
```

### Logout

```typescript
import { logout } from "@/lib/actions/auth";

await logout();
router.push("/login");
```

## 📁 Key Files

```
lib/
├── models/User.ts           # User model & permissions
├── actions/auth.ts          # Auth actions
├── utils/rbac.ts           # Permission helpers
└── mongodb.ts              # Database connection

components/
├── auth/protected-route.tsx # Route protection
├── layout/
│   ├── user-menu.tsx       # User menu component
│   └── sidebar.tsx         # Updated sidebar
└── ui/                     # Updated UI components

app/
├── login/page.tsx          # Login page
└── page.tsx                # Dashboard (updated)

middleware.ts               # Route protection
hooks/use-auth.ts          # Client auth hook
```

## 🔧 Environment Variables

```env
# Required
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=your_32_char_secret

# MongoDB Atlas Connection String Format:
# mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## 🎯 Permission Matrix

| Resource    | Admin | Manager | Employee |
| ----------- | ----- | ------- | -------- |
| Inventory   | CRUD  | CRU     | R        |
| Tickets     | CRUD  | CRU     | CR       |
| Issuance    | CRUD  | CRU     | R        |
| Users       | CRUD  | -       | -        |
| Departments | CRUD  | R       | R        |
| Employees   | CRUD  | R       | R        |
| Reports     | R     | R       | -        |

_Legend: C=Create, R=Read, U=Update, D=Delete_

## 🚨 Security Checklist

- ✅ Passwords hashed with bcryptjs
- ✅ Sessions encrypted with iron-session
- ✅ HTTP-only cookies
- ✅ Middleware route protection
- ✅ Server-side permission validation
- ⚠️ Update SESSION_SECRET in production
- ⚠️ Use HTTPS in production
- ⚠️ Update MongoDB credentials

## 📱 Responsive Features

- Glassmorphic mobile header
- Collapsible sidebar
- Touch-friendly navigation
- Adaptive user menu placement

---

**Need Help?** Check [RBAC_UPDATE_README.md](RBAC_UPDATE_README.md) for detailed documentation.
