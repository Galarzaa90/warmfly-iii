"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function NavTitle() {
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

  return (
    <Link
      href={overviewHref}
      style={{ color: "inherit", textDecoration: "none" }}
      aria-label="Warmfly III overview"
    >
      Warmfly III
    </Link>
  );
}
