import { Container } from "@mantine/core";
import TransactionsPanel from "../components/TransactionsPanel";
import type { TransactionRow } from "../components/TransactionsTable";
import {
  fetchAccounts,
  fetchCategories,
  searchTransactions,
  fetchTags,
  type AccountRead,
  type CategoryRead,
  type TagRead,
  type TransactionArray,
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

function parseDifferenceAmount(value?: string | null) {
  const amount = Math.abs(Number.parseFloat(value ?? "0"));
  return Number.isNaN(amount) ? 0 : amount;
}

function buildTransactionRows(response: TransactionArray): TransactionRow[] {
  return (
    response.data?.flatMap((item) => {
      const groupTitle = item.attributes.group_title;
      return item.attributes.transactions.map((split, index) => {
        const amountValue = parseDifferenceAmount(split.amount);
        const foreignAmountValue = split.foreign_amount
          ? parseDifferenceAmount(split.foreign_amount)
          : null;
        return {
          id: `${item.id}-${index}`,
          title: groupTitle || split.description || "Untitled expense",
          date: split.date,
          amountValue,
          currencyCode: split.currency_code,
          currencySymbol: split.currency_symbol,
          foreignAmountValue,
          foreignCurrencySymbol: split.foreign_currency_symbol,
          type: split.type,
          source: split.source_name,
          destination: split.destination_name,
          category: split.category_name,
          budget: split.budget_name,
          tags: split.tags,
        };
      });
    }) ?? []
  );
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

  let entries: TransactionRow[] = [];
  let totalPages = 1;
  let totalMatches: number | null = null;
  let accounts: AccountRead[] = [];
  let categories: CategoryRead[] = [];
  let labels: TagRead[] = [];
  let errorMessage: string | null = null;

  try {
    const [accountsResponse, categoriesResponse, tagsResponse] = await Promise.all([
      fetchAccounts(),
      fetchCategories(),
      fetchTags(),
    ]);
    accounts = accountsResponse.data ?? [];
    categories = categoriesResponse.data ?? [];
    labels = tagsResponse.data ?? [];

    const categoryNameById = new Map(
      categories.map((category) => [category.id, category.attributes.name]),
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

    const entryMap = new Map<string, TransactionRow>();
    searchResponses.forEach((response) => {
      buildTransactionRows(response).forEach((entry) => {
        entryMap.set(entry.id, entry);
      });
    });

    entries = Array.from(entryMap.values());
    totalPages = searchResponses.reduce((max, response) => {
      const candidate = response.meta?.pagination?.total_pages ?? 1;
      return candidate > max ? candidate : max;
    }, 1);
    totalMatches = searchResponses.reduce((max, response) => {
      const candidate = response.meta?.pagination?.total ?? 0;
      return candidate > max ? candidate : max;
    }, 0);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load transactions.";
  }

  const recentEntries = [...entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
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
            const type = (account.attributes.type ?? "").toLowerCase();
            return type !== "initial-balance" && type !== "reconciliation";
          })
          .map((account) => ({
            value: account.id,
            label: account.attributes.name,
          }))}
        categoryOptions={categories.map((category) => ({
          value: category.id,
          label: category.attributes.name,
        }))}
        labelOptions={labels.map((tag) => ({
          value: tag.attributes.tag,
          label: tag.attributes.tag,
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
