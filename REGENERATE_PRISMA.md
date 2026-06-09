# Fix: Regenerate Prisma Client

## Problem
The `isApproved` field exists in the database but the Prisma Client is out of sync, causing the error:
```
Unknown field `isApproved` for select statement on model `User`
```

## Solution

### Step 1: Stop the Dev Server
Press `Ctrl+C` in the terminal where `npm run dev` is running.

### Step 2: Regenerate Prisma Client
```powershell
npx prisma generate
```

This will regenerate the Prisma Client with the latest schema including the `isApproved`, `approvedAt`, and `approvedBy` fields.

### Step 3: Restart Dev Server
```powershell
npm run dev
```

## Verification

After these steps, try signing in with OAuth again. The role selection should work correctly.

## Why This Happened

The Prisma Client was generated before the `isApproved` fields were added to the schema. The database has the fields (verified with `npx prisma db push`), but the TypeScript types and query builder don't know about them yet.

When the dev server is running, it locks the Prisma Client files, preventing regeneration. That's why we need to stop it first.
