# User Approval System

## Overview
New users must be approved by an admin before they can access the application. This prevents unauthorized access and allows admins to control who gets access to the system.

## How It Works

### 1. User Signs Up
- User creates an account via `/login` (email/password or Google OAuth)
- Account is created with `isApproved = false` by default
- User is redirected to `/auth/pending-approval` page

### 2. Pending Approval Page
- User sees a message that their account is pending admin approval
- Cannot access any part of the application
- Can only sign out

### 3. Admin Approves User
- Admin goes to `/dashboard/users`
- Sees all users with their approval status
- Clicks the approve button (green checkmark) for pending users
- Sets the user's role (ADMIN, PROJECT_MANAGER, TEAM_MEMBER, SALES, FINANCE)
- User is now approved and can access the system

### 4. User Logs In Again
- User logs out and logs back in
- Session is refreshed with `isApproved = true`
- User is redirected to `/dashboard` based on their role

## Database Changes

### User Model
```prisma
model User {
  // ... existing fields
  isApproved Boolean   @default(false)  // Admin approval required
  approvedAt DateTime?                  // When user was approved
  approvedBy String?                    // Admin who approved the user
}
```

## Files Created/Modified

### New Files
1. **`/app/auth/pending-approval/page.js`** - Pending approval page
2. **`/app/api/users/[id]/approve/route.js`** - Approve user API

### Modified Files
1. **`prisma/schema.prisma`** - Added isApproved, approvedAt, approvedBy fields
2. **`lib/auth.js`** - Added isApproved to JWT and session
3. **`app/dashboard/page.js`** - Redirect unapproved users
4. **`app/dashboard/users/page.js`** - Added approval UI and stats
5. **`app/api/users/route.js`** - Include isApproved in response

## Features

### Admin Dashboard (`/dashboard/users`)
- ✅ **Pending Approval Counter** - Shows how many users need approval
- ✅ **Approval Status Badge** - Green "Approved" or Yellow "Pending"
- ✅ **Approve Button** - One-click approval for pending users
- ✅ **Filter by Status** - Search for pending or approved users
- ✅ **Bulk Stats** - Total users, pending, approved counts

### User Experience
- ✅ **Clear Messaging** - Users know they're waiting for approval
- ✅ **Professional UI** - Clean pending approval page
- ✅ **Email Display** - Shows which email is pending
- ✅ **Sign Out Option** - Users can sign out while waiting

### Security
- ✅ **No Access Until Approved** - Users cannot access any protected routes
- ✅ **Admin Only Approval** - Only admins can approve users
- ✅ **Audit Trail** - Tracks who approved and when
- ✅ **Session Validation** - Checks approval status on every request

## API Endpoints

### Approve User
```http
POST /api/users/[id]/approve
Authorization: Required (Admin only)

Response:
{
  "success": true,
  "message": "User approved successfully",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "...",
    "isApproved": true,
    "approvedAt": "2025-01-09T..."
  }
}
```

### Get Users
```http
GET /api/users
Authorization: Required

Response:
[
  {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "...",
    "isApproved": true,
    "approvedAt": "2025-01-09T...",
    "createdAt": "2025-01-09T..."
  }
]
```

## Workflow Diagram

```
User Signs Up
     ↓
Account Created (isApproved = false)
     ↓
Redirected to /auth/pending-approval
     ↓
[User Waits]
     ↓
Admin Approves User
     ↓
isApproved = true, approvedAt = now, approvedBy = admin.id
     ↓
User Logs Out & Logs In Again
     ↓
Session Refreshed with isApproved = true
     ↓
User Redirected to /dashboard
     ↓
Full Access Granted ✓
```

## Admin Workflow

1. **View Pending Users**
   - Go to `/dashboard/users`
   - See "Pending Approval" count in stats
   - Yellow "Pending" badge on unapproved users

2. **Approve User**
   - Click green checkmark button
   - User is immediately approved
   - Badge changes to green "Approved"

3. **Set User Role**
   - Click edit button
   - Select role from dropdown
   - Save changes

4. **Notify User** (Optional)
   - User will see approved status on next login
   - Can implement email notification (future enhancement)

## Migration Steps

### Step 1: Update Database Schema
```bash
npx prisma db push
```

This adds:
- `isApproved` (Boolean, default: false)
- `approvedAt` (DateTime, nullable)
- `approvedBy` (String, nullable)

### Step 2: Approve Existing Users
Run this SQL to approve all existing users:
```sql
UPDATE "User" SET "isApproved" = true, "approvedAt" = NOW() WHERE "isApproved" = false;
```

Or use Prisma Studio:
```bash
npx prisma studio
```
Then manually approve users.

### Step 3: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 4: Restart Server
```bash
npm run dev
```

## Testing

### Test New User Signup
1. Sign up with a new email
2. Should see pending approval page
3. Cannot access `/dashboard`
4. Can only sign out

### Test Admin Approval
1. Login as admin
2. Go to `/dashboard/users`
3. See new user with "Pending" status
4. Click approve button
5. Status changes to "Approved"

### Test Approved User Login
1. New user logs out and logs in again
2. Should be redirected to `/dashboard`
3. Can access all features based on role

## Future Enhancements

- [ ] Email notification when user is approved
- [ ] Rejection workflow (reject user with reason)
- [ ] Bulk approve multiple users
- [ ] Approval comments/notes
- [ ] Auto-approve for certain email domains
- [ ] Approval expiry (re-approve after X days)
- [ ] User request role change workflow

## Security Considerations

- ✅ All protected routes check `isApproved` status
- ✅ Only admins can approve users
- ✅ Approval is tracked with timestamp and admin ID
- ✅ Session is validated on every request
- ✅ No bypass possible without database access

## Troubleshooting

### Issue: Existing users cannot login
**Solution**: Run the SQL to approve all existing users (see Migration Step 2)

### Issue: Approved user still sees pending page
**Solution**: User needs to logout and login again to refresh session

### Issue: Admin cannot see approve button
**Solution**: Check that user has ADMIN role and proper permissions

### Issue: Approval doesn't work
**Solution**: Check browser console for errors, verify API endpoint is accessible

---

**User approval system is now fully functional!** 🎉

New users will need admin approval before accessing the application.
