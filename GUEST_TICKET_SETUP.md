# Guest Ticket Feature Setup

## Overview

The guest ticketing feature allows users to create support tickets without registering for an account. To prevent spam and abuse, we use a **zero-configuration CAPTCHA system** that combines multiple anti-spam techniques.

## Features

- ✅ Rich text editor (TipTap) for detailed ticket descriptions
- ✅ File attachments support (images and documents)
- ✅ **Zero-config CAPTCHA** (no API keys required):
  - Math challenge verification
  - Honeypot field for bot detection
  - Time-based verification
- ✅ Ticket tracking by ticket number
- ✅ Public knowledge base access

## Anti-Spam Protection

### 1. Math Challenge

Users must solve a simple addition problem (e.g., "What is 5 + 3?") before submitting the ticket. This is effective against basic bots while being easy for humans.

### 2. Honeypot Field

A hidden form field that legitimate users won't see or fill, but bots often do. If this field is filled, the submission is silently rejected.

### 3. Time-Based Verification

- **Minimum time**: Forms submitted in less than 3 seconds are rejected (too fast for humans)
- **Maximum time**: Sessions older than 30 minutes expire (prevents session hijacking)

## Setup

**No setup required!** The CAPTCHA system works out of the box with zero configuration.

### Testing the Implementation

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Visit the home page (http://localhost:3000)
3. Try creating a ticket:
   - Fill in the form
   - Answer the math question correctly
   - Submit the ticket
   - You should receive a ticket number

4. Test ticket tracking:
   - Switch to the "Track Ticket" tab
   - Enter the ticket number you received
   - Verify you can see your ticket details

## File Upload Limits

- **Individual file size**: Maximum 10MB
- **Total attachments**: Maximum 5 files
- **Combined size**: Maximum 20MB
- **Accepted formats**:
  - Images: .jpg, .jpeg, .png, .gif
  - Documents: .pdf, .doc, .docx, .txt

## Security Features

1. **Math CAPTCHA**: Simple but effective against automated submissions
2. **Honeypot**: Catches bots that auto-fill all form fields
3. **Time-Based Verification**:
   - Prevents rapid-fire bot submissions
   - Prevents session replay attacks
4. **File Upload Validation**:
   - File size limits enforced
   - File type restrictions
   - Unique filename generation to prevent overwrites
5. **No Authentication Required**: Guest users can create and track tickets without registering

## How It Works

### Client-Side (components/guest/guest-ticket-form.tsx)

1. Form start time is recorded when component mounts
2. Math problem is randomly generated
3. Honeypot field is rendered but hidden with CSS
4. On submit:
   - Checks if honeypot is empty (should be)
   - Validates minimum time spent (3 seconds)
   - Verifies math answer
   - Uploads attachments
   - Submits ticket

### Server-Side (lib/actions/tickets.ts)

1. Receives form submission with `formStartTime`
2. Verifies time spent is between 3 seconds and 30 minutes
3. Creates ticket in database
4. Returns ticket number

## Troubleshooting

### "Please slow down" error

- The form was submitted too quickly (< 3 seconds)
- This is normal - just take a moment to fill out the form

### "Verification Failed" error

- Math answer was incorrect
- Try again with the correct answer

### "Session expired" error

- Form was open for more than 30 minutes
- Refresh the page and start over

### File upload fails

- Check file size (max 10MB per file)
- Ensure the `public/uploads/tickets` directory exists and is writable
- Verify file type is in the accepted formats list

## Production Deployment

### Additional Security Measures (Optional)

1. **Rate Limiting**: Add IP-based rate limiting using middleware
2. **Email Verification**: Send confirmation email with ticket number
3. **Content Filtering**: Check for spam keywords in descriptions
4. **Database Indexing**: Add index on `createdAt` for efficient cleanup of old tickets

### Recommended Next Steps

1. Set up automated email notifications for new guest tickets
2. Implement admin dashboard to review and moderate guest submissions
3. Add analytics to track spam attempts
4. Consider adding more complex math problems for high-traffic sites

## Advantages Over reCAPTCHA

- ✅ **No registration required** - Works immediately
- ✅ **No API keys** - Zero configuration
- ✅ **Privacy-friendly** - No third-party tracking
- ✅ **Fully customizable** - Complete control over logic
- ✅ **No external dependencies** - Faster page load
- ✅ **Better UX** - Simple math vs clicking images
- ✅ **Free forever** - No quota limits

## Additional Notes

- Guest tickets are stored in the same database collection as authenticated user tickets
- Guest tickets can be viewed and managed by staff through the normal ticket management interface
- The rich text editor supports:
  - Text formatting (bold, italic, code)
  - Headings (H2, H3)
  - Lists (bulleted and numbered)
  - Quotes
  - Images (inline)
  - File attachments
