import { Container } from "@mantine/core";
import OverviewPanel from "./components/OverviewPanel";
import type { TransactionRow } from "./components/TransactionsTable";
import {
  fetchBudgets,
  fetchTransactions,
  fetchInsightExpenseCategories,
  fetchInsightExpenseNoCategory,
  fetchInsightTotals,
  type BudgetRead,
  type InsightGroupEntry,
  type InsightTotalEntry,
  type TransactionArray,
  type TransactionTypeFilter,
} from "./lib/firefly";

const DAYS_30 = 30;
const DAYS_90 = 90;
const ALL_DATA_START = new Date(1970, 0, 1);
const CATEGORY_COLORS = [
  "#22c55e",
  "#38bdf8",
  "#f97316",
  "#a78bfa",
  "#f43f5e",
  "#eab308",
];
const TRANSACTION_TYPE_FILTERS = new Set<TransactionTypeFilter>([
  "all",
  "withdrawal",
  "withdrawals",
  "expense",
  "deposit",
  "deposits",
  "income",
  "transfer",
  "transfers",
  "opening_balance",
  "reconciliation",
  "special",
  "specials",
]);

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function parseDifferenceAmount(value?: string | null) {
  const amount = Math.abs(Number.parseFloat(value ?? "0"));
  return Number.isNaN(amount) ? 0 : amount;
}

