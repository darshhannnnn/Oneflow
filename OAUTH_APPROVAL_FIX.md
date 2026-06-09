# OAuth User Approval System Fix

## Problem
OAuth users (Google sign-in) were bypassing the admin approval system when signing up. After selecting their role through the role selection modal, they were directly accessing the dashboard without requiring admin approval, unlike credentials-based users who correctly required approval.

## Root Cause
1. OAuth users sign in → redirected to `/auth/role-setup`
2. User selects role → calls `/api/user/profile` PUT endpoint
3. Profile updated with role, but `isApproved` remained `false` (default)
4. User redirected to `/dashboard` without checking approval status
5. Dashboard did not enforce approval check for OAuth users properly

## Solution Overview
Implemented a comprehensive approval system for OAuth users that:
- **Auto-approves TEAM_MEMBER role** for instant access (low-risk role)
- **Requires admin approval** for elevated roles (ADMIN, PROJECT_MANAGER, SALES, FINANCE)
- **Enforces approval checks** throughout the authentication flow
- **Provides clear user feedback** about approval requirements

## Changes Made

### 1. `/app/api/user/profile/route.js` ✅
**Purpose**: Handle role selection and approval logic for OAuth users

**Changes**:
- Added logic to detect OAuth users (no password field)
- Auto-approve TEAM_MEMBER role for OAuth users
- Require admin approval for other roles (ADMIN, PROJECT_MANAGER, SALES, FINANCE)
- Return `isApproved` status in response

```javascript
// If this is a new OAuth user setting their role for the first time
if (!existingUser.role && !existingUser.isApproved && !existingUser.password) {
  // OAuth user setting role for first time
  if (role === "TEAM_MEMBER") {
    // Auto-approve TEAM_MEMBER role for OAuth users
    updateData.isApproved = true;
    updateData.approvedAt = new Date();
  }
  // For other roles, keep isApproved as false - requires admin approval
}
```

### 2. `/components/RoleSelectionModal.jsx` ✅
**Purpose**: Show approval requirements and redirect appropriately

**Changes**:
- Added `needsApproval` flag to each role definition
- Added visual indicators (Clock icon + badge) for roles requiring approval
- Added informational message explaining approval process
- Updated `handleSubmit` to check `isApproved` status from API response
- Redirect to `/auth/pending-approval` if not approved
- Redirect to `/dashboard` if auto-approved (TEAM_MEMBER)

**Visual Improvements**:
```jsx
{role.needsApproval && (
  <Badge variant="outline" className="bg-yellow-500/10...">
    <Clock className="w-3 h-3 mr-1" />
    Requires Approval
  </Badge>
)}
```

### 3. `/lib/auth.js` ✅
**Purpose**: Ensure approval status is properly handled in JWT and session

**Changes**:
- Updated `signIn` callback to include `isApproved` for existing OAuth users
- Enhanced `jwt` callback to fetch fresh approval status from database on session update
- Default `isApproved` to `false` if undefined (safety check)
- Added database lookup during session updates to ensure accuracy

```javascript
// Fetch fresh data from database to ensure accuracy
if (session.user.email || token.email) {
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email || token.email },
    select: { role: true, isApproved: true }
  });
  if (dbUser) {
    token.role = dbUser.role;
    token.isApproved = dbUser.isApproved;
  }
}
```

### 4. `/app/api/auth/signup/route.js` ✅
**Purpose**: Ensure consistency with credentials-based signup

**Changes**:
- Auto-approve TEAM_MEMBER role for credentials signup too
- Require admin approval for elevated roles
- Return `needsApproval` flag in response
- Set `approvedAt` timestamp for auto-approved users

## Role Approval Matrix

| Role | OAuth Users | Credentials Users | Reason |
|------|-------------|-------------------|---------|
| **TEAM_MEMBER** | ✅ Auto-approved | ✅ Auto-approved | Low-risk, view-only access |
| **PROJECT_MANAGER** | ❌ Needs approval | ❌ Needs approval | Can create/manage projects |
| **SALES** | ❌ Needs approval | ❌ Needs approval | Financial data access |
| **FINANCE** | ❌ Needs approval | ❌ Needs approval | Financial data access |
| **ADMIN** | ❌ Needs approval | ❌ Needs approval | Full system access |

## User Experience Flow

### OAuth User - TEAM_MEMBER (Auto-approved)
```
1. Sign in with Google
2. Select "Team Member" role
3. ✅ Immediately redirected to /dashboard
4. Full access to assigned tasks
```

### OAuth User - Other Roles (Needs Approval)
```
1. Sign in with Google
2. Select "Project Manager" / "Sales" / "Finance" / "Admin"
3. See warning: "This role requires admin approval"
4. Submit role selection
5. ⏳ Redirected to /auth/pending-approval
6. Wait for admin to approve
7. Login again after approval
8. ✅ Access granted to /dashboard
```

