import { Container } from "@mantine/core";
import { notFound } from "next/navigation";
import ScopedTransactionsPanel from "../../components/ScopedTransactionsPanel";
import {
  fetchTags,
  searchTransactions,
  type TransactionSplit,
} from "../../lib/firefly";
import { groupTotalsByCurrency } from "../../lib/reports";

const DAYS_30 = 30;
const DAYS_90 = 90;
const ALL_DATA_START = new Date(1970, 0, 1);
const PAGE_SIZE_OPTIONS = new Set([25, 50, 100]);
const SUMMARY_PAGE_SIZE = 100;

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

function toSplits(response: Awaited<ReturnType<typeof searchTransactions>>) {
  return response.data?.flatMap((item) => item.attributes.transactions ?? []) ?? [];
}

async function fetchAllMatchingSplits(query: string) {
  let page = 1;
  let totalPages = 1;
  const entries: TransactionSplit[] = [];

  while (page <= totalPages) {
    const response = await searchTransactions({
      query,
      limit: SUMMARY_PAGE_SIZE,
      page,
    });
    entries.push(...toSplits(response));
    totalPages = response.meta?.pagination?.total_pages ?? 1;
    page += 1;
  }

  return entries;
}

type TagsSearchParams = {
  preset?: "last-30-days" | "last-90-days" | "all-data" | "month";
  month?: string;
  page?: string;
  limit?: string;
};

type Params = {
  tag: string;
};

export default async function TagDetailsPage({
  params,
  searchParams,
}: {
  params: Params | Promise<Params>;
  searchParams?: TagsSearchParams | Promise<TagsSearchParams>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const rawTag = resolvedParams.tag;
  const selectedTag = decodeURIComponent(rawTag).trim();
  if (!selectedTag) notFound();

  const tagsResponse = await fetchTags();
  const allTags = (tagsResponse.data ?? [])
    .map((tag) => tag.attributes.tag)
    .filter((tag): tag is string => Boolean(tag));
  if (!allTags.includes(selectedTag)) notFound();

  const endDate = new Date();
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
  const pageParam = Number.parseInt(resolvedSearchParams?.page ?? "", 10);
  const limitParam = Number.parseInt(resolvedSearchParams?.limit ?? "", 10);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit =
    Number.isNaN(limitParam) || !PAGE_SIZE_OPTIONS.has(limitParam) ? 50 : limitParam;

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

  let entries: TransactionSplit[] = [];
  let summaryEntries: TransactionSplit[] = [];
  let totalPages = 1;
  let totalMatches: number | null = null;
  let errorMessage: string | null = null;

  try {
    const tokens = [
      `date_after:${formatDateOnly(startDate)}`,
      `date_before:${formatDateOnly(rangeEndDate)}`,
      buildToken("tag_is", selectedTag),
    ];
    const query = tokens.join(" ");

    const [pageResponse, fullEntries] = await Promise.all([
      searchTransactions({ query, limit, page }),
      fetchAllMatchingSplits(query),
    ]);

    entries = toSplits(pageResponse).sort((a, b) => b.date.getTime() - a.date.getTime());
    summaryEntries = fullEntries;
    totalPages = pageResponse.meta?.pagination?.total_pages ?? 1;
    totalMatches = pageResponse.meta?.pagination?.total ?? 0;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load transactions.";
  }

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
      <ScopedTransactionsPanel
        title={`Tag: ${selectedTag}`}
        dateRangeValue={dateRangeValue}
        entries={entries}
        incomeTotals={groupTotalsByCurrency(summaryEntries, "income")}
        expenseTotals={groupTotalsByCurrency(summaryEntries, "expense")}
        totalMatches={totalMatches}
        page={page}
        totalPages={totalPages}
        limit={limit}
        basePath={`/tags/${encodeURIComponent(selectedTag)}`}
        errorMessage={errorMessage}
      />
    </Container>
  );
}

