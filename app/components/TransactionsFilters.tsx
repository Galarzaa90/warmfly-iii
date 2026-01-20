"use client";

import { Loader, Select } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  basePath?: string;
  accountOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  labelOptions: { value: string; label: string }[];
  accountValue?: string | null;
  categoryValue?: string | null;
  labelValue?: string | null;
  isLoading?: boolean;
  onNavigate?: (url: string) => void;
};

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

export default function TransactionsFilters({
  basePath = "/transactions",
  accountOptions,
  categoryOptions,
  labelOptions,
  accountValue,
  categoryValue,
  labelValue,
  isLoading = false,
  onNavigate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams],
  );

  const navigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
      return;
    }
    router.push(url);
  };

  return (
    <>
      <Select
        label="Account"
        data={accountOptions}
        value={accountValue ?? null}
        searchable
        clearable
        disabled={isLoading}
        rightSection={isLoading ? <Loader size="xs" /> : null}
        rightSectionPointerEvents="none"
        onChange={(nextValue) => {
          const updated = updateParam(params, "account", nextValue);
          navigate(`${basePath}?${updated.toString()}`);
        }}
        w={220}
      />
      <Select
        label="Category"
        data={categoryOptions}
        value={categoryValue ?? null}
        searchable
        clearable
        disabled={isLoading}
        rightSection={isLoading ? <Loader size="xs" /> : null}
        rightSectionPointerEvents="none"
        onChange={(nextValue) => {
          const updated = updateParam(params, "categories", nextValue);
          navigate(`${basePath}?${updated.toString()}`);
        }}
        w={260}
      />
      <Select
        label="Label"
        data={labelOptions}
        value={labelValue ?? null}
        searchable
        clearable
        disabled={isLoading}
        rightSection={isLoading ? <Loader size="xs" /> : null}
        rightSectionPointerEvents="none"
        onChange={(nextValue) => {
          const updated = updateParam(params, "labels", nextValue);
          navigate(`${basePath}?${updated.toString()}`);
        }}
        w={240}
      />
    </>
  );
}
