# Ticket Email Notification Rules - Implementation Summary

## Changes Implemented

### 1. Ticket Code Pattern Updated ✅

**File**: `lib/actions/tickets.ts` - `generateTicketNumber()`

**Old Pattern**: `IT[YY][00001]` (e.g., IT2600001)
**New Pattern**: `TKT-[YYYY]-[00001]` (e.g., TKT-2026-00001)

- Changed from 2-digit year to 4-digit year
- Changed prefix from "IT" to "TKT-"
- Added dashes for better readability

---

### 2. New Ticket Created Notification ✅

**File**: `lib/utils/ticket-notifications.ts` - `sendNewTicketNotification()`

**Recipients**:

- ✅ Ticket creator (reporter)
- ✅ Assigned technician (if assigned)
- ✅ **All managers**
- ✅ **All admins**

**Implementation**:

```typescript
// Queries database for all users with role "manager" or "admin"
// Adds them to recipient list (avoiding duplicates)
const managersAndAdmins = await usersCollection
  .find({
    role: { $in: ["manager", "admin"] },
  })
  .toArray();
```

**Email Subject**: `New Ticket: TKT-2026-00001 - [Title]`

---

### 3. Ticket Assignment Notification ✅

**File**: `lib/utils/ticket-notifications.ts` - `sendTicketAssignedNotification()`

**Recipients**:

- ✅ Assigned technician only

**Trigger**: When ticket is assigned or reassigned to a technician

**Email Subject**: `Ticket Assigned: TKT-2026-00001 - [Title]`

---

### 4. Comment Added Notification ✅

**File**: `lib/utils/ticket-notifications.ts` - `sendTicketCommentNotification()`

**Recipients**:

- ✅ Ticket creator (if they didn't write the comment)
- ✅ Assigned technician (if they didn't write the comment)

**Exclusions**:

- Does NOT notify the person who wrote the comment
- Does NOT notify managers or admins

**Email Subject**: `New Comment: TKT-2026-00001 - [Title]`

---

### 5. Ticket Status Update Notification (Resolved/Closed/Defective) ✅

**File**: `lib/utils/ticket-notifications.ts` - `sendTicketStatusUpdateNotification()`

**Recipients for Regular Status Changes**:

- ✅ Ticket creator
- ✅ Assigned technician

**Additional Recipients for Resolved/Closed/Defective_Closed**:

- ✅ **All managers** (in addition to creator and assigned tech)

**Implementation**:

```typescript
if (
  newStatus === "resolved" ||
  newStatus === "closed" ||
  newStatus === "defective_closed"
) {
  // Get and notify all managers
  const managers = await usersCollection
    .find({
      role: "manager",
    })
    .toArray();
}
```

**Email Subject**: `Ticket Update: TKT-2026-00001 - Status changed to [Status]`

---

## Notification Matrix

| Event                                | Creator | Assigned Tech    | Manager | Admin |
| ------------------------------------ | ------- | ---------------- | ------- | ----- |
| **New Ticket Created**               | ✅      | ✅ (if assigned) | ✅      | ✅    |
| **Ticket Assigned**                  | ❌      | ✅               | ❌      | ❌    |
| **Comment Added**                    | ✅      | ✅               | ❌      | ❌    |
| **Status: Open/In Progress/Waiting** | ✅      | ✅               | ❌      | ❌    |
| **Status: Resolved**                 | ✅      | ✅               | ✅      | ❌    |
| **Status: Closed**                   | ✅      | ✅               | ✅      | ❌    |
| **Status: Defective Closed**         | ✅      | ✅               | ✅      | ❌    |

---

## Email Notification Features

All notifications include:

- ✅ Professional HTML email templates
- ✅ Color-coded priorities and statuses
- ✅ Ticket number (with new format)
- ✅ Ticket title and description
- ✅ Reporter information
- ✅ Assigned technician (if applicable)
- ✅ Timestamps
- ✅ Automatic duplicate recipient filtering
- ✅ Non-blocking async sending (failures don't affect ticket operations)

---

## Testing Checklist

### Test Ticket Code Pattern

- [ ] Create new ticket → Verify format is `TKT-2026-00001`
- [ ] Create second ticket → Verify format is `TKT-2026-00002`
- [ ] Check that year updates properly

### Test New Ticket Notifications

- [ ] Create ticket as employee
- [ ] Verify creator receives email
- [ ] Verify all managers receive email
- [ ] Verify all admins receive email
- [ ] If assigned, verify technician receives email

### Test Assignment Notifications

- [ ] Assign ticket to technician
- [ ] Verify only technician receives email
- [ ] Reassign to different technician
- [ ] Verify new technician receives email

### Test Comment Notifications

- [ ] Add comment as creator
- [ ] Verify assigned tech receives email (not creator)
- [ ] Add comment as technician
- [ ] Verify creator receives email (not tech)
- [ ] Verify managers/admins do NOT receive email

### Test Status Update Notifications

- [ ] Change status to "In Progress"
- [ ] Verify only creator and tech receive email
- [ ] Change status to "Resolved"
- [ ] Verify creator, tech, AND managers receive email
- [ ] Change status to "Closed"
- [ ] Verify creator, tech, AND managers receive email
- [ ] Change status to "Defective Closed"
- [ ] Verify creator, tech, AND managers receive email

---

## Configuration Requirements

Ensure email is configured in Settings before testing:

1. Go to Settings → Email Configuration
2. Configure SMTP or API provider
3. Test email functionality using "Send Test" button
4. Verify test email is received

For Gmail SMTP:

- Host: smtp.gmail.com
- Port: 587 (TLS/STARTTLS)
- Use App Password (not regular password)

---

## Implementation Files

| File                                  | Changes                                           |
| ------------------------------------- | ------------------------------------------------- |
| `lib/actions/tickets.ts`              | Updated ticket number pattern                     |
| `lib/utils/ticket-notifications.ts`   | Updated all 4 notification functions              |
| `lib/utils/ticket-email-templates.ts` | No changes (templates already exist)              |
| `lib/utils/email.ts`                  | No changes (SMTP/API sending already implemented) |

---

## Notes

- All email sending is asynchronous and non-blocking
- Email failures are logged but don't prevent ticket operations
- Duplicate recipients are automatically filtered
- Comment notifications exclude the comment author
- Managers are notified only for final status changes (resolved/closed/defective)
- Admins are notified only for new tickets
