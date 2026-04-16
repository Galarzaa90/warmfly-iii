"use client";

import { Badge, Card, Group, Paper, Select, Stack, Text } from "@mantine/core";
import { useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DateRangeFilter from "./DateRangeFilter";
import TransactionsPagination from "./TransactionsPagination";
import TransactionsTable from "./TransactionsTable";
import type { TransactionSplit } from "../lib/firefly";

type Option = { value: string; label: string };
type CurrencyTotal = { currency: string; amount: number };

type Props = {
  title: string;
  scopeLabel?: string;
  scopeParam?: string;
  scopeOptions?: Option[];
  scopeValue?: string | null;
  dateRangeValue: string;
  entries: TransactionSplit[];
  incomeTotals: CurrencyTotal[];
  expenseTotals: CurrencyTotal[];
  totalMatches: number | null;
  page: number;
  totalPages: number;
  limit: number;
  basePath: string;
  errorMessage?: string | null;
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

function summaryTotal(entries: CurrencyTotal[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export default function ScopedTransactionsPanel({
  title,
  scopeLabel,
  scopeParam,
  scopeOptions = [],
  scopeValue = null,
  dateRangeValue,
  entries,
  incomeTotals,
  expenseTotals,
  totalMatches,
  page,
  totalPages,
  limit,
  basePath,
  errorMessage,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, startTransition] = useTransition();

  const handleNavigate = useCallback(
    (url: string) => {
      startTransition(() => {
        router.push(url);
      });
    },
    [router, startTransition],
  );

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams],
  );
  const showScopeSelect = Boolean(scopeLabel && scopeParam && scopeOptions.length > 0);

  const incomeOverall = summaryTotal(incomeTotals);
  const expenseOverall = summaryTotal(expenseTotals);

  return (
    <Stack gap="xl">
      <Group gap="md" align="center" wrap="wrap">
        <DateRangeFilter
          value={dateRangeValue}
          basePath={basePath}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />
        {showScopeSelect ? (
          <Select
            label={scopeLabel}
            data={scopeOptions}
            value={scopeValue}
            searchable
            clearable
            disabled={isLoading}
            onChange={(nextValue) => {
              const updated = new URLSearchParams(params);
              if (nextValue) {
                updated.set(scopeParam!, nextValue);
              } else {
                updated.delete(scopeParam!);
              }
              updated.set("page", "1");
              handleNavigate(`${basePath}?${updated.toString()}`);
            }}
            w={280}
          />
        ) : null}
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

      <Group grow>
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
          {incomeTotals.length <= 1 ? (
            <Text fw={600} size="xl">
              {formatMoney(incomeOverall, incomeTotals[0]?.currency ?? "Unknown")}
            </Text>
          ) : (
            <Stack gap={4} mt="xs">
              {incomeTotals.map((entry) => (
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
            Total expenses
          </Text>
          {expenseTotals.length <= 1 ? (
            <Text fw={600} size="xl">
              {formatMoney(expenseOverall, expenseTotals[0]?.currency ?? "Unknown")}
            </Text>
          ) : (
            <Stack gap={4} mt="xs">
              {expenseTotals.map((entry) => (
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
      </Group>

      <Card
        padding="lg"
        radius="md"
        style={{
          backgroundColor: "var(--app-panel-strong)",
          border: "1px solid var(--app-border)",
        }}
      >
        <Group justify="space-between" mb="md">
          <Text fw={600}>{title}</Text>
          <Group gap="md" align="center">
            <Badge variant="light" color="gray">
              {(totalMatches ?? entries.length)} entries
            </Badge>
            <TransactionsPagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              basePath={basePath}
              showPagination={false}
              variant="compact"
              isLoading={isLoading}
              onNavigate={handleNavigate}
            />
          </Group>
        </Group>
        <TransactionsTable
          entries={entries}
          isLoading={isLoading}
          pagination={
            <TransactionsPagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              basePath={basePath}
              showSelect={false}
              isLoading={isLoading}
              onNavigate={handleNavigate}
            />
          }
        />
      </Card>
    </Stack>
  );
}
