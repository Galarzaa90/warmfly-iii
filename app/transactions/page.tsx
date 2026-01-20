import { Container } from "@mantine/core";
import TransactionsPanel from "../components/TransactionsPanel";
import {
  fetchAccounts,
  fetchCategories,
  searchTransactions,
  fetchTags,
  type AccountEntry,
  type CategoryEntry,
  type ExpenseEntry,
  type TagEntry,
} from "../lib/firefly";

const DAYS_30 = 30;
const DAYS_90 = 90;
const ALL_DATA_START = new Date(1970, 0, 1);
const PAGE_SIZE_OPTIONS = new Set([25, 50, 100]);

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

function formatSearchValue(value: string) {
  const trimmed = value.trim();
  const escaped = trimmed.replace(/"/g, '\\"');
  return /\s/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildToken(key: string, value: string) {
  return `${key}:${formatSearchValue(value)}`;
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
        page?: string;
        limit?: string;
      }
    | Promise<{
        type?: string;
        preset?: string;
        month?: string;
        account?: string;
        categories?: string;
        labels?: string;
        page?: string;
        limit?: string;
      }>;
}) {
  const endDate = new Date();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedType = resolvedSearchParams?.type;
  const preset =
    resolvedSearchParams?.preset === "last-30-days" ||
    resolvedSearchParams?.preset === "last-90-days" ||
    resolvedSearchParams?.preset === "all-data" ||
    resolvedSearchParams?.preset === "month"
      ? resolvedSearchParams.preset
      : "month";

  let startDate: Date;
  let rangeEndDate: Date;
  let presetMonth = resolvedSearchParams?.month ?? "";
  const accountFilter = resolvedSearchParams?.account ?? "";
  const categoryFilter = resolvedSearchParams?.categories ?? "";
  const labelFilter = resolvedSearchParams?.labels ?? "";
  const pageParam = Number.parseInt(resolvedSearchParams?.page ?? "", 10);
  const limitParam = Number.parseInt(resolvedSearchParams?.limit ?? "", 10);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit =
    Number.isNaN(limitParam) || !PAGE_SIZE_OPTIONS.has(limitParam)
      ? 50
      : limitParam;
  const categorySelection = categoryFilter.trim();
  const labelSelection = labelFilter.trim();

  if (preset === "last-30-days") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS_30);
    rangeEndDate = endDate;
  } else if (preset === "last-90-days") {
    startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS_90);
    rangeEndDate = endDate;
  } else if (preset === "all-data") {
    startDate = new Date(ALL_DATA_START);
    rangeEndDate = endDate;
  } else {
    const selectedMonth = parseMonth(presetMonth) ?? startOfMonth(endDate);
    startDate = startOfMonth(selectedMonth);
    rangeEndDate = endOfMonth(selectedMonth);
    presetMonth = formatDateOnly(startDate).slice(0, 7);
  }

  let entries: ExpenseEntry[] = [];
  let totalPages = 1;
  let totalMatches: number | null = null;
  let accounts: AccountEntry[] = [];
  let categories: CategoryEntry[] = [];
  let labels: TagEntry[] = [];
  let errorMessage: string | null = null;

  try {
    const [accountsResponse, categoriesResponse, tagsResponse] = await Promise.all([
      fetchAccounts(),
      fetchCategories(),
      fetchTags(),
    ]);
    accounts = accountsResponse;
    categories = categoriesResponse;
    labels = tagsResponse;

    const categoryNameById = new Map(
      categoriesResponse.map((category) => [category.id, category.name]),
    );
    const selectedCategoryName = categorySelection
      ? categoryNameById.get(categorySelection) ?? null
      : null;

    const baseTokens = [
      `date_after:${formatDateOnly(startDate)}`,
      `date_before:${formatDateOnly(rangeEndDate)}`,
    ];

    if (requestedType && requestedType !== "all") {
      baseTokens.push(`type:${requestedType}`);
    }

    if (accountFilter) {
      baseTokens.push(`account_id:${accountFilter}`);
    }

    const tokens = [...baseTokens];
    if (selectedCategoryName) {
      tokens.push(buildToken("category_is", selectedCategoryName));
    }
    if (labelSelection) {
      tokens.push(buildToken("tag_is", labelSelection));
    }
    const queries = [tokens.join(" ")];

    const searchResponses = await Promise.all(
      queries.map((query) =>
        searchTransactions({
          query,
          limit,
          page,
        }),
      ),
    );

    const entryMap = new Map<string, ExpenseEntry>();
    searchResponses.forEach((response) => {
      response.entries.forEach((entry) => {
        entryMap.set(entry.id, entry);
      });
    });

    entries = Array.from(entryMap.values());
    totalPages = searchResponses.reduce((max, response) => {
      const candidate = response.pagination?.total_pages ?? 1;
      return candidate > max ? candidate : max;
    }, 1);
    totalMatches = searchResponses.reduce((max, response) => {
      const candidate = response.pagination?.total ?? 0;
      return candidate > max ? candidate : max;
    }, 0);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load transactions.";
  }

  const normalizedEntries = entries.map((entry) => {
    const amount = Math.abs(Number.parseFloat(entry.amount || "0"));
    const foreignAmount = entry.foreignAmount
      ? Math.abs(Number.parseFloat(entry.foreignAmount))
      : null;
    return {
      ...entry,
      amountValue: Number.isNaN(amount) ? 0 : amount,
      foreignAmountValue:
        foreignAmount === null || Number.isNaN(foreignAmount)
          ? null
          : foreignAmount,
    };
  });

  const recentEntries = [...normalizedEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const dateRangeValue =
    preset === "last-30-days"
      ? "last-30-days"
      : preset === "last-90-days"
        ? "last-90-days"
        : preset === "all-data"
          ? "all-data"
          : `month:${presetMonth}`;

  return (
    <Container size="xl" py="xl">
      <TransactionsPanel
        requestedType={requestedType ?? "all"}
        dateRangeValue={dateRangeValue}
        basePath="/transactions"
        accountOptions={accounts
          .filter((account) => {
            const type = (account.type ?? "").toLowerCase();
            return type !== "initial-balance" && type !== "reconciliation";
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
        categoryValue={categorySelection || null}
        labelValue={labelSelection || null}
        entries={recentEntries}
        totalMatches={totalMatches}
        page={page}
        totalPages={totalPages}
        limit={limit}
        errorMessage={errorMessage}
      />
    </Container>
  );
}
