# Email Setup Guide

The invoice system uses **Nodemailer** to send emails to customers from `sales@oneflow.com`.

## Quick Setup (Gmail)

### 1. **Create Gmail App Password**

Since Gmail requires 2-factor authentication, you need to create an App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Go to **App passwords**: https://myaccount.google.com/apppasswords
4. Select **Mail** and **Other (Custom name)** → Enter "OneFlow"
5. Click **Generate** and copy the 16-character password

### 2. **Update .env File**

Add these to your `.env` file:

```env
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="youremail@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
```

**Example:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="sales@yourcompany.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"
```

### 3. **Restart Server**

```bash
npm run dev
```

## Alternative Email Services

### **SendGrid** (Recommended for Production)

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

### **AWS SES**

```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-aws-access-key"
SMTP_PASSWORD="your-aws-secret-key"
```

### **Outlook/Office 365**

```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="youremail@outlook.com"
SMTP_PASSWORD="your-password"
```

## How It Works

1. **Invoice Creation**: User creates invoice at `/dashboard/invoices/new`
2. **Email Sending**: If "Send Email" is checked, the system:
   - Creates invoice in database
   - Sends beautiful HTML email to customer
   - Email includes invoice details, line items, and totals
3. **Email Content**:
   - **From**: OneFlow Sales <sales@oneflow.com>
   - **To**: Customer's email
   - **Subject**: Invoice INV123456 from OneFlow
   - **Body**: Professional HTML invoice with branding

## Testing

After setup, create a test invoice:

1. Go to http://localhost:3000/dashboard/invoices/new
2. Fill in customer details
3. Check "Send Email to Customer"
4. Click Create

Check server console for email status:
- ✓ Success: `Email sent successfully: <message-id>`
- ✗ Error: `Error sending email: <error message>`

## Troubleshooting

### "Invalid login"
- Make sure you're using an **App Password**, not your regular password
- Enable 2-factor authentication on Gmail first

### "Connection timeout"
- Check firewall/antivirus blocking port 587
- Try port 465 with `secure: true` in email.js

### "Email not received"
- Check spam/junk folder
- Verify recipient email is correct
- Check server console for delivery status

## Email Features

- ✅ Professional HTML template with branding
- ✅ Plain text fallback
- ✅ Invoice details and line items
- ✅ Calculation of subtotal, tax, and total
- ✅ Sent from sales@oneflow.com
- ✅ Non-blocking (invoice creates even if email fails)

## Production Deployment

For production, use a dedicated email service:

1. **SendGrid**: 100 emails/day free
2. **AWS SES**: $0.10 per 1,000 emails
3. **Mailgun**: 5,000 emails/month free

Update environment variables in your production environment (Cloud Run, Vercel, etc.).
