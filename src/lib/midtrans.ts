import { createHash, timingSafeEqual } from "node:crypto";

import { DonationStatus } from "@/generated/prisma/client";

type MidtransConfig = {
  serverKey: string;
  isProduction: boolean;
  appUrl: string;
  enabledPayments: string[];
};

type CreateSnapTransactionInput = {
  orderId: string;
  amount: number;
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
};

type MidtransCustomerDetails = {
  first_name?: string;
  email?: string;
  phone?: string;
};

type MidtransSnapRequest = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  enabled_payments?: string[];
  customer_details?: MidtransCustomerDetails;
  callbacks: {
    finish: string;
    error: string;
    pending: string;
  };
};

type MidtransSnapResponse = {
  token: string;
  redirect_url: string;
};

export type MidtransNotificationPayload = {
  order_id?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
  transaction_status?: unknown;
  fraud_status?: unknown;
  transaction_id?: unknown;
};

export type ParsedMidtransNotification = {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  transactionStatus: string;
  fraudStatus: string | null;
  transactionId: string | null;
};

export type PaymentHandoff = {
  provider: "midtrans";
  method: "qris";
  snapToken: string;
  redirectUrl: string;
};

export class MidtransConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MidtransConfigurationError";
  }
}

export async function createMidtransSnapTransaction(
  input: CreateSnapTransactionInput,
): Promise<PaymentHandoff> {
  const config = getMidtransConfig();
  const statusUrl = `${config.appUrl}/donasi/status/${input.orderId}`;
  const payload: MidtransSnapRequest = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.amount,
    },
    callbacks: {
      finish: statusUrl,
      error: statusUrl,
      pending: statusUrl,
    },
  };

  if (config.enabledPayments.length > 0) {
    payload.enabled_payments = config.enabledPayments;
  }

  const customerDetails = buildCustomerDetails(input);

  if (customerDetails) {
    payload.customer_details = customerDetails;
  }

  const response = await fetch(
    `${getMidtransApiBaseUrl(config)}/snap/v1/transactions`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Midtrans transaction failed: ${response.status} ${errorText}`,
    );
  }

  const snapResponse = (await response.json()) as MidtransSnapResponse;

  return {
    provider: "midtrans",
    method: "qris",
    snapToken: snapResponse.token,
    redirectUrl: snapResponse.redirect_url,
  };
}

export function parseMidtransNotification(
  payload: MidtransNotificationPayload,
): ParsedMidtransNotification | null {
  const orderId = normalizeString(payload.order_id);
  const statusCode = normalizeString(payload.status_code);
  const grossAmount = normalizeString(payload.gross_amount);
  const signatureKey = normalizeString(payload.signature_key);
  const transactionStatus = normalizeString(payload.transaction_status);
  const fraudStatus = normalizeString(payload.fraud_status);
  const transactionId = normalizeString(payload.transaction_id);

  if (
    !orderId ||
    !statusCode ||
    !grossAmount ||
    !signatureKey ||
    !transactionStatus
  ) {
    return null;
  }

  return {
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
    transactionStatus,
    fraudStatus,
    transactionId,
  };
}

export function verifyMidtransSignature(
  notification: ParsedMidtransNotification,
) {
  const config = getMidtransConfig();
  const expectedSignature = createHash("sha512")
    .update(
      `${notification.orderId}${notification.statusCode}${notification.grossAmount}${config.serverKey}`,
    )
    .digest("hex");
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(notification.signatureKey);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function mapMidtransStatus(notification: ParsedMidtransNotification) {
  if (notification.transactionStatus === "settlement") {
    return DonationStatus.settlement;
  }

  if (notification.transactionStatus === "capture") {
    return notification.fraudStatus === "accept"
      ? DonationStatus.settlement
      : DonationStatus.pending;
  }

  if (notification.transactionStatus === "pending") {
    return DonationStatus.pending;
  }

  if (notification.transactionStatus === "expire") {
    return DonationStatus.expire;
  }

  if (notification.transactionStatus === "cancel") {
    return DonationStatus.cancel;
  }

  if (notification.transactionStatus === "deny") {
    return DonationStatus.deny;
  }

  if (notification.transactionStatus === "failure") {
    return DonationStatus.failure;
  }

  if (notification.transactionStatus === "refund") {
    return DonationStatus.refund;
  }

  return null;
}

export type MidtransTransactionStatusResponse = {
  orderId: string;
  transactionStatus: string;
  fraudStatus: string | null;
  statusCode: string;
  grossAmount: string;
};

export async function checkMidtransTransactionStatus(
  orderId: string,
): Promise<MidtransTransactionStatusResponse> {
  const config = getMidtransConfig();
  const baseUrl = getMidtransApiBaseUrl(config);

  const response = await fetch(`${baseUrl}/v2/${orderId}/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Midtrans status check failed: ${response.status} ${errorText}`,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    orderId: String(data.order_id ?? ""),
    transactionStatus: String(data.transaction_status ?? ""),
    fraudStatus:
      typeof data.fraud_status === "string" ? data.fraud_status : null,
    statusCode: String(data.status_code ?? ""),
    grossAmount: String(data.gross_amount ?? ""),
  };
}

function getMidtransConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!serverKey) {
    throw new MidtransConfigurationError("MIDTRANS_SERVER_KEY is required.");
  }

  return {
    serverKey,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    appUrl: appUrl.replace(/\/$/, ""),
    enabledPayments: parseEnabledPayments(
      process.env.MIDTRANS_ENABLED_PAYMENTS,
    ),
  };
}

function parseEnabledPayments(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((payment) => payment.trim())
    .filter((payment) => payment.length > 0);
}

function getMidtransApiBaseUrl(config: MidtransConfig) {
  return config.isProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function buildCustomerDetails(input: CreateSnapTransactionInput) {
  const customerDetails: MidtransCustomerDetails = {};

  if (input.donorName) {
    customerDetails.first_name = input.donorName;
  }

  if (input.donorEmail) {
    customerDetails.email = input.donorEmail;
  }

  if (input.donorPhone) {
    customerDetails.phone = input.donorPhone;
  }

  return Object.keys(customerDetails).length > 0 ? customerDetails : null;
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
