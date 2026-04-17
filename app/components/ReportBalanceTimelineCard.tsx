"use client";

import { Card, Text } from "@mantine/core";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimelinePoint = {
  key: string;
  label: string;
  periodLabel: string;
  net: number;
  value: number;
  color: string;
};

type Props = {
  title: string;
  data: TimelinePoint[];
  currencyCode?: string | null;
};

function formatAmount(amount: number, currencyCode?: string | null) {
  if (currencyCode && currencyCode !== "Unknown") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return amount.toFixed(2);
}

export default function ReportBalanceTimelineCard({
  title,
  data,
  currencyCode,
}: Props) {
  return (
    <Card
      padding="lg"
      radius="md"
      style={{
        backgroundColor: "var(--app-panel)",
        border: "1px solid var(--app-border)",
      }}
    >
      <Text fw={600}>{title}</Text>
      {data.length === 0 ? (
        <Text size="sm" c="dimmed" mt="md">
          No income or expense activity for this period.
        </Text>
      ) : (
        <div style={{ width: "100%", height: 280, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                minTickGap={14}
              />
              <YAxis hide />
              <Tooltip
                formatter={(_, __, payload) => {
                  const point = payload?.payload as TimelinePoint | undefined;
                  if (!point) return "";
                  const prefix = point.net >= 0 ? "+" : "-";
                  return `${prefix}${formatAmount(Math.abs(point.net), currencyCode)}`;
                }}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as TimelinePoint | undefined;
                  return point?.periodLabel ?? "";
                }}
                contentStyle={{
                  backgroundColor: "var(--app-panel-strong)",
                  border: "1px solid var(--app-border)",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "var(--mantine-color-text)" }}
                labelStyle={{ color: "var(--mantine-color-text)" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

