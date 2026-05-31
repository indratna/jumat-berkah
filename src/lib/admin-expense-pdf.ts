import { formatAdminDate, formatRupiah } from "@/lib/admin";

type ExpenseItem = {
  expenseDate: Date;
  category: string;
  description: string;
  amount: number;
  vendorName: string | null;
  receiptUrl: string | null;
  createdAt: Date;
};

type ExpensePdfFilters = {
  q: string | null;
  category: string | null;
  from: string | null;
  to: string | null;
};

type ExpensePdfInput = {
  expenses: ExpenseItem[];
  total: number;
  filters: ExpensePdfFilters;
};

type PdfColumn = {
  label: string;
  width: number;
  align?: "left" | "right" | "center";
  value: (expense: ExpenseItem) => string;
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
    label: "Tanggal",
    width: 78,
    value: (expense) => formatAdminDate(expense.expenseDate),
  },
  { label: "Kategori", width: 96, value: (expense) => expense.category },
  { label: "Deskripsi", width: 200, value: (expense) => expense.description },
  {
    label: "Nominal",
    width: 90,
    align: "right",
    value: (expense) => formatRupiah(expense.amount),
  },
  { label: "Vendor", width: 96, value: (expense) => expense.vendorName ?? "-" },
  {
    label: "Bukti",
    width: 120,
    value: (expense) => formatReceiptCell(expense.receiptUrl),
  },
  {
    label: "Input",
    width: 90,
    value: (expense) => formatAdminDate(expense.createdAt),
  },
];

function formatReceiptCell(receiptUrl: string | null) {
  if (!receiptUrl) return "-";
  if (receiptUrl.startsWith("http")) return receiptUrl;
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${receiptUrl}`;
}

export function buildAdminExpensePdf(input: ExpensePdfInput) {
  const totalAmount = input.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
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
  const pages = paginate(input.expenses, firstPageRows, nextPageRows);
  const contentStreams = pages.map((pageRows, index) =>
    buildPageContent({
      rows: pageRows,
      pageIndex: index,
      pageCount: pages.length,
      totalRows: input.total,
      filters: input.filters,
      totalAmount,
    }),
  );
  return buildPdfDocument(contentStreams);
}

function paginate<T>(items: T[], firstPageRows: number, nextPageRows: number) {
  if (items.length === 0) return [[] as T[]];
  const pages: T[][] = [items.slice(0, firstPageRows)];
  let offset = firstPageRows;
  while (offset < items.length) {
    pages.push(items.slice(offset, offset + nextPageRows));
    offset += nextPageRows;
  }
  return pages;
}

function buildPageContent(input: {
  rows: ExpenseItem[];
  pageIndex: number;
  pageCount: number;
  totalRows: number;
  filters: ExpensePdfFilters;
  totalAmount: number;
}) {
  const commands: string[] = [];
  const pageTop = PAGE_HEIGHT - MARGIN_TOP;

  if (input.pageIndex === 0) {
    drawFilledRect(
      commands,
      MARGIN_X,
      pageTop - 28,
      290,
      28,
      "0.91 0.96 0.93 rg",
    );
    drawText(commands, {
      text: "Laporan Pengeluaran",
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
      text: `Periode: ${formatPeriod(input.filters.from, input.filters.to)}`,
      x: MARGIN_X,
      y: pageTop - 58,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
    drawText(commands, {
      text: `Kategori: ${input.filters.category?.trim() || "Semua"}`,
      x: MARGIN_X,
      y: pageTop - 72,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
    drawText(commands, {
      text: `Cari: ${input.filters.q?.trim() || "-"}`,
      x: MARGIN_X + 220,
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
      size: 11,
      color: "0.16 0.2 0.29 rg",
    });
    drawText(commands, {
      text: `Total baris: ${String(input.totalRows)}`,
      x: summaryX + 12,
      y: summaryY + 38,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
    drawText(commands, {
      text: `Total nominal: ${formatRupiah(input.totalAmount)}`,
      x: summaryX + 12,
      y: summaryY + 22,
      size: META_FONT_SIZE,
      color: "0.25 0.25 0.25 rg",
    });
  }

  const tableTop =
    input.pageIndex === 0 ? pageTop - TITLE_SECTION_HEIGHT : pageTop;
  const tableLeft = MARGIN_X;
  const tableWidth = COLUMNS.reduce((sum, column) => sum + column.width, 0);
  drawFilledRect(
    commands,
    tableLeft,
    tableTop - TABLE_HEADER_HEIGHT,
    tableWidth,
    TABLE_HEADER_HEIGHT,
    "0.2 0.4 0.28 rg",
  );
  drawStrokedRect(
    commands,
    tableLeft,
    tableTop - TABLE_HEADER_HEIGHT,
    tableWidth,
    TABLE_HEADER_HEIGHT,
    "0.2 0.4 0.28 RG",
  );

  let currentX = tableLeft;
  for (const column of COLUMNS) {
    drawText(commands, {
      text: column.label,
      x: currentX + 6,
      y: tableTop - 14,
      font: "F2",
      size: HEADER_FONT_SIZE,
      color: "1 1 1 rg",
    });
    currentX += column.width;
    drawLine(
      commands,
      currentX,
      tableTop - TABLE_HEADER_HEIGHT,
      currentX,
      tableTop,
      "0.77 0.86 0.8 RG",
    );
  }

  input.rows.forEach((expense, rowIndex) => {
    const rowTop = tableTop - TABLE_HEADER_HEIGHT - rowIndex * TABLE_ROW_HEIGHT;
    const rowBottom = rowTop - TABLE_ROW_HEIGHT;
    if (rowIndex % 2 === 0) {
      drawFilledRect(
        commands,
        tableLeft,
        rowBottom,
        tableWidth,
        TABLE_ROW_HEIGHT,
        "0.98 0.99 0.98 rg",
      );
    }
    drawStrokedRect(
      commands,
      tableLeft,
      rowBottom,
      tableWidth,
      TABLE_ROW_HEIGHT,
      "0.86 0.9 0.88 RG",
    );

    let cellX = tableLeft;
    for (const column of COLUMNS) {
      const raw = column.value(expense);
      const text = fitCellText(raw, column.width, column.align ?? "left");
      const x = getCellTextX(cellX, column.width, text, column.align ?? "left");
      drawText(commands, {
        text,
        x,
        y: rowBottom + 6,
        size: BODY_FONT_SIZE,
        color: "0.16 0.2 0.16 rg",
      });
      cellX += column.width;
      drawLine(commands, cellX, rowBottom, cellX, rowTop, "0.91 0.93 0.92 RG");
    }
  });

  drawText(commands, {
    text: `Halaman ${input.pageIndex + 1} / ${input.pageCount}`,
    x: PAGE_WIDTH - MARGIN_X - 78,
    y: MARGIN_BOTTOM - 6,
    size: 8,
    color: "0.45 0.45 0.45 rg",
  });

  return commands.join("\n");
}

function buildPdfDocument(pageContents: string[]) {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageIds = pageContents.map((_, index) => 3 + index * 2);
  objects.push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
  );

  pageContents.forEach((content, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${3 + pageContents.length * 2} 0 R /F2 ${4 + pageContents.length * 2} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects.push(
      `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    );
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

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

