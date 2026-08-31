export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("he-IL", { style: "currency", currency: currencyCode }).format(amount);
  } catch {
    return `${amount.toLocaleString("he-IL")} ${currencyCode}`;
  }
}
