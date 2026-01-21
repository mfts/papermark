import crypto from "crypto";

import { z } from "zod";

import prisma from "@/lib/prisma";
import { checkPassword, hashPassword } from "@/lib/utils";

// Validation schemas
export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  name: z.string().trim().optional(),
});

export const signinSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Token expiry constants
export const EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new user with password
 */
export async function createUserWithPassword(data: SignupInput) {
  const { email, password, name } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, emailVerified: true },
  });

  if (existingUser) {
    // If user exists with password, return error
    if (existingUser.passwordHash) {
      return { error: "An account with this email already exists" };
    }

    // If user exists but without password (OAuth user), add password to existing account
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.update({
      where: { email },
      data: { passwordHash, name: name || existingUser.id },
    });

    return { user, isExistingOAuthUser: true };
  }

  // Create new user
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  return { user, isExistingOAuthUser: false };
}

/**
 * Create email verification token
 */
export async function createEmailVerificationToken(userId: string) {
  // Invalidate any existing tokens for this user
  await prisma.emailVerificationToken.updateMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await prisma.emailVerificationToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt,
    },
  });

  return token; // Return unhashed token for email
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string) {
  const hashedToken = hashToken(token);

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!verificationToken) {
    return { error: "Invalid verification link" };
  }

  if (verificationToken.usedAt) {
    return { error: "This verification link has already been used" };
  }

  if (verificationToken.expiresAt < new Date()) {
    return { error: "This verification link has expired" };
  }

  // Mark token as used and verify user email
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    }),
  ]);

  return { success: true, user: verificationToken.user };
}

/**
 * Create password reset token
 */
export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // Always return success to prevent user enumeration
  // But only create token if user exists and has password auth
  if (!user || !user.passwordHash) {
    return { success: true }; // Don't reveal if user exists
  }

  // Invalidate any existing tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await prisma.passwordResetToken.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { success: true, token, userId: user.id }; // Return unhashed token for email
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string) {
  const hashedToken = hashToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!resetToken) {
    return { error: "Invalid reset link" };
  }

  if (resetToken.usedAt) {
    return { error: "This reset link has already been used" };
  }

  if (resetToken.expiresAt < new Date()) {
    return { error: "This reset link has expired" };
  }

  return { success: true, user: resetToken.user, tokenId: resetToken.id };
}

/**
 * Reset user password
 */
export async function resetPassword(token: string, newPassword: string) {
  const verification = await verifyPasswordResetToken(token);

  if (verification.error) {
    return { error: verification.error };
  }

  const hashedPassword = await hashPassword(newPassword);
  const hashedToken = hashToken(token);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { token: hashedToken },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verification.user!.id },
      data: { passwordHash: hashedPassword },
    }),
  ]);

  return { success: true };
}

/**
 * Authenticate user with email and password
 */
export async function authenticateWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      passwordHash: true,
      emailVerified: true,
    },
  });

  if (!user || !user.passwordHash) {
    return { error: "Invalid email or password" };
  }

  const isValidPassword = await checkPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return { error: "Invalid email or password" };
  }

  // Check if email is verified
  if (!user.emailVerified) {
    return { error: "Please verify your email address before signing in", needsVerification: true };
  }

  // Remove passwordHash from returned user
  const { passwordHash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword };
}

/**
 * Check if user can resend verification email
 * Returns true if no recent token was sent (rate limiting)
 */
export async function canResendVerificationEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return false;

  // Check for recent tokens (within last 2 minutes)
  const recentToken = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      createdAt: {
        gt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
    },
  });

  return !recentToken;
}
