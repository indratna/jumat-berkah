import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requiredEnv("DATABASE_URL") }),
});

async function main() {
  const donation = await prisma.donation.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    select: { orderId: true, amount: true },
  });

  if (!donation) {
    throw new Error("NO_PENDING_DONATION");
  }

  const grossAmount = `${donation.amount}.00`;
  const signature = createHash("sha512")
    .update(`${donation.orderId}200${grossAmount}${requiredEnv("MIDTRANS_SERVER_KEY")}`)
    .digest("hex");
  const response = await fetch("http://localhost:3037/api/webhooks/midtrans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction_time: new Date().toISOString().replace("T", " ").slice(0, 19),
      transaction_status: "settlement",
      transaction_id: `sandbox-manual-${Date.now()}`,
      status_message: "midtrans payment notification simulation",
      status_code: "200",
      signature_key: signature,
      payment_type: "qris",
      order_id: donation.orderId,
      merchant_id: process.env.MIDTRANS_MERCHANT_ID ?? "sandbox",
      gross_amount: grossAmount,
      fraud_status: "accept",
    }),
  });

  console.log(JSON.stringify({
    orderId: donation.orderId,
    httpStatus: response.status,
    response: await response.text(),
  }, null, 2));
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
