import { betterAuth } from "better-auth";
import { Pool } from "pg";

import { Prisma } from "@/generated/prisma/client";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (name === "BETTER_AUTH_URL") {
    return "http://localhost:3000";
  }

  return `missing-${name.toLowerCase()}`;
}

function getOptionalEnv(name: string) {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const betterAuthInstance = betterAuth({
  baseURL: getRequiredEnv("BETTER_AUTH_URL"),
  secret: getRequiredEnv("BETTER_AUTH_SECRET"),
  database: new Pool({
    connectionString: getRequiredEnv("DATABASE_URL"),
  }),
  user: {
    modelName: "auth_users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "auth_sessions",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
  },
  account: {
    modelName: "auth_accounts",
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "auth_verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      const { buildPasswordResetEmail, safeSendEmail } =
        await import("@/lib/email");

      const result = await safeSendEmail(
        buildPasswordResetEmail({ email: user.email, url }),
      );

      if (!result.sent && process.env.NODE_ENV !== "production") {
        console.log(`Better Auth password reset URL for ${user.email}: ${url}`);
      }
    },
    onPasswordReset: async ({ user }) => {
      const { getPrisma } = await import("@/lib/db");
      const prisma = getPrisma();
      const appUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, email: true, role: true },
      });

      if (!appUser) {
        return;
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: appUser.id,
          action: "account.password.reset",
          entityType: "user",
          entityId: appUser.id,
          before: Prisma.JsonNull,
          after: {
            email: appUser.email,
            role: appUser.role,
            revokeSessionsOnPasswordReset: true,
          },
        },
      });
    },
  },
  socialProviders: {
    google: {
      clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    },
  },
  trustedOrigins: [
    getRequiredEnv("BETTER_AUTH_URL"),
    getOptionalEnv("NEXT_PUBLIC_APP_URL"),
  ].filter((origin): origin is string => Boolean(origin)),
});