function drawText(
  commands: string[],
  input: {
    text: string;
    x: number;
    y: number;
    size: number;
    font?: "F1" | "F2";
    color?: string;
  },
) {
  const font = input.font ?? "F1";
  const color = input.color ?? "0 0 0 rg";
  commands.push("BT");
  commands.push(`${color}`);
  commands.push(`/${font} ${input.size} Tf`);
  commands.push(`${formatNumber(input.x)} ${formatNumber(input.y)} Td`);
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
  commands.push(
    `${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)} re f`,
  );
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
  commands.push("0.6 w");
  commands.push(
    `${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)} re S`,
  );
}

function drawLine(
  commands: string[],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string,
) {
  commands.push(color);
  commands.push("0.4 w");
  commands.push(
    `${formatNumber(startX)} ${formatNumber(startY)} m ${formatNumber(endX)} ${formatNumber(endY)} l S`,
  );
}

function fitCellText(
  value: string,
  width: number,
  align: "left" | "right" | "center",
) {
  const maxChars = Math.max(
    4,
    Math.floor((width - 10) / (align === "center" ? 5.2 : 5)),
  );
  if (value.length <= maxChars) return value;
  if (maxChars <= 3) return value.slice(0, maxChars);
  return `${value.slice(0, maxChars - 1)}…`;
}

function getCellTextX(
  cellX: number,
  width: number,
  text: string,
  align: "left" | "right" | "center",
) {
  const textWidth = estimateTextWidth(text, BODY_FONT_SIZE);
  if (align === "right") return cellX + width - textWidth - 6;
  if (align === "center") return cellX + (width - textWidth) / 2;
  return cellX + 6;
}

function estimateTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.48;
}

function formatPeriod(from: string | null, to: string | null) {
  if (from && to) return `${from} s/d ${to}`;
  if (from) return `mulai ${from}`;
  if (to) return `sampai ${to}`;
  return "Semua periode";
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}
