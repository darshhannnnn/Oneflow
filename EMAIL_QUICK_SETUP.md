# 📧 Email Quick Setup

## Step 1: Get Gmail App Password

1. Visit: https://myaccount.google.com/apppasswords
2. Create app password for "Mail"
3. Copy the 16-character password

## Step 2: Update .env

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="youremail@gmail.com"
SMTP_PASSWORD="xxxx xxxx xxxx xxxx"
```

## Step 3: Restart Server

```bash
npm run dev
```

## Test It!

1. Go to: http://localhost:3000/dashboard/invoices/new
2. Create invoice with customer email
3. Check console for: `✓ Email sent successfully`

---

**That's it!** Emails will be sent from `sales@oneflow.com` to your customers. 🎉
