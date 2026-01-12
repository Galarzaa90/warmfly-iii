import { Badge, Group, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, Text } from "@mantine/core";
import { TransferArrowIcon } from "./icons";

export type TransactionRow = {
  id: string;
  title: string;
  date: string;
  amountValue: number;
  currencyCode?: string | null;
  currencySymbol?: string | null;
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

export default function TransactionsTable({ entries, maxRows }: Props) {
  const rows = maxRows ? entries.slice(0, maxRows) : entries;

  return (
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
                <TransactionTypeIcon type={entry.type} />
                <Text fw={600} size="sm">
                  {entry.title}
                </Text>
              </Group>
              <Group gap="xs" mt={6} wrap="wrap">
                {entry.category ? (
                  <Badge
                    size="xs"
                    variant="light"
                    color="teal"
                    style={{ textTransform: "none" }}
                    leftSection={<CategoryIcon />}
                    title={`Category: ${entry.category}`}
                  >
                    {entry.category}
                  </Badge>
                ) : null}
                {entry.budget ? (
                  <Badge
                    size="xs"
                    variant="light"
                    color="cyan"
                    style={{ textTransform: "none" }}
                    leftSection={<BudgetIcon />}
                    title={`Budget: ${entry.budget}`}
                  >
                    {entry.budget}
                  </Badge>
                ) : null}
                {entry.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    size="xs"
                    variant="light"
                    color="gray"
                    style={{ textTransform: "none" }}
                    leftSection={<LabelIcon />}
                    title={`Label: ${tag}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </Group>
            </TableTd>
            <TableTd>
              {entry.type === "transfer" ? (
                <Group gap="xs" align="center" wrap="wrap">
                  <Badge
                    size="md"
                    variant="light"
                    color={accountColor(
                      normalizeAccountName(entry.source),
                    )}
                    style={{ textTransform: "none" }}
                  >
                    {normalizeAccountName(entry.source)}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    <TransferArrowIcon size={14} />
                  </Text>
                  <Badge
                    size="md"
                    variant="light"
                    color={accountColor(
                      normalizeAccountName(entry.destination),
                    )}
                    style={{ textTransform: "none" }}
                  >
                    {normalizeAccountName(entry.destination)}
                  </Badge>
                </Group>
              ) : (
                <Badge
                  size="md"
                  variant="light"
                  color={accountColor(
                    normalizeAccountName(
                      entry.type === "deposit" || entry.type === "income"
                        ? entry.destination
                        : entry.source,
                    ),
                  )}
                  style={{ textTransform: "none" }}
                >
                  {normalizeAccountName(
                    entry.type === "deposit" || entry.type === "income"
                      ? entry.destination
                      : entry.source,
                  )}
                </Badge>
              )}
            </TableTd>
            <TableTd>
              <Text size="sm">{formatDate(entry.date)}</Text>
            </TableTd>
            <TableTd style={{ textAlign: "right" }}>
              <Text fw={600} size="sm">
                {formatAmount(
                  entry.amountValue,
                  entry.currencyCode,
                  entry.currencySymbol,
                )}
              </Text>
            </TableTd>
          </TableTr>
        ))}
      </TableTbody>
    </Table>
  );
}
