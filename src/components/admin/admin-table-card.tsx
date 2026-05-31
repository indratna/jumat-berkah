import { adminTableStyles } from "@/components/admin/admin-table-styles";

export function AdminTableCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className={adminTableStyles.tableCard}>{children}</section>;
}
