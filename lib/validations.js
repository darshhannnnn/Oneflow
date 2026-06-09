import { z } from "zod";

// =======================
// Email Validation
// =======================
const disposableEmailDomains = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
  "trashmail.com",
  "yopmail.com",
  "maildrop.cc",
  "getnada.com",
];

const invalidEmailPatterns = [
  /^test@/i,
  /^admin@/i,
  /^demo@/i,
  /^sample@/i,
  /^example@/i,
  /^user@/i,
  /^noreply@/i,
  /^no-reply@/i,
];

const commonInvalidDomains = [
  "abc.com",
  "xyz.com",
  "test.com",
  "example.com",
  "sample.com",
  "demo.com",
  "temp.com",
  "fake.com",
  "invalid.com",
];

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return !disposableEmailDomains.includes(domain);
    },
    { message: "Disposable email addresses are not allowed" }
  )
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return !commonInvalidDomains.includes(domain);
    },
    { message: "Please use a valid business or personal email address" }
  )
  .refine(
    (email) => {
      return !invalidEmailPatterns.some((pattern) => pattern.test(email));
    },
    { message: "Please use a real email address" }
  )
  .refine(
    (email) => {
      const localPart = email.split("@")[0];
      // Check for repeated characters (like aaaa@domain.com)
      return !/(.)\1{3,}/.test(localPart);
    },
    { message: "Email appears to be invalid" }
  );

// =======================
// Name Validation
// =======================
const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters")
  .refine(
    (name) => {
      // Must contain at least one letter
      return /[a-zA-Z]/.test(name);
    },
    { message: "Name must contain at least one letter" }
  )
  .refine(
    (name) => {
      // No excessive special characters
      const specialCharCount = (name.match(/[^a-zA-Z0-9\s]/g) || []).length;
      return specialCharCount <= 3;
    },
    { message: "Name contains too many special characters" }
  )
  .refine(
    (name) => {
      // Not just numbers
      return !/^\d+$/.test(name.trim());
    },
    { message: "Name cannot be only numbers" }
  );

// =======================
// Password Validation
// =======================
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must not exceed 100 characters")
  .refine(
    (password) => /[a-z]/.test(password),
    { message: "Password must contain at least one lowercase letter" }
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: "Password must contain at least one uppercase letter" }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: "Password must contain at least one number" }
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    { message: "Password must contain at least one special character" }
  )
  .refine(
    (password) => {
      // Check for common weak passwords
      const weakPasswords = [
        "password",
        "12345678",
        "qwerty123",
        "abc12345",
        "password1",
        "password123",
      ];
      return !weakPasswords.some((weak) =>
        password.toLowerCase().includes(weak)
      );
    },
    { message: "Password is too common or weak" }
  );

// =======================
// Date Validation
// =======================
const futureDateSchema = z
  .string()
  .min(1, "Date is required")
  .refine(
    (dateStr) => {
      const selectedDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    { message: "Date cannot be in the past" }
  );

const optionalFutureDateSchema = z
  .string()
  .optional()
  .refine(
    (dateStr) => {
      if (!dateStr) return true;
      const selectedDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    { message: "Date cannot be in the past" }
  );

const dateRangeSchema = z.object({
  startDate: futureDateSchema,
  endDate: futureDateSchema,
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

// =======================
// Number Validation
// =======================
const positiveNumberSchema = z
  .string()
  .min(1, "Value is required")
  .refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Must be a positive number" }
  )
  .refine(
    (val) => Number(val) < 1e15,
    { message: "Value is too large" }
  );

const optionalPositiveNumberSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return !isNaN(Number(val)) && Number(val) > 0;
    },
    { message: "Must be a positive number" }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return Number(val) < 1e15;
    },
    { message: "Value is too large" }
  );

const hoursSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 10000;
    },
    { message: "Hours must be between 0 and 10,000" }
  );

// =======================
// Text Validation
// =======================
const titleSchema = z
  .string()
  .min(3, "Title must be at least 3 characters")
  .max(200, "Title must not exceed 200 characters")
  .refine(
    (title) => title.trim().length >= 3,
    { message: "Title cannot be only whitespace" }
  )
  .refine(
    (title) => {
      // Must contain at least one alphanumeric character
      return /[a-zA-Z0-9]/.test(title);
    },
    { message: "Title must contain at least one letter or number" }
  );

const descriptionSchema = z
  .string()
  .max(5000, "Description must not exceed 5000 characters")
  .optional();

const codeSchema = z
  .string()
  .optional()
  .refine(
    (code) => {
      if (!code) return true;
      // Alphanumeric, hyphens, underscores only
      return /^[a-zA-Z0-9_-]+$/.test(code);
    },
    { message: "Code can only contain letters, numbers, hyphens, and underscores" }
  )
  .refine(
    (code) => {
      if (!code) return true;
      return code.length >= 2 && code.length <= 20;
    },
    { message: "Code must be between 2 and 20 characters" }
  );

// =======================
// User Validation
// =======================
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// =======================
// Project Validation
// =======================
export const projectSchema = z.object({
  name: titleSchema,
  code: codeSchema,
  description: descriptionSchema,
  managerId: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: optionalFutureDateSchema,
  endDate: optionalFutureDateSchema,
  budget: optionalPositiveNumberSchema,
  memberIds: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    if (!data.budget) return true;
    const budget = Number(data.budget);
    return budget >= 0 && budget <= 1000000000; // 1 billion max
  },
  {
    message: "Budget must be between 0 and 1,000,000,000",
    path: ["budget"],
  }
);

// =======================
// Task Validation
// =======================
export const taskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  assigneeId: z.string().optional(),
  status: z.enum(["NEW", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  deadline: optionalFutureDateSchema,
  estimateHours: hoursSchema,
  loggedHours: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 10000;
      },
      { message: "Logged hours must be between 0 and 10,000" }
    ),
  coverUrl: z
    .string()
    .optional()
    .refine(
      (url) => {
        if (!url) return true;
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid URL" }
    ),
}).refine(
  (data) => {
    // Logged hours should not exceed estimated hours
    if (!data.loggedHours || !data.estimateHours) return true;
    const logged = Number(data.loggedHours);
    const estimated = Number(data.estimateHours);
    if (isNaN(logged) || isNaN(estimated)) return true;
    return logged <= estimated * 1.5; // Allow 50% overrun as warning, not error
  },
  {
    message: "Logged hours significantly exceed estimated hours (more than 50% overrun)",
    path: ["loggedHours"],
  }
);

// =======================
// Profile Validation
// =======================
export const profileSchema = z.object({
  name: nameSchema,
  avatarUrl: z
    .string()
    .optional()
    .refine(
      (url) => {
        if (!url) return true;
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid URL" }
    ),
  hourlyRate: z
    .number()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === null) return true;
        return val > 0 && val <= 10000;
      },
      { message: "Hourly rate must be between 0 and 10,000" }
    ),
});

// =======================
// Utility Functions
// =======================
export const validateField = (schema, value) => {
  try {
    schema.parse(value);
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Validation failed",
    };
  }
};

export const validateForm = (schema, data) => {
  try {
    schema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.errors.forEach((err) => {
      const path = err.path.join(".");
      errors[path] = err.message;
    });
    return { success: false, errors };
  }
};
