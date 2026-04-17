import Link from "next/link";
import { connection } from "next/server";
import {
  Badge,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import TransactionsTable from "../components/TransactionsTable";
import ReportPieCard from "../components/ReportPieCard";
import ReportBalanceTimelineCard from "../components/ReportBalanceTimelineCard";
import {
  fetchAccounts,
  fetchTransactions,
  type AccountRead,
  type TransactionSplit,
  type TransactionTypeFilter,
} from "../lib/firefly";
import { formatDateOnly, groupTotalsByCurrency, isCreditAccount } from "../lib/reports";

const PAGE_SIZE = 100;

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  startDate: Date;
  endDate: Date;
  breadcrumbs: BreadcrumbItem[];
  cacheSeconds: number;
  timelineGranularity: "day" | "month";
};

type TimelinePoint = {
  key: string;
  label: string;
  periodLabel: string;
  net: number;
  value: number;
  color: string;
};

function formatMoney(amount: number, currencyCode: string) {
  if (currencyCode !== "Unknown") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return amount.toFixed(2);
}

async function fetchAllSplitsByType(
  type: Extract<TransactionTypeFilter, "income" | "expense" | "transfer">,
  start: string,
  end: string,
  cacheSeconds: number,
) {
  const entries: TransactionSplit[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetchTransactions({
      type,
      start,
      end,
      page,
      limit: PAGE_SIZE,
    }, { cacheSeconds });
    response.data?.forEach((item) => {
      entries.push(...(item.attributes.transactions ?? []));
    });

    totalPages = response.meta?.pagination?.total_pages ?? 1;
    page += 1;
  }

  return entries;
}

function summarizeCardData(entries: { currency: string; amount: number }[]) {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  return { total, entries };
}

function buildBalanceByCurrency({
  income,
  cashExpense,
  transfer,
}: {
  income: { currency: string; amount: number }[];
  cashExpense: { currency: string; amount: number }[];
  transfer: { currency: string; amount: number }[];
}) {
  const balances = new Map<string, number>();

  income.forEach((entry) => {
    balances.set(entry.currency, (balances.get(entry.currency) ?? 0) + entry.amount);
  });
  cashExpense.forEach((entry) => {
    balances.set(entry.currency, (balances.get(entry.currency) ?? 0) - entry.amount);
  });
  transfer.forEach((entry) => {
    balances.set(entry.currency, (balances.get(entry.currency) ?? 0) - entry.amount);
  });

  return Array.from(balances.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
}

function balanceColor(amount: number): "green" | "red" | undefined {
  if (amount > 0) return "green";
  if (amount < 0) return "red";
  return undefined;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function pickTimelineCurrency(entries: TransactionSplit[]) {
  const byCurrency = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.type !== "deposit" && entry.type !== "withdrawal") return;
    const currency = entry.currency_code;
    if (!currency) return;
    const amount = Math.abs(Number.parseFloat(entry.amount ?? "0"));
    if (Number.isNaN(amount) || amount <= 0) return;
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
  });

  let selected: string | null = null;
  let maxAmount = -1;
  byCurrency.forEach((amount, currency) => {
    if (amount > maxAmount) {
      maxAmount = amount;
      selected = currency;
    }
  });

  return selected;
}

