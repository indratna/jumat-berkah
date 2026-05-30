export type SystemSettingStatus = "ok" | "missing" | "warning";

export type SystemSettingItem = {
  key: string;
  label: string;
  status: SystemSettingStatus;
  detail: string | null;
};

export type SystemSettingGroup = {
  id: string;
  label: string;
  description: string;
  items: SystemSettingItem[];
};

function readEnv(key: string): string | null {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function presence(
  key: string,
  label: string,
  detail: string | null = null,
): SystemSettingItem {
  return {
    key,
    label,
    status: readEnv(key) ? "ok" : "missing",
    detail: readEnv(key) ? detail : null,
  };
}

function valueItem(
  key: string,
  label: string,
  display: string | null,
): SystemSettingItem {
  return {
    key,
    label,
    status: display ? "ok" : "missing",
    detail: display,
  };
}

function maskEmail(value: string): string {
  const [user, domain] = value.split("@");
  if (!user || !domain) {
    return "***";
  }

  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function countCsv(value: string | null): number {
  if (!value) {
    return 0;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0).length;
}

function buildBetterAuthSecret(): SystemSettingItem {
  const value = readEnv("BETTER_AUTH_SECRET");
  if (!value) {
    return {
      key: "BETTER_AUTH_SECRET",
      label: "Better Auth secret",
      status: "missing",
      detail: null,
    };
  }

  if (value.length < 32) {
    return {
      key: "BETTER_AUTH_SECRET",
      label: "Better Auth secret",
      status: "warning",
      detail: "Panjang kurang dari 32 karakter",
    };
  }

  return {
    key: "BETTER_AUTH_SECRET",
    label: "Better Auth secret",
    status: "ok",
    detail: null,
  };
}

function buildAdminEmail(): SystemSettingItem {
  const value = readEnv("ADMIN_EMAIL");
  return {
    key: "ADMIN_EMAIL",
    label: "Email admin utama",
    status: value ? "ok" : "missing",
    detail: value ? maskEmail(value) : null,
  };
}

function buildMidtransMode(): SystemSettingItem {
  const value = readEnv("MIDTRANS_IS_PRODUCTION");
  if (value === "true") {
    return {
      key: "MIDTRANS_IS_PRODUCTION",
      label: "Mode Midtrans",
      status: "ok",
      detail: "production",
    };
  }

  return {
    key: "MIDTRANS_IS_PRODUCTION",
    label: "Mode Midtrans",
    status: "ok",
    detail: "sandbox",
  };
}

function buildIntegerEnv(
  key: string,
  label: string,
  unit: string,
): SystemSettingItem {
  const value = readEnv(key);
  if (!value) {
    return { key, label, status: "missing", detail: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return { key, label, status: "warning", detail: `Bukan angka valid` };
  }

  return { key, label, status: "ok", detail: `${parsed} ${unit}`.trim() };
}

function buildBooleanEnv(
  key: string,
  label: string,
  trueText: string,
  falseText: string,
): SystemSettingItem {
  const value = readEnv(key);
  if (value === "true") {
    return { key, label, status: "ok", detail: trueText };
  }

  return { key, label, status: "ok", detail: falseText };
}

export function getSystemSettings(): SystemSettingGroup[] {
  return [
    {
      id: "aplikasi",
      label: "Aplikasi",
      description: "Identitas aplikasi dan akses admin.",
      items: [
        valueItem(
          "NEXT_PUBLIC_APP_URL",
          "URL publik aplikasi",
          readEnv("NEXT_PUBLIC_APP_URL"),
        ),
        buildBetterAuthSecret(),
        buildAdminEmail(),
        presence("ADMIN_LOGIN_CODE", "Kode login admin"),
      ],
    },
    {
      id: "database",
      label: "Database",
      description: "Koneksi database utama.",
      items: [presence("DATABASE_URL", "URL database PostgreSQL")],
    },
    {
      id: "midtrans",
      label: "Midtrans",
      description: "Pembayaran QRIS dan webhook.",
      items: [
        presence("MIDTRANS_SERVER_KEY", "Server key"),
        presence("MIDTRANS_CLIENT_KEY", "Client key"),
        buildMidtransMode(),
      ],
    },
    {
      id: "telegram",
      label: "Telegram",
      description: "Notifikasi dan bot Telegram.",
      items: [
        presence("TELEGRAM_BOT_TOKEN", "Bot token"),
        presence("TELEGRAM_WEBHOOK_SECRET_TOKEN", "Webhook secret token"),
        presence("TELEGRAM_NOTIFY_CHAT_ID", "Chat ID notifikasi admin"),
        presence("TELEGRAM_PUBLIC_CHANNEL_ID", "Channel publik"),
        {
          key: "TELEGRAM_ADMIN_ALLOWLIST",
          label: "Allowlist chat admin",
          status: countCsv(readEnv("TELEGRAM_ADMIN_ALLOWLIST"))
            ? "ok"
            : "missing",
          detail: (() => {
            const total = countCsv(readEnv("TELEGRAM_ADMIN_ALLOWLIST"));
            return total > 0 ? `${total} chat ID` : null;
          })(),
        },
      ],
    },
    {
      id: "email",
      label: "Email",
      description: "Pengirim email transaksional.",
      items: [
        valueItem(
          "EMAIL_PROVIDER",
          "Provider email",
          readEnv("EMAIL_PROVIDER")?.toLowerCase() === "resend"
            ? "resend"
            : null,
        ),
        valueItem("EMAIL_FROM", "Alamat pengirim", readEnv("EMAIL_FROM")),
        presence("RESEND_API_KEY", "Resend API key"),
        {
          key: "ADMIN_EMAIL_NOTIFICATIONS",
          label: "Penerima email admin",
          status: countCsv(readEnv("ADMIN_EMAIL_NOTIFICATIONS"))
            ? "ok"
            : "missing",
          detail: (() => {
            const total = countCsv(readEnv("ADMIN_EMAIL_NOTIFICATIONS"));
            return total > 0 ? `${total} email` : null;
          })(),
        },
      ],
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      description: "Pengingat WhatsApp Cloud API.",
      items: [
        buildBooleanEnv(
          "WHATSAPP_ENABLED",
          "Status WhatsApp",
          "Aktif",
          "Nonaktif",
        ),
        presence("WHATSAPP_PROVIDER", "Provider"),
        presence("WHATSAPP_PHONE_NUMBER_ID", "Phone Number ID"),
        presence("WHATSAPP_ACCESS_TOKEN", "Access token"),
      ],
    },
    {
      id: "cron-ops",
      label: "Cron & Ops",
      description: "Konfigurasi cron, threshold alert, dan persetujuan biaya.",
      items: [
        presence("CRON_SECRET", "Cron secret"),
        buildIntegerEnv(
          "TELEGRAM_LOW_BALANCE_THRESHOLD",
          "Threshold saldo rendah",
          "Rupiah",
        ),
        buildIntegerEnv(
          "TELEGRAM_LOW_TARGET_PROGRESS_PERCENT",
          "Threshold progres rendah",
          "%",
        ),
        buildIntegerEnv(
          "EXPENSE_APPROVAL_THRESHOLD_RUPIAH",
          "Batas biaya butuh approval",
          "Rupiah",
        ),
        buildIntegerEnv(
          "EXPENSE_APPROVAL_REQUIRED_COUNT",
          "Jumlah approval minimal",
          "approver",
        ),
      ],
    },
  ];
}
