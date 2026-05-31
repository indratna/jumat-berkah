import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminDataPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className={adminTableStyles.pageShell}>{children}</main>;
}
