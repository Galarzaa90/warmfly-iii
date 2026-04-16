import type { AccountRead, TransactionSplit } from "./firefly";

export function monthStartDate(year: number, month: number) {
  return new Date(year, month - 1, 1);
}

export function monthEndDate(year: number, month: number) {
  return new Date(year, month, 0);
}

export function yearStartDate(year: number) {
  return new Date(year, 0, 1);
}

export function yearEndDate(year: number) {
  return new Date(year, 11, 31);
}

export function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseAmount(value?: string | null) {
  const amount = Math.abs(Number.parseFloat(value ?? "0"));
  return Number.isNaN(amount) ? 0 : amount;
}

export function isCreditAccount(account: AccountRead) {
  const role = (account.attributes.account_role ?? "").toLowerCase();
  const creditCardType = (account.attributes.credit_card_type ?? "").toLowerCase();

  return role === "ccasset" || creditCardType === "monthlyfull";
}

export function excludesCreditAccounts(
  entries: TransactionSplit[],
  creditAccountIds: Set<string>,
) {
  return entries.filter((entry) => {
    if (entry.source_id && creditAccountIds.has(entry.source_id)) return false;
    if (entry.destination_id && creditAccountIds.has(entry.destination_id)) return false;
    return true;
  });
}

export function groupTotalsByCurrency(
  entries: TransactionSplit[],
  kind: "income" | "expense" | "transfer",
) {
  const totalsByCurrency = new Map<string, number>();

  entries.forEach((entry) => {
    const isIncomeType = entry.type === "deposit";
    const isExpenseType = entry.type === "withdrawal";
    const isTransferType = entry.type === "transfer";

    if (kind === "income" && !isIncomeType) return;
    if (kind === "expense" && !isExpenseType) return;
    if (kind === "transfer" && !isTransferType) return;

    const amount = parseAmount(entry.amount);
    const currency = entry.currency_code ?? "Unknown";
    totalsByCurrency.set(currency, (totalsByCurrency.get(currency) ?? 0) + amount);
  });

  return Array.from(totalsByCurrency.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
}
