-- Fix DocumentStatus enum to match Prisma schema
-- This script ensures the database enum matches the schema definition

-- First, check current enum values
-- Run: SELECT enum_range(NULL::public."DocumentStatus");

-- Drop and recreate the enum with correct values
-- WARNING: This will fail if there are existing values not in the new enum
-- You may need to update existing records first

-- Step 1: Add any missing enum values
DO $$ 
BEGIN
    -- Add PENDING_APPROVAL if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PENDING_APPROVAL' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'PENDING_APPROVAL';
    END IF;

    -- Add APPROVED if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'APPROVED' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'APPROVED';
    END IF;

    -- Add REJECTED if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'REJECTED' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'REJECTED';
    END IF;

    -- Add CONFIRMED if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CONFIRMED' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'CONFIRMED';
    END IF;

    -- Add CANCELLED if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CANCELLED' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'CANCELLED';
    END IF;

    -- Add PAID if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PAID' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'PAID';
    END IF;

    -- Add PARTIAL if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PARTIAL' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'PARTIAL';
    END IF;

    -- Add SENT if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'SENT' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'SENT';
    END IF;

    -- Add DONE if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DONE' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'DONE';
    END IF;

    -- Add DRAFT if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DRAFT' 
        AND enumtypid = 'public."DocumentStatus"'::regtype
    ) THEN
        ALTER TYPE public."DocumentStatus" ADD VALUE 'DRAFT';
    END IF;
END $$;

-- Verify the enum values
SELECT enum_range(NULL::public."DocumentStatus");
