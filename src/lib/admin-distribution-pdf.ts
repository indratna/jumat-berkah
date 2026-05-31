import { formatAdminDate, formatAdminDateOnly } from "@/lib/admin";
import type { DistributionReportRecord } from "@/lib/distribution-report";

type DistributionPdfFilters = {
  status: string | null;
  q: string | null;
};

type DistributionPdfInput = {
  reports: DistributionReportRecord[];
  total: number;
  filters: DistributionPdfFilters;
};

type PdfColumn = {
  label: string;
  width: number;
  align?: "left" | "right" | "center";
  value: (report: DistributionReportRecord) => string;
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN_X = 36;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 28;
const TABLE_ROW_HEIGHT = 18;
const TABLE_HEADER_HEIGHT = 22;
const TITLE_SECTION_HEIGHT = 92;
const FOOTER_HEIGHT = 18;
const BODY_FONT_SIZE = 9;
const HEADER_FONT_SIZE = 9;
const TITLE_FONT_SIZE = 18;
const META_FONT_SIZE = 9;

const COLUMNS: PdfColumn[] = [
  {
    label: "Siklus",
    width: 90,
    value: (report) => formatAdminDateOnly(report.cycleStart),
  },
  {
    label: "Judul",
    width: 152,
    value: (report) => report.title,
  },
  {
    label: "Status",
    width: 56,
    align: "center",
    value: (report) => (report.publishedAt ? "Publik" : "Draft"),
  },
  {
    label: "Foto",
    width: 42,
    align: "center",
    value: (report) => String(report.photoUrls.length),
  },
  {
    label: "Paket",
    width: 52,
    align: "right",
    value: (report) =>
      report.packageCount !== null ? String(report.packageCount) : "-",
  },
  {
    label: "Lokasi",
    width: 120,
    value: (report) => report.locationSummary ?? "-",
  },
  {
    label: "Ringkasan",
    width: 190,
    value: (report) => truncate(report.summary, 64),
  },
  {
    label: "Publish",
    width: 110,
    value: (report) =>
      report.publishedAt ? formatAdminDate(report.publishedAt) : "-",
  },
];

export function buildAdminDistributionPdf(input: DistributionPdfInput) {
  const publishedCount = input.reports.filter((report) => report.publishedAt).length;

  const firstPageRows = Math.max(
    1,
    Math.floor(
      (PAGE_HEIGHT -
        MARGIN_TOP -
        TITLE_SECTION_HEIGHT -
        TABLE_HEADER_HEIGHT -
        MARGIN_BOTTOM -
        FOOTER_HEIGHT) /
        TABLE_ROW_HEIGHT,
    ),
  );
  const nextPageRows = Math.max(
    1,
    Math.floor(
      (PAGE_HEIGHT -
        MARGIN_TOP -
        TABLE_HEADER_HEIGHT -
        MARGIN_BOTTOM -
        FOOTER_HEIGHT) /
        TABLE_ROW_HEIGHT,
    ),
  );

  const pages = paginate(input.reports, firstPageRows, nextPageRows);
  const contentStreams = pages.map((pageRows, index) =>
    buildPageContent({
      rows: pageRows,
      pageIndex: index,
      pageCount: pages.length,
      totalRows: input.total,
      filters: input.filters,
      publishedCount,
    }),
  );

  return buildPdfDocument(contentStreams);
}

function paginate<T>(items: T[], firstPageRows: number, nextPageRows: number) {
  if (items.length === 0) {
    return [[] as T[]];
  }

  const pages: T[][] = [];
  pages.push(items.slice(0, firstPageRows));

  let offset = firstPageRows;
  while (offset < items.length) {
    pages.push(items.slice(offset, offset + nextPageRows));
    offset += nextPageRows;
  }

  return pages;
}

function buildPageContent(input: {
  rows: DistributionReportRecord[];
  pageIndex: number;
  pageCount: number;
  totalRows: number;
  filters: DistributionPdfFilters;
  publishedCount: number;
}) {
  const commands: string[] = [];
  const pageTop = PAGE_HEIGHT - MARGIN_TOP;

  if (input.pageIndex === 0) {
    drawFilledRect(commands, MARGIN_X, pageTop - 28, 300, 28, "0.91 0.96 0.93 rg");
    drawText(commands, {
      text: "Laporan Cerita Penyaluran",
      x: MARGIN_X + 12,
      y: pageTop - 20,
      font: "F2",
      size: TITLE_FONT_SIZE,
      color: "0.09 0.22 0.14 rg",
    });

    drawText(commands, {
      text: `Dicetak: ${formatAdminDate(new Date())}`,
      x: MARGIN_X,
      y: pageTop - 44,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
    drawText(commands, {
      text: `Status: ${input.filters.status?.trim() || "Semua"}`,
      x: MARGIN_X,
      y: pageTop - 58,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
    drawText(commands, {
      text: `Cari: ${input.filters.q?.trim() || "-"}`,
      x: MARGIN_X,
      y: pageTop - 72,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });

    const summaryX = PAGE_WIDTH - MARGIN_X - 220;
    const summaryY = pageTop - 80;
    drawFilledRect(commands, summaryX, summaryY, 220, 74, "0.97 0.98 0.99 rg");
    drawStrokedRect(commands, summaryX, summaryY, 220, 74, "0.84 0.88 0.93 RG");
    drawText(commands, {
      text: "Ringkasan Export",
      x: summaryX + 12,
      y: summaryY + 56,
      font: "F2",
      size: 10,
      color: "0.18 0.25 0.35 rg",
    });
    drawText(commands, {
      text: `Total cerita: ${input.totalRows}`,
      x: summaryX + 12,
      y: summaryY + 38,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
    drawText(commands, {
      text: `Publik: ${input.publishedCount}`,
      x: summaryX + 12,
      y: summaryY + 24,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
    drawText(commands, {
      text: `Draft: ${Math.max(0, input.totalRows - input.publishedCount)}`,
      x: summaryX + 12,
      y: summaryY + 10,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
  }

  const tableTop =
    input.pageIndex === 0
      ? pageTop - TITLE_SECTION_HEIGHT
      : pageTop;

  drawTableHeader(commands, tableTop);

  input.rows.forEach((report, rowIndex) => {
    const y = tableTop - TABLE_HEADER_HEIGHT - rowIndex * TABLE_ROW_HEIGHT;
    const background = rowIndex % 2 === 0 ? "0.99 0.995 1 rg" : "1 1 1 rg";
    drawFilledRect(
      commands,
      MARGIN_X,
      y - TABLE_ROW_HEIGHT + 1,
      getTableWidth(),
      TABLE_ROW_HEIGHT,
      background,
    );
    drawRow(commands, report, y - 12);
  });

  drawText(commands, {
    text: `Halaman ${input.pageIndex + 1}/${input.pageCount}`,
    x: PAGE_WIDTH - MARGIN_X - 70,
    y: 14,
    size: 8,
    color: "0.45 0.45 0.45 rg",
  });

  return commands.join("\n");
}

function drawTableHeader(commands: string[], topY: number) {
  drawFilledRect(
    commands,
    MARGIN_X,
    topY - TABLE_HEADER_HEIGHT,
    getTableWidth(),
    TABLE_HEADER_HEIGHT,
    "0.92 0.95 0.98 rg",
  );
  drawStrokedRect(
    commands,
    MARGIN_X,
    topY - TABLE_HEADER_HEIGHT,
    getTableWidth(),
    TABLE_HEADER_HEIGHT,
    "0.82 0.86 0.9 RG",
  );

  let x = MARGIN_X;
  for (const column of COLUMNS) {
    drawText(commands, {
      text: column.label,
      x: x + 4,
      y: topY - 14,
      font: "F2",
      size: HEADER_FONT_SIZE,
      color: "0.26 0.32 0.4 rg",
    });
    x += column.width;
  }
}

function drawRow(commands: string[], report: DistributionReportRecord, y: number) {
  let x = MARGIN_X;

  for (const column of COLUMNS) {
    const raw = column.value(report);
    const text = truncate(raw, column.width <= 56 ? 10 : column.width <= 110 ? 20 : 34);
    const textWidth = estimateTextWidth(text, BODY_FONT_SIZE);
    let textX = x + 4;

    if (column.align === "right") {
      textX = x + column.width - textWidth - 4;
    } else if (column.align === "center") {
      textX = x + (column.width - textWidth) / 2;
    }

    drawText(commands, {
      text,
      x: textX,
      y,
      size: BODY_FONT_SIZE,
      color: "0.18 0.18 0.18 rg",
    });
    x += column.width;
  }
}

function getTableWidth() {
  return COLUMNS.reduce((sum, column) => sum + column.width, 0);
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed || "-";
  }
  return `${trimmed.slice(0, Math.max(1, maxLength - 1))}…`;
}

function estimateTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.5;
}

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function drawText(
  commands: string[],
  input: {
    text: string;
    x: number;
    y: number;
    font?: "F1" | "F2";
    size?: number;
    color?: string;
  },
) {
  commands.push("BT");
  commands.push(`/${input.font ?? "F1"} ${input.size ?? BODY_FONT_SIZE} Tf`);
  commands.push(input.color ?? "0 0 0 rg");
  commands.push(`1 0 0 1 ${input.x.toFixed(2)} ${input.y.toFixed(2)} Tm`);
  commands.push(`(${escapePdfText(input.text)}) Tj`);
  commands.push("ET");
}

function drawFilledRect(
  commands: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  commands.push(color);
  commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
}

function drawStrokedRect(
  commands: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  commands.push(color);
  commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
}

function buildPdfDocument(contentStreams: string[]) {
  const objects: string[] = [];
  const pageIds: number[] = [];
  const contentIds: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [] /Count 0 >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  for (const content of contentStreams) {
    const contentId = objects.length + 1;
    contentIds.push(contentId);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

    const pageId = objects.length + 1;
    pageIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  }

  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