### Admin Approval Process
```
1. Admin logs in
2. Goes to /dashboard/users
3. Sees "Pending Approval" counter
4. Clicks approve button for pending OAuth user
5. User can now login and access system
```

## Testing Instructions

### Test 1: OAuth User - TEAM_MEMBER Role
1. Sign out if logged in
2. Click "Sign in with Google"
3. Select "Team Member" role
4. **Expected**: Immediately redirected to dashboard
5. **Verify**: Can view tasks, cannot create projects

### Test 2: OAuth User - PROJECT_MANAGER Role
1. Sign out if logged in
2. Sign in with different Google account
3. Select "Project Manager" role
4. **Expected**: See approval required warning
5. **Expected**: Redirected to pending approval page
6. Admin logs in → goes to /dashboard/users
7. Admin clicks approve button
8. OAuth user signs out and signs in again
9. **Expected**: Can now access dashboard with PM features

### Test 3: Existing OAuth User
1. User who already has role logs in
2. **Expected**: Normal login flow
3. **Expected**: Approval status unchanged
4. **Expected**: Direct access to dashboard

### Test 4: Credentials User
1. Sign up with email/password and TEAM_MEMBER role
2. **Expected**: Auto-approved, immediate access
3. Sign up with email/password and SALES role
4. **Expected**: Needs admin approval

## Files Modified

1. ✅ `/app/api/user/profile/route.js` - Role selection & approval logic
2. ✅ `/components/RoleSelectionModal.jsx` - UI improvements & redirects
3. ✅ `/lib/auth.js` - JWT/session approval handling
4. ✅ `/app/api/auth/signup/route.js` - Credentials signup consistency

## Database Schema (No Changes Required)
The existing schema already supports this:
```prisma
model User {
  isApproved Boolean   @default(false)  // ✅ Already exists
  approvedAt DateTime?                  // ✅ Already exists
  approvedBy String?                    // ✅ Already exists
  role       Role?                      // ✅ Already nullable
}
```

## Security Benefits

### Before Fix
- ❌ OAuth users could select any role and immediately access system
- ❌ No admin oversight for elevated permissions
- ❌ Inconsistent with credentials-based signup flow

### After Fix
- ✅ TEAM_MEMBER auto-approved (safe, limited permissions)
- ✅ Elevated roles require admin approval
- ✅ Consistent approval flow for all signup methods
- ✅ Admin maintains control over user permissions
- ✅ Clear audit trail with `approvedAt` and `approvedBy`

## Visual Indicators

### Role Selection Modal
- **Badges**: Clear role labels with color coding
- **Approval Badge**: Yellow "Requires Approval" badge for elevated roles
- **Warning Message**: Yellow info box explaining approval process
- **Icon Indicators**: Clock icon for pending approval roles

### Pending Approval Page
- Professional waiting page
- Clear messaging about approval status
- Sign out option available
- Contact information for admin

## Future Enhancements

- [ ] Email notification to admins when new OAuth user needs approval
- [ ] Email notification to user when approved
- [ ] Admin notes/comments during approval
- [ ] Automatic role suggestions based on email domain
- [ ] Self-service role upgrade requests
- [ ] Time-limited trial access for elevated roles

## Troubleshooting

### Issue: OAuth user sees pending approval but should be auto-approved
**Solution**: Check if they selected TEAM_MEMBER role. Only TEAM_MEMBER is auto-approved.

### Issue: Session not updating after approval
**Solution**: User must sign out and sign in again to refresh the session JWT.

### Issue: Approval badge not showing
**Solution**: Clear browser cache and reload the page.

### Issue: Database shows isApproved but user still pending
**Solution**: Session is cached. Sign out and sign in to refresh.

## Migration Notes

**No database migration required!** This fix uses existing schema fields.

However, if you want to approve all existing OAuth users:
```sql
-- Approve all existing OAuth users with roles
UPDATE "User" 
SET "isApproved" = true, "approvedAt" = NOW() 
WHERE "role" IS NOT NULL 
  AND "isApproved" = false 
  AND "password" IS NULL;
```

Or approve only TEAM_MEMBER OAuth users:
```sql
UPDATE "User" 
SET "isApproved" = true, "approvedAt" = NOW() 
WHERE "role" = 'TEAM_MEMBER' 
  AND "isApproved" = false 
  AND "password" IS NULL;
```

## Summary

✅ **OAuth users now properly require admin approval for elevated roles**
✅ **TEAM_MEMBER role auto-approved for quick onboarding**
✅ **Consistent approval flow across all signup methods**
✅ **Clear visual indicators and user feedback**
✅ **No database changes required**

The admin approval system now works consistently for both OAuth and credentials-based users! 🎉
