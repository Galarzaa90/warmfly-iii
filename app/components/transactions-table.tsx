"use client";

import {
  Badge,
  Group,
  Paper,
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
import { TransferArrowIcon } from "./icons";

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

function TransactionTypeIcon({ type }: { type?: string }) {
  const icon = (() => {
    if (type === "withdrawal" || type === "expense") {
      return {
        path: "M12 4v16m0 0l-5-5m5 5l5-5",
        color: "#f97316",
        label: "Withdrawal",
      };
    }
    if (type === "deposit" || type === "income") {
      return {
        path: "M12 20V4m0 0l-5 5m5-5l5 5",
        color: "#22c55e",
        label: "Deposit",
      };
    }
    if (type === "transfer") {
      return {
        path: "M4 9h14m0 0l-4-4m4 4l-4 4M20 15H6m0 0l4-4m-4 4l4 4",
        color: "#38bdf8",
        label: "Transfer",
      };
    }
    return {
      path: "M4 12h16",
      color: "#94a3b8",
      label: "Transaction",
    };
  })();

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={icon.color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={icon.label}
      role="img"
    >
      <path d={icon.path} />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h7l2 3h7v13H4z" />
    </svg>
  );
}

function LabelIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10l-8 8-8-8V4h6z" />
      <circle cx="9" cy="9" r="1.5" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h6M7 16h8" />
    </svg>
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
          <TransferArrowIcon size={12} />
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
}: Props) {
  const rows = maxRows ? entries.slice(0, maxRows) : entries;
  const isMobile = useMediaQuery("(max-width: 48em)") ?? false;

  return (
    <Stack gap="md">
      {isMobile ? (
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
                    <Text size="xs" c="dimmed">
                      {formatForeignAmount(
                        entry.foreignAmountValue,
                        entry.foreignCurrencySymbol,
                      )}
                    </Text>
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
                            leftSection={<CategoryIcon />}
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
                            leftSection={<BudgetIcon />}
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
                            leftSection={<LabelIcon />}
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
                            leftSection={<CategoryIcon />}
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
                            leftSection={<BudgetIcon />}
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
                            leftSection={<LabelIcon />}
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
                      <Text size="xs" c="dimmed">
                        {formatForeignAmount(
                          entry.foreignAmountValue,
                          entry.foreignCurrencySymbol,
                        )}
                      </Text>
                    ) : null}
                  </Stack>
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
