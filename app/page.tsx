import {
  Badge,
  Card,
  Container,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Grid,
  GridCol,
} from "@mantine/core";
import DateRangeFilter from "./components/date-range-filter";
import TransactionsTable from "./components/transactions-table";
import {
  fetchBudgetLimits,
  fetchBudgets,
  fetchExpenses,
  type BudgetEntry,
  type BudgetLimitEntry,
  type ExpenseEntry,
} from "./lib/firefly";

const DAYS = 30;
const CATEGORY_COLORS = [
  "#22c55e",
  "#38bdf8",
  "#f97316",
  "#a78bfa",
  "#f43f5e",
  "#eab308",
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatAmount(
  amount: number,
  currencyCode?: string | null,
  currencySymbol?: string | null,
) {
  if (currencyCode) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  if (currencySymbol) {
    return `${currencySymbol}${amount.toFixed(2)}`;
  }
  return amount.toFixed(2);
}

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

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
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
    resolvedSearchParams?.preset === "month"
      ? resolvedSearchParams.preset
      : "month";

  let startDate: Date;
  let rangeEndDate: Date;
  let presetMonth = resolvedSearchParams?.month ?? "";
  let rangeLabel = formatMonthYear(startOfMonth(endDate));

  if (preset === "last-30-days") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS);
    rangeEndDate = endDate;
    rangeLabel = "Last 30 days";
  } else if (preset === "month") {
    const selectedMonth = parseMonth(presetMonth) ?? startOfMonth(endDate);
    startDate = startOfMonth(selectedMonth);
    rangeEndDate = endOfMonth(selectedMonth);
    presetMonth = formatDateOnly(startDate).slice(0, 7);
    rangeLabel = formatMonthYear(startDate);
  } else {
    startDate = startOfMonth(endDate);
    rangeEndDate = endOfMonth(endDate);
    rangeLabel = formatMonthYear(startDate);
  }

  type ExpensesResponse = Awaited<ReturnType<typeof fetchExpenses>>;

  let entries: ExpenseEntry[] = [];
  let pagination: ExpensesResponse["pagination"];
  let budgetLimits: BudgetLimitEntry[] = [];
  let budgets: BudgetEntry[] = [];
  let errorMessage: string | null = null;

  try {
    const [transactionsResponse, budgetsResponse, limitsResponse] =
      await Promise.all([
        fetchExpenses({
          start: formatDateOnly(startDate),
          end: formatDateOnly(rangeEndDate),
          limit: 60,
          type: requestedType,
        }),
        fetchBudgets({
          start: formatDateOnly(startDate),
          end: formatDateOnly(rangeEndDate),
        }),
        fetchBudgetLimits({
          start: formatDateOnly(startDate),
          end: formatDateOnly(rangeEndDate),
        }),
      ]);

    entries = transactionsResponse.entries;
    pagination = transactionsResponse.pagination;
    budgets = budgetsResponse;
    budgetLimits = limitsResponse;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load expenses.";
  }

  const totalsByCurrency = new Map<string, number>();
  const countByCurrency = new Map<string, number>();
  const normalizedEntries = entries.map((entry) => {
    const amount = Math.abs(Number.parseFloat(entry.amount || "0"));
    if (!Number.isNaN(amount) && entry.currencyCode) {
      totalsByCurrency.set(
        entry.currencyCode,
        (totalsByCurrency.get(entry.currencyCode) ?? 0) + amount,
      );
      countByCurrency.set(
        entry.currencyCode,
        (countByCurrency.get(entry.currencyCode) ?? 0) + 1,
      );
    }
    return {
      ...entry,
      amountValue: Number.isNaN(amount) ? 0 : amount,
    };
  });

  const currencyTotals = Array.from(totalsByCurrency.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const primaryCurrency = currencyTotals[0]?.[0] ?? null;
  const primaryTotal = currencyTotals[0]?.[1] ?? 0;
  const primaryCount = primaryCurrency
    ? countByCurrency.get(primaryCurrency) ?? 0
    : entries.length;

  const focusEntries = primaryCurrency
    ? normalizedEntries.filter((entry) => entry.currencyCode === primaryCurrency)
    : normalizedEntries;

  const totalSpent = focusEntries
    .filter((entry) => entry.type === "withdrawal" || entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amountValue, 0);
  const totalIncome = focusEntries
    .filter((entry) => entry.type === "deposit" || entry.type === "income")
    .reduce((sum, entry) => sum + entry.amountValue, 0);

  const byCategory = new Map<string, number>();
  const categorySource = focusEntries.filter(
    (entry) => entry.type === "withdrawal" || entry.type === "expense",
  );

  categorySource.forEach((entry) => {
    const category = entry.category || "Uncategorized";
    byCategory.set(category, (byCategory.get(category) ?? 0) + entry.amountValue);
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
  const limitByBudgetId = new Map(
    budgetLimits.map((limit) => [limit.budgetId, limit]),
  );
  const budgetsWithLimits = budgets
    .map((budget) => {
      const limit = limitByBudgetId.get(budget.id);
      const resolvedLimit = limit?.limit ?? budget.autoLimit ?? 0;
      return {
        ...budget,
        limit: resolvedLimit,
        limitCurrencyCode: limit?.currencyCode ?? budget.currencyCode,
        limitCurrencySymbol: limit?.currencySymbol ?? budget.currencySymbol,
        usage: resolvedLimit ? budget.spent / resolvedLimit : 0,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const recentExpenses = [...normalizedEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const daySpan =
    Math.max(
      1,
      Math.round(
        (rangeEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    );
  const averagePerDay = primaryTotal / daySpan;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center" wrap="wrap">

          <DateRangeFilter
            value={
              preset === "last-30-days"
                ? "last-30-days"
                : `month:${presetMonth}`
            }
          />
        </Group>

        {errorMessage ? (
          <Paper
            radius="md"
            p="lg"
            style={{
              backgroundColor: "var(--app-panel-strong)",
              border: "1px solid #3a1b1b",
            }}
          >
            <Text fw={600} mb={4}>
              Unable to load expenses
            </Text>
            <Text size="sm" c="dimmed">
              {errorMessage}
            </Text>
          </Paper>
        ) : null}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          <Card
            padding="lg"
            radius="md"
            style={{
              backgroundColor: "var(--app-panel)",
              border: "1px solid var(--app-border)",
            }}
          >
            <Text size="sm" c="dimmed">
              Total income
            </Text>
            <Text fw={600} size="xl">
              {formatAmount(totalIncome, primaryCurrency)}
            </Text>
            <Text size="xs" c="dimmed" mt={6}>
              {primaryCurrency ? "Primary currency" : "Mixed currencies"}
            </Text>
          </Card>

          <Card
            padding="lg"
            radius="md"
            style={{
              backgroundColor: "var(--app-panel)",
              border: "1px solid var(--app-border)",
            }}
          >
            <Text size="sm" c="dimmed">
              Total spent
            </Text>
            <Text fw={600} size="xl">
              {formatAmount(totalSpent, primaryCurrency)}
            </Text>
            <Text size="xs" c="dimmed" mt={6}>
              {currencyTotals.length > 1
                ? `Across ${currencyTotals.length} currencies`
                : `${primaryCount} expenses`}
            </Text>
          </Card>

          <Card
            padding="lg"
            radius="md"
            style={{
              backgroundColor: "var(--app-panel)",
              border: "1px solid var(--app-border)",
            }}
          >
            <Text size="sm" c="dimmed">
              Daily pace
            </Text>
            <Text fw={600} size="xl">
              {formatAmount(averagePerDay, primaryCurrency)}
            </Text>
            <Text size="xs" c="dimmed" mt={6}>
              {formatDateOnly(startDate)} to {formatDateOnly(rangeEndDate)}
            </Text>
          </Card>

        </SimpleGrid>

        <Grid gutter="xl">
          <GridCol span={{ base: 12, lg: 8 }}>
            <Card
              padding="lg"
              radius="md"
              style={{
                backgroundColor: "var(--app-panel-strong)",
                border: "1px solid var(--app-border)",
              }}
            >
              <Group justify="space-between" mb="md">
                <Text fw={600}>Recent transactions</Text>
                <Badge variant="light" color="gray">
                  {recentExpenses.length} entries
                </Badge>
              </Group>
              <TransactionsTable entries={recentExpenses} maxRows={12} />
            </Card>
          </GridCol>

          <GridCol span={{ base: 12, lg: 4 }}>
            <Stack gap="xl">
              <Card
                padding="lg"
                radius="md"
                style={{
                  backgroundColor: "var(--app-panel)",
                  border: "1px solid var(--app-border)",
                }}
              >
                <Text fw={600} mb="md">
                  Categories breakdown
                </Text>
                {categorySlices.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No category data available yet.
                  </Text>
                ) : (
                  <Stack gap="md">
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 220,
                        aspectRatio: "1 / 1",
                        margin: "0 auto",
                        borderRadius: "50%",
                        background: `conic-gradient(${pieStops.stops.join(
                          ", ",
                        )})`,
                        border: "1px solid var(--app-border)",
                      }}
                    />
                    <Stack gap={8}>
                      {categorySlices.map(([name, value], index) => (
                        <Group key={name} justify="space-between" gap="sm">
                          <Group gap="xs">
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor:
                                  CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                                display: "inline-block",
                              }}
                            />
                            <Text size="sm">{name}</Text>
                          </Group>
                          <Text size="sm" fw={600}>
                            {formatAmount(value, primaryCurrency)}
                          </Text>
                        </Group>
                      ))}
                      </Stack>
                  </Stack>
                )}
              </Card>

              <Card
                padding="lg"
                radius="md"
                style={{
                  backgroundColor: "var(--app-panel)",
                  border: "1px solid var(--app-border)",
                }}
              >
                <Text fw={600} mb="md">
                  Budgets
                </Text>
                <Stack gap="md">
                  {budgetsWithLimits.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No budget data available yet.
                    </Text>
                  ) : null}
                  {budgetsWithLimits.map((budget) => {
                    const percent =
                      budget.limit > 0
                        ? Math.min(100, (budget.spent / budget.limit) * 100)
                        : 0;
                    const overBy =
                      budget.limit > 0 ? budget.spent - budget.limit : 0;
                    const isOver = overBy > 0;

                    return (
                      <div key={budget.id}>
                        <Group justify="space-between" mb={6}>
                          <Text size="sm">{budget.name}</Text>
                          <Text size="sm" fw={600}>
                            {budget.limit > 0
                              ? `${formatAmount(
                                  budget.spent,
                                  budget.currencyCode,
                                  budget.currencySymbol,
                                )} of ${formatAmount(
                                  budget.limit,
                                  budget.limitCurrencyCode ??
                                    budget.currencyCode,
                                  budget.limitCurrencySymbol ??
                                    budget.currencySymbol,
                                )}`
                              : `Spent ${formatAmount(
                                  budget.spent,
                                  budget.currencyCode,
                                  budget.currencySymbol,
                                )}`}
                          </Text>
                        </Group>
                        {budget.limit > 0 ? (
                          <>
                            <Progress
                              radius="xl"
                              value={percent}
                              color={isOver ? "red" : "cyan"}
                            />
                            <Text size="xs" c={isOver ? "red" : "dimmed"} mt={6}>
                              {isOver
                                ? `Over by ${formatAmount(
                                    overBy,
                                    budget.limitCurrencyCode ??
                                      budget.currencyCode,
                                    budget.limitCurrencySymbol ??
                                      budget.currencySymbol,
                                  )}`
                                : "Within budget"}
                            </Text>
                          </>
                        ) : (
                          <Text size="xs" c="dimmed">
                            No limit set.
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </Stack>
              </Card>
            </Stack>
          </GridCol>
        </Grid>
      </Stack>
    </Container>
  );
}
