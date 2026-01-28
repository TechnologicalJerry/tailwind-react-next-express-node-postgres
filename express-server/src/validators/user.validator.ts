import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    userName: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    email: z.string().email().optional(),
    dob: z.string().optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    search: z.string().optional(),
    role: z.enum(['admin', 'manager', 'user']).optional(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'manager', 'user']),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type GetUsersQuery = z.infer<typeof getUsersSchema>['query'];