function buildTimelineData({
  entries,
  startDate,
  endDate,
  granularity,
  currencyCode,
}: {
  entries: TransactionSplit[];
  startDate: Date;
  endDate: Date;
  granularity: "day" | "month";
  currencyCode?: string | null;
}) {
  const periods = new Map<string, TimelinePoint>();
  const pointer = new Date(startDate);

  if (granularity === "day") {
    while (pointer <= endDate) {
      const key = formatDateKey(pointer);
      periods.set(key, {
        key,
        label: String(pointer.getDate()),
        periodLabel: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(pointer),
        net: 0,
        value: 0,
        color: "#22c55e",
      });
      pointer.setDate(pointer.getDate() + 1);
    }
  } else {
    while (pointer <= endDate) {
      const key = formatMonthKey(pointer);
      periods.set(key, {
        key,
        label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(pointer),
        periodLabel: new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        }).format(pointer),
        net: 0,
        value: 0,
        color: "#22c55e",
      });
      pointer.setMonth(pointer.getMonth() + 1);
    }
  }

  entries.forEach((entry) => {
    if (entry.type !== "deposit" && entry.type !== "withdrawal") return;
    if (currencyCode && entry.currency_code !== currencyCode) return;

    const amount = Math.abs(Number.parseFloat(entry.amount ?? "0"));
    if (Number.isNaN(amount) || amount <= 0) return;

    const key =
      granularity === "day" ? formatDateKey(entry.date) : formatMonthKey(entry.date);
    const current = periods.get(key);
    if (!current) return;

    current.net += entry.type === "deposit" ? amount : -amount;
  });

  return Array.from(periods.values()).map((item) => {
    const isPositive = item.net >= 0;
    return {
      ...item,
      value: Math.abs(item.net),
      color: isPositive ? "#22c55e" : "#ef4444",
    };
  });
}

