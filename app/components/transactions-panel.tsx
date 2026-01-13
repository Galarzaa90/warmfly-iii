"use client";

import { Badge, Card, Group, Paper, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DateRangeFilter from "./date-range-filter";
import TransactionsFilters from "./transactions-filters";
import TransactionsPagination from "./transactions-pagination";
import TransactionsTable, { type TransactionRow } from "./transactions-table";
import TypeFilter from "./type-filter";

type Option = { value: string; label: string };

type Props = {
  basePath?: string;
  requestedType: string;
  dateRangeValue: string;
  accountOptions: Option[];
  categoryOptions: Option[];
  labelOptions: Option[];
  accountValue: string | null;
  categoryValue: string | null;
  labelValue: string | null;
  entries: TransactionRow[];
  totalMatches: number | null;
  page: number;
  totalPages: number;
  limit: number;
  errorMessage?: string | null;
};

export default function TransactionsPanel({
  basePath = "/transactions",
  requestedType,
  dateRangeValue,
  accountOptions,
  categoryOptions,
  labelOptions,
  accountValue,
  categoryValue,
  labelValue,
  entries,
  totalMatches,
  page,
  totalPages,
  limit,
  errorMessage,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const resetKey = useMemo(
    () =>
      [
        requestedType,
        dateRangeValue,
        accountValue ?? "",
        categoryValue ?? "",
        labelValue ?? "",
        page,
        limit,
      ].join("|"),
    [
      requestedType,
      dateRangeValue,
      accountValue,
      categoryValue,
      labelValue,
      page,
      limit,
    ],
  );

  useEffect(() => {
    setIsLoading(false);
  }, [resetKey, entries]);

  const handleNavigate = useCallback(
    (url: string) => {
      setIsLoading(true);
      router.push(url);
    },
    [router],
  );

  return (
    <Stack gap="xl">
      <Group gap="md" align="center" wrap="wrap">
        <TypeFilter
          value={requestedType ?? "all"}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />
        <DateRangeFilter
          value={dateRangeValue}
          basePath={basePath}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />
        <TransactionsFilters
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          labelOptions={labelOptions}
          accountValue={accountValue || null}
          categoryValue={categoryValue || null}
          labelValue={labelValue || null}
          basePath={basePath}
          isLoading={isLoading}
          onNavigate={handleNavigate}
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
