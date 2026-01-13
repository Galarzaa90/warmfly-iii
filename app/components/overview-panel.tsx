"use client";

import {
  Badge,
  Card,
  Grid,
  GridCol,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DateRangeFilter from "./date-range-filter";
import TransactionsTable, { type TransactionRow } from "./transactions-table";
import type {
  BudgetEntry,
  InsightCategoryEntry,
  InsightTotalEntry,
} from "../lib/firefly";

type BudgetWithLimit = BudgetEntry & {
  limit: number;
  limitCurrencyCode?: string | null;
  limitCurrencySymbol?: string | null;
  usage: number;
};

type Props = {
  dateRangeValue: string;
  dateRangeLabel: string;
  basePath?: string;
  recentExpenses: TransactionRow[];
  sortedIncomeTotals: InsightTotalEntry[];
  sortedExpenseTotals: InsightTotalEntry[];
  sortedTransferTotals: InsightTotalEntry[];
  primaryCurrency?: string | null;
  categorySlices: [string, number][];
  pieStops: string[];
  categoryColors: string[];
  budgetsWithLimits: BudgetWithLimit[];
  errorMessage?: string | null;
};

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

export default function OverviewPanel({
  dateRangeValue,
  dateRangeLabel,
  basePath = "/",
  recentExpenses,
  sortedIncomeTotals,
  sortedExpenseTotals,
  sortedTransferTotals,
  primaryCurrency,
  categorySlices,
  pieStops,
  categoryColors,
  budgetsWithLimits,
  errorMessage,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const resetKey = useMemo(
    () =>
      [
        dateRangeValue,
        recentExpenses.length,
        budgetsWithLimits.length,
        sortedIncomeTotals.length,
        sortedExpenseTotals.length,
        sortedTransferTotals.length,
        categorySlices.length,
      ].join("|"),
    [
      dateRangeValue,
      recentExpenses.length,
      budgetsWithLimits.length,
      sortedIncomeTotals.length,
      sortedExpenseTotals.length,
      sortedTransferTotals.length,
      categorySlices.length,
    ],
  );

  useEffect(() => {
    setIsLoading(false);
  }, [resetKey]);

  const handleNavigate = useCallback(
    (url: string) => {
      setIsLoading(true);
      router.push(url);
    },
    [router],
  );

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center" wrap="wrap">
        <DateRangeFilter
          value={dateRangeValue}
          basePath={basePath}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />
      </Group>

      {errorMessage && !isLoading ? (
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
          {isLoading ? (
            <Stack gap={6} mt="xs">
              <Skeleton height={24} width="70%" />
              <Skeleton height={10} width="60%" />
            </Stack>
          ) : sortedIncomeTotals.length <= 1 ? (
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
          {isLoading ? (
            <Skeleton height={10} width="60%" mt={6} />
          ) : (
            <Text size="xs" c="dimmed" mt={6}>
              {dateRangeLabel}
            </Text>
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
            Total spent
          </Text>
          {isLoading ? (
            <Stack gap={6} mt="xs">
              <Skeleton height={24} width="70%" />
              <Skeleton height={10} width="60%" />
            </Stack>
          ) : sortedExpenseTotals.length <= 1 ? (
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
          {isLoading ? (
            <Skeleton height={10} width="60%" mt={6} />
          ) : (
            <Text size="xs" c="dimmed" mt={6}>
              {dateRangeLabel}
            </Text>
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
          {isLoading ? (
            <Stack gap={6} mt="xs">
              <Skeleton height={24} width="70%" />
              <Skeleton height={10} width="60%" />
            </Stack>
          ) : sortedTransferTotals.length <= 1 ? (
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
          {isLoading ? (
            <Skeleton height={10} width="60%" mt={6} />
          ) : (
            <Text size="xs" c="dimmed" mt={6}>
              {dateRangeLabel}
            </Text>
          )}
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
              {isLoading ? (
                <Skeleton height={18} width={90} radius="xl" />
              ) : (
                <Badge variant="light" color="gray">
                  {recentExpenses.length} entries
                </Badge>
              )}
            </Group>
            <TransactionsTable
              entries={recentExpenses}
              maxRows={20}
              isLoading={isLoading}
            />
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
              {isLoading ? (
                <Stack gap="md">
                  <Skeleton
                    height={220}
                    width={220}
                    radius="50%"
                    style={{ margin: "0 auto" }}
                  />
                  <Stack gap={8}>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Group key={`cat-skel-${index}`} justify="space-between">
                        <Skeleton height={10} width={120} />
                        <Skeleton height={10} width={80} />
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              ) : categorySlices.length === 0 ? (
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
                      background: `conic-gradient(${pieStops.join(", ")})`,
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
                                categoryColors[index % categoryColors.length],
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
              {isLoading ? (
                <Stack gap="md">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Stack key={`budget-skel-${index}`} gap={6}>
                      <Skeleton height={10} width="55%" />
                      <Skeleton height={10} width="75%" />
                      <Skeleton height={8} width="100%" />
                    </Stack>
                  ))}
                </Stack>
              ) : (
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
              )}
            </Card>
          </Stack>
        </GridCol>
      </Grid>
    </Stack>
  );
}
