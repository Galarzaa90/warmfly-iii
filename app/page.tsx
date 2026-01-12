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
    return {
      ...entry,
      amountValue: Number.isNaN(amount) ? 0 : amount,
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

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center" wrap="wrap">

          <DateRangeFilter
            value={
              preset === "last-30-days"
                ? "last-30-days"
                : preset === "last-90-days"
                  ? "last-90-days"
                  : preset === "all-data"
                    ? "all-data"
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
            {sortedIncomeTotals.length <= 1 ? (
              <Text fw={600} size="xl">
                {formatAmount(
                  sortedIncomeTotals[0]?.amount ?? 0,
                  sortedIncomeTotals[0]?.currencyCode ?? primaryCurrency,
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {sortedIncomeTotals.map((entry, index) => (
                  <Group
                    key={`${entry.currencyCode ?? "currency"}-${index}`}
                    justify="space-between"
                  >
                    <Text size="sm" c="dimmed">
                      {entry.currencyCode ?? "Unknown"}
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatAmount(entry.amount, entry.currencyCode)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
            <Text size="xs" c="dimmed" mt={6}>
              {formatDateOnly(startDate)} to {formatDateOnly(rangeEndDate)}
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
            {sortedExpenseTotals.length <= 1 ? (
              <Text fw={600} size="xl">
                {formatAmount(
                  sortedExpenseTotals[0]?.amount ?? 0,
                  sortedExpenseTotals[0]?.currencyCode ?? primaryCurrency,
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {sortedExpenseTotals.map((entry, index) => (
                  <Group
                    key={`${entry.currencyCode ?? "currency"}-${index}`}
                    justify="space-between"
                  >
                    <Text size="sm" c="dimmed">
                      {entry.currencyCode ?? "Unknown"}
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatAmount(entry.amount, entry.currencyCode)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
            <Text size="xs" c="dimmed" mt={6}>
              {formatDateOnly(startDate)} to {formatDateOnly(rangeEndDate)}
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
              Total transfers
            </Text>
            {sortedTransferTotals.length <= 1 ? (
              <Text fw={600} size="xl">
                {formatAmount(
                  sortedTransferTotals[0]?.amount ?? 0,
                  sortedTransferTotals[0]?.currencyCode ?? primaryCurrency,
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {sortedTransferTotals.map((entry, index) => (
                  <Group
                    key={`${entry.currencyCode ?? "currency"}-${index}`}
                    justify="space-between"
                  >
                    <Text size="sm" c="dimmed">
                      {entry.currencyCode ?? "Unknown"}
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatAmount(entry.amount, entry.currencyCode)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
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
              <TransactionsTable entries={recentExpenses} maxRows={20} />
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
