import { Badge, Card, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import DateRangeFilter from "../components/date-range-filter";
import TransactionsTable from "../components/transactions-table";
import TypeFilter from "../components/type-filter";
import { fetchExpenses } from "../lib/firefly";

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
  let errorMessage: string | null = null;

  try {
    const response = await fetchExpenses({
      start: formatDateOnly(startDate),
      end: formatDateOnly(rangeEndDate),
      limit: 200,
      type: requestedType,
    });
    entries = response.entries;
    pagination = response.pagination;
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

  const recentEntries = [...normalizedEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Title order={1}>Warmfly III</Title>
            <Text c="dimmed" mt={4}>
              Full ledger view with server-side filters.
            </Text>
          </div>
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
          </Group>
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
