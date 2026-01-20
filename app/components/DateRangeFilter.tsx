"use client";

import { Group, Loader, Select } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  value: string;
  basePath?: string;
  isLoading?: boolean;
  onNavigate?: (url: string) => void;
};

function updateParams(
  params: URLSearchParams,
  next: Partial<{
    preset: "last-30-days" | "last-90-days" | "all-data" | "month";
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

export default function DateRangeFilter({
  value,
  basePath = "/",
  isLoading = false,
  onNavigate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams],
  );

  const options = useMemo(() => {
    const now = new Date();
    const monthItems: { value: string; label: string }[] = [];

    for (let i = 0; i < 12; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toISOString().slice(0, 7);
      const label = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date);
      monthItems.push({ value: `month:${month}`, label });
    }

    return [
      {
        group: "Presets",
        items: [
          { value: "last-30-days", label: "Last 30 days" },
          { value: "last-90-days", label: "Last 90 days" },
          { value: "all-data", label: "All data" },
        ],
      },
      {
        group: "Months",
        items: monthItems,
      },
    ];
  }, []);

  const navigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
      return;
    }
    router.push(url);
  };

  return (
    <Group gap="md" wrap="wrap">
      <Select
        label="Range"
        value={value}
        data={options}
        disabled={isLoading}
        rightSection={isLoading ? <Loader size="xs" /> : null}
        rightSectionPointerEvents="none"
        onChange={(nextValue) => {
          if (!nextValue) return;
          if (nextValue === "last-30-days") {
            const next = updateParams(params, {
              preset: "last-30-days",
              month: "",
            });
            navigate(`${basePath}?${next.toString()}`);
            return;
          }
          if (nextValue === "last-90-days") {
            const next = updateParams(params, {
              preset: "last-90-days",
              month: "",
            });
            navigate(`${basePath}?${next.toString()}`);
            return;
          }
          if (nextValue === "all-data") {
            const next = updateParams(params, {
              preset: "all-data",
              month: "",
            });
            navigate(`${basePath}?${next.toString()}`);
            return;
          }
          if (nextValue.startsWith("month:")) {
            const month = nextValue.replace("month:", "");
            const next = updateParams(params, { preset: "month", month });
            navigate(`${basePath}?${next.toString()}`);
          }
        }}
        maxDropdownHeight={320}
        w={260}
      />
    </Group>
  );
}
