import {
  Badge,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import DateRangeFilter from "../components/date-range-filter";
import TransactionsFilters from "../components/transactions-filters";
import TransactionsTable from "../components/transactions-table";
import TypeFilter from "../components/type-filter";
import {
  fetchAccounts,
  fetchCategories,
  fetchExpenses,
  fetchTags,
} from "../lib/firefly";

const DAYS = 30;

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

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?:
    | {
        type?: string;
        preset?: string;
        month?: string;
    account?: string;
    categories?: string;
    labels?: string;
      }
    | Promise<{
        type?: string;
        preset?: string;
        month?: string;
      account?: string;
      categories?: string;
      labels?: string;
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
  const accountFilter = resolvedSearchParams?.account ?? "";
  const categoryFilter = resolvedSearchParams?.categories ?? "";
  const labelFilter = resolvedSearchParams?.labels ?? "";

  if (preset === "last-30-days") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS);
    rangeEndDate = endDate;
  } else {
    const selectedMonth = parseMonth(presetMonth) ?? startOfMonth(endDate);
    startDate = startOfMonth(selectedMonth);
    rangeEndDate = endOfMonth(selectedMonth);
    presetMonth = formatDateOnly(startDate).slice(0, 7);
  }

  let entries = [];
  let pagination;
  let accounts = [];
  let categories = [];
  let labels = [];
  let errorMessage: string | null = null;

  try {
    const [transactionsResponse, accountsResponse, categoriesResponse, tagsResponse] =
      await Promise.all([
        fetchExpenses({
          start: formatDateOnly(startDate),
          end: formatDateOnly(rangeEndDate),
          limit: 200,
          type: requestedType,
        }),
        fetchAccounts(),
        fetchCategories(),
        fetchTags(),
      ]);
    entries = transactionsResponse.entries;
    pagination = transactionsResponse.pagination;
    accounts = accountsResponse;
    categories = categoriesResponse;
    labels = tagsResponse;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load transactions.";
  }

  const normalizedEntries = entries.map((entry) => {
    const amount = Math.abs(Number.parseFloat(entry.amount || "0"));
    return {
      ...entry,
      amountValue: Number.isNaN(amount) ? 0 : amount,
    };
  });

  const categorySelections = categoryFilter
    ? categoryFilter.split(",").filter(Boolean)
    : [];
  const labelSelections = labelFilter ? labelFilter.split(",").filter(Boolean) : [];

  const filteredEntries = normalizedEntries.filter((entry) => {
    if (accountFilter) {
      const matchesAccount =
        entry.sourceId === accountFilter || entry.destinationId === accountFilter;
      if (!matchesAccount) return false;
    }
    if (categorySelections.length > 0) {
      if (!entry.categoryId || !categorySelections.includes(entry.categoryId)) {
        return false;
      }
    }
    if (labelSelections.length > 0) {
      if (!entry.tags || !labelSelections.some((label) => entry.tags?.includes(label))) {
        return false;
      }
    }
    return true;
  });

  const recentEntries = [...filteredEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group gap="md" align="center" wrap="wrap">
          <TypeFilter value={requestedType ?? "all"} />
          <DateRangeFilter
            value={
              preset === "last-30-days"
                ? "last-30-days"
                : `month:${presetMonth}`
            }
            basePath="/transactions"
          />
          <TransactionsFilters
            accountOptions={accounts
              .filter((account) => {
                const type = (account.type ?? "").toLowerCase();
                return type !== "initial-balance" && type !== "initial balance account";
              })
              .map((account) => ({
                value: account.id,
                label: account.name,
              }))}
            categoryOptions={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            labelOptions={labels.map((tag) => ({
              value: tag.name,
              label: tag.name,
            }))}
            accountValue={accountFilter || null}
            categoryValues={categorySelections}
            labelValues={labelSelections}
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
              Unable to load transactions
            </Text>
            <Text size="sm" c="dimmed">
              {errorMessage}
            </Text>
          </Paper>
        ) : null}

        <Card
          padding="lg"
          radius="md"
          style={{
            backgroundColor: "var(--app-panel-strong)",
            border: "1px solid var(--app-border)",
          }}
        >
          <Group justify="space-between" mb="md">
            <Text fw={600}>Transactions</Text>
            <Badge variant="light" color="gray">
              {pagination?.total ?? recentEntries.length} entries
            </Badge>
          </Group>
          <TransactionsTable entries={recentEntries} />
        </Card>
      </Stack>
    </Container>
  );
}
