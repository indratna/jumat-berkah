import Link from "next/link";

import { adminTableStyles } from "@/components/admin/admin-table-styles";

type Variant = "neutral" | "danger" | "export" | "primary";

const variantClasses: Record<Variant, string> = {
  neutral: "",
  primary:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:border-emerald-700",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:border-rose-800",
  export:
    "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:border-sky-800",
};

export function AdminTableActionButton({
  href,
  children,
  ariaLabel,
  variant = "neutral",
  scroll = false,
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel: string;
  variant?: Variant;
  scroll?: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={scroll}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${adminTableStyles.compactAction} ${variantClasses[variant]}`}
    >
      {children}
    </Link>
  );
}
