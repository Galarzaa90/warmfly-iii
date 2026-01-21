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

export type TransactionRow = {
  id: string;
  title: string;
  date: string;
  amountValue: number;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  foreignAmountValue?: number | null;
  foreignCurrencySymbol?: string | null;
  type?: string;
  source?: string | null;
  destination?: string | null;
  category?: string | null;
  budget?: string | null;
  tags?: string[] | null;
};

type Props = {
  entries: TransactionRow[];
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatFullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(date);
}

function formatTransactionType(type?: string) {
  if (!type) return "Transaction";
  return type.charAt(0).toUpperCase() + type.slice(1);
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
  entry: TransactionRow;
  size?: "sm" | "md" | "lg";
}) {
  if (entry.type === "transfer") {
    return (
      <Group gap="xs" align="center" wrap="wrap">

        <span style={{ display: "inline-flex" }}>
          <Badge
            size={size}
            variant="light"
            color={accountColor(normalizeAccountName(entry.source))}
            style={{ textTransform: "none" }}
          >
            {normalizeAccountName(entry.source)}
          </Badge>
        </span>
        <Text size="xs" c="dimmed">
          <IconArrowNarrowRight size={12} aria-hidden="true" />
        </Text>
        <span style={{ display: "inline-flex" }}>
          <Badge
            size={size}
            variant="light"
            color={accountColor(normalizeAccountName(entry.destination))}
            style={{ textTransform: "none" }}
          >
            {normalizeAccountName(entry.destination)}
          </Badge>
        </span>
      </Group>
    );
  }

  const accountName = normalizeAccountName(
    entry.type === "deposit" || entry.type === "income"
      ? entry.destination
      : entry.source,
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
            {rows.map((entry) => {
              const hasMetaBadges =
                Boolean(entry.category) ||
                Boolean(entry.budget) ||
                Boolean(entry.tags?.length);

              return (
                <Paper key={entry.id} withBorder radius="md" p="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="xs" align="center" wrap="nowrap">
                      <Tooltip label={formatTransactionType(entry.type)} withArrow>
                        <span style={{ display: "inline-flex" }}>
                          <TransactionTypeIcon type={entry.type} />
                        </span>
                      </Tooltip>
                      <Text fw={600} size="sm" lineClamp={2}>
                        {entry.title}
                      </Text>
                    </Group>
                    <Stack gap={2} align="flex-end">
                      <Text fw={600} size="sm">
                        {formatAmount(
                          entry.amountValue,
                          entry.currencyCode,
                          entry.currencySymbol,
                        )}
                      </Text>
                      {entry.foreignAmountValue !== null &&
                        entry.foreignAmountValue !== undefined ? (
                        <Tooltip
                          label={formatExchangeRateLabel({
                            primaryAmount: entry.amountValue,
                            foreignAmount: entry.foreignAmountValue,
                            primarySymbol: entry.currencySymbol,
                            primaryCode: entry.currencyCode,
                            foreignSymbol: entry.foreignCurrencySymbol,
                          })}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Text size="xs" c="dimmed">
                              {formatForeignAmount(
                                entry.foreignAmountValue,
                                entry.foreignCurrencySymbol,
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
                      {entry.category ? (
                        <Tooltip label={`Category: ${entry.category}`} withArrow>
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="sm"
                              variant="light"
                              color="teal"
                              style={{ textTransform: "none" }}
                              leftSection={<IconFolder size={14} aria-hidden="true" />}
                            >
                              {entry.category}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.budget ? (
                        <Tooltip label={`Budget: ${entry.budget}`} withArrow>
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="sm"
                              variant="light"
                              color="cyan"
                              style={{ textTransform: "none" }}
                              leftSection={<IconCoins size={14} aria-hidden="true" />}
                            >
                              {entry.budget}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.tags?.map((tag, index) => (
                        <Tooltip
                          key={`${entry.id}-tag-${tag}-${index}`}
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
              {rows.map((entry) => (
                <TableTr key={entry.id}>
                  <TableTd>
                    <Group gap="xs" align="center">
                      <Tooltip label={formatTransactionType(entry.type)} withArrow>
                        <span style={{ display: "inline-flex" }}>
                          <TransactionTypeIcon type={entry.type} />
                        </span>
                      </Tooltip>
                      <Text fw={600} size="sm">
                        {entry.title}
                      </Text>
                    </Group>
                    <Group gap="xs" mt={6} wrap="wrap">
                      {entry.category ? (
                        <Tooltip label={`Category: ${entry.category}`} withArrow>
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="md"
                              variant="light"
                              color="teal"
                              style={{ textTransform: "none" }}
                              leftSection={<IconFolder size={14} aria-hidden="true" />}
                            >
                              {entry.category}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.budget ? (
                        <Tooltip label={`Budget: ${entry.budget}`} withArrow>
                          <span style={{ display: "inline-flex" }}>
                            <Badge
                              size="md"
                              variant="light"
                              color="cyan"
                              style={{ textTransform: "none" }}
                              leftSection={<IconCoins size={14} aria-hidden="true" />}
                            >
                              {entry.budget}
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                      {entry.tags?.map((tag, index) => (
                        <Tooltip
                          key={`${entry.id}-tag-${tag}-${index}`}
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
                          entry.amountValue,
                          entry.currencyCode,
                          entry.currencySymbol,
                        )}
                      </Text>
                      {entry.foreignAmountValue !== null &&
                        entry.foreignAmountValue !== undefined ? (
                        <Tooltip
                          label={formatExchangeRateLabel({
                            primaryAmount: entry.amountValue,
                            foreignAmount: entry.foreignAmountValue,
                            primarySymbol: entry.currencySymbol,
                            primaryCode: entry.currencyCode,
                            foreignSymbol: entry.foreignCurrencySymbol,
                          })}
                          withArrow
                        >
                          <span style={{ display: "inline-flex" }}>
                            <Text size="xs" c="dimmed">
                              {formatForeignAmount(
                                entry.foreignAmountValue,
                                entry.foreignCurrencySymbol,
                              )}
                            </Text>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  </TableTd>
                </TableTr>
              ))}
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
