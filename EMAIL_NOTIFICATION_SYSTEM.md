# Email Notification System for Tickets

## Overview

The ticket module now includes comprehensive email notifications for all ticket-related events. The system supports both SMTP and API-based email delivery, configured through the Settings module.

## Features Implemented

### 1. Email Infrastructure

- **Location**: `lib/utils/email.ts`
- **Capabilities**:
  - SMTP email sending using nodemailer
  - API-based email sending (for services like SendGrid, Mailgun, etc.)
  - Automatic provider selection based on Settings configuration
  - Professional HTML email templates with responsive design

### 2. Ticket Email Templates

- **Location**: `lib/utils/ticket-email-templates.ts`
- **Templates Available**:
  - `newTicketCreatedEmail` - Notification when a new ticket is created
  - `ticketStatusUpdatedEmail` - Notification when ticket status changes
  - `ticketAssignedEmail` - Notification when ticket is assigned to a user
  - `ticketCommentAddedEmail` - Notification when comments are added (ready for future use)
  - `guestTicketCreatedEmail` - Confirmation email for guest-submitted tickets

### 3. Notification Service

- **Location**: `lib/utils/ticket-notifications.ts`
- **Functions**:
  - `sendNewTicketNotification()` - Sends notification to reporter and assigned technician
  - `sendTicketStatusUpdateNotification()` - Notifies reporter and assigned technician of status changes
  - `sendTicketAssignedNotification()` - Notifies technician when ticket is assigned to them
  - `sendTicketCommentNotification()` - Notifies relevant parties of new comments (ready for future use)
  - `sendGuestTicketConfirmation()` - Sends tracking info to guest users

## Integration Points

### Ticket Creation

**File**: `lib/actions/tickets.ts` - `createTicket()`

- Automatically sends notification to:
  - Ticket reporter (confirmation)
  - Assigned technician (if assigned during creation)

### Guest Ticket Creation

**File**: `lib/actions/tickets.ts` - `createGuestTicket()`

- Sends confirmation email with:
  - Ticket number
  - Tracking URL
  - Subject/title

### Ticket Status Updates

**File**: `lib/actions/tickets.ts` - `updateTicketStatus()`

- Sends notification when:
  - Status changes (e.g., Open → In Progress → Resolved)
  - Ticket is assigned/reassigned to a technician
- Recipients:
  - Ticket reporter
  - Assigned technician (if different from reporter)

## Configuration

### Email Settings

Configure email in the **Settings** module:

1. **SMTP Configuration**:
   - SMTP Host (e.g., smtp.gmail.com)
   - SMTP Port (e.g., 587 for TLS, 465 for SSL)
   - SMTP Username
   - SMTP Password
   - Secure Connection (TLS/SSL)

2. **API Configuration**:
   - API Key (from your email provider)
   - API Endpoint (provider's API URL)

### Required Package

The system uses `nodemailer` for SMTP functionality:

```bash
npm install nodemailer @types/nodemailer
```

## Notification Flow

### 1. New Ticket Created

```
User creates ticket
  ↓
System generates ticket number
  ↓
Ticket saved to database
  ↓
Email notification sent to:
  - Reporter (confirmation)
  - Assigned tech (if assigned)
```

### 2. Status Update

```
Technician updates ticket status
  ↓
System checks old vs new status
  ↓
Database updated
  ↓
Email notification sent to:
  - Reporter (status change)
  - Assigned tech (status change)
```

### 3. Ticket Assignment

```
Manager assigns ticket to technician
  ↓
System checks for assignment change
  ↓
Database updated
  ↓
Email notification sent to:
  - Newly assigned technician
```

### 4. Guest Ticket

```
Guest submits ticket
  ↓
System generates ticket number
  ↓
Ticket saved to database
  ↓
Confirmation email sent to:
  - Guest email (with tracking URL)
```

## Email Template Design

All emails follow a consistent, professional design:

- Company branding (name from Settings)
- Responsive layout (mobile-friendly)
- Color-coded priorities and statuses
- Clear call-to-action sections
- Monospace font for ticket numbers
- Information boxes for key details
- Footer with automated message disclaimer

## Error Handling

The notification system includes robust error handling:

- Non-blocking: Email failures don't prevent ticket operations
- Logged errors: All email send failures are logged to console
- Graceful degradation: System continues to work even if email is not configured
- Silent failures: Missing email configuration doesn't crash the application

## Future Enhancements (Ready to Implement)

1. **Comment Notifications**:
   - Template already exists: `ticketCommentAddedEmail`
   - Service function ready: `sendTicketCommentNotification`
   - Just needs integration when comment feature is added

2. **Notification Preferences**:
   - Allow users to opt-out of certain notification types
   - Configure which events trigger emails

3. **Email Queue**:
   - Implement background job processing for emails
   - Retry failed email sends

4. **Additional Templates**:
   - SLA breach warnings
   - Overdue ticket reminders
   - Daily/weekly digest emails

## Testing

### Test SMTP Configuration

1. Go to Settings → Email Configuration
2. Choose SMTP provider
3. Enter valid SMTP credentials
4. Create a test ticket
5. Check recipient email inbox

### Test API Configuration

1. Go to Settings → Email Configuration
2. Choose API provider
3. Enter API key and endpoint
4. Create a test ticket
5. Check recipient email inbox

## Troubleshooting

### Emails Not Sending

1. Check Settings module for email configuration
2. Verify SMTP credentials or API keys
3. Check server console for error logs
4. Ensure email addresses are valid

### SMTP Connection Issues

- Verify SMTP host and port
- Check if secure connection (TLS) is required
- Ensure firewall allows outbound SMTP connections
- Try different SMTP ports (587, 465, 25)

### API Email Issues

- Verify API key is valid and active
- Check API endpoint URL is correct
- Ensure API account has sufficient credits/quota
- Review API provider's documentation for request format

## Security Notes

- Email credentials stored in database (should be encrypted in production)
- Emails sent asynchronously (non-blocking)
- No sensitive data in email templates
- All email operations are server-side only ("use server")
