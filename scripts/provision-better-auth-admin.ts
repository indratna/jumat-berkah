import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

loadEnvConfig(process.cwd());

type SignUpResponse = {
  error?: {
    message?: string;
  };
  message?: string;
};

const authUrl = getRequiredEnv("BETTER_AUTH_URL").replace(/\/$/, "");
const email = getRequiredEnv("BETTER_AUTH_ADMIN_EMAIL").trim().toLowerCase();
const name = getRequiredEnv("BETTER_AUTH_ADMIN_NAME").trim();
const password = getRequiredEnv("BETTER_AUTH_ADMIN_PASSWORD");
const databaseUrl = getRequiredEnv("DATABASE_URL");

if (password.length < 8 || password.length > 128) {
  throw new Error("BETTER_AUTH_ADMIN_PASSWORD must be 8-128 characters.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  try {
    await ensureBetterAuthAccount();
    await ensureDomainAdminUser();
    console.log(`Better Auth admin provisioned for ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function ensureBetterAuthAccount() {
  const response = await fetch(`${authUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: authUrl,
    },
    body: JSON.stringify({
      email,
      name,
      password,
      callbackURL: "/admin",
    }),
  });

  if (response.ok) {
    return;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as SignUpResponse | null;
  const message =
    payload?.error?.message ?? payload?.message ?? `HTTP ${response.status}`;

  if (message.toLowerCase().includes("already")) {
    return;
  }

  throw new Error(`Better Auth sign-up failed: ${message}`);
}

async function ensureDomainAdminUser() {
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "admin",
    },
    create: {
      email,
      name,
      role: "admin",
    },
  });
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
