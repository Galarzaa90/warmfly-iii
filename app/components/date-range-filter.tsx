"use client";

import { Group, Select } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  value: string;
  basePath?: string;
};

function updateParams(
  params: URLSearchParams,
  next: Partial<{
    preset: "last-30-days" | "month";
    month: string;
  }>,
) {
  const updated = new URLSearchParams(params);
  if (next.preset) updated.set("preset", next.preset);
  if (typeof next.month !== "undefined")
    next.month ? updated.set("month", next.month) : updated.delete("month");
  updated.delete("start");
  updated.delete("end");
  return updated;
}

export default function DateRangeFilter({ value, basePath = "/" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams],
  );

  const options = useMemo(() => {
    const now = new Date();
    const items = [
      { value: "last-30-days", label: "Last 30 days" },
    ] as { value: string; label: string }[];

    for (let i = 0; i < 6; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toISOString().slice(0, 7);
      const label = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date);
      items.push({ value: `month:${month}`, label });
    }

    return items;
  }, []);

  return (
    <Group gap="md" wrap="wrap">
      <Select
        label="Range"
        value={value}
        data={options}
        onChange={(nextValue) => {
          if (!nextValue) return;
          if (nextValue === "last-30-days") {
            const next = updateParams(params, {
              preset: "last-30-days",
              month: "",
            });
          router.push(`${basePath}?${next.toString()}`);
          return;
        }
        if (nextValue.startsWith("month:")) {
          const month = nextValue.replace("month:", "");
          const next = updateParams(params, { preset: "month", month });
          router.push(`${basePath}?${next.toString()}`);
        }
      }}
        maxDropdownHeight={260}
        w={260}
      />
    </Group>
  );
}
