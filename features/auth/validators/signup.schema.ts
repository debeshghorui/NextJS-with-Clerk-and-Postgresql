import { z } from 'zod';

export const signupSchema = z.object({
    firstName: z.string().min(1).max(20).optional(),
    lastName: z.string().min(1).max(20).optional(),
    email: z.string().email().min(1).max(255),
    password: z.string().min(8).max(255),
});

export type SignupSchema = z.infer<typeof signupSchema>;
