"use client";

import { Group, Pagination, Select, Text } from "@mantine/core";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  page: number;
  totalPages: number;
  limit: number;
  basePath?: string;
  showSelect?: boolean;
  showPagination?: boolean;
  variant?: "full" | "compact";
};

const PAGE_SIZES = [10, 25, 50, 100];

function updateParam(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  const updated = new URLSearchParams(params);
  if (value) {
    updated.set(key, value);
  } else {
    updated.delete(key);
  }
  return updated;
}

export default function TransactionsPagination({
  page,
  totalPages,
  limit,
  basePath = "/transactions",
  showSelect = true,
  showPagination = true,
  variant = "full",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams],
  );

  const selectControl = showSelect ? (
    <Group gap="xs">
      <Text size="sm" c="dimmed">
        Page size
      </Text>
      <Select
        data={PAGE_SIZES.map((value) => ({
          value: String(value),
          label: String(value),
        }))}
        value={String(limit)}
        onChange={(nextValue) => {
          if (!nextValue) return;
          let next = updateParam(params, "limit", nextValue);
          next = updateParam(next, "page", "1");
          router.push(`${basePath}?${next.toString()}`);
        }}
        w={120}
      />
    </Group>
  ) : null;

  const pagerControl =
    showPagination && totalPages > 1 ? (
      <Pagination
        total={totalPages}
        value={page}
        onChange={(nextPage) => {
          const next = updateParam(params, "page", String(nextPage));
          router.push(`${basePath}?${next.toString()}`);
        }}
      />
    ) : null;

  if (variant === "compact") {
    return (
      <Group gap="md" align="center" wrap="wrap">
        {selectControl}
        {pagerControl}
      </Group>
    );
  }

  return (
    <Group justify="space-between" align="center" wrap="wrap">
      {selectControl}
      {pagerControl}
    </Group>
  );
}