function buildTransactionRows(response: TransactionArray): TransactionRow[] {
  return (
    response.data?.flatMap((item) => {
      const groupTitle = item.attributes.group_title;
      return item.attributes.transactions.map((split, index) => {
        const amountValue = parseDifferenceAmount(split.amount);
        const foreignAmountValue = split.foreign_amount
          ? parseDifferenceAmount(split.foreign_amount)
          : null;
        return {
          id: `${item.id}-${index}`,
          title: groupTitle || split.description || "Untitled expense",
          date: split.date,
          amountValue,
          currencyCode: split.currency_code,
          currencySymbol: split.currency_symbol,
          foreignAmountValue,
          foreignCurrencySymbol: split.foreign_currency_symbol,
          type: split.type,
          source: split.source_name,
          destination: split.destination_name,
          category: split.category_name,
          budget: split.budget_name,
          tags: split.tags,
        };
      });
    }) ?? []
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams?:
    | {
        type?: string;
        preset?: string;
        month?: string;
      }
    | Promise<{
        type?: string;
        preset?: string;
        month?: string;
      }>;
}) {
  const endDate = new Date();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedType = resolvedSearchParams?.type;
  const requestedTypeFilter = TRANSACTION_TYPE_FILTERS.has(
    requestedType as TransactionTypeFilter,
  )
    ? (requestedType as TransactionTypeFilter)
    : undefined;
  const preset =
    resolvedSearchParams?.preset === "last-30-days" ||
    resolvedSearchParams?.preset === "last-90-days" ||
    resolvedSearchParams?.preset === "all-data" ||
    resolvedSearchParams?.preset === "month"
      ? resolvedSearchParams.preset
      : "month";

  let startDate: Date;
  let rangeEndDate: Date;
  let presetMonth = resolvedSearchParams?.month ?? "";
  if (preset === "last-30-days") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS_30);
    rangeEndDate = endDate;
  } else if (preset === "last-90-days") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS_90);
    rangeEndDate = endDate;
  } else if (preset === "all-data") {
    startDate = new Date(ALL_DATA_START);
    rangeEndDate = endDate;
  } else if (preset === "month") {
    const selectedMonth = parseMonth(presetMonth) ?? startOfMonth(endDate);
    startDate = startOfMonth(selectedMonth);
    rangeEndDate = endOfMonth(selectedMonth);
    presetMonth = formatDateOnly(startDate).slice(0, 7);
  } else {
    startDate = startOfMonth(endDate);
    rangeEndDate = endOfMonth(endDate);
  }

  let entries: TransactionRow[] = [];
  let budgets: BudgetRead[] = [];
  let expenseTotals: InsightTotalEntry[] = [];
  let incomeTotals: InsightTotalEntry[] = [];
  let transferTotals: InsightTotalEntry[] = [];
  let insightCategories: InsightGroupEntry[] = [];
  let insightNoCategory: InsightTotalEntry[] = [];
  let errorMessage: string | null = null;

  try {
    const [
      transactionsResponse,
      budgetsResponse,
      expenseTotalsResponse,
      incomeTotalsResponse,
      transferTotalsResponse,
      categoryResponse,
      noCategoryResponse,
    ] = await Promise.all([
      fetchTransactions({
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
        limit: 20,
        type: requestedTypeFilter,
      }),
      fetchBudgets({
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
      }),
      fetchInsightTotals({
        type: "expense",
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
      }),
      fetchInsightTotals({
        type: "income",
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
      }),
      fetchInsightTotals({
        type: "transfer",
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
      }),
      fetchInsightExpenseCategories({
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
      }),
      fetchInsightExpenseNoCategory({
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
      }),
    ]);

    entries = buildTransactionRows(transactionsResponse);
    budgets = budgetsResponse.data ?? [];
    expenseTotals = expenseTotalsResponse;
    incomeTotals = incomeTotalsResponse;
    transferTotals = transferTotalsResponse;
    insightCategories = categoryResponse;
    insightNoCategory = noCategoryResponse;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load expenses.";
  }

  const primaryCurrency =
    expenseTotals[0]?.currency_code ?? insightCategories[0]?.currency_code ?? null;

  const sortedExpenseTotals = [...expenseTotals].sort(
    (a, b) =>
      parseDifferenceAmount(b.difference) - parseDifferenceAmount(a.difference),
  );
  const sortedIncomeTotals = [...incomeTotals].sort(
    (a, b) =>
      parseDifferenceAmount(b.difference) - parseDifferenceAmount(a.difference),
  );
  const sortedTransferTotals = [...transferTotals].sort(
    (a, b) =>
      parseDifferenceAmount(b.difference) - parseDifferenceAmount(a.difference),
  );

  const byCategory = new Map<string, number>();
  const categorySource = insightCategories.filter((entry) =>
    primaryCurrency ? entry.currency_code === primaryCurrency : true,
  );

  categorySource.forEach((entry) => {
    const name = entry.name ?? "Uncategorized";
    const amount = parseDifferenceAmount(entry.difference);
    byCategory.set(name, (byCategory.get(name) ?? 0) + amount);
  });

  insightNoCategory
    .filter((entry) =>
      primaryCurrency ? entry.currency_code === primaryCurrency : true,
    )
    .forEach((entry) => {
      const amount = parseDifferenceAmount(entry.difference);
      byCategory.set("Uncategorized", (byCategory.get("Uncategorized") ?? 0) + amount);
    });

  const categoryEntries = Array.from(byCategory.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const topCategories = categoryEntries.slice(0, 5);
  const otherTotal = categoryEntries
    .slice(5)
    .reduce((sum, [, value]) => sum + value, 0);
  const categorySlices = otherTotal
    ? [...topCategories, ["Other", otherTotal] as [string, number]]
    : topCategories;
  const categoryTotal = categorySlices.reduce((sum, [, value]) => sum + value, 0);
  const pieStops = categorySlices.reduce(
    (acc, [, value], index) => {
      const start = acc.offset;
      const slice = categoryTotal > 0 ? (value / categoryTotal) * 360 : 0;
      const end = start + slice;
      acc.offset = end;
      acc.stops.push(
        `${CATEGORY_COLORS[index % CATEGORY_COLORS.length]} ${start.toFixed(
          2,
        )}deg ${end.toFixed(2)}deg`,
      );
      return acc;
    },
    { offset: 0, stops: [] as string[] },
  );
  const budgetsWithLimits = budgets
    .map((budget) => {
      const spentEntry = budget.attributes.spent?.[0];
      const spentValue = parseDifferenceAmount(spentEntry?.sum ?? "0");
      const autoLimitValue = parseDifferenceAmount(
        budget.attributes.auto_budget_amount ?? "0",
      );
      const resolvedLimit = autoLimitValue ?? 0;
      const currencyCode =
        spentEntry?.currency_code ?? budget.attributes.currency_code ?? null;
      const currencySymbol =
        spentEntry?.currency_symbol ?? budget.attributes.currency_symbol ?? null;
      return {
        id: budget.id,
        name: budget.attributes.name,
        spent: spentValue,
        currencyCode,
        currencySymbol,
        autoLimit: autoLimitValue,
        limit: resolvedLimit,
        limitCurrencyCode: currencyCode,
        limitCurrencySymbol: currencySymbol,
        usage: resolvedLimit ? spentValue / resolvedLimit : 0,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const recentExpenses = [...entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const dateRangeValue =
    preset === "last-30-days"
      ? "last-30-days"
      : preset === "last-90-days"
        ? "last-90-days"
        : preset === "all-data"
          ? "all-data"
          : `month:${presetMonth}`;
  const dateRangeLabel = `${formatDateOnly(startDate)} to ${formatDateOnly(
    rangeEndDate,
  )}`;

  return (
    <Container size="xl" py="xl">
      <OverviewPanel
        dateRangeValue={dateRangeValue}
        dateRangeLabel={dateRangeLabel}
        recentExpenses={recentExpenses}
        sortedIncomeTotals={sortedIncomeTotals}
        sortedExpenseTotals={sortedExpenseTotals}
        sortedTransferTotals={sortedTransferTotals}
        primaryCurrency={primaryCurrency}
        categorySlices={categorySlices}
        pieStops={pieStops.stops}
        categoryColors={CATEGORY_COLORS}
        budgetsWithLimits={budgetsWithLimits}
        errorMessage={errorMessage}
      />
    </Container>
  );
}
