import { getPublicDonorName } from "@/lib/reports";
import { formatJakartaDateTime, formatRupiah } from "@/lib/telegram";

export type EmailProvider = "resend";

export type EmailMessage = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

export type EmailSendResult =
  | { sent: true }
  | { sent: false; reason: "disabled" | "missing-config" | "send-failed" };

export type AdminAlertEmailInput = {
  title: string;
  bodyLines: string[];
  occurredAt: Date;
};

export type SettlementEmailInput = {
  orderId: string;
  amount: number;
  donorName: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
  message: string | null;
  paidAt: Date;
};

export function getEmailProvider(): EmailProvider | null {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  return provider === "resend" ? "resend" : null;
}

export function getEmailFrom(): string | null {
  const value = process.env.EMAIL_FROM?.trim();
  return value && value.includes("@") ? value : null;
}

export function getAdminEmailRecipients(): string[] {
  const value = process.env.ADMIN_EMAIL_NOTIFICATIONS;

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter((recipient) => recipient.includes("@"));
}

export function isEmailEnabled(): boolean {
  return getEmailProvider() !== null && getEmailFrom() !== null;
}

export function buildPasswordResetEmail(input: {
  email: string;
  url: string;
}): EmailMessage {
  const subject = "Reset password akun Jumat Berkah";
  const text = [
    "Assalamu'alaikum.",
    "",
    "Kami menerima permintaan reset password untuk akun Jumat Berkah Anda.",
    "Buka tautan berikut untuk membuat password baru:",
    input.url,
    "",
    "Tautan berlaku 1 jam. Abaikan email ini jika Anda tidak meminta reset password.",
  ].join("\n");

  return {
    to: [input.email],
    subject,
    text,
    html: renderBasicHtml(subject, text),
  };
}

export function buildSettlementAdminEmail(
  input: SettlementEmailInput,
): Omit<EmailMessage, "to"> {
  const donorName = getPublicDonorName(input);
  const subject = `Donasi settlement ${input.orderId}`;
  const lines = [
    "Donasi baru sudah settlement.",
    "",
    `Order ID: ${input.orderId}`,
    `Nominal: ${formatRupiah(input.amount)}`,
    `Donatur: ${donorName}`,
    `Waktu bayar: ${formatJakartaDateTime(input.paidAt)}`,
  ];

  if (input.message && input.message.trim().length > 0) {
    lines.push(`Pesan: ${input.message.trim()}`);
  }

  const text = lines.join("\n");

  return {
    subject,
    text,
    html: renderBasicHtml(subject, text),
  };
}

export async function safeSendEmail(
  message: EmailMessage,
): Promise<EmailSendResult> {
  if (!isEmailEnabled()) {
    return { sent: false, reason: "disabled" };
  }

  const provider = getEmailProvider();
  const from = getEmailFrom();

  if (provider !== "resend" || from === null) {
    return { sent: false, reason: "missing-config" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "missing-config" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      console.error(`Email send failed: HTTP ${response.status}`);
      return { sent: false, reason: "send-failed" };
    }

    return { sent: true };
  } catch (error) {
    console.error("Email send failed", error);
    return { sent: false, reason: "send-failed" };
  }
}

export function buildAdminAlertEmail(
  input: AdminAlertEmailInput,
): Omit<EmailMessage, "to"> {
  const subject = `[Jumat Berkah] ${input.title}`;
  const text = [
    input.title,
    "",
    `Waktu: ${formatJakartaDateTime(input.occurredAt)}`,
    ...input.bodyLines,
  ].join("\n");

  return {
    subject,
    text,
    html: renderBasicHtml(subject, text),
  };
}

export async function safeSendAdminAlertEmail(input: AdminAlertEmailInput) {
  const recipients = getAdminEmailRecipients();

  if (recipients.length === 0) {
    return { sent: false, reason: "missing-config" as const };
  }

  const message = buildAdminAlertEmail(input);
  return safeSendEmail({ ...message, to: recipients });
}

export async function safeSendAdminSettlementEmail(
  input: SettlementEmailInput,
) {
  const recipients = getAdminEmailRecipients();

  if (recipients.length === 0) {
    return { sent: false, reason: "missing-config" as const };
  }

  const message = buildSettlementAdminEmail(input);
  return safeSendEmail({ ...message, to: recipients });
}

function renderBasicHtml(subject: string, text: string): string {
  const escapedSubject = escapeHtml(subject);
  const escapedText = escapeHtml(text).replaceAll("\n", "<br />");
  return `<main><h1>${escapedSubject}</h1><p>${escapedText}</p></main>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
