import { getCurrentFridayCycleRange } from "@/lib/friday-cycle";
import { getPublicReport } from "@/lib/reports";

export type PublicReportExport = Awaited<ReturnType<typeof getPublicReport>>;

export function buildPublicReportCsv(report: PublicReportExport) {
  const rows = [
    ["bagian", "tanggal", "nama", "kategori", "deskripsi", "nominal"],
    [
      "ringkasan",
      "",
      "Pemasukan Periode",
      "",
      "",
      String(report.summary.income),
    ],
    [
      "ringkasan",
      "",
      "Pengeluaran Periode",
      "",
      "",
      String(report.summary.expenses),
    ],
    [
      "ringkasan",
      "",
      "Saldo Periode",
      "",
      "",
      String(report.summary.periodBalance),
    ],
    [
      "ringkasan",
      "",
      "Saldo Berjalan",
      "",
      "",
      String(report.summary.currentBalance),
    ],
    ...report.donations.map((donation) => [
      "donasi",
      donation.date,
      donation.donorName,
      "",
      donation.message ?? "",
      String(donation.amount),
    ]),
    ...report.expenses.map((expense) => [
      "pengeluaran",
      expense.date,
      "",
      expense.category,
      expense.description,
      String(-expense.amount),
    ]),
  ];

  return rows.map(formatCsvRow).join("\n");
}

export function buildFridayCycleReportPdf(input: {
  report: PublicReportExport;
  generatedAt: Date;
  now?: Date;
}) {
  const cycle = getCurrentFridayCycleRange(input.now ?? input.generatedAt);
  const lines = buildReportTextLines({
    title: "Laporan Jumat Berkah",
    periodLabel: `Siklus Jumat ${cycle.label}`,
    report: input.report,
    generatedAt: input.generatedAt,
  });

  return buildSimplePdf(lines);
}

export function buildReportTextLines(input: {
  title: string;
  periodLabel: string;
  report: PublicReportExport;
  generatedAt: Date;
}) {
  const lines = [
    input.title,
    input.periodLabel,
    `Dibuat: ${formatDateTime(input.generatedAt)}`,
    "",
    `Pemasukan Periode: ${formatRupiah(input.report.summary.income)}`,
    `Pengeluaran Periode: ${formatRupiah(input.report.summary.expenses)}`,
    `Saldo Periode: ${formatRupiah(input.report.summary.periodBalance)}`,
    `Saldo Berjalan: ${formatRupiah(input.report.summary.currentBalance)}`,
    "",
    "Ringkasan Kategori Pengeluaran",
    ...input.report.expenseCategories
      .slice(0, 8)
      .map(
        (category) => `${category.category} - ${formatRupiah(category.amount)}`,
      ),
    input.report.expenseCategories.length === 0
      ? "Belum ada kategori pengeluaran."
      : "",
    "",
    "Donasi Berhasil",
    ...input.report.donations
      .slice(0, 12)
      .map(
        (donation) =>
          `${donation.date} - ${donation.donorName} - ${formatRupiah(donation.amount)}`,
      ),
    input.report.donations.length === 0 ? "Belum ada donasi berhasil." : "",
    "",
    "Pengeluaran",
    ...input.report.expenses
      .slice(0, 12)
      .map(
        (expense) =>
          `${expense.date} - ${expense.category} - ${formatRupiah(expense.amount)} - ${expense.description}`,
      ),
    input.report.expenses.length === 0 ? "Belum ada pengeluaran." : "",
    "",
    "Timeline Transparansi",
    ...input.report.timeline.slice(0, 8).map((item) => {
      const amount =
        item.amount === null ? "" : ` - ${formatRupiah(item.amount)}`;
      return `${item.date} - ${item.title}${amount}`;
    }),
    input.report.timeline.length === 0 ? "Belum ada aktivitas publik." : "",
    "",
    "Catatan privasi: laporan publik tidak memuat email atau nomor WhatsApp donatur.",
    "Laporan ini hanya menghitung donasi berstatus settlement sebagai pemasukan.",
  ];

  return lines.filter(
    (line, index, all) => line !== "" || all[index - 1] !== "",
  );
}

function buildSimplePdf(lines: string[]) {
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 790 Td",
    "13 TL",
    ...lines.flatMap((line, index) => {
      const text = `(${escapePdfText(line.slice(0, 105))}) Tj`;
      return index === 0 ? [text] : ["T*", text];
    }),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function formatCsvRow(values: string[]) {
  return values.map(formatCsvCell).join(",");
}

function formatCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
