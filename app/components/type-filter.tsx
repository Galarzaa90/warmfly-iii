"use client";

import { Select } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  value: string;
};

export default function TypeFilter({ value }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams],
  );

  return (
    <Select
      label="Type"
      value={value}
      data={[
        { value: "all", label: "All types" },
        { value: "withdrawal", label: "Withdrawals" },
        { value: "deposit", label: "Deposits" },
        { value: "transfer", label: "Transfers" },
        { value: "expense", label: "Expenses" },
        { value: "income", label: "Income" },
      ]}
      onChange={(nextValue) => {
        if (!nextValue) return;
        const updated = new URLSearchParams(params);
        if (nextValue === "all") {
          updated.delete("type");
        } else {
          updated.set("type", nextValue);
        }
        router.push(`/transactions?${updated.toString()}`);
      }}
      w={200}
    />
  );
}