function buildTopExpenseCategories(entries: TransactionSplit[]) {
  const totalsByCategory = new Map<string, number>();
  const currencyCodes = new Set<string>();

  entries.forEach((entry) => {
    if (entry.type !== "withdrawal") return;

    const category = entry.category_name?.trim() || "Uncategorized";
    const amount = Math.abs(Number.parseFloat(entry.amount ?? "0"));
    if (Number.isNaN(amount) || amount <= 0) return;

    totalsByCategory.set(category, (totalsByCategory.get(category) ?? 0) + amount);
    if (entry.currency_code) currencyCodes.add(entry.currency_code);
  });

  const data = Array.from(totalsByCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const currencyCode = currencyCodes.size === 1 ? Array.from(currencyCodes)[0] : null;
  return { data, currencyCode };
}

function buildCreditCardPieData({
  entries,
  creditAccountsById,
  mode,
}: {
  entries: TransactionSplit[];
  creditAccountsById: Map<string, AccountRead>;
  mode: "spent" | "paid";
}) {
  const totalsByCard = new Map<string, number>();
  const currencyCodes = new Set<string>();

  entries.forEach((entry) => {
    if (mode === "spent") {
      if (entry.type !== "withdrawal") return;
      const sourceId = entry.source_id ?? "";
      const account = creditAccountsById.get(sourceId);
      if (!account) return;
      const name = entry.source_name ?? account.attributes.name;
      const amount = Math.abs(Number.parseFloat(entry.amount ?? "0"));
      if (Number.isNaN(amount) || amount <= 0) return;

      totalsByCard.set(name, (totalsByCard.get(name) ?? 0) + amount);
      if (entry.currency_code) currencyCodes.add(entry.currency_code);
      return;
    }

    if (entry.type !== "transfer" && entry.type !== "deposit") return;
    const destinationId = entry.destination_id ?? "";
    const account = creditAccountsById.get(destinationId);
    if (!account) return;
    const name = entry.destination_name ?? account.attributes.name;
    const amount = Math.abs(Number.parseFloat(entry.amount ?? "0"));
    if (Number.isNaN(amount) || amount <= 0) return;

    totalsByCard.set(name, (totalsByCard.get(name) ?? 0) + amount);
    if (entry.currency_code) currencyCodes.add(entry.currency_code);
  });

  const data = Array.from(totalsByCard.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const currencyCode = currencyCodes.size === 1 ? Array.from(currencyCodes)[0] : null;

  return { data, currencyCode };
}

export default async function ReportView({
  title,
  startDate,
  endDate,
  breadcrumbs,
  cacheSeconds,
  timelineGranularity,
}: Props) {
  await connection();

  const start = formatDateOnly(startDate);
  const end = formatDateOnly(endDate);

  const [accountsResponse, incomeEntries, expenseEntries, transferEntries] =
    await Promise.all([
      fetchAccounts({ cacheSeconds }),
      fetchAllSplitsByType("income", start, end, cacheSeconds),
      fetchAllSplitsByType("expense", start, end, cacheSeconds),
      fetchAllSplitsByType("transfer", start, end, cacheSeconds),
    ]);

  const creditAccounts = (accountsResponse.data ?? []).filter((account) =>
    isCreditAccount(account),
  );
  const creditAccountsById = new Map(creditAccounts.map((account) => [account.id, account]));

  const reportEntries = [...incomeEntries, ...expenseEntries, ...transferEntries].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
  const creditExpenseEntries = expenseEntries.filter((entry) =>
    entry.source_id ? creditAccountsById.has(entry.source_id) : false,
  );
  const cashExpenseEntries = expenseEntries.filter((entry) =>
    entry.source_id ? !creditAccountsById.has(entry.source_id) : true,
  );

  const incomeTotals = groupTotalsByCurrency(reportEntries, "income");
  const cashExpenseTotals = groupTotalsByCurrency(cashExpenseEntries, "expense");
  const creditExpenseTotals = groupTotalsByCurrency(creditExpenseEntries, "expense");
  const transferTotals = groupTotalsByCurrency(reportEntries, "transfer");

  const incomeSummary = summarizeCardData(incomeTotals);
  const cashExpenseSummary = summarizeCardData(cashExpenseTotals);
  const creditExpenseSummary = summarizeCardData(creditExpenseTotals);
  const transferSummary = summarizeCardData(transferTotals);
  const balanceSummary = summarizeCardData(
    buildBalanceByCurrency({
      income: incomeTotals,
      cashExpense: cashExpenseTotals,
      transfer: transferTotals,
    }),
  );
  const spentOnCards = buildCreditCardPieData({
    entries: reportEntries,
    creditAccountsById,
    mode: "spent",
  });
  const paidOnCards = buildCreditCardPieData({
    entries: reportEntries,
    creditAccountsById,
    mode: "paid",
  });
  const topCashCategories = buildTopExpenseCategories(cashExpenseEntries);
  const topCreditCategories = buildTopExpenseCategories(creditExpenseEntries);
  const timelineCurrency = pickTimelineCurrency(reportEntries);
  const timelineData = buildTimelineData({
    entries: reportEntries,
    startDate,
    endDate,
    granularity: timelineGranularity,
    currencyCode: timelineCurrency,
  });

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Group gap={8} wrap="wrap">
            {breadcrumbs.map((item, index) => (
              <Group key={`${item.label}-${index}`} gap={8} wrap="nowrap">
                {item.href ? (
                  <Link
                    href={item.href}
                    style={{ color: "var(--mantine-color-dimmed)", textDecoration: "none" }}
                  >
                    <Text c="dimmed" size="sm">
                      {item.label}
                    </Text>
                  </Link>
                ) : (
                  <Text size="sm">{item.label}</Text>
                )}
                {index < breadcrumbs.length - 1 ? (
                  <Text c="dimmed" size="sm">
                    &gt;
                  </Text>
                ) : null}
              </Group>
            ))}
          </Group>
          <Group justify="space-between" align="center" mt={4}>
            <div>
              <Title order={2}>{title}</Title>
              <Text c="dimmed" size="sm">
                Range: {start} to {end}
              </Text>
            </div>
            <Badge variant="light" color="gray">
              {reportEntries.length} included transactions
            </Badge>
          </Group>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
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
            {incomeSummary.entries.length <= 1 ? (
              <Text fw={600} size="xl">
                {formatMoney(
                  incomeSummary.total,
                  incomeSummary.entries[0]?.currency ?? "Unknown",
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {incomeSummary.entries.map((entry) => (
                  <Group key={entry.currency} justify="space-between">
                    <Text size="sm" c="dimmed">
                      {entry.currency}
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatMoney(entry.amount, entry.currency)}
                    </Text>
                  </Group>
                ))}
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
            <Text size="sm" c="dimmed">
              Total cash expenses
            </Text>
            {cashExpenseSummary.entries.length <= 1 ? (
              <Text fw={600} size="xl">
                {formatMoney(
                  cashExpenseSummary.total,
                  cashExpenseSummary.entries[0]?.currency ?? "Unknown",
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {cashExpenseSummary.entries.map((entry) => (
                  <Group key={entry.currency} justify="space-between">
                    <Text size="sm" c="dimmed">
                      {entry.currency}
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatMoney(entry.amount, entry.currency)}
                    </Text>
                  </Group>
                ))}
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
            <Text size="sm" c="dimmed">
              Total credit expenses
            </Text>
            {creditExpenseSummary.entries.length <= 1 ? (
              <Text fw={600} size="xl">
                {formatMoney(
                  creditExpenseSummary.total,
                  creditExpenseSummary.entries[0]?.currency ?? "Unknown",
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {creditExpenseSummary.entries.map((entry) => (
                  <Group key={entry.currency} justify="space-between">
                    <Text size="sm" c="dimmed">
                      {entry.currency}
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatMoney(entry.amount, entry.currency)}
                    </Text>
                  </Group>
                ))}
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
            <Text size="sm" c="dimmed">
              Total transfers
            </Text>
            {transferSummary.entries.length <= 1 ? (
              <Text fw={600} size="xl">
                {formatMoney(
                  transferSummary.total,
                  transferSummary.entries[0]?.currency ?? "Unknown",
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {transferSummary.entries.map((entry) => (
                  <Group key={entry.currency} justify="space-between">
                    <Text size="sm" c="dimmed">
                      {entry.currency}
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatMoney(entry.amount, entry.currency)}
                    </Text>
                  </Group>
                ))}
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
            <Text size="sm" c="dimmed">
              Balance
            </Text>
            {balanceSummary.entries.length <= 1 ? (
              <Text fw={600} size="xl" c={balanceColor(balanceSummary.total)}>
                {formatMoney(
                  balanceSummary.total,
                  balanceSummary.entries[0]?.currency ?? "Unknown",
                )}
              </Text>
            ) : (
              <Stack gap={4} mt="xs">
                {balanceSummary.entries.map((entry) => (
                  <Group key={entry.currency} justify="space-between">
                    <Text size="sm" c="dimmed">
                      {entry.currency}
                    </Text>
                    <Text size="sm" fw={600} c={balanceColor(entry.amount)}>
                      {formatMoney(entry.amount, entry.currency)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
            <Text size="xs" c="dimmed" mt={6}>
              Income - cash expenses - transfers
            </Text>
          </Card>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          <ReportPieCard
            title="Spent on each credit card"
            data={spentOnCards.data}
            currencyCode={spentOnCards.currencyCode}
            emptyLabel="No credit-card spending found for this period."
          />
          <ReportPieCard
            title="Paid on each credit card"
            data={paidOnCards.data}
            currencyCode={paidOnCards.currencyCode}
            emptyLabel="No credit-card payments found for this period."
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          <ReportPieCard
            title="Top 5 cash expense categories"
            data={topCashCategories.data}
            currencyCode={topCashCategories.currencyCode}
            emptyLabel="No cash expense categories found for this period."
          />
          <ReportPieCard
            title="Top 5 credit expense categories"
            data={topCreditCategories.data}
            currencyCode={topCreditCategories.currencyCode}
            emptyLabel="No credit expense categories found for this period."
          />
        </SimpleGrid>

        <ReportBalanceTimelineCard
          title="Income vs expense balance timeline"
          data={timelineData}
          currencyCode={timelineCurrency}
        />

        <Card
          padding="lg"
          radius="md"
          style={{
            backgroundColor: "var(--app-panel-strong)",
            border: "1px solid var(--app-border)",
          }}
        >
          <Group justify="space-between" mb="md">
            <Text fw={600}>All transactions</Text>
            <Badge variant="light" color="gray">
              {reportEntries.length} entries
            </Badge>
          </Group>
          <TransactionsTable entries={reportEntries} maxRows={200} />
        </Card>
      </Stack>
    </Container>
  );
}
