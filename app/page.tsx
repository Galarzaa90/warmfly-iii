import { Container } from "@mantine/core";
import OverviewPanel from "./components/overview-panel";
import {
  fetchBudgets,
  fetchExpenses,
  fetchInsightExpenseCategories,
  fetchInsightExpenseNoCategory,
  fetchInsightTotals,
  type BudgetEntry,
  type ExpenseEntry,
  type InsightCategoryEntry,
  type InsightTotalEntry,
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

  let entries: ExpenseEntry[] = [];
  let budgets: BudgetEntry[] = [];
  let expenseTotals: InsightTotalEntry[] = [];
  let incomeTotals: InsightTotalEntry[] = [];
  let transferTotals: InsightTotalEntry[] = [];
  let insightCategories: InsightCategoryEntry[] = [];
  let insightNoCategory: InsightCategoryEntry[] = [];
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
      fetchExpenses({
        start: formatDateOnly(startDate),
        end: formatDateOnly(rangeEndDate),
        limit: 20,
        type: requestedType,
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

    entries = transactionsResponse.entries;
    budgets = budgetsResponse;
    expenseTotals = expenseTotalsResponse;
    incomeTotals = incomeTotalsResponse;
    transferTotals = transferTotalsResponse;
    insightCategories = categoryResponse;
    insightNoCategory = noCategoryResponse;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load expenses.";
  }

  const normalizedEntries = entries.map((entry) => {
    const amount = Math.abs(Number.parseFloat(entry.amount || "0"));
    const foreignAmount = entry.foreignAmount
      ? Math.abs(Number.parseFloat(entry.foreignAmount))
      : null;
    return {
      ...entry,
      amountValue: Number.isNaN(amount) ? 0 : amount,
      foreignAmountValue:
        foreignAmount === null || Number.isNaN(foreignAmount)
          ? null
          : foreignAmount,
    };
  });

  const primaryCurrency =
    expenseTotals[0]?.currencyCode ?? insightCategories[0]?.currencyCode ?? null;

  const sortedExpenseTotals = [...expenseTotals].sort(
    (a, b) => b.amount - a.amount,
  );
  const sortedIncomeTotals = [...incomeTotals].sort(
    (a, b) => b.amount - a.amount,
  );
  const sortedTransferTotals = [...transferTotals].sort(
    (a, b) => b.amount - a.amount,
  );

  const byCategory = new Map<string, number>();
  const categorySource = insightCategories.filter(
    (entry) => (primaryCurrency ? entry.currencyCode === primaryCurrency : true),
  );

  categorySource.forEach((entry) => {
    byCategory.set(entry.name, (byCategory.get(entry.name) ?? 0) + entry.amount);
  });

  insightNoCategory
    .filter((entry) =>
      primaryCurrency ? entry.currencyCode === primaryCurrency : true,
    )
    .forEach((entry) => {
      byCategory.set(
        entry.name,
        (byCategory.get(entry.name) ?? 0) + entry.amount,
      );
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
      const resolvedLimit = budget.autoLimit ?? 0;
      return {
        ...budget,
        limit: resolvedLimit,
        limitCurrencyCode: budget.currencyCode,
        limitCurrencySymbol: budget.currencySymbol,
        usage: resolvedLimit ? budget.spent / resolvedLimit : 0,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const recentExpenses = [...normalizedEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
