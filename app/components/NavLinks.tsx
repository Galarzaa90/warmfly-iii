"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  gap?: number;
};

export default function NavLinks({ gap = 16 }: Props) {
  const searchParams = useSearchParams();

  const queryString = useMemo(() => {
    if (!searchParams) return "";
    const nextParams = new URLSearchParams();
    const allowedKeys = ["preset", "month", "start", "end"];
    allowedKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) nextParams.set(key, value);
    });
    const value = nextParams.toString();
    return value ? `?${value}` : "";
  }, [searchParams]);

  const overviewHref = `/${queryString}`;
  const transactionsHref = `/transactions${queryString}`;
  const tagsHref = `/tags${queryString}`;
  const categoriesHref = `/categories${queryString}`;
  const reportsHref = "/reports";

  return (
    <div style={{ display: "flex", gap }}>
      <Link href={overviewHref} style={{ color: "inherit", textDecoration: "none" }}>
        Overview
      </Link>
      <Link
        href={transactionsHref}
        style={{ color: "inherit", textDecoration: "none" }}
      >
        Transactions
      </Link>
      <Link href={tagsHref} style={{ color: "inherit", textDecoration: "none" }}>
        Tags
      </Link>
      <Link
        href={categoriesHref}
        style={{ color: "inherit", textDecoration: "none" }}
      >
        Categories
      </Link>
      <Link href={reportsHref} style={{ color: "inherit", textDecoration: "none" }}>
        Reports
      </Link>
    </div>
  );
}
