"use client";

import { MultiSelect, Select } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  basePath?: string;
  accountOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  labelOptions: { value: string; label: string }[];
  accountValue?: string | null;
  categoryValues: string[];
  labelValues: string[];
};

function updateParam(
  params: URLSearchParams,
  key: string,
  value: string | string[] | null,
) {
  const updated = new URLSearchParams(params);
  if (Array.isArray(value)) {
    if (value.length > 0) updated.set(key, value.join(","));
    else updated.delete(key);
  } else if (value) {
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
  categoryValues,
  labelValues,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams],
  );

  return (
    <>
      <Select
        label="Account"
        data={accountOptions}
        value={accountValue ?? null}
        searchable
        clearable
        onChange={(nextValue) => {
          const updated = updateParam(params, "account", nextValue);
          router.push(`${basePath}?${updated.toString()}`);
        }}
        w={220}
      />
      <MultiSelect
        label="Categories"
        data={categoryOptions}
        value={categoryValues}
        searchable
        clearable
        onChange={(nextValue) => {
          const updated = updateParam(params, "categories", nextValue);
          router.push(`${basePath}?${updated.toString()}`);
        }}
        w={260}
      />
      <MultiSelect
        label="Labels"
        data={labelOptions}
        value={labelValues}
        searchable
        clearable
        onChange={(nextValue) => {
          const updated = updateParam(params, "labels", nextValue);
          router.push(`${basePath}?${updated.toString()}`);
        }}
        w={240}
      />
    </>
  );
}
