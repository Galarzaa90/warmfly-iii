"use client";

import { Loader, Select } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  value: string;
  isLoading?: boolean;
  onNavigate?: (url: string) => void;
};

export default function TypeFilter({
  value,
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
    <Select
      label="Type"
      value={value}
      data={[
        { value: "all", label: "All types" },
        { value: "withdrawal", label: "Withdrawals" },
        { value: "deposit", label: "Deposits" },
        { value: "transfer", label: "Transfers" },
      ]}
      disabled={isLoading}
      rightSection={isLoading ? <Loader size="xs" /> : null}
      rightSectionPointerEvents="none"
      onChange={(nextValue) => {
        if (!nextValue) return;
        const updated = new URLSearchParams(params);
        if (nextValue === "all") {
          updated.delete("type");
        } else {
          updated.set("type", nextValue);
        }
        navigate(`/transactions?${updated.toString()}`);
      }}
      w={200}
    />
  );
}
