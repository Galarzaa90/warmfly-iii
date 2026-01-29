"use client";

import {
  Badge,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconArrowDown,
  IconArrowNarrowRight,
  IconArrowUp,
  IconArrowsRightLeft,
  IconCoins,
  IconFolder,
  IconLabel,
  IconMinus,
} from "@tabler/icons-react";
import type { TransactionSplit } from "../lib/firefly";

type Props = {
  entries: TransactionSplit[];
  maxRows?: number;
  pagination?: React.ReactNode;
  isLoading?: boolean;
};

const ACCOUNT_COLORS = [
  "teal",
  "blue",
  "cyan",
  "grape",
  "violet",
  "lime",
  "yellow",
  "orange",
  "indigo",
  "pink",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function accountColor(name: string) {
  const index = hashString(name) % ACCOUNT_COLORS.length;
  return ACCOUNT_COLORS[index];
}

function normalizeAccountName(name?: string | null) {
  return name?.trim() ? name.trim() : "Unknown";
}

function formatDate(value: Date) {
  const date = value;
  if (Number.isNaN(date.getTime())) return value.toString();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatFullDate(value: Date) {
  const date = value;
  if (Number.isNaN(date.getTime())) return value.toString();
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(date);
}

function formatTransactionType(type?: string) {
  if (!type) return "Transaction";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function parseAmount(value?: string | null) {
  const amount = Math.abs(Number.parseFloat(value ?? "0"));
  return Number.isNaN(amount) ? 0 : amount;
}

function transactionKey(entry: TransactionSplit, index: number) {
  const dateKey =
    entry.date instanceof Date ? entry.date.toISOString() : String(entry.date);
  return `${dateKey}-${entry.amount ?? ""}-${entry.description ?? ""}-${index}`;
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

function formatForeignAmount(
  amount: number,
  currencySymbol?: string | null,
) {
  const prefix = currencySymbol ?? "";
  return `${prefix}${amount.toFixed(2)}`;
}

function formatExchangeRateLabel({
  primaryAmount,
  foreignAmount,
  primarySymbol,
  primaryCode,
  foreignSymbol,
}: {
  primaryAmount: number;
  foreignAmount: number;
  primarySymbol?: string | null;
  primaryCode?: string | null;
  foreignSymbol?: string | null;
}) {
  if (!foreignAmount) return null;
  const rate = primaryAmount / foreignAmount;
  if (!Number.isFinite(rate)) return null;
  const primaryLabel = primarySymbol ?? primaryCode ?? "";
  const foreignLabel = foreignSymbol ?? "";
  const primaryValue = `${primaryLabel}${rate.toFixed(4)}`;
  return `1${foreignLabel} = ${primaryValue}`;
}

function TransactionTypeIcon({ type }: { type?: string }) {
  if (type === "withdrawal" || type === "expense") {
    return (
      <IconArrowDown
        size={18}
        color="#f97316"
        aria-label="Withdrawal"
        role="img"
      />
    );
  }
  if (type === "deposit" || type === "income") {
    return (
      <IconArrowUp
        size={18}
        color="#22c55e"
        aria-label="Deposit"
        role="img"
      />
    );
  }
  if (type === "transfer") {
    return (
      <IconArrowsRightLeft
        size={18}
        color="#38bdf8"
        aria-label="Transfer"
        role="img"
      />
    );
  }
  return (
    <IconMinus
      size={18}
      color="#94a3b8"
      aria-label="Transaction"
      role="img"
    />
  );
}

function AccountBadges({
  entry,
  size = "lg",
}: {
  entry: TransactionSplit;
  size?: "sm" | "md" | "lg";
}) {
  if (entry.type === "transfer") {
    return (
      <Group gap="xs" align="center" wrap="wrap">

        <span style={{ display: "inline-flex" }}>
          <Badge
            size={size}
            variant="light"
            color={accountColor(normalizeAccountName(entry.source_name))}
            style={{ textTransform: "none" }}
          >
            {normalizeAccountName(entry.source_name)}
          </Badge>
        </span>
        <Text size="xs" c="dimmed">
          <IconArrowNarrowRight size={12} aria-hidden="true" />
        </Text>
        <span style={{ display: "inline-flex" }}>
          <Badge
            size={size}
            variant="light"
            color={accountColor(normalizeAccountName(entry.destination_name))}
            style={{ textTransform: "none" }}
          >
            {normalizeAccountName(entry.destination_name)}
          </Badge>
        </span>
      </Group>
    );
  }

  const accountName = normalizeAccountName(
    entry.type === "deposit" || entry.type === "income"
      ? entry.destination_name
      : entry.source_name,
  );

  return (

    <span style={{ display: "inline-flex" }}>
      <Badge
        size={size}
        variant="light"
        color={accountColor(accountName)}
        style={{ textTransform: "none" }}
      >
        {accountName}
      </Badge>
    </span>
  );
}

export default function TransactionsTable({
  entries,
  maxRows,
  pagination,
  isLoading = false,
}: Props) {
  const rows = maxRows ? entries.slice(0, maxRows) : entries;
  const isMobile = useMediaQuery("(max-width: 48em)") ?? false;
  const hasRows = rows.length > 0;

  if (isLoading) {
    return (
      <Stack gap="md">
        {isMobile ? (
          <Stack gap="sm">
            {Array.from({ length: 4 }).map((_, index) => (
              <Paper key={`loading-card-${index}`} withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Skeleton height={12} width="60%" />
                  <Skeleton height={10} width="40%" />
                  <Group gap="xs" mt="xs" wrap="wrap">
                    <Skeleton height={18} width={64} radius="xl" />
                    <Skeleton height={18} width={88} radius="xl" />
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
            <TableThead>
              <TableTr>
                <TableTh>Transaction</TableTh>
                <TableTh>Account</TableTh>
                <TableTh>Date</TableTh>
                <TableTh style={{ textAlign: "right" }}>Amount</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <TableTr key={`loading-row-${index}`}>
                  <TableTd>
                    <Stack gap={6}>
                      <Skeleton height={12} width="70%" />
                      <Skeleton height={10} width="45%" />
                    </Stack>
                  </TableTd>
                  <TableTd>
                    <Skeleton height={18} width={120} radius="xl" />
                  </TableTd>
                  <TableTd>
                    <Skeleton height={12} width={72} />
                  </TableTd>
                  <TableTd style={{ textAlign: "right" }}>
                    <Skeleton height={12} width={88} />
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        )}
        {pagination ?? null}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {hasRows ? (
        isMobile ? (
          <Stack gap="sm">
            {rows.map((entry, index) => {
              const rowKey = transactionKey(entry, index);
              const amountValue = parseAmount(entry.amount);
              const foreignAmountValue = entry.foreign_amount
                ? parseAmount(entry.foreign_amount)
                : null;
              const hasMetaBadges =
                Boolean(entry.category_name) ||
                Boolean(entry.budget_name) ||
                Boolean(entry.tags?.length);

              return (
                <Paper key={rowKey} withBorder radius="md" p="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="xs" align="center" wrap="nowrap">
                      <Tooltip label={formatTransactionType(entry.type)} withArrow>
                        <span style={{ display: "inline-flex" }}>
                          <TransactionTypeIcon type={entry.type} />
                        </span>
                      </Tooltip>
                      <Text fw={600} size="sm" lineClamp={2}>
                        {entry.description || "Untitled expense"}
                      </Text>
                    </Group>
                    <Stack gap={2} align="flex-end">
                      <Text fw={600} size="sm">
                        {formatAmount(
                          amountValue,
                          entry.currency_code,
                          entry.currency_symbol,
                        )}
                      </Text>
                      {foreignAmountValue !== null &&
                        foreignAmountValue !== undefined ? (
                        <Tooltip
                          label={formatExchangeRateLabel({
                            primaryAmount: amountValue,
                            foreignAmount: foreignAmountValue,
                            primarySymbol: entry.currency_symbol,
                            primaryCode: entry.currency_code,
                            foreignSymbol: entry.foreign_currency_symbol,
                          })}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Text size="xs" c="dimmed">
                              {formatForeignAmount(
                                foreignAmountValue,
                                entry.foreign_currency_symbol,
                              )}
                            </Text>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  </Group>
                  <Group gap="xs" mt="xs" align="center" wrap="wrap">
                    <Tooltip label={formatFullDate(entry.date)} withArrow>
                      <span style={{ display: "inline-flex" }}>
                        <Text size="xs" c="dimmed">
                          {formatDate(entry.date)}
                        </Text>
                      </span>
                    </Tooltip>
                    <AccountBadges entry={entry} size="sm" />
                  </Group>
                  {hasMetaBadges ? (
                    <Group gap="xs" mt="xs" wrap="wrap">
                      {entry.category_name ? (
                        <Tooltip
                          label={`Category: ${entry.category_name}`}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="sm"
                              variant="light"
                              color="teal"
                              style={{ textTransform: "none" }}
                              leftSection={<IconFolder size={14} aria-hidden="true" />}
                            >
                              {entry.category_name}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.budget_name ? (
                        <Tooltip
                          label={`Budget: ${entry.budget_name}`}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="sm"
                              variant="light"
                              color="cyan"
                              style={{ textTransform: "none" }}
                              leftSection={<IconCoins size={14} aria-hidden="true" />}
                            >
                              {entry.budget_name}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.tags?.map((tag, tagIndex) => (
                        <Tooltip
                          key={`${rowKey}-tag-${tag}-${tagIndex}`}
                          label={`Label: ${tag}`}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="sm"
                              variant="light"
                              color="gray"
                              style={{ textTransform: "none" }}
                              leftSection={<IconLabel size={14} aria-hidden="true" />}
                            >
                              {tag}
                            </Badge>
                          </span>
                        </Tooltip>
                      ))}
                    </Group>
                  ) : null}
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
            <TableThead>
              <TableTr>
                <TableTh>Transaction</TableTh>
                <TableTh>Account</TableTh>
                <TableTh>Date</TableTh>
                <TableTh style={{ textAlign: "right" }}>Amount</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {rows.map((entry, index) => {
                const rowKey = transactionKey(entry, index);
                const amountValue = parseAmount(entry.amount);
                const foreignAmountValue = entry.foreign_amount
                  ? parseAmount(entry.foreign_amount)
                  : null;

                return (
                <TableTr key={rowKey}>
                  <TableTd>
                    <Group gap="xs" align="center">
                      <Tooltip label={formatTransactionType(entry.type)} withArrow>
                        <span style={{ display: "inline-flex" }}>
                          <TransactionTypeIcon type={entry.type} />
                        </span>
                      </Tooltip>
                      <Text fw={600} size="sm">
                        {entry.description || "Untitled expense"}
                      </Text>
                    </Group>
                    <Group gap="xs" mt={6} wrap="wrap">
                      {entry.category_name ? (
                        <Tooltip
                          label={`Category: ${entry.category_name}`}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="md"
                              variant="light"
                              color="teal"
                              style={{ textTransform: "none" }}
                              leftSection={<IconFolder size={14} aria-hidden="true" />}
                            >
                              {entry.category_name}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.budget_name ? (
                        <Tooltip
                          label={`Budget: ${entry.budget_name}`}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="md"
                              variant="light"
                              color="cyan"
                              style={{ textTransform: "none" }}
                              leftSection={<IconCoins size={14} aria-hidden="true" />}
                            >
                              {entry.budget_name}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.tags?.map((tag, tagIndex) => (
                        <Tooltip
                          key={`${rowKey}-tag-${tag}-${tagIndex}`}
                          label={`Label: ${tag}`}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="md"
                              variant="light"
                              color="gray"
                              style={{ textTransform: "none" }}
                              leftSection={<IconLabel size={14} aria-hidden="true" />}
                            >
                              {tag}
                            </Badge>
                          </span>
                        </Tooltip>
                      ))}
                    </Group>
                  </TableTd>
                  <TableTd>
                    <AccountBadges entry={entry} />
                  </TableTd>
                  <TableTd>
                    <Tooltip label={formatFullDate(entry.date)} withArrow>
                      <span style={{ display: "inline-flex" }}>
                        <Text size="sm" component="span">
                          {formatDate(entry.date)}
                        </Text>
                      </span>
                    </Tooltip>
                  </TableTd>
                  <TableTd style={{ textAlign: "right" }}>
                    <Stack gap={2} align="flex-end">
                      <Text fw={600} size="sm">
                        {formatAmount(
                          amountValue,
                          entry.currency_code,
                          entry.currency_symbol,
                        )}
                      </Text>
                      {foreignAmountValue !== null &&
                        foreignAmountValue !== undefined ? (
                        <Tooltip
                          label={formatExchangeRateLabel({
                            primaryAmount: amountValue,
                            foreignAmount: foreignAmountValue,
                            primarySymbol: entry.currency_symbol,
                            primaryCode: entry.currency_code,
                            foreignSymbol: entry.foreign_currency_symbol,
                          })}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Text size="xs" c="dimmed">
                              {formatForeignAmount(
                                foreignAmountValue,
                                entry.foreign_currency_symbol,
                              )}
                            </Text>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  </TableTd>
                </TableTr>
                );
              })}
            </TableTbody>
          </Table>
        )
      ) : (
        <Stack gap={0} align="center" py="xl">
          <Text size="xs" c="dimmed">
            No transactions found.
          </Text>
        </Stack>
      )}
      {pagination ?? null}
    </Stack>
  );
}
