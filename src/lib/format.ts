// Constructing Intl.NumberFormat is relatively expensive; do it once at module
// load instead of on every render or keystroke in the donation form.
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number) {
  return rupiahFormatter.format(amount);
}
